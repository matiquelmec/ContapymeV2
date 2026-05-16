import requests
import json

SUPABASE_URL = "https://mofkjgfrpfmtnktaepqi.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZmtqZ2ZycGZtdG5rdGFlcHFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMzg3MSwiZXhwIjoyMDg5MTA5ODcxfQ.4Dt6aFWe-0aDpY2LpeTC-CRkh2nh7YHFAGSr-M7uBvI"
ORG_ID = "2e9f634b-4087-448c-bfa6-244bfa1eec61"

def find_dates():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    
    url = f"{SUPABASE_URL}/rest/v1/journal_entries?organization_id=eq.{ORG_ID}&select=fecha&limit=10"
    
    try:
        response = requests.get(url, headers=headers)
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(str(e))

if __name__ == "__main__":
    find_dates()
