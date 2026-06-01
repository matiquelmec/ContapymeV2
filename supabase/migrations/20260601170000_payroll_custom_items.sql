-- ============================================================
-- 🧩 MIGRACIÓN: Haberes y descuentos configurables por la empresa
-- Objetivo: permitir definir conceptos propios por período (un bono especial,
-- un descuento puntual, etc.) sin tocar el esquema. El motor los agrega en
-- tres cubos: haber imponible, haber no imponible y descuento.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payroll_custom_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  periodo DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('haber', 'descuento')),
  nombre TEXT NOT NULL,
  monto BIGINT NOT NULL CHECK (monto >= 0),
  -- Solo aplica a 'haber'. true = imponible y tributable; false = no imponible.
  es_imponible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payroll_custom_items_lookup
  ON public.payroll_custom_items (organization_id, employee_id, periodo);

ALTER TABLE public.payroll_custom_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payroll_custom_items_all ON public.payroll_custom_items;
CREATE POLICY payroll_custom_items_all ON public.payroll_custom_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = payroll_custom_items.organization_id
        AND om.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.payroll_custom_items IS
  'Haberes y descuentos definidos por la empresa, por empleado y período. Los agrega el motor de nómina.';
