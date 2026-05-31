import psycopg2
import os
from dotenv import load_dotenv

# Load env variables from engine/.env
load_dotenv(dotenv_path="engine/.env")

db_url = os.getenv("DATABASE_URL")

try:
    print(f"Connecting to database...")
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()
    
    # 1. Drop trigger if exists
    print("Dropping trigger if exists...")
    cur.execute("DROP TRIGGER IF EXISTS trg_sync_contract_to_employee ON public.employment_contracts;")
    print("Trigger dropped successfully.")
    
    # 2. Re-create the function
    print("Creating function fn_sync_contract_to_employee...")
    func_sql = """
    CREATE OR REPLACE FUNCTION public.fn_sync_contract_to_employee()
    RETURNS trigger AS $$
    BEGIN
        IF NEW.status = 'activo' THEN
            UPDATE public.employees
            SET sueldo_base = NEW.sueldo_base,
                tipo_contrato = NEW.tipo_contrato::text::contract_type,
                cargo = NEW.cargo
            WHERE id = NEW.employee_id;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    """
    cur.execute(func_sql)
    print("Function created successfully.")
    
    # 3. Re-create the trigger
    print("Creating trigger trg_sync_contract_to_employee...")
    trigger_sql = """
    CREATE TRIGGER trg_sync_contract_to_employee
    AFTER INSERT OR UPDATE ON public.employment_contracts
    FOR EACH ROW EXECUTE FUNCTION public.fn_sync_contract_to_employee();
    """
    cur.execute(trigger_sql)
    print("Trigger created successfully!")
    
    cur.close()
    conn.close()
    print("🎉 All operations completed successfully.")
except Exception as e:
    print(f"❌ Error: {e}")
