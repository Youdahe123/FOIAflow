import pandas as pd

df = pd.read_csv("2022_Individual_Unit_File - General Purpose.csv", low_memory=False)

print("\nCOLUMNS:")
print(df.columns.tolist())

print("\nFIRST 5 ROWS:")
print(df.head())

exit()

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
        "jurisdiction": "United States"
    })

with open(OUTPUT_FILE, "w") as f:
    json.dump(records, f, indent=2)

print(f"Saved {len(records)} records to {OUTPUT_FILE}")