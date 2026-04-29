import pandas as pd
import uuid
from supabase import create_client

# ==============================
# CONFIG
# ==============================

INPUT_FILE = "accredited_police.csv"
SUPABASE_URL = "YOUR_SUPABASE_URL"
SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY"

LEVEL = "LAW_ENFORCEMENT"

BATCH_SIZE = 500

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ==============================
# LOAD DATA
# ==============================

df = pd.read_csv(INPUT_FILE)

print("Loaded rows:", len(df))

records = []

for _, row in df.iterrows():
    name = str(row.get("Agency Name", "")).strip()

    if not name or name.lower() == "nan":
        continue

    # Clean names
    name = name.replace(" PD", " Police Department")
    name = name.replace(" SO", " Sheriff's Office")

    county = str(row.get("County", "")).strip()

    records.append({
        "id": str(uuid.uuid4()),
        "name": name.title(),
        "abbreviation": "",
        "level": LEVEL,
        "jurisdiction": f"{county.title()} County, NY"
    })

print(f"Prepared {len(records)} records")

# ==============================
# INSERT
# ==============================

for i in range(0, len(records), BATCH_SIZE):
    chunk = records[i:i+BATCH_SIZE]
    supabase.table("agencies").upsert(chunk).execute()
    print(f"Inserted {i + len(chunk)} / {len(records)}")

print("DONE")
