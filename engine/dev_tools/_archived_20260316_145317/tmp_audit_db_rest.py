
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load from engine/.env
load_dotenv(dotenv_path=r"c:\Users\Matías Riquelme\Desktop\Contapymepuq\engine\.env")

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env")
    exit(1)

supabase: Client = create_client(url, key)

try:
    # Get all tables using RPC or a query if possible, 
    # but supabase-py doesn't have a direct "list tables" method easily.
    # We can try to query a known table or use the postgrest client to query information_schema if allowed via RPC, 
    # but usually we use a raw SQL approach for this.
    # Since I don't have psycopg2, I'll try to use the REST API to see if I can get some info.
    
    # Or I can try to simply query the schema if there's an RPC for it.
    # For now, let's just check if we can connect and get organizations.
    res = supabase.table("organizations").select("id").limit(1).execute()
    print("Successfully connected to Supabase.")
    
    # List of tables to check
    tables_to_check = [
        "account_mapping_rules", "centralized_account_config", "chart_of_accounts", 
        "economic_indicators", "employee_documents", "employee_terminations", 
        "employees", "employment_contracts", "f29_box_details", "f29_forms", 
        "fixed_assets", "journal_entries", "journal_entry_lines", "liquidations", 
        "organization_members", "organization_payroll_settings", "organizations", 
        "payroll_book_details", "payroll_books", "profiles", "purchase_records", 
        "rcv_imports", "sales_records", "termination_causes"
    ]
    
    existing_tables = []
    missing_tables = []
    
    for table in tables_to_check:
        try:
            # We use a select with limit 0 to just check existence
            supabase.table(table).select("*").limit(0).execute()
            existing_tables.append(table)
        except Exception:
            missing_tables.append(table)
            
    print("\nTable Audit:")
    print(f"Existing tables: {len(existing_tables)}")
    for t in existing_tables:
        print(f"  [OK] {t}")
        
    print(f"\nMissing tables in DB: {len(missing_tables)}")
    for t in missing_tables:
        print(f"  [!!] {t}")

except Exception as e:
    print(f"Error connecting: {e}")
