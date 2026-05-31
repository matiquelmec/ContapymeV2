import os
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = "postgresql://postgres:Matigol1234.@db.mofkjgfrpfmtnktaepqi.supabase.co:5432/postgres"

def inspect():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    print("--- INSPECCIONANDO LIQUIDACION MARZO 2026 ---")
    cur.execute("""
        SELECT 
            total_haberes_brutos, 
            salud_total, 
            sueldo_liquido, 
            afp, 
            afp_comision, 
            impuesto_unico, 
            afc_trabajador,
            sis_empresa,
            afc_empresa,
            asignacion_familiar
        FROM liquidations 
        WHERE periodo = '2026-03-01' 
        LIMIT 1;
    """)
    row = cur.fetchone()
    
    if not row:
        print("No se encontró liquidación para ese periodo.")
        return

    print(f"Total Haberes Brutos: {row['total_haberes_brutos']}")
    print(f"Salud Total (H):      {row['salud_total']}")
    print(f"AFP + Comis (H):      {row['afp'] + row['afp_comision']}")
    print(f"AFC Trab (H):         {row['afc_trabajador']}")
    print(f"Impuesto (H):         {row['impuesto_unico']}")
    print(f"Líquido (H):          {row['sueldo_liquido']}")
    print(f"Asig Familiar (H?):   {row['asignacion_familiar']}")
    
    sum_haber = (row['salud_total'] + row['afp'] + row['afp_comision'] + 
                 row['afc_trabajador'] + row['impuesto_unico'] + row['sueldo_liquido'])
    
    print(f"Suma Haber (sin AsigFam): {sum_haber}")
    print(f"Diferencia (Bruto - SumHaber): {row['total_haberes_brutos'] - sum_haber}")
    
    print("\n--- CARGOS EMPRESA ---")
    print(f"SIS Empresa: {row['sis_empresa']}")
    print(f"AFC Empresa: {row['afc_empresa']}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    inspect()
