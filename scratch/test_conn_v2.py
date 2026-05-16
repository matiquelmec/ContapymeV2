import requests
import json

SUPABASE_URL = "https://mofkjgfrpfmtnktaepqi.supabase.co"
# SERVICE ROLE KEY
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZmtqZ2ZycGZtdG5rdGFlcHFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMzg3MSwiZXhwIjoyMDg5MTA5ODcxfQ.4Dt6aFWe-0aDpY2LpeTC-CRkh2nh7YHFAGSr-M7uBvI"

def test_connection():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    
    url = f"{SUPABASE_URL}/rest/v1/organizations?select=id,nombre&limit=5"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        print("--- Connection Successful (Service Role) ---")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"--- Connection Failed ---\n{str(e)}")

if __name__ == "__main__":
    test_connection()
