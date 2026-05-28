import psycopg2

DB_URL = "postgresql://postgres.mofkjgfrpfmtnktaepqi:Matigol1234.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require"

conn = psycopg2.connect(DB_URL)
cur = conn.cursor()
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'journal_entry_lines' AND table_schema = 'public' ORDER BY ordinal_position;")
rows = cur.fetchall()
print("Columnas de journal_entry_lines:")
for r in rows:
    print(f"  - {r[0]}")

cur.execute("SELECT COUNT(*) FROM public.journal_entry_lines WHERE account_id IS NULL;")
null_count = cur.fetchone()[0]
print(f"\nRegistros con account_id NULL: {null_count}")

cur.execute("SELECT is_nullable FROM information_schema.columns WHERE table_name = 'journal_entry_lines' AND column_name = 'account_id' AND table_schema = 'public';")
nullable = cur.fetchone()
print(f"account_id is_nullable: {nullable[0] if nullable else 'N/A'}")

cur.close()
conn.close()
