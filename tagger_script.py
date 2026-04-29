import pandas as pd
import uuid
import json

# ==============================
# FILES
# ==============================

FILES = [
    "BIA_Agency%2C_Regional%2C_and_Field_Offices.csv",
    "Currently_Accredited_Law_Enforcement_Agencies.csv"
]

OUTPUT_FILE = "batch_quality_layers.json"

records = []

# ==============================
# PROCESS FILES
# ==============================

for file in FILES:
    print(f"\nProcessing: {file}")

    df = pd.read_csv(file, encoding="utf-8-sig", encoding_errors="ignore")

    print("Columns:", list(df.columns))

    for _, row in df.iterrows():

        # ==============================
        # BIA FILE LOGIC
        # ==============================
        if "OfficeName" in df.columns:
            name = str(row.get("OfficeName", "")).strip().title()
            state = str(row.get("State", "")).strip()
            lat = float(row.get("Latitude", 0.0) or 0.0)
            lon = float(row.get("Longitude", 0.0) or 0.0)

            if not name or name.lower() == "nan":
                continue

            records.append({
                "id": str(uuid.uuid4()),
                "name": name.title(),
                "abbreviation": "",
                "level": "FEDERAL",
                "jurisdiction": state,
                "latitude": lat,
                "longitude": lon
            })

        # ==============================
        # NY POLICE FILE LOGIC
        # ==============================
        elif "Agency Name" in df.columns:
            name = str(row.get("Agency Name", "")).strip().title()
            county = str(row.get("County", "")).strip()

            if not name or name.lower() == "nan":
                continue

            # Clean names
            name = name.replace(" PD", " Police Department")
            name = name.replace(" SO", " Sheriff's Office")

            records.append({
                "id": str(uuid.uuid4()),
                "name": name.title(),
                "abbreviation": "",
                "level": "LAW_ENFORCEMENT",
                "jurisdiction": f"{county.title()} County, NY",
                "latitude": 0.0,
                "longitude": 0.0
            })

        else:
            print(f"⚠️ Skipping unknown format: {file}")
            break

# ==============================
# SAVE OUTPUT
# ==============================

print(f"\nTotal records prepared: {len(records)}")

with open(OUTPUT_FILE, "w") as f:
    json.dump(records, f, indent=2)

print(f"Saved to {OUTPUT_FILE}")