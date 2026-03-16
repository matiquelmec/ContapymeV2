import os
import psycopg2
from dotenv import load_dotenv

load_dotenv("engine/.env")
url = os.environ.get("DATABASE_URL")

sql = """
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'journal_entries';
"""

try:
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    cur.execute(sql)
    rows = cur.fetchall()
    for row in rows:
        print(row)
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cur' in locals(): cur.close()
    if 'conn' in locals(): conn.close()
