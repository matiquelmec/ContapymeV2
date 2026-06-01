-- ============================================================
-- 🏥 MIGRACIÓN: Módulo de Licencias Médicas
-- Objetivo: Registrar licencias (común, accidente, maternal) con folio
-- y derivar automáticamente el código de movimiento Previred (3/6) y los
-- días trabajados del período para el cálculo de nómina.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.medical_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'licencia_comun'
    CHECK (tipo IN ('licencia_comun', 'accidente_trabajo', 'licencia_maternal')),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL CHECK (fecha_fin >= fecha_inicio),
  dias_licencia INTEGER NOT NULL CHECK (dias_licencia > 0),
  folio TEXT,
  -- Código de movimiento Previred: 3 = subsidio (licencia), 6 = accidente del trabajo
  previred_movement_code TEXT NOT NULL DEFAULT '3'
    CHECK (previred_movement_code IN ('3', '6')),
  -- Período contable afectado (primer día del mes)
  periodo DATE NOT NULL,
  comentarios TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_medical_leaves_org_periodo
  ON public.medical_leaves (organization_id, periodo);
CREATE INDEX IF NOT EXISTS idx_medical_leaves_employee
  ON public.medical_leaves (employee_id);

ALTER TABLE public.medical_leaves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS medical_leaves_all ON public.medical_leaves;
CREATE POLICY medical_leaves_all ON public.medical_leaves FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = medical_leaves.organization_id
        AND om.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.medical_leaves IS
  'Licencias médicas y accidentes del trabajo. Alimentan días trabajados y código de movimiento Previred (3/6) del período.';
