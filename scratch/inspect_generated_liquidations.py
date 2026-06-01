import os
import psycopg2
from dotenv import load_dotenv

load_dotenv("c:/Users/Matías Riquelme/Desktop/Proyectos documentados/Contapymepuq/.env")

def main():
    print("Conectándose a Supabase via Pooler SSL...")
    conn = psycopg2.connect(
        host="aws-1-us-east-2.pooler.supabase.com",
        database="postgres",
        user="postgres.mofkjgfrpfmtnktaepqi",
        password="Matigol1234.",
        port=6543,
        sslmode="require",
        connect_timeout=10
    )
    cur = conn.cursor()
    
    print("Consultando las últimas 10 liquidaciones creadas en la base de datos...")
    cur.execute("""
        SELECT id, organization_id, employee_id, periodo, status, created_at, sueldo_liquido
        FROM public.liquidations
        ORDER BY created_at DESC
        LIMIT 10;
    """)
    rows = cur.fetchall()
    print(f"Últimas {len(rows)} liquidaciones:")
    for r in rows:
        print(f"ID: {r[0]} | OrgID: {r[1]} | EmpID: {r[2]} | Período: {r[3]} | Estado: {r[4]} | Creado: {r[5]} | Neto: {r[6]}")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
