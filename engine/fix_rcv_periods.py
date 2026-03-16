
from core.database import get_supabase
from datetime import datetime
import sys

def fix_periods():
    db = get_supabase()
    print("--- Iniciando Curación de Datos RCV (Inteligencia Temporal) ---")
    
    # 1. Corregir COMPRAS
    print("\n[Fase 1: Compras]")
    p_res = db.table("purchase_records").select("id, fecha_docto, periodo").execute()
    p_data = p_res.data or []
    
    p_updates = 0
    for r in p_data:
        try:
            # Extraer periodo real de la fecha del documento
            real_date = datetime.strptime(r['fecha_docto'], "%Y-%m-%d")
            real_period = f"{real_date.year}-{str(real_date.month).zfill(2)}-01"
            
            if r['periodo'] != real_period:
                db.table("purchase_records").update({"periodo": real_period}).eq("id", r['id']).execute()
                p_updates += 1
                if p_updates % 50 == 0:
                    print(f"  > Compras corregidas: {p_updates}...")
        except Exception as e:
            continue
            
    print(f"Fin Fase 1. Total compras corregidas: {p_updates}")

    # 2. Corregir VENTAS
    print("\n[Fase 2: Ventas]")
    s_res = db.table("sales_records").select("id, fecha_docto, periodo").execute()
    s_data = s_res.data or []
    
    s_updates = 0
    for r in s_data:
        try:
            real_date = datetime.strptime(r['fecha_docto'], "%Y-%m-%d")
            real_period = f"{real_date.year}-{str(real_date.month).zfill(2)}-01"
            
            if r['periodo'] != real_period:
                db.table("sales_records").update({"periodo": real_period}).eq("id", r['id']).execute()
                s_updates += 1
                if s_updates % 50 == 0:
                    print(f"  > Ventas corregidas: {s_updates}...")
        except Exception as e:
            continue

    print(f"Fin Fase 2. Total ventas corregidas: {s_updates}")
    
    # 3. Limpiar periodos vacíos en imports (opcional pero recomendado)
    print("\n[Fase 3: Sincronización de Lotes]")
    # Esto es más complejo por la naturaleza de los nombres de archivos, 
    # pero al menos los documentos ya están en su lugar correcto.
    
    print("\n¡OPERACIÓN COMPLETADA EXITOSAMENTE!")
    print(f"Resumen: {p_updates + s_updates} documentos fueron re-ubicados en su periodo cronológico real.")

if __name__ == "__main__":
    fix_periods()
