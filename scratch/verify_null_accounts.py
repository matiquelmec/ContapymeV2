import requests
import json

SUPABASE_URL = "https://mofkjgfrpfmtnktaepqi.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZmtqZ2ZycGZtdG5rdGFlcHFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMzg3MSwiZXhwIjoyMDg5MTA5ODcxfQ.4Dt6aFWe-0aDpY2LpeTC-CRkh2nh7YHFAGSr-M7uBvI"
ORG_ID = "f8758d56-0675-41e4-bc31-e3013052292a"

def check_null_accounts():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    
    # Check lines with null account_id
    url = f"{SUPABASE_URL}/rest/v1/journal_entry_lines?organization_id=eq.{ORG_ID}&account_id=is.null&select=id"
    res = requests.get(url, headers=headers)
    null_count = len(res.json())
    
    # Check total lines
    url_total = f"{SUPABASE_URL}/rest/v1/journal_entry_lines?organization_id=eq.{ORG_ID}&select=id"
    res_total = requests.get(url_total, headers=headers)
    total_count = len(res_total.json())
    
    print(f"Total Lines: {total_count}")
    print(f"Lines with NULL account_id: {null_count}")
    
if __name__ == "__main__":
    check_null_accounts()
