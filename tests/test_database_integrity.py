import os
import sys
import unittest
import psycopg2

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'engine'))

class TestDatabaseIntegrity(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        # Configurar conexión usando el pooler con hostaddr en us-east-2 (Ohio).
        # La credencial NUNCA se hardcodea: se lee del entorno.
        cls.project_ref = "mofkjgfrpfmtnktaepqi"
        cls.password = os.getenv("SUPABASE_DB_PASSWORD") or os.getenv("DB_PASSWORD")
        if not cls.password:
            raise unittest.SkipTest("Falta SUPABASE_DB_PASSWORD en el entorno; se omite la prueba de integridad.")
        cls.user = f"postgres.{cls.project_ref}"
        cls.db_name = "postgres"
        cls.port = 6543
        cls.pooler_host = "aws-0-us-east-2.pooler.supabase.com"
        cls.ip = "13.59.95.192"
        
        try:
            cls.conn = psycopg2.connect(
                host=cls.pooler_host,
                hostaddr=cls.ip,
                database=cls.db_name,
                user=cls.user,
                password=cls.password,
                port=cls.port,
                connect_timeout=10
            )
            cls.conn.autocommit = False
            cls.cur = cls.conn.cursor()
            print("Conectado exitosamente a la DB para pruebas de integridad.")
        except Exception as e:
            raise unittest.SkipTest(f"No se pudo conectar a la base de datos para pruebas: {e}")

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, 'conn') and cls.conn:
            cls.conn.rollback()
            cls.cur.close()
            cls.conn.close()

    def setUp(self):
        # Crear una organización ficticia limpia para las pruebas
        self.cur.execute("SELECT id FROM public.organizations LIMIT 1;")
        res = self.cur.fetchone()
        if res:
            self.org_id = res[0]
        else:
            # Crear organización si no hay ninguna
            self.cur.execute(
                "INSERT INTO public.organizations (rut_empresa, nombre) VALUES ('99-1', 'Org Prueba') RETURNING id;"
            )
            self.org_id = self.cur.fetchone()[0]

    def test_dte_sales_record_deduplication(self):
        """1. Validar que sales_records se asocie y deduplique ante dte_issued"""
        # Crear DTE de prueba
        folio_test = 999999
        tipo_dte_test = 33 # Factura Electrónica
        
        # Buscar dte_company o crear una ficticia
        self.cur.execute("SELECT id FROM public.dte_companies WHERE organization_id = %s LIMIT 1;", (self.org_id,))
        company_res = self.cur.fetchone()
        if company_res:
            company_id = company_res[0]
        else:
            self.cur.execute(
                "INSERT INTO public.dte_companies (organization_id, rut, razon_social) VALUES (%s, '88-8', 'Co Prueba') RETURNING id;",
                (self.org_id,)
            )
            company_id = self.cur.fetchone()[0]

        # Insertar DTE
        self.cur.execute(
            """
            INSERT INTO public.dte_issued (organization_id, company_id, tipo_dte, folio, receptor_rut, receptor_razon_social)
            VALUES (%s, %s, %s, %s, '77-7', 'Receptor Prueba') RETURNING id;
            """,
            (self.org_id, company_id, tipo_dte_test, folio_test)
        )
        dte_id = self.cur.fetchone()[0]

        # Insertar sales_record con el mismo folio y tipo
        self.cur.execute(
            """
            INSERT INTO public.sales_records (organization_id, periodo, tipo_documento, folio, rut_receptor, fecha_docto, monto_total)
            VALUES (%s, CURRENT_DATE, '33', %s, '77-7', CURRENT_DATE, 1000) RETURNING id, dte_issued_id, es_suma;
            """,
            (self.org_id, folio_test)
        )
        sales_rec = self.cur.fetchone()
        
        # Aserciones
        self.assertEqual(sales_rec[1], dte_id, "El sales_record no se asoció al dte_issued_id correspondiente.")
        self.assertFalse(sales_rec[2], "es_suma debería ser false para evitar duplicar el registro en la contabilidad.")

    def test_sync_contract_to_employee(self):
        """2. Validar que la ficha del empleado se actualice automáticamente al activar un contrato"""
        # Crear empleado ficticio
        self.cur.execute(
            """
            INSERT INTO public.employees (organization_id, rut, nombres, apellido_paterno, fecha_ingreso, sueldo_base)
            VALUES (%s, '11-1', 'Juan', 'Perez', CURRENT_DATE, 500000) RETURNING id;
            """,
            (self.org_id,)
        )
        emp_id = self.cur.fetchone()[0]

        # Crear contrato en borrador
        self.cur.execute(
            """
            INSERT INTO public.employment_contracts (organization_id, employee_id, sueldo_base, cargo, status, fecha_inicio)
            VALUES (%s, %s, 650000, 'Gerente', 'borrador', CURRENT_DATE) RETURNING id;
            """,
            (self.org_id, emp_id)
        )
        contract_id = self.cur.fetchone()[0]

        # Actualizar contrato a activo para gatillar la sincronización
        self.cur.execute(
            "UPDATE public.employment_contracts SET status = 'activo' WHERE id = %s;",
            (contract_id,)
        )

        # Consultar empleado y verificar que los datos se actualizaron
        self.cur.execute("SELECT sueldo_base, cargo FROM public.employees WHERE id = %s;", (emp_id,))
        emp_data = self.cur.fetchone()
        
        self.assertEqual(emp_data[0], 650000, "El sueldo_base del empleado no se actualizó.")
        self.assertEqual(emp_data[1], "Gerente", "El cargo del empleado no se actualizó.")

    def test_accounting_event_reversal(self):
        """3. Validar que al anular un evento se genere un contracargo contable automático"""
        # Crear cuenta contable si no hay ninguna
        self.cur.execute("SELECT id FROM public.chart_of_accounts WHERE organization_id = %s LIMIT 2;", (self.org_id,))
        acc_rows = self.cur.fetchall()
        if len(acc_rows) >= 2:
            acc_debe = acc_rows[0][0]
            acc_haber = acc_rows[1][0]
        else:
            # Crear cuentas
            self.cur.execute(
                "INSERT INTO public.chart_of_accounts (organization_id, codigo, nombre, nivel, tipo) VALUES (%s, '1.1.1', 'Caja', 3, 'activo') RETURNING id;",
                (self.org_id,)
            )
            acc_debe = self.cur.fetchone()[0]
            self.cur.execute(
                "INSERT INTO public.chart_of_accounts (organization_id, codigo, nombre, nivel, tipo) VALUES (%s, '1.1.2', 'Banco', 3, 'activo') RETURNING id;",
                (self.org_id,)
            )
            acc_haber = self.cur.fetchone()[0]

        # Crear evento contable activo
        self.cur.execute(
            """
            INSERT INTO public.accounting_events (organization_id, event_type, source_id, status)
            VALUES (%s, 'pago', 'src_123', 'active') RETURNING id;
            """,
            (self.org_id,)
        )
        event_id = self.cur.fetchone()[0]

        # Crear asiento contable original
        self.cur.execute(
            """
            INSERT INTO public.journal_entries (organization_id, fecha, glosa, event_id, tipo_comprobante)
            VALUES (%s, CURRENT_DATE, 'Asiento Original Test', %s, 'T') RETURNING id;
            """,
            (self.org_id, event_id)
        )
        entry_id = self.cur.fetchone()[0]

        # Crear líneas del asiento contable original (Debe y Haber cuadran en 50000)
        self.cur.execute(
            "INSERT INTO public.journal_entry_lines (entry_id, tipo, monto, account_id, organization_id) VALUES (%s, 'debe', 50000, %s, %s);",
            (entry_id, acc_debe, self.org_id)
        )
        self.cur.execute(
            "INSERT INTO public.journal_entry_lines (entry_id, tipo, monto, account_id, organization_id) VALUES (%s, 'haber', 50000, %s, %s);",
            (entry_id, acc_haber, self.org_id)
        )

        # Reversar el evento (gatilla el trigger)
        self.cur.execute(
            "UPDATE public.accounting_events SET status = 'reversed' WHERE id = %s;",
            (event_id,)
        )

        # Verificar que exista un asiento contable de reversa (con glosa REVERSA AUTOMATICA)
        self.cur.execute(
            "SELECT id FROM public.journal_entries WHERE event_id = %s AND glosa LIKE 'REVERSA AUTOMATICA%%';",
            (event_id,)
        )
        rev_entry = self.cur.fetchone()
        self.assertIsNotNone(rev_entry, "No se generó el asiento contable de reversa automático.")
        rev_entry_id = rev_entry[0]

        # Verificar las líneas del asiento de reversa (las cuentas deben tener tipos Debe y Haber invertidos)
        self.cur.execute(
            "SELECT tipo, account_id, monto FROM public.journal_entry_lines WHERE entry_id = %s ORDER BY tipo;",
            (rev_entry_id,)
        )
        lines = self.cur.fetchall()
        self.assertEqual(len(lines), 2, "El asiento de reversa no tiene la cantidad correcta de líneas.")
        
        # Línea 1 (debe) - Corresponde a la cuenta que originalmente era 'haber'
        self.assertEqual(lines[0][0], 'debe')
        self.assertEqual(lines[0][1], acc_haber, "La cuenta contable del Debe no es la cuenta invertida.")
        self.assertEqual(lines[0][2], 50000)

        # Línea 2 (haber) - Corresponde a la cuenta que originalmente era 'debe'
        self.assertEqual(lines[1][0], 'haber')
        self.assertEqual(lines[1][1], acc_debe, "La cuenta contable del Haber no es la cuenta invertida.")
        self.assertEqual(lines[1][2], 50000)

if __name__ == '__main__':
    unittest.main()
