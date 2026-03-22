-- 1. F29 FORMS: Blindaje Multi-empresa y Cascading
ALTER TABLE public.f29_forms 
DROP CONSTRAINT IF EXISTS f29_forms_organization_id_fkey;

ALTER TABLE public.f29_forms 
ADD CONSTRAINT f29_forms_organization_id_fkey 
FOREIGN KEY (organization_id) 
REFERENCES public.organizations(id) 
ON DELETE CASCADE;

ALTER TABLE public.f29_forms 
ALTER COLUMN organization_id SET NOT NULL;


-- 2. RCV IMPORTS: El historial de cargas
ALTER TABLE public.rcv_imports 
DROP CONSTRAINT IF EXISTS rcv_imports_organization_id_fkey;

ALTER TABLE public.rcv_imports 
ADD CONSTRAINT rcv_imports_organization_id_fkey 
FOREIGN KEY (organization_id) 
REFERENCES public.organizations(id) 
ON DELETE CASCADE;

ALTER TABLE public.rcv_imports 
ALTER COLUMN organization_id SET NOT NULL;


-- 3. PURCHASE RECORDS (Compras)
ALTER TABLE public.purchase_records 
DROP CONSTRAINT IF EXISTS purchase_records_organization_id_fkey;

ALTER TABLE public.purchase_records 
ADD CONSTRAINT purchase_records_organization_id_fkey 
FOREIGN KEY (organization_id) 
REFERENCES public.organizations(id) 
ON DELETE CASCADE;

ALTER TABLE public.purchase_records 
ALTER COLUMN organization_id SET NOT NULL;


-- 4. SALES RECORDS (Ventas)
ALTER TABLE public.sales_records 
DROP CONSTRAINT IF EXISTS sales_records_organization_id_fkey;

ALTER TABLE public.sales_records 
ADD CONSTRAINT sales_records_organization_id_fkey 
FOREIGN KEY (organization_id) 
REFERENCES public.organizations(id) 
ON DELETE CASCADE;

ALTER TABLE public.sales_records 
ALTER COLUMN organization_id SET NOT NULL;


-- 5. LIQUIDATIONS: Constraint de Unicidad para Upserts Atómicos
ALTER TABLE public.liquidations 
DROP CONSTRAINT IF EXISTS unique_employee_period_org;

ALTER TABLE public.liquidations 
ADD CONSTRAINT unique_employee_period_org 
UNIQUE (organization_id, employee_id, periodo);
