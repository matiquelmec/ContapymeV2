import requests
import json

SUPABASE_URL = "https://mofkjgfrpfmtnktaepqi.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZmtqZ2ZycGZtdG5rdGFlcHFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MzM4NzEsImV4cCI6MjA4OTEwOTg3MX0.KNAio9v-sL3BGTLst_M11duLmaoJ2C8hFsFWLtBbJvY"

def test_connection():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    
    url = f"{SUPABASE_URL}/rest/v1/organizations?select=id,nombre&limit=5"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        print("--- Connection Successful ---")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"--- Connection Failed ---\n{str(e)}")

if __name__ == "__main__":
    test_connection()
