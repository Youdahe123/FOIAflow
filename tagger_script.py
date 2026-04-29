import pandas as pd
import uuid
from supabase import create_client

# ==============================
# CONFIG
# ==============================

INPUT_FILE = "accredited_police.csv"
BATCH_SIZE = 2000
INSERT_CHUNK_SIZE = 500

SUPABASE_URL = "https://tmepkdippikertlftctl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZXBrZGlwcGlrZXJ0bGZ0Y3RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MTcyNjgsImV4cCI6MjA5MDM5MzI2OH0.nCBMnq5AlWNnRibrWC0XMryqMbB2-87qxSuWSQSyVHg"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ==============================
# LOAD DATA
# ==============================

df = pd.read_csv(INPUT_FILE, low_memory=False)

# Remove duplicates at source level
df = df.drop_duplicates(subset=["UNIT_NAME"])

print(f"Total rows after dedupe: {len(df)}")

# ==============================
# CATEGORY FUNCTION (MUST BE ABOVE LOOP)
# ==============================

def categorize(name):
    name = str(name).lower()

    if "police" in name or "sheriff" in name:
        return "LAW_ENFORCEMENT"
    elif "county" in name:
        return "COUNTY"
    elif "city" in name:
        return "CITY"
    elif "school" in name or "district" in name:
        return "EDUCATION"
    elif "department" in name:
        return "GOVERNMENT"
    else:
        return "UNCATEGORIZED"

# ==============================
# MAIN INGEST LOOP
# ==============================

for start in range(0, len(df), BATCH_SIZE):
    batch = df.iloc[start:start + BATCH_SIZE]

    records = []

    for _, row in batch.iterrows():
        name = str(row.get("UNIT_NAME", "")).strip()

        if not name or name == "nan":
            continue

        records.append({
            "id": str(uuid.uuid4()),
            "name": name,
            "abbreviation": "",
            "level": categorize(name),
            "jurisdiction": f"{row.get('CITY', '')} {row.get('STATE', '')}"
        })

    print(f"\n🚀 Inserting batch starting at {start} ({len(records)} records)...")

    # Insert in chunks to avoid API limits
    for i in range(0, len(records), INSERT_CHUNK_SIZE):
        chunk = records[i:i + INSERT_CHUNK_SIZE]

        try:
            supabase.table("agencies").upsert(chunk).execute()
        except Exception as e:
            print(f"❌ Error inserting chunk starting at index {i}: {e}")

print("\n✅ DONE: All data processed and inserted.")