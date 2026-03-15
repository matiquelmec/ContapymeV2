import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(url, key)

sql = """
CREATE TABLE IF NOT EXISTS public.payroll_books (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id),
    periodo date NOT NULL,
    book_number integer NOT NULL,
    company_name text NOT NULL,
    company_rut text NOT NULL,
    status text NOT NULL DEFAULT 'draft',
    total_employees integer DEFAULT 0,
    total_haberes bigint DEFAULT 0,
    total_descuentos bigint DEFAULT 0,
    total_liquido bigint DEFAULT 0,
    generated_at timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT payroll_books_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.payroll_book_details (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    payroll_book_id uuid NOT NULL REFERENCES public.payroll_books(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES public.employees(id),
    employee_rut text NOT NULL,
    apellido_paterno text,
    apellido_materno text,
    nombres text,
    cargo text,
    area text,
    centro_costo text,
    dias_trabajados integer DEFAULT 30,
    horas_semanales integer DEFAULT 45,
    horas_no_trabajadas integer DEFAULT 0,
    sueldo_base bigint DEFAULT 0,
    gratificacion_legal bigint DEFAULT 0,
    promedio_variable_vacaciones bigint DEFAULT 0,
    colacion bigint DEFAULT 0,
    movilizacion bigint DEFAULT 0,
    asignacion_familiar bigint DEFAULT 0,
    total_haberes_imponibles bigint DEFAULT 0,
    total_haberes_brutos bigint DEFAULT 0,
    descuento_afp bigint DEFAULT 0,
    descuento_salud bigint DEFAULT 0,
    descuento_afc bigint DEFAULT 0,
    impuesto_unico bigint DEFAULT 0,
    otros_descuentos bigint DEFAULT 0,
    total_descuentos bigint DEFAULT 0,
    sueldo_liquido bigint DEFAULT 0,
    CONSTRAINT payroll_book_details_pkey PRIMARY KEY (id)
);
"""

try:
    print("Attempting to execute SQL via RPC...")
    res = supabase.rpc("exec_sql", {"query": sql}).execute()
    print("Success!")
except Exception as e:
    print(f"Failed to execute SQL via RPC: {e}")
