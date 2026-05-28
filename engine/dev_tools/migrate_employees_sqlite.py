import sqlite3
import os
import sys
from core.database import get_supabase

# Configuración
SQLITE_DB_PATH = r"C:\Users\Matías Riquelme\Desktop\SistemaRemuneraciones_Export\database\remuneraciones.db"
# Usamos Tecnología rodriguez Saldivia spa (RUT 77411206-5) asociada a mirodrigcab@gmail.com.
TARGET_ORG_ID = "be168b8e-8906-49e5-86e1-6a75919024ba" 

def clean_rut(rut_str):
    if not rut_str:
        return ""
    return rut_str.replace(".", "").replace("-", "").replace(" ", "").upper()

def migrate_employees():
    if not os.path.exists(SQLITE_DB_PATH):
        print(f"[-] Error: El archivo SQLite no existe en {SQLITE_DB_PATH}")
        sys.exit(1)

    print("[*] Conectando a SQLite...")
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM trabajadores WHERE activo = 1")
        workers = cursor.fetchall()
        print(f"[*] Encontrados {len(workers)} trabajadores activos en SQLite.")
    except Exception as e:
        print(f"[-] Error al consultar la tabla trabajador en SQLite: {e}")
        conn.close()
        sys.exit(1)

    supabase = get_supabase()
    migrated_count = 0
    errors_count = 0

    print("[*] Iniciando migracion a Supabase...")

    for w in workers:
        rut_clean = clean_rut(w["rut"])
        if not rut_clean:
            print(f"[!] Omitiendo registro con RUT vacio. ID SQLite: {w['id']}")
            continue

        nombre_completo = f"{w['nombres']} {w['apellido_paterno']}"
        print(f"[-] Procesando: {nombre_completo} (RUT: {rut_clean})")

        # Conversion del enum contract_type
        tipo_contrato_sqlite = (w["tipo_contrato"] or "INDEFINIDO").upper()
        tipo_contrato = "indefinido"
        if "FIJO" in tipo_contrato_sqlite or "PLAZO" in tipo_contrato_sqlite:
            tipo_contrato = "plazo_fijo"

        # Formatear fechas
        fecha_ingreso = w["fecha_ingreso"]
        if fecha_ingreso and len(fecha_ingreso) > 10:
            fecha_ingreso = fecha_ingreso[:10]
        
        # Mapear a esquema Postgres Supabase
        employee_record = {
            "organization_id": TARGET_ORG_ID,
            "rut": rut_clean,
            "nombres": w["nombres"] or "",
            "apellido_paterno": w["apellido_paterno"] or "",
            "apellido_materno": w["apellido_materno"] or "",
            "fecha_ingreso": fecha_ingreso or "2025-01-01",
            "cargo": (w["cargo"] or "OPERARIO").upper(),
            "tipo_contrato": tipo_contrato,
            "sueldo_base": int(w["sueldo_base"] or 0),
            "gratificacion_legal": bool(w["tiene_gratificacion"]),
            "afp": (w["afp"] or "MODELO").upper(),
            "prevision_salud": (w["salud"] or "FONASA").upper(),
            "plan_salud_uf": float(w["plan_salud_uf"] or 0.0),
            "family_allowances": int(w["cargas_familiares"] or 0),
            "afc_active": True,
            "email": w["email"] or "",
            "phone": w["telefono"] or "",
            "sexo": "M" if w["sexo"] == "M" else "F",
            "estado_civil": "Soltero(a)",
            "nacionalidad": "Chilena",
            "horas_semanales": 42,
            "activo": True,
            "asignacion_colacion": 0,
            "asignacion_movilizacion": 0,
            "bono_fijo": 0
        }

        try:
            # Upsert idempotente por RUT y Organizacion
            supabase.table("employees").upsert(
                employee_record, 
                on_conflict="organization_id, rut"
            ).execute()
            print(f"[+] Migrado exitosamente: {nombre_completo}")
            migrated_count += 1
        except Exception as ex:
            print(f"[-] Error al migrar {nombre_completo}: {ex}")
            errors_count += 1

    conn.close()
    print("\n[*] --- PROCESO FINALIZADO ---")
    print(f"[+] Migrados con exito: {migrated_count}")
    print(f"[-] Errores encontrados: {errors_count}")

if __name__ == "__main__":
    migrate_employees()
