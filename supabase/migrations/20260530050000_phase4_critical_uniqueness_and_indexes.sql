-- =============================================================================
-- FASE 4: Unicidad Critica e Indices Operacionales
-- Fecha: 2026-05-30
-- Objetivo:
--   1) Proteger unicidad documental/operativa
--   2) Reforzar performance en consultas criticas
--   3) Fallar explicitamente si existen duplicados historicos
-- =============================================================================

SET search_path = public;

-- -----------------------------------------------------------------------------
-- 1) UNIQUE: dte_issued (company_id, tipo_dte, folio)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_exists boolean;
  v_dupes bigint;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname='public'
      AND t.relname='dte_issued'
      AND c.conname='dte_issued_company_tipo_folio_unique'
  ) INTO v_exists;

  IF NOT v_exists THEN
    SELECT COUNT(*) INTO v_dupes
    FROM (
      SELECT company_id, tipo_dte, folio
      FROM public.dte_issued
      GROUP BY company_id, tipo_dte, folio
      HAVING COUNT(*) > 1
    ) d;

    IF v_dupes > 0 THEN
      RAISE EXCEPTION 'No se puede crear dte_issued_company_tipo_folio_unique: existen % grupos duplicados.', v_dupes;
    END IF;

    ALTER TABLE public.dte_issued
      ADD CONSTRAINT dte_issued_company_tipo_folio_unique
      UNIQUE (company_id, tipo_dte, folio);
  END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- 2) UNIQUE: sales_records / purchase_records
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_exists boolean;
  v_dupes bigint;
BEGIN
  -- sales_records
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname='public'
      AND t.relname='sales_records'
      AND c.conname='sales_records_org_tipo_folio_unique'
  ) INTO v_exists;

  IF NOT v_exists THEN
    SELECT COUNT(*) INTO v_dupes
    FROM (
      SELECT organization_id, tipo_documento, folio, rut_receptor
      FROM public.sales_records
      GROUP BY organization_id, tipo_documento, folio, rut_receptor
      HAVING COUNT(*) > 1
    ) d;

    IF v_dupes > 0 THEN
      RAISE EXCEPTION 'No se puede crear sales_records_org_tipo_folio_unique: existen % grupos duplicados.', v_dupes;
    END IF;

    ALTER TABLE public.sales_records
      ADD CONSTRAINT sales_records_org_tipo_folio_unique
      UNIQUE (organization_id, tipo_documento, folio, rut_receptor);
  END IF;

  -- purchase_records
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname='public'
      AND t.relname='purchase_records'
      AND c.conname='purchase_records_org_tipo_folio_unique'
  ) INTO v_exists;

  IF NOT v_exists THEN
    SELECT COUNT(*) INTO v_dupes
    FROM (
      SELECT organization_id, tipo_documento, folio, rut_emisor
      FROM public.purchase_records
      GROUP BY organization_id, tipo_documento, folio, rut_emisor
      HAVING COUNT(*) > 1
    ) d;

    IF v_dupes > 0 THEN
      RAISE EXCEPTION 'No se puede crear purchase_records_org_tipo_folio_unique: existen % grupos duplicados.', v_dupes;
    END IF;

    ALTER TABLE public.purchase_records
      ADD CONSTRAINT purchase_records_org_tipo_folio_unique
      UNIQUE (organization_id, tipo_documento, folio, rut_emisor);
  END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- 3) UNIQUE indexes operativos
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_dupes bigint;
BEGIN
  -- accounting_periods: no puede repetir org/ano/mes
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND indexname='idx_accounting_periods_org_ano_mes'
  ) THEN
    SELECT COUNT(*) INTO v_dupes
    FROM (
      SELECT organization_id, ano, mes
      FROM public.accounting_periods
      GROUP BY organization_id, ano, mes
      HAVING COUNT(*) > 1
    ) d;

    IF v_dupes > 0 THEN
      RAISE EXCEPTION 'No se puede crear idx_accounting_periods_org_ano_mes: existen % grupos duplicados.', v_dupes;
    END IF;

    CREATE UNIQUE INDEX idx_accounting_periods_org_ano_mes
      ON public.accounting_periods (organization_id, ano, mes);
  END IF;

  -- liquidations: evitar doble liquidacion por empleado/periodo/org
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND indexname='idx_liquidations_employee_periodo_unique'
  ) THEN
    SELECT COUNT(*) INTO v_dupes
    FROM (
      SELECT organization_id, employee_id, periodo
      FROM public.liquidations
      GROUP BY organization_id, employee_id, periodo
      HAVING COUNT(*) > 1
    ) d;

    IF v_dupes > 0 THEN
      RAISE EXCEPTION 'No se puede crear idx_liquidations_employee_periodo_unique: existen % grupos duplicados.', v_dupes;
    END IF;

    CREATE UNIQUE INDEX idx_liquidations_employee_periodo_unique
      ON public.liquidations (organization_id, employee_id, periodo);
  END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- 4) Indices de performance criticos (idempotentes)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_journal_entries_org_fecha
  ON public.journal_entries (organization_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_jel_org_account
  ON public.journal_entry_lines (organization_id, account_id);

CREATE INDEX IF NOT EXISTS idx_dte_issued_org_fecha
  ON public.dte_issued (organization_id, fecha_emision DESC);

CREATE INDEX IF NOT EXISTS idx_treasury_payments_org_fecha
  ON public.treasury_payments (organization_id, fecha_pago DESC);

CREATE INDEX IF NOT EXISTS idx_vacation_requests_employee
  ON public.vacation_requests (employee_id, status, fecha_inicio DESC);

NOTIFY pgrst, 'reload schema';
