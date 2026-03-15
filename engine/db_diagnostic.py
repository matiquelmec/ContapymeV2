import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Missing environment variables")
    exit(1)

supabase: Client = create_client(url, key)

try:
    print(f"Testing connectivity to {url}...")
    # Try to list organizations as a base check
    orgs = supabase.table("organizations").select("count", count="exact").limit(1).execute()
    print(f"Successfully connected. Organization count check: {orgs.count}")
    
    # Check if payroll_books exists
    try:
        books = supabase.table("payroll_books").select("count", count="exact").limit(1).execute()
        print("Table 'payroll_books' exists.")
    except Exception as e:
        print(f"Table 'payroll_books' does NOT exist or error: {e}")

except Exception as e:
    print(f"Connection error: {e}")
