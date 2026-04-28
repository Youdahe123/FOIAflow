import pandas as pd
import json
import uuid

INPUT_FILE = "2022_Individual_Unit_File - General Purpose.csv"
OUTPUT_FILE = "batch_001.json"
BATCH_SIZE = 2000
START_ROW = 0  # change this later

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
        "jurisdiction": f"{row.get('CITY', '')}, {row.get('STATE', '')}"
    })

import csv

csv_file = OUTPUT_FILE.replace(".json", ".csv")

with open(csv_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(
        f,
        fieldnames=["id", "name", "abbreviation", "level", "jurisdiction"]
    )
    writer.writeheader()
    writer.writerows(records)

print(f"Saved {len(records)} records to {csv_file}")

print(f"Saved {len(records)} records to {OUTPUT_FILE}")