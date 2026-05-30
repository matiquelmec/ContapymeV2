import os
import sys
import hashlib
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scratch"))
from apply_migration_19 import _connect

def calculate_python_hash(row) -> str:
    """Calcula el hash de integridad en Python idéntico a PostgreSQL."""
    # row es una tupla: (organization_id, company_id, tipo_dte, folio, monto_total, receptor_rut, previous_hash)
    fields = [str(val) for val in row]
    data_string = "|".join(fields)
    return hashlib.sha256(data_string.encode('utf-8')).hexdigest()

def main():
    load_dotenv(ROOT / ".env")
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL no esta configurada en .env")
        return 1

    print("=== INICIANDO SIMULACIÓN DE AUDITORÍA Y ALTERACIÓN FORENSE (LEDGER SHA-256) ===")
    conn = _connect(db_url)
    try:
        # Iniciamos transacción para poder revertir cualquier cambio al final
        conn.autocommit = False
        with conn.cursor() as cur:
            # 1. Obtener una organización de prueba
            cur.execute("SELECT id FROM public.organizations LIMIT 1")
            org_row = cur.fetchone()
            if not org_row:
                print("ERROR: No se encontró ninguna organización en la base de datos para realizar la prueba.")
                return 1
            org_id = org_row[0]

            # 2. Buscar o crear una compañía emisora ficticia para el test
            cur.execute("SELECT id, rut FROM public.dte_companies WHERE organization_id = %s LIMIT 1", (org_id,))
            company_row = cur.fetchone()
            if not company_row:
                print("Creando compañía emisora temporal para pruebas...")
                cur.execute(
                    """
                    INSERT INTO public.dte_companies (organization_id, rut, razon_social)
                    VALUES (%s, '99999999-9', 'EMPRESA MOCK AUDIT')
                    RETURNING id, rut
                    """,
                    (org_id,)
                )
                company_row = cur.fetchone()
            
            company_id, company_rut = company_row

            # Limpiar cualquier DTE de prueba anterior en esta transacción
            cur.execute("DELETE FROM public.dte_issued WHERE company_id = %s", (company_id,))

            # 3. Crear 3 DTEs para construir una cadena limpia
            print("\nCreando cadena de 3 DTEs consecutivos (simulación)...")
            dtes = [
                {"tipo": 33, "folio": 101, "monto": 150000, "receptor": "88888888-8"},
                {"tipo": 33, "folio": 102, "monto": 250000, "receptor": "77777777-7"},
                {"tipo": 33, "folio": 103, "monto": 350000, "receptor": "66666666-6"},
            ]

            inserted_dtes = []
            for dte in dtes:
                cur.execute(
                    """
                    INSERT INTO public.dte_issued (organization_id, company_id, tipo_dte, folio, monto_total, receptor_rut, receptor_razon_social, status)
                    VALUES (%s, %s, %s, %s, %s, %s, 'CLIENTE PRUEBA', 'signed')
                    RETURNING id, organization_id, company_id, tipo_dte, folio, monto_total, receptor_rut, previous_hash, integrity_hash
                    """,
                    (org_id, company_id, dte["tipo"], dte["folio"], dte["monto"], dte["receptor"])
                )
                inserted_dtes.append(cur.fetchone())

            print("Cadena creada con éxito:")
            for row in inserted_dtes:
                print(f"  Folio {row[4]}: Hash={row[8][:16]}... PrevHash={row[7][:16]}...")

            # 4. Validar la cadena (Python logic contra BD records)
            print("\nValidando consistencia de la cadena (Estado Inicial)...")
            chain_errors = []
            expected_prev = "ORIGIN"
            for row in inserted_dtes:
                # tuple keys map:
                # 0: id, 1: organization_id, 2: company_id, 3: tipo_dte, 4: folio, 5: monto_total, 6: receptor_rut, 7: previous_hash, 8: integrity_hash
                rec = (row[1], row[2], row[3], row[4], row[5], row[6], row[7])
                py_hash = calculate_python_hash(rec)
                
                # Check 1: Chain link
                if row[7] != expected_prev:
                    chain_errors.append(f"Ruptura de enlace en Folio {row[4]}: anterior esperado {expected_prev}, encontrado {row[7]}")
                # Check 2: Content integrity
                if row[8] != py_hash:
                    chain_errors.append(f"Mismacth de contenido en Folio {row[4]}: hash BD {row[8]}, hash calculado {py_hash}")
                
                expected_prev = row[8]

            if not chain_errors:
                print("OK - VERIFICACION INICIAL: LA CADENA ESTA 100% SANA Y CORRECTA.")
            else:
                print(f"ERROR - FALLA EN VERIFICACION INICIAL: {chain_errors}")
                return 1

            # 5. Intentar alterar un registro (Simular ataque de manipulación de monto en el Folio 102)
            altered_folio = 102
            print(f"\nSimulando ataque (Tampering): Modificando monto_total en Folio {altered_folio} de 250.000 a 10.000...")
            
            # Ejecutar modificación directa en la base de datos
            cur.execute(
                "UPDATE public.dte_issued SET monto_total = 10000 WHERE company_id = %s AND folio = %s",
                (company_id, altered_folio)
            )

            # Volver a leer la cadena completa desde la BD
            cur.execute(
                """
                SELECT id, organization_id, company_id, tipo_dte, folio, monto_total, receptor_rut, previous_hash, integrity_hash
                FROM public.dte_issued
                WHERE company_id = %s
                ORDER BY folio ASC
                """,
                (company_id,)
            )
            altered_dtes = cur.fetchall()

            # 6. Ejecutar auditoría forense sobre la cadena modificada
            print("\nValidando consistencia de la cadena (Post-Alteración)...")
            post_errors = []
            expected_prev = "ORIGIN"
            for row in altered_dtes:
                rec = (row[1], row[2], row[3], row[4], row[5], row[6], row[7])
                py_hash = calculate_python_hash(rec)
                
                # Check 1: Chain link
                if row[7] != expected_prev:
                    post_errors.append(f"Ruptura de enlace en Folio {row[4]}: anterior esperado {expected_prev[:12]}..., encontrado {row[7][:12]}...")
                # Check 2: Content integrity
                if row[8] != py_hash:
                    post_errors.append(f"Manipulacion detectada en Folio {row[4]}: El contenido no coincide con el hash firmado. (Monto={row[5]}, Hash BD={row[8][:12]}..., Hash Real Computado={py_hash[:12]}...)")
                
                expected_prev = row[8]

            print(f"Resultados de la auditoria post-alteracion:")
            if post_errors:
                print("OK - PRUEBA EXITOSA: El Ledger detecto la manipulacion correctamente!")
                for err in post_errors:
                    print(f"  ALERTA: {err}")
            else:
                print("ERROR GRAVE: El Ledger no detecto la manipulacion!")

            # 7. Hallazgo de Auditoría Adicional: Mostrar que la base de datos no bloqueó el UPDATE
            print("\nAnálisis de Seguridad de Base de Datos:")
            print("  [HALLAZGO] PostgreSQL permitió ejecutar la modificación directamente (UPDATE) sin lanzar errores.")
            print("  Esto confirma que el trigger solo corre BEFORE INSERT y no existe restricción de edición (UPDATE) para DTEs firmados.")

    except Exception as e:
        print(f"Ocurrió un error inesperado durante el test: {e}")
    finally:
        # Revertir todo para no tocar los datos reales de producción
        print("\nRevirtiendo todos los cambios temporales (ROLLBACK)...")
        conn.rollback()
        conn.close()
        print("Conexión cerrada y base de datos limpia.")

if __name__ == "__main__":
    main()
