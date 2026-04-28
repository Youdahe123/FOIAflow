import pandas as pd
import uuid
from supabase import create_client

INPUT_FILE = "2022_Individual_Unit_File - General Purpose.csv"
OUTPUT_FILE = "batch_001.json"
BATCH_SIZE = 2000
START_ROW = 0  # change this later
SUPABASE_URL = "https://tmepkdippikertlftctl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZXBrZGlwcGlrZXJ0bGZ0Y3RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MTcyNjgsImV4cCI6MjA5MDM5MzI2OH0.nCBMnq5AlWNnRibrWC0XMryqMbB2-87qxSuWSQSyVHg"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

df = pd.read_csv(INPUT_FILE, low_memory=False)

batch = df.iloc[START_ROW:START_ROW + BATCH_SIZE]

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

import csv

csv_file = OUTPUT_FILE.replace(".json", ".csv")

BATCH_INSERT_SIZE = 500

print(f"Inserting {len(records)} records into Supabase...")

for i in range(0, len(records), BATCH_INSERT_SIZE):
    chunk = records[i:i + BATCH_INSERT_SIZE]
    supabase.table("agencies").insert(chunk).execute()

print(f"Finished inserting {len(records)} records.")

print(f"Saved {len(records)} records to {OUTPUT_FILE}")