import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = "postgresql://postgres:Matigol1234.@db.mofkjgfrpfmtnktaepqi.supabase.co:5432/postgres"

def fix():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Asientos detectados con descuadre de $37,389
    target_entries = [
        "128d7090-b914-4309-b40c-2485fcd29152", # Mayo 2026
        "f14c544b-33c7-45aa-93cd-6153cc8e62e5"  # Marzo 2026
    ]
    
    for entry_id in target_entries:
        print(f"Reparando asiento {entry_id}...")
        
        # 1. Obtener la cuenta de AFP por Pagar (Haber) para este asiento
        cur.execute("""
            SELECT id, monto, cuenta_nombre 
            FROM journal_entry_lines 
            WHERE entry_id = %s AND cuenta_nombre LIKE '%%AFP%%' AND tipo = 'haber'
        """, (entry_id,))
        line = cur.fetchone()
        
        if line:
            nuevo_monto = line['monto'] + 37389
            print(f"   Actualizando {line['cuenta_nombre']}: {line['monto']} -> {nuevo_monto}")
            
            cur.execute("""
                UPDATE journal_entry_lines 
                SET monto = %s 
                WHERE id = %s
            """, (nuevo_monto, line['id']))
        else:
            print(f"   No se encontró la línea de AFP para el asiento {entry_id}")

    conn.commit()
    print("\n✅ Reparación completada. Los asientos ahora deberían estar cuadrados.")
    cur.close()
    conn.close()

if __name__ == "__main__":
    fix()
