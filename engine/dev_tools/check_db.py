import os
from supabase import create_client

url = "https://mofkjgfrpfmtnktaepqi.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZmtqZ2ZycGZtdG5rdGFlcHFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMzg3MSwiZXhwIjoyMDg5MTA5ODcxfQ.4Dt6aFWe-0aDpY2LpeTC-CRkh2nh7YHFAGSr-M7uBvI"
supabase = create_client(url, key)

try:
    response = supabase.table("bank_reconciliations").select("count", count="exact").execute()
    print(f"COUNT: {response.count}")
    
    recs = supabase.table("bank_reconciliations").select("*").execute()
    print(f"RECORDS: {recs.data}")
except Exception as e:
    print(f"ERROR: {e}")
