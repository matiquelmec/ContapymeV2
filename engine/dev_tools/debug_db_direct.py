import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def check_data():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    print("Checking organizations...")
    cur.execute("SELECT id, name FROM organizations;")
    orgs = cur.fetchall()
    for org in orgs:
        print(f"Org: {org[0]} - {org[1]}")
        
    print("\nChecking centralized_account_config...")
    try:
        cur.execute("SELECT id, organization_id, module_name, transaction_type FROM centralized_account_config;")
        configs = cur.fetchall()
        if not configs:
            print("No records found in centralized_account_config.")
        for cfg in configs:
            print(f"Config: {cfg[0]} | Org: {cfg[1]} | Module: {cfg[2]} | Type: {cfg[3]}")
    except Exception as e:
        print(f"Error checking centralized_account_config: {e}")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    check_data()
