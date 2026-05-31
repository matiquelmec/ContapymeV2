import os
import psycopg2
from dotenv import load_dotenv

env_path = r"c:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq\engine\.env"
load_dotenv(env_path)

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("Error: DATABASE_URL not found in .env")
    exit(1)

import re
match = re.search(r"postgresql://([^:]+):([^@]+)@db\.([^.]+)\.supabase\.co:5432/(.+)", db_url)
if not match:
    print("Could not parse DATABASE_URL to get project details.")
    exit(1)

user_base, password, project_ref, dbname = match.groups()
print(f"Project Reference: {project_ref}")

hosts = [
    f"aws-1-us-east-2.pooler.supabase.com",
    f"aws-0-us-east-2.pooler.supabase.com"
]

connected = False
for host in hosts:
    pooler_user = f"{user_base}.{project_ref}"
    print(f"Connecting to {host} on port 6543...")
    try:
        conn = psycopg2.connect(
            host=host,
            port=6543,
            user=pooler_user,
            password=password,
            database=dbname,
            connect_timeout=5
        )
        cur = conn.cursor()
        
        # Test query
        cur.execute("SELECT 1;")
        cur.fetchone()
        
        print(f"  [SUCCESS] Connected to {host}!")
        connected = True
        
        # Check if error_log column exists
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='dte_issued' AND column_name='error_log';
        """)
        res = cur.fetchone()
        
        if res:
            print("  Column 'error_log' already exists in 'dte_issued'.")
        else:
            print("  Column 'error_log' does NOT exist. Creating it...")
            cur.execute("ALTER TABLE dte_issued ADD COLUMN error_log TEXT;")
            conn.commit()
            print("  Column 'error_log' created successfully.")
            
        # Print all columns of dte_issued
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name='dte_issued'
            ORDER BY column_name;
        """)
        columns = cur.fetchall()
        print("\nColumns in 'dte_issued' table:")
        for col, dtype in columns:
            print(f"    - {col} ({dtype})")
            
        cur.close()
        conn.close()
        break
    except Exception as e:
        print(f"  Failed for host {host}: {e}")

if not connected:
    print("Could not connect to any pooler host.")
