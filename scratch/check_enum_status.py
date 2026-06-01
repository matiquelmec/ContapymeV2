import os
import psycopg2

db_url = "postgresql://postgres:Matigol1234.@db.mofkjgfrpfmtnktaepqi.supabase.co:5432/postgres"

conn = psycopg2.connect(db_url)
cursor = conn.cursor()

# 1. Consultar el tipo enum y sus valores
cursor.execute("""
SELECT e.enumlabel
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'liquidation_status';
""")
rows = cursor.fetchall()
print("Valores de liquidation_status:")
for row in rows:
    print(f" - {row[0]}")

# 2. Consultar las liquidaciones con sus estados actuales
cursor.execute("SELECT status, count(*) FROM public.liquidations GROUP BY status;")
rows_status = cursor.fetchall()
print("\nLiquidaciones por estado:")
for r in rows_status:
    print(f" - {r[0]}: {r[1]}")

conn.close()
