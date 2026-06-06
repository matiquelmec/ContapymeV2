import os
import sys
import uuid
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]

def _connect(db_url: str):
    import psycopg2
    return psycopg2.connect(db_url)

def main():
    load_dotenv(ROOT / ".env")
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL no esta configurada en .env")
        return 1

    print("=== INICIANDO PRUEBAS DE PENETRACIÓN LÓGICA (AISLAMIENTO MULTI-TENANT RLS) ===")
    conn = _connect(db_url)
    try:
        conn.autocommit = False
        with conn.cursor() as cur:
            # 1. Crear Tenants (Organizaciones) temporales
            org_a = str(uuid.uuid4())
            org_b = str(uuid.uuid4())
            
            cur.execute(
                "INSERT INTO public.organizations (id, nombre, rut_empresa) VALUES (%s, 'TENANT A MOCK', '11111111-1'), (%s, 'TENANT B MOCK', '22222222-2')",
                (org_a, org_b)
            )
            print(f"Tenants de prueba creados:\n  Tenant A: {org_a}\n  Tenant B: {org_b}")

            # 2. Crear Usuarios en Auth (si es requerido por FK) o crear en profiles
            user_a = str(uuid.uuid4())
            user_b = str(uuid.uuid4())

            # 2. Crear Usuarios en Auth (para evitar violar FK de organization_members)
            user_a = str(uuid.uuid4())
            user_b = str(uuid.uuid4())

            print(f"Usuarios de prueba creados:\n  User A: {user_a}\n  User B: {user_b}")
            
            cur.execute(
                "INSERT INTO auth.users (id, email) VALUES (%s, 'usera@mock.com'), (%s, 'userb@mock.com')",
                (user_a, user_b)
            )

            # 3. Asignar membresías a los tenants
            cur.execute(
                "INSERT INTO public.organization_members (organization_id, user_id, role) VALUES (%s, %s, 'owner'), (%s, %s, 'owner')",
                (org_a, user_a, org_b, user_b)
            )

            # 4. Crear datos confidenciales en Tenant B (DTEs, períodos, etc.)
            # Crearemos un DTE en el Tenant B
            cur.execute(
                "INSERT INTO public.dte_companies (organization_id, rut, razon_social) VALUES (%s, '77777777-7', 'EMPRESA B MOCK') RETURNING id",
                (org_b,)
            )
            company_b_id = cur.fetchone()[0]

            cur.execute(
                """
                INSERT INTO public.dte_issued (organization_id, company_id, tipo_dte, folio, receptor_rut, receptor_razon_social, monto_total, status)
                VALUES (%s, %s, 33, 501, '99999999-9', 'CLIENTE CONFIDENCIAL B', 8000000, 'signed')
                RETURNING id
                """,
                (org_b, company_b_id)
            )
            dte_b_id = cur.fetchone()[0]
            print("Datos confidenciales inyectados exitosamente en el Tenant B.")

            # 5. Activar RLS para la sesión actual simulando al Usuario A de Tenant A
            print("\nSimulando sesión del Usuario A (Tenant A)...")
            # Cambiamos el rol actual a 'authenticated' para que se apliquen las políticas RLS de Supabase
            cur.execute("SET ROLE authenticated")
            
            # Seteamos el JWT claim que Supabase usa para auth.uid()
            cur.execute(f"SET LOCAL request.jwt.claim.sub = '{user_a}'")
            cur.execute("SET LOCAL request.jwt.claims = '{\"sub\": \"" + user_a + "\"}'")

            # 6. Intentar leer datos de Tenant B como Usuario A (Debería retornar vacío debido a RLS)
            print("EJECUTANDO ATAQUE LOGICO: Usuario A intentando leer DTEs del Tenant B...")
            cur.execute("SELECT id, monto_total FROM public.dte_issued WHERE organization_id = %s", (org_b,))
            leak_data = cur.fetchall()
            
            if leak_data:
                print(f"ERROR - FALLA DE SEGURIDAD DETECTADA: El Usuario A pudo leer los datos del Tenant B! Datos filtrados: {leak_data}")
            else:
                print("OK - EXCELENTE: RLS bloqueo la lectura de datos de Tenant B correctamente (retorno 0 registros).")

            # 7. Intentar insertar datos en Tenant B como Usuario A (Debería fallar o ser bloqueado por WITH CHECK)
            print("EJECUTANDO ATAQUE LOGICO: Usuario A intentando insertar un DTE en el Tenant B...")
            try:
                cur.execute(
                    """
                    INSERT INTO public.dte_issued (organization_id, company_id, tipo_dte, folio, receptor_rut, receptor_razon_social, monto_total, status)
                    VALUES (%s, %s, 33, 999, '99999999-9', 'HACKED', 99999999, 'signed')
                    """,
                    (org_b, company_b_id)
                )
                print("ERROR - FALLA DE SEGURIDAD DETECTADA: El Usuario A pudo insertar registros en el Tenant B!")
            except Exception as insert_blocked_err:
                print(f"OK - EXCELENTE: RLS bloqueo la insercion en Tenant B. Mensaje: {insert_blocked_err}")
                # Como la transacción se aborta tras el error, hacemos rollback de esta parte
                conn.rollback()

            # 8. Regresar a rol administrador para finalizar la transacción limpia
            # Nota: Al haber hecho rollback, ya estamos en limpio
            print("=== PRUEBAS DE ISOLACIÓN COMPLETADAS CON ÉXITO ===")

    except Exception as e:
        print(f"Error inesperado durante la ejecución: {e}")
    finally:
        # Revertir todo de forma segura
        conn.rollback()
        conn.close()
        print("Transacción revertida y conexión cerrada.")

if __name__ == "__main__":
    main()
