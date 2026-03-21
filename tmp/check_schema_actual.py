
import os, json
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('engine/.env')

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

results = {}

def log_table(table_name):
    try:
        res = supabase.table(table_name).select("*").limit(1).execute()
        if res.data:
            results[table_name] = list(res.data[0].keys())
        else:
            results[table_name] = "EMPTY_TABLE_NO_SCHEMA_INFO"
    except Exception as e:
        results[table_name] = f"ERROR: {str(e)}"

for t in ["bank_reconciliations", "bank_statement_lines", "journal_entry_lines", "chart_of_accounts"]:
    log_table(t)

with open('tmp/schema_results.json', 'w') as f:
    json.dump(results, f)
print("Schema logged to tmp/schema_results.json")

