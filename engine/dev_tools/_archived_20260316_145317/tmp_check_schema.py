import psycopg2
import os
from dotenv import load_dotenv
load_dotenv('engine/.env')

url = os.getenv('DATABASE_URL')
conn = psycopg2.connect(url)
cur = conn.cursor()

def check_table(table_name):
    print(f'\n--- Columns in {table_name} ---')
    try:
        cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table_name}'")
        for row in cur.fetchall():
            print(f'{row[0]} : {row[1]}')
    except Exception as e:
        print(f"Error checking {table_name}: {e}")

check_table('companies')
check_table('organizations')
check_table('organization_members')

cur.close()
conn.close()
