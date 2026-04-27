import json
import csv

# ============ CONFIGURATION ============
INPUT_FILE = '2022_Individual_Unit_File.csv'
OUTPUT_FILE = 'batch_001.json'
START_ROW = 0
LIMIT = 2000

# Function Code to Industry Mapping
FUNCTION_CODE_MAP = {
    '32': 'HEALTH_AND_HUMAN_SERVICES',
    '34': 'HEALTH_AND_HUMAN_SERVICES',
    '40': 'PUBLIC_SAFETY_AND_JUSTICE',
    '41': 'PUBLIC_SAFETY_AND_JUSTICE',
    '66': 'PUBLIC_SAFETY_AND_JUSTICE',
    '92': 'TRANSPORTATION_AND_INFRASTRUCTURE',
    '98': 'TRANSPORTATION_AND_INFRASTRUCTURE',
    '13': 'ENVIRONMENT_AND_ENERGY',
    '99': 'FINANCE_AND_CORPORATE',
}

def load_taxonomy():
    """Load core taxonomy with trigger keywords."""
    with open('taxonomy_core.json') as f:
        core = json.load(f)
    return core

def load_taxonomy():
    """Load core taxonomy with trigger keywords."""
    with open('taxonomy_core.json') as f:
        core = json.load(f)
    return core

def get_industry_from_function_code(func_code):
    """Map Census FUNCTION_CODE to industry."""
    return FUNCTION_CODE_MAP.get(func_code, 'UNCLASSIFIED')

def match_industry_by_name(name, taxonomy):
    """Match agency name to industry using keyword triggers."""
    name_lower = name.lower()
    best_match = None
    best_score = 0
    
    for sector, triggers in taxonomy['trigger_keywords'].items():
        score = sum(1 for t in triggers if t in name_lower)
        if score > best_score:
            best_score = score
            best_match = sector
    
    return best_match if best_score > 0 else None

def tag_agency(row, taxonomy):
    """Tag a single agency from Census CSV row."""
    name = row.get('NAME', '').strip()
    state = row.get('STATE', '').strip()
    func_code = row.get('FUNCTION_CODE', '').strip()
    latitude = row.get('LATITUDE', '')
    longitude = row.get('LONGITUDE', '')
    
    # Try keyword matching first
    industry = match_industry_by_name(name, taxonomy)
    
    # Fallback to function code
    if not industry:
        industry = get_industry_from_function_code(func_code)
    
    if not industry:
        industry = 'UNCLASSIFIED'
    
    return {
        'name': name,
        'state': state,
        'industry': industry,
        'subcategory': 'General',
        'latitude': latitude if latitude else None,
        'longitude': longitude if longitude else None
    }

def process_batch(input_file, output_file, start_row=0, limit=2000):
    """Process Census file in batches and output Supabase-ready JSON."""
    taxonomy = load_taxonomy()
    results = []
    processed = 0
    
    try:
        with open(input_file, 'r', encoding='utf-8', 
                  errors='ignore') as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                # Skip rows before start_row
                if i < start_row:
                    continue
                # Stop at limit
                if processed >= limit:
                    break
                
                # Progress indicator
                if processed % 100 == 0:
                    print(f"Processed row {processed}...")
                
                # Tag agency
                tagged = tag_agency(row, taxonomy)
                results.append(tagged)
                processed += 1
        
        # Write results to JSON
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\nBatch complete!")
        print(f"Total agencies processed: {len(results)}")
        print(f"Output saved to: {output_file}")
        return results
        
    except FileNotFoundError:
        print(f"Error: File '{input_file}' not found.")
        return []
    except Exception as e:
        print(f"Error processing file: {e}")
        return []

# ============ MAIN EXECUTION ============
if __name__ == '__main__':
    process_batch(
        INPUT_FILE,
        OUTPUT_FILE,
        start_row=START_ROW,
        limit=LIMIT
    )
