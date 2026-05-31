import psycopg2
import sys

pooler_url = "postgresql://postgres.mofkjgfrpfmtnktaepqi:Matigol1234.@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

print("Connecting to database...")
try:
    conn = psycopg2.connect(pooler_url)
    conn.autocommit = True
    cursor = conn.cursor()

    # Check columns in employee_terminations
    cursor.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'employee_terminations'
    """)
    columns = {row[0]: row[1] for row in cursor.fetchall()}
    print("Current columns in 'employee_terminations':")
    for col, dtype in sorted(columns.items()):
        print(f"  - {col}: {dtype}")

    # Add missing columns if they don't exist
    new_cols = {
        "asignacion_colacion": "bigint DEFAULT 0",
        "asignacion_movilizacion": "bigint DEFAULT 0",
        "viaticos": "bigint DEFAULT 0",
        "prestamo_ccaf": "bigint DEFAULT 0",
        "anticipo_sueldo": "bigint DEFAULT 0",
        "banco_transferencia": "text DEFAULT ''",
        "tipo_cuenta": "text DEFAULT ''",
        "cuenta_transferencia": "text DEFAULT ''"
    }

    modified = False
    for col_name, col_def in new_cols.items():
        if col_name not in columns:
            print(f"Adding column '{col_name}'...")
            cursor.execute(f"ALTER TABLE public.employee_terminations ADD COLUMN {col_name} {col_def}")
            modified = True

    if modified:
        print("[SUCCESS] Columns added successfully.")
    else:
        print("No new columns needed.")

    cursor.close()
    conn.close()
except Exception as e:
    print(f"[ERROR] {str(e)}")
    sys.exit(1)
