"""Re-migración correctiva de campos de empleados desde el SQLite legacy.

La migración original (migrate_employees_sqlite.py) NO trasladó varios campos:
zona extrema, jornada parcial, centro de costo, datos bancarios, tramo de
asignación, semana corrida y vacaciones pendientes. Este script hace un
UPDATE conservador: solo rellena esos campos (matcheando por organización + RUT)
sin sobrescribir el resto de la ficha, por lo que es seguro re-ejecutarlo.

Credenciales: usa get_supabase() (lee del entorno). NO hardcodear secretos.

Uso:
    engine/.venv/Scripts/python.exe engine/dev_tools/remigrate_employees_fields.py
"""

import os
import sqlite3
import sys

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "engine"))
from core.database import get_supabase  # noqa: E402

SQLITE_DB_PATH = r"C:\Users\Matías Riquelme\Desktop\SistemaRemuneraciones_Export\database\remuneraciones.db"
# Org destino de la migración original (Tecnología Rodriguez Saldivia SpA / mirodrigcab).
TARGET_ORG_ID = "be168b8e-8906-49e5-86e1-6a75919024ba"

VALID_TRAMOS = {"A", "B", "C", "D"}


def clean_rut(rut_str: str) -> str:
    if not rut_str:
        return ""
    return rut_str.replace(".", "").replace("-", "").replace(" ", "").upper()


def main():
    if not os.path.exists(SQLITE_DB_PATH):
        sys.exit(f"[-] No existe el SQLite en {SQLITE_DB_PATH}")

    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    workers = conn.execute("SELECT * FROM trabajadores WHERE activo = 1").fetchall()
    print(f"[*] {len(workers)} trabajadores activos en el legacy.")

    db = get_supabase()
    updated = skipped = vac_loaded = 0

    for w in workers:
        rut = clean_rut(w["rut"])
        if not rut:
            continue

        # Solo backfill de los campos que la migración original dejó fuera.
        fields = {}
        if w["centro_costo"]:
            fields["centro_costo"] = w["centro_costo"]
        if w["banco"]:
            fields["banco_transferencia"] = w["banco"]
        if w["cuenta_banco"]:
            fields["cuenta_transferencia"] = str(w["cuenta_banco"])
        if w["tipo_cuenta"]:
            fields["tipo_cuenta"] = w["tipo_cuenta"]
        tramo = (w["tramo_asignacion"] or "").upper().strip()
        if tramo in VALID_TRAMOS:
            fields["tramo_asignacion"] = tramo
        if w["es_zona_extrema"]:
            fields["es_zona_extrema"] = True
            fields["zona_extrema"] = (w["zona_extrema"] or "MAGALLANES").upper()
        if w["jornada_parcial"]:
            fields["jornada_parcial"] = True
        if w["tiene_semana_corrida"]:
            fields["tiene_semana_corrida"] = True
        fecha_termino = w["fecha_termino"]
        if fecha_termino and len(str(fecha_termino)) >= 10:
            fields["fecha_termino"] = str(fecha_termino)[:10]

        if not fields:
            skipped += 1
            continue

        try:
            res = (
                db.table("employees")
                .update(fields)
                .eq("organization_id", TARGET_ORG_ID)
                .eq("rut", rut)
                .execute()
            )
            if res.data:
                updated += 1
                print(f"[+] {rut} {w['nombres']} {w['apellido_paterno']}: {list(fields.keys())}")
            else:
                print(f"[!] {rut} no encontrado en la org destino (¿no migrado?).")
        except Exception as ex:
            print(f"[-] Error actualizando {rut}: {ex}")

        # Vacaciones pendientes -> ajuste en el ledger (si no se cargó antes).
        dias_vac = w["dias_vacaciones_pendientes"]
        if dias_vac and float(dias_vac) > 0:
            try:
                emp_res = (
                    db.table("employees").select("id")
                    .eq("organization_id", TARGET_ORG_ID).eq("rut", rut).limit(1).execute()
                )
                if emp_res.data:
                    emp_id = emp_res.data[0]["id"]
                    existing = (
                        db.table("vacation_ledger").select("id")
                        .eq("employee_id", emp_id).eq("tipo", "adjustment")
                        .ilike("comentarios", "%saldo inicial migracion legacy%").limit(1).execute()
                    )
                    if not existing.data:
                        db.table("vacation_ledger").insert({
                            "organization_id": TARGET_ORG_ID,
                            "employee_id": emp_id,
                            "tipo": "adjustment",
                            "dias": float(dias_vac),
                            "comentarios": "Saldo inicial migracion legacy",
                        }).execute()
                        vac_loaded += 1
                        print(f"    -> vacaciones pendientes cargadas: {dias_vac} dias")
            except Exception as ex:
                print(f"[-] Error cargando vacaciones de {rut}: {ex}")

    conn.close()
    print("\n[*] --- FIN ---")
    print(f"[+] Actualizados: {updated}  |  Sin cambios: {skipped}  |  Vacaciones cargadas: {vac_loaded}")


if __name__ == "__main__":
    main()
