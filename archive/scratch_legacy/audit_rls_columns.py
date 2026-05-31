import psycopg2

DB_URL = "postgresql://postgres.mofkjgfrpfmtnktaepqi:Matigol1234.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require"

TABLES = [
    "account_config_entries",
    "bank_mapping_rules",
    "bank_statements",
    "dte_items",
    "employee_documents",
    "f29_box_details",
    "journal_entry_sequences",
    "national_payroll_params",
    "termination_causes"
]

def main():
    try:
        conn = psycopg2.connect(DB_URL)
        with conn.cursor() as cur:
            for table in TABLES:
                cur.execute(f"""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = '{table}' 
                      AND table_schema = 'public';
                """)
                cols = [row[0] for row in cur.fetchall()]
                print(f"Tabla: {table:<25} | Columnas: {', '.join(cols)}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
