import psycopg2
import os
from dotenv import load_dotenv

load_dotenv('engine/.env')
db_url = os.environ.get("DATABASE_URL")
print(f"URL: {db_url}")

try:
    conn = psycopg2.connect(db_url)
    print("✅ Connected!")
    conn.close()
except Exception as e:
    print(f"❌ Failed: {e}")
