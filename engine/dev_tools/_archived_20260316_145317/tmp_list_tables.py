
import os
import psycopg2
from dotenv import load_dotenv

# Load from engine/.env
load_dotenv(dotenv_path=r"c:\Users\Matías Riquelme\Desktop\Contapymepuq\engine\.env")

db_url = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    # Get all tables in public schema
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    """)
    tables = cur.fetchall()
    
    print("Tables in public schema:")
    for table in sorted(tables):
        print(f"- {table[0]}")
        
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
