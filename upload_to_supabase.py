from supabase import create_client
import json

# ==============================
# SUPABASE CONFIG
# ==============================

SUPABASE_URL = "https://tmepkdippikertlftctl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZXBrZGlwcGlrZXJ0bGZ0Y3RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MTcyNjgsImV4cCI6MjA5MDM5MzI2OH0.nCBMnq5AlWNnRibrWC0XMryqMbB2-87qxSuWSQSyVHg"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ==============================
# LOAD JSON
# ==============================

INPUT_FILE = "batch_quality_layers.json"

with open(INPUT_FILE, "r") as f:
    records = json.load(f)

print(f"Loaded {len(records)} records")

# ==============================
# INSERT INTO SUPABASE
# ==============================

for i in range(0, len(records), 500):
    chunk = records[i:i+500]
    supabase.table("agencies").upsert(chunk).execute()
    print(f"Inserted {i + len(chunk)} / {len(records)}")

print("DONE") 