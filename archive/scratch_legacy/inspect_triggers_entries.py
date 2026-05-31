import psycopg2

DATABASE_URL = "postgresql://postgres.mofkjgfrpfmtnktaepqi:Matigol1234.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require"

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Get triggers on centralized_account_config
cur.execute("""
    SELECT trigger_name, event_manipulation, action_statement, action_timing
    FROM information_schema.triggers
    WHERE event_object_table = 'centralized_account_config';
""")
triggers = cur.fetchall()
print("Triggers:")
for t in triggers:
    print(t)

# Let's inspect the error or entries
cur.execute("SELECT * FROM public.account_config_entries;")
print("\nEntries in account_config_entries:")
print(cur.fetchall())

cur.close()
conn.close()
