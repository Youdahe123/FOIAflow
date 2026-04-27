import json, csv, re

def load_all_taxonomies():
    with open('taxonomy_core.json') as f:
        core = json.load(f)
    files = [
        'subcategories_land.json',
        'subcategories_safety_finance.json',
        'subcategories_env_health_sports_transit.json'
    ]
    subcats = {}
    for file in files:
        with open(file) as f:
            data = json.load(f)
            for sector, cats in data.items():
                subcats[sector] = cats
    return core, subcats

def detect_level(name):
    n = name.lower()
    federal = ['federal','u.s.','united states',
               'national','fbi','irs','epa','faa']
    county = ['county','parish','borough']
    city = ['city','town','village','municipal',
            'city of','town of']
    if any(k in n for k in federal):
        return 'federal'
    if any(k in n for k in county):
        return 'county'
    if any(k in n for k in city):
        return 'city'
    if 'district' in n or 'authority' in n:
        return 'special_district'
    return 'state'

STATE_LAWS = {
    '01': ('Alabama Open Records Act', 
           'Ala. Code § 36-12-40',
           'reasonable time'),
    '02': ('Alaska Public Records Act',
           'AS § 40.25.110', '10 business days'),
    '04': ('Arizona Public Records Law',
           'ARS § 39-121', 'promptly'),
    '05': ('Arkansas FOIA',
           'ACA § 25-19-105', '3 business days'),
    '06': ('California Public Records Act',
           'Gov Code § 7920', '10 calendar days'),
    '08': ('Colorado Open Records Act',
           'CRS § 24-72-201', '3 business days'),
    '09': ('Connecticut FOIA',
           'CGS § 1-210', '4 business days'),
    '10': ('Delaware FOIA',
           'Del. Code § 10002', '15 business days'),
    '12': ('Florida Public Records Law',
           'Fla. Stat. § 119', 'reasonable time'),
    '13': ('Georgia Open Records Act',
           'OCGA § 50-18-70', '3 business days'),
    '15': ('Hawaii UIPA',
           'HRS § 92F', '10 business days'),
    '16': ('Idaho Public Records Act',
           'IC § 74-101', '3 business days'),
    '17': ('Illinois FOIA',
           '5 ILCS 140', '5 business days'),
    '18': ('Indiana APRA',
           'IC § 5-14-3', '24 hours'),
    '19': ('Iowa Open Records Act',
           'Iowa Code § 22', 'reasonable time'),
    '20': ('Kansas KORA',
           'KSA § 45-218', '3 business days'),
    '21': ('Kentucky Open Records Act',
           'KRS § 61.880', '3 business days'),
    '22': ('Louisiana Public Records',
           'RS § 44:32', '3 business days'),
    '23': ('Maine FOAA',
           '1 MRSA § 408', '5 business days'),
    '24': ('Maryland MPIA',
           'GP § 4-203', '10 business days'),
    '25': ('Massachusetts Public Records',
           'GL c. 66 § 10', '10 business days'),
    '26': ('Michigan FOIA',
           'MCL § 15.235', '5 business days'),
    '27': ('Minnesota MGDPA',
           'Minn. Stat. § 13', 'reasonable time'),
    '28': ('Mississippi Public Records',
           'Miss. Code § 25-61-5', 
           'promptly, not to exceed 14 days'),
    '29': ('Missouri Sunshine Law',
           'RSMo § 610.023', '3 business days'),
    '30': ('Montana FOIA',
           'MCA § 2-6-102', 'reasonable time'),
    '31': ('Nebraska Public Records',
           'Neb. Rev. Stat. § 84-712', 
           '4 business days'),
    '32': ('Nevada Public Records Act',
           'NRS § 239.010', '5 business days'),
    '33': ('New Hampshire RTK Law',
           'RSA 91-A:4', '5 business days'),
    '34': ('New Jersey OPRA',
           'NJSA § 47:1A-5', '7 business days'),
    '35': ('New Mexico IPRA',
           'NMSA § 14-2-8', '3 business days'),
    '36': ('New York FOIL',
           'Public Officers Law § 89',
           '5 business days acknowledge, '
           '20 business days respond'),
    '37': ('North Carolina Public Records',
           'GS § 132-6', 'reasonable time'),
    '38': ('North Dakota Open Records',
           'NDCC § 44-04-18', 'reasonable time'),
    '39': ('Ohio Public Records Act',
           'ORC § 149.43', 
           'reasonable time, promptly'),
    '40': ('Oklahoma Open Records Act',
           '51 OS § 24A.5', '3 business days'),
    '41': ('Oregon Public Records Law',
           'ORS § 192.324', '5 business days'),
    '42': ('Pennsylvania RTKL',
           '65 PS § 67.301', '5 business days'),
    '44': ('Rhode Island APRA',
           'RIGL § 38-2-3', '10 business days'),
    '45': ('South Carolina FOIA',
           'SC Code § 30-4-30', '10 business days'),
    '46': ('South Dakota Open Records',
           'SDCL § 1-27-1.1', 'reasonable time'),
    '47': ('Tennessee Public Records Act',
           'TCA § 10-7-503', '7 business days'),
    '48': ('Texas PIA',
           'Gov Code § 552.228', '10 business days'),
    '49': ('Utah GRAMA',
           'Utah Code § 63G-2-204',
           '10 business days'),
    '50': ('Vermont Public Records Act',
           '1 VSA § 318', '3 business days'),
    '51': ('Virginia VFOIA',
           'Va. Code § 2.2-3704', '5 business days'),
    '53': ('Washington PRA',
           'RCW § 42.56.520', '5 business days'),
    '54': ('West Virginia FOIA',
           'WV Code § 29B-1-3', '5 business days'),
    '55': ('Wisconsin Open Records',
           'Wis. Stat. § 19.35', 'reasonable time'),
    '56': ('Wyoming Public Records',
           'WY Stat. § 16-4-202', 'reasonable time'),
    '00': ('Federal FOIA',
           '5 U.S.C. § 552', '20 business days')
}

def tag_agency(name, state_fips, core, subcats):
    n = name.lower()
    result = {
        'name': name,
        'level': detect_level(name),
        'state_fips': state_fips,
        'sector': 'UNCLASSIFIED',
        'subcategory': 'Review_Required',
        'confidence': 0
    }
    
    law_info = STATE_LAWS.get(
        state_fips, STATE_LAWS['00']
    )
    if result['level'] == 'federal':
        law_info = STATE_LAWS['00']
    
    result['governing_law'] = law_info[0]
    result['law_citation'] = law_info[1]
    result['response_deadline'] = law_info[2]
    
    best = 0
    for sector, triggers in \
        core['trigger_keywords'].items():
        tscore = sum(
            1 for t in triggers if t in n
        )
        if tscore == 0:
            continue
        cats = subcats.get(sector, {})
        for cat, kws in cats.items():
            cscore = sum(1 for k in kws if k in n)
            total = tscore * 0.3 + cscore * 0.7
            if total > best:
                best = total
                result['sector'] = sector
                result['subcategory'] = cat
                result['confidence'] = min(
                    round(total * 25), 100
                )
    
    return result

def process_batch(input_file, output_file,
                  start=0, batch=2000):
    core, subcats = load_all_taxonomies()
    results = []
    
    with open(input_file, 'r',
              encoding='utf-8',
              errors='ignore') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i < start:
                continue
            if i >= start + batch:
                break
            if i % 100 == 0:
                print(f'Processing row {i}...')
            
            name = (row.get('NAME') or 
                   row.get('UNIT_NAME') or
                   row.get('Agency_Name') or '')
            fips = (row.get('FIPS_STATE') or
                   row.get('STATE') or '00')
            
            if not name.strip():
                continue
            
            tagged = tag_agency(
                name, fips.zfill(2), core, subcats
            )
            tagged['census_id'] = row.get(
                'ID', row.get('UNIT_ID', str(i))
            )
            tagged['county_fips'] = row.get(
                'FIPS_COUNTY', row.get('COUNTY','')
            )
            results.append(tagged)
        
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    flagged = [r for r in results 
               if r['confidence'] < 30]
    print(f"Batch done: {len(results)} agencies")
    print(f"Need review: {len(flagged)}")
    print(f"Output: {output_file}")
    return results

# RUN FIRST BATCH OF 2000:
process_batch(
    '2022_Gaz_place_national.txt',
    'batch_001.json',
    start=0,
    batch=2000
)
