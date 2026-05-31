import psycopg2
import sys

pooler_url = "postgresql://postgres.mofkjgfrpfmtnktaepqi:Matigol1234.@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

print("Connecting to Supabase via US-East-2 Pooler...")
try:
    conn = psycopg2.connect(pooler_url)
    print("SUCCESS: Connection established!")
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    print(f"Version: {cursor.fetchone()[0]}")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"FAIL: Connection failed: {e}")
    sys.exit(1)
