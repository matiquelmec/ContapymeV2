import psycopg2
import os
from dotenv import load_dotenv
load_dotenv('engine/.env')

url = os.getenv('DATABASE_URL')
conn = psycopg2.connect(url)
cur = conn.cursor()

print('--- COMPANIES ---')
try:
    cur.execute("SELECT id, name FROM companies")
    for row in cur.fetchall():
        print(f"{row[0]} | {row[1]}")
except Exception as e:
    print(f"Error companies: {e}")

print('\n--- SALES RECORD COUNTS ---')
try:
    cur.execute("SELECT organization_id, count(*) FROM sales_records GROUP BY organization_id")
    for row in cur.fetchall():
        print(f"Sales | {row[0]} | {row[1]}")
except Exception as e:
    print(f"Error sales: {e}")

print('\n--- PURCHASE RECORD COUNTS ---')
try:
    cur.execute("SELECT organization_id, count(*) FROM purchase_records GROUP BY organization_id")
    for row in cur.fetchall():
        print(f"Purchase | {row[0]} | {row[1]}")
except Exception as e:
    print(f"Error purchase: {e}")

cur.close()
conn.close()
