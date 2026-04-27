import json
import csv

# ============ CONFIGURATION ============
INPUT_FILE = '2022_Individual_Unit_File - General Purpose.csv'
OUTPUT_FILE = 'batch_001.json'
START_ROW = 0
LIMIT = 2000

# Unit Type to Industry Mapping
UNIT_TYPE_MAP = {
    'Police': 'PUBLIC_SAFETY_AND_JUSTICE',
    'Sheriff': 'PUBLIC_SAFETY_AND_JUSTICE',
    'Fire': 'PUBLIC_SAFETY_AND_JUSTICE',
    'Court': 'PUBLIC_SAFETY_AND_JUSTICE',
    'Prison': 'PUBLIC_SAFETY_AND_JUSTICE',
    'Health': 'HEALTH_AND_HUMAN_SERVICES',
    'Hospital': 'HEALTH_AND_HUMAN_SERVICES',
    'School': 'HEALTH_AND_HUMAN_SERVICES',
    'Water': 'ENVIRONMENT_AND_ENERGY',
    'Transit': 'TRANSPORTATION_AND_INFRASTRUCTURE',
    'Airport': 'TRANSPORTATION_AND_INFRASTRUCTURE',
    'Port': 'TRANSPORTATION_AND_INFRASTRUCTURE',
    'Housing': 'LAND_AND_PROPERTY',
    'Parks': 'SPORTS_MEDIA_AND_CULTURE',
    'Library': 'SPORTS_MEDIA_AND_CULTURE',
}

def load_taxonomy():
    """Load core taxonomy with trigger keywords."""
    try:
        with open('taxonomy_core.json', encoding='utf-8') as f:
            core = json.load(f)
        return core
    except FileNotFoundError:
        print("Error: taxonomy_core.json not found")
        return None

def match_industry_by_name(name, taxonomy):
    """Match agency name to industry using keyword triggers."""
    if not taxonomy or not name:
        return None
    
    name_lower = name.lower()
    best_match = None
    best_score = 0
    
    for sector, triggers in taxonomy.get('trigger_keywords', {}).items():
        score = sum(1 for t in triggers if t in name_lower)
        if score > best_score:
            best_score = score
            best_match = sector
    
    return best_match if best_score > 0 else None

def match_industry_by_unit_type(unit_type):
    """Map unit type to industry category."""
    if not unit_type:
        return None
    
    unit_type_lower = unit_type.lower()
    for key, industry in UNIT_TYPE_MAP.items():
        if key.lower() in unit_type_lower:
            return industry
    
    return None

def tag_agency(row, taxonomy):
    """Tag a single agency from Census CSV row."""
    name = row.get('UNIT_NAME', '').strip()
    state = row.get('STATE', '').strip()
    unit_type = row.get('UNIT_TYPE', '').strip()
    
    # Try keyword matching first
    industry = match_industry_by_name(name, taxonomy)
    
    # Fallback to unit type
    if not industry:
        industry = match_industry_by_unit_type(unit_type)
    
    # Default if no match
    if not industry:
        industry = 'UNCLASSIFIED'
    
    return {
        'name': name,
        'state': state,
        'industry': industry,
        'subcategory': 'General',
        'latitude': '0.0',
        'longitude': '0.0'
    }

def process_batch(input_file, output_file, start_row=0, limit=2000):
    """Process Census file in batches and output Supabase-ready JSON."""
    taxonomy = load_taxonomy()
    if not taxonomy:
        print("Failed to load taxonomy. Exiting.")
        return []
    
    results = []
    processed = 0
    
    try:
        with open(input_file, 'r', encoding='utf-8-sig', 
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
                    print(f"Processing row {processed}...")
                
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
        
    except FileNotFoundError as e:
        print(f"Error: File not found - {e}")
        return []
    except Exception as e:
        print(f"Error processing file: {e}")
        return []

if __name__ == '__main__':
    process_batch(
        INPUT_FILE,
        OUTPUT_FILE,
        start_row=START_ROW,
        limit=LIMIT
    )
