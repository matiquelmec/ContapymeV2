import requests
import json

SUPABASE_URL = "https://mofkjgfrpfmtnktaepqi.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZmtqZ2ZycGZtdG5rdGFlcHFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMzg3MSwiZXhwIjoyMDg5MTA5ODcxfQ.4Dt6aFWe-0aDpY2LpeTC-CRkh2nh7YHFAGSr-M7uBvI"

def list_tables():
    # We can't list tables easily via REST without knowing them, but we can try to guess or use the swagger docs if enabled
    # Actually, let's try to query 'journal_entry_details' or 'ledger_entries'
    tables_to_try = ['journal_entry_details', 'journal_entry_lines', 'ledger_entries', 'account_moves']
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    
    for table in tables_to_try:
        url = f"{SUPABASE_URL}/rest/v1/{table}?limit=1"
        response = requests.get(url, headers=headers)
        if response.ok:
            print(f"--- Table Found: {table} ---")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"Table not found: {table}")

if __name__ == "__main__":
    list_tables()
