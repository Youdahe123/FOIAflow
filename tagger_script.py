import csv
import json

# --- CONFIGURATION ---
INPUT_FILE = '2022_Individual_Unit_File - General Purpose.csv'
TAXONOMY_FILE = 'taxonomy_core.json'
OUTPUT_FILE = 'batch_001.json'
START_ROW = 0
LIMIT = 2000

def run_tagger():
    # Load Taxonomy
    with open(TAXONOMY_FILE, 'r') as f:
        taxonomy = json.load(f)
    
    results = []
    
    with open(INPUT_FILE, mode='r', encoding='utf-8-sig', errors='ignore') as f:
        reader = csv.DictReader(f)
        # Skip to start row
        for _ in range(START_ROW):
            next(reader, None)
            
        for i, row in enumerate(reader):
            if i >= LIMIT:
                break
            
            name = row.get('UNIT_NAME', 'Unknown')
            state = row.get('STATE', '')
            unit_type = row.get('UNIT_TYPE', '')
            
            # DEFAULT CATEGORIZATION
            industry = "Government"
            subcategory = "General"
            
            # 1. KEYWORD MATCHING (Priority)
            found_match = False
            for entry in taxonomy:
                for keyword in entry.get('keywords_trigger', []):
                    if keyword.lower() in name.lower():
                        industry = entry.get('industry')
                        subcategory = entry.get('subcategory')
                        found_match = True
                        break
                if found_match: break
            
            # 2. SMART FALLBACK (If no keyword matches)
            if not found_match:
                if '1 - COUNTY' in unit_type:
                    subcategory = 'County Administration'
                elif '2 - MUNICIPAL' in unit_type:
                    subcategory = 'Municipal Government'
                elif '3 - TOWNSHIP' in unit_type:
                    subcategory = 'Township Government'
            
            # ADD TO RESULTS
            results.append({
                "name": name,
                "state": state,
                "industry": industry,
                "subcategory": subcategory,
                "latitude": "0.0",
                "longitude": "0.0"
            })
            
            if i % 100 == 0:
                print(f"Processed {i} rows... Current: {name}")

    # SAVE TO JSON
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(results, f, indent=4)
    print(f"DONE! {len(results)} records saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    run_tagger()