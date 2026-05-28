-- ============================================================
-- 🏛️ MIGRACIÓN 15: Cierre Contable por Período
-- Objetivo: Restringir operaciones en periodos cerrados o bloqueados
-- ============================================================

-- 1. Crear la tabla de períodos contables
CREATE TABLE IF NOT EXISTS public.accounting_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL CHECK (ano >= 2000 AND ano <= 2100),
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'locked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(organization_id, ano, mes)
);

-- Habilitar RLS en accounting_periods
ALTER TABLE public.accounting_periods ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para accounting_periods basadas en membresía
DROP POLICY IF EXISTS accounting_periods_select ON public.accounting_periods;
CREATE POLICY accounting_periods_select ON public.accounting_periods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = accounting_periods.organization_id
        AND om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS accounting_periods_all ON public.accounting_periods;
CREATE POLICY accounting_periods_all ON public.accounting_periods FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = accounting_periods.organization_id
        AND om.user_id = auth.uid()
    )
  );

-- 2. Función Trigger para validar estados del periodo en journal_entries
CREATE OR REPLACE FUNCTION public.fn_check_journal_entry_period()
RETURNS TRIGGER AS $$
DECLARE
  v_date DATE;
  v_org_id UUID;
  v_period_status TEXT;
  v_ano INTEGER;
  v_mes INTEGER;
BEGIN
  -- Determinar organización y fecha según la operación
  IF TG_OP = 'DELETE' THEN
    v_date := OLD.fecha;
    v_org_id := OLD.organization_id;
  ELSE
    v_date := NEW.fecha;
    v_org_id := NEW.organization_id;
  END IF;

  v_ano := EXTRACT(YEAR FROM v_date)::INTEGER;
  v_mes := EXTRACT(MONTH FROM v_date)::INTEGER;

  -- Buscar si existe un periodo registrado y si no está abierto
  SELECT status INTO v_period_status
  FROM public.accounting_periods
  WHERE organization_id = v_org_id AND ano = v_ano AND mes = v_mes;

  IF v_period_status IS NOT NULL AND v_period_status != 'open' THEN
    RAISE EXCEPTION 'El periodo contable %-% de la organizacion % esta % y no admite modificaciones.', 
      v_ano, v_mes, v_org_id, v_period_status;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger para journal_entries
DROP TRIGGER IF EXISTS trg_check_journal_entry_period ON public.journal_entries;
CREATE TRIGGER trg_check_journal_entry_period
  BEFORE INSERT OR UPDATE OR DELETE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_check_journal_entry_period();

-- 3. Función Trigger para validar estados del periodo en journal_entry_lines
CREATE OR REPLACE FUNCTION public.fn_check_journal_entry_lines_period()
RETURNS TRIGGER AS $$
DECLARE
  v_entry_id UUID;
  v_date DATE;
  v_org_id UUID;
  v_period_status TEXT;
  v_ano INTEGER;
  v_mes INTEGER;
BEGIN
  -- Determinar entry_id
  IF TG_OP = 'DELETE' THEN
    v_entry_id := OLD.entry_id;
  ELSE
    v_entry_id := NEW.entry_id;
  END IF;

  -- Obtener la fecha y la org del asiento padre
  SELECT fecha, organization_id INTO v_date, v_org_id
  FROM public.journal_entries
  WHERE id = v_entry_id;

  IF FOUND THEN
    v_ano := EXTRACT(YEAR FROM v_date)::INTEGER;
    v_mes := EXTRACT(MONTH FROM v_date)::INTEGER;

    SELECT status INTO v_period_status
    FROM public.accounting_periods
    WHERE organization_id = v_org_id AND ano = v_ano AND mes = v_mes;

    IF v_period_status IS NOT NULL AND v_period_status != 'open' THEN
      RAISE EXCEPTION 'El periodo contable %-% de la organizacion % esta % y no admite modificaciones en sus lineas.', 
        v_ano, v_mes, v_org_id, v_period_status;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger para journal_entry_lines
DROP TRIGGER IF EXISTS trg_check_journal_entry_lines_period ON public.journal_entry_lines;
CREATE TRIGGER trg_check_journal_entry_lines_period
  BEFORE INSERT OR UPDATE OR DELETE ON public.journal_entry_lines
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_check_journal_entry_lines_period();

-- Notificar recarga de esquemas
NOTIFY pgrst, 'reload schema';
