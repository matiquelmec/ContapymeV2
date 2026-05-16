import psycopg2
import os

DATABASE_URL = "postgresql://postgres:Matigol1234.@db.mofkjgfrpfmtnktaepqi.supabase.co:5432/postgres"

def migrate():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # SQL to add columns if they don't exist
        sql = """
        ALTER TABLE employees 
        ADD COLUMN IF NOT EXISTS birth_date DATE,
        ADD COLUMN IF NOT EXISTS gender VARCHAR(50),
        ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50),
        ADD COLUMN IF NOT EXISTS nationality VARCHAR(100) DEFAULT 'Chilena',
        ADD COLUMN IF NOT EXISTS address TEXT,
        ADD COLUMN IF NOT EXISTS city VARCHAR(100),
        ADD COLUMN IF NOT EXISTS region VARCHAR(100),
        ADD COLUMN IF NOT EXISTS family_allowances INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS afc_active BOOLEAN DEFAULT TRUE;
        """
        
        cur.execute(sql)
        conn.commit()
        print("[SUCCESS] Migración completada: Columnas profesionales añadidas a 'employees'.")
        
        # Verify structure
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'employees';")
        cols = cur.fetchall()
        print(f"[INFO] Columnas actuales: {[c[0] for c in cols]}")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"[ERROR] Fallo en la migración: {str(e)}")

if __name__ == "__main__":
    migrate()
