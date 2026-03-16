-- Migration: RCV Imports Log and CSV Storage Backup
-- Description: Agrega tabla rcv_imports para respaldar datos del CSV en Storage, 
-- y asocia import_id a compra/venta.

-- 1. Crear tabla de logs (rcv_imports)
CREATE TABLE IF NOT EXISTS public.rcv_imports (
  id              uuid    NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid    NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  periodo         date    NOT NULL,
  tipo            text    NOT NULL CHECK (tipo IN ('purchases', 'sales')),
  file_name       text    NOT NULL,
  storage_path    text    NOT NULL,
  total_docs      integer DEFAULT 0,
  failed_docs     integer DEFAULT 0,
  error_log       jsonb   DEFAULT '[]'::jsonb,
  created_at      timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Habilitar RLS y políticas
ALTER TABLE public.rcv_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members access RCV Imports" ON public.rcv_imports;
CREATE POLICY "Members access RCV Imports" 
ON public.rcv_imports FOR ALL 
USING (organization_id IN (SELECT get_my_org_ids()));

-- 3. Referenciar import_id en tablas de registros
ALTER TABLE public.purchase_records
ADD COLUMN IF NOT EXISTS import_id uuid;

ALTER TABLE public.sales_records
ADD COLUMN IF NOT EXISTS import_id uuid;
