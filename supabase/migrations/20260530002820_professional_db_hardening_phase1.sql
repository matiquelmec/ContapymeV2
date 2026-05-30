-- Professional DB hardening - Phase 1.
-- Scope: low-risk indexes, critical uniqueness guards, vacation overlap guard,
-- DTE folio reservation RPC, and read-only accounting balance diagnostics.
--
-- Operational note:
-- - Run during low traffic. These indexes are intentionally non-CONCURRENTLY so
--   the file remains compatible with transactional migration runners.
-- - Run db/audits/20260530_professional_db_hardening_preflight.sql before this
--   migration on production.

-- ---------------------------------------------------------------------------
-- 1. Performance indexes for common multi-tenant queries and joins.
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_journal_entries_event_id_not_null
  ON public.journal_entries (event_id)
  WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_org_account
  ON public.journal_entry_lines (organization_id, account_id);

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entry_id
  ON public.journal_entry_lines (entry_id);

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_unreconciled
  ON public.journal_entry_lines (organization_id, is_reconciled)
  WHERE is_reconciled = false;

CREATE INDEX IF NOT EXISTS idx_bank_statement_lines_bank_reconciled_fecha
  ON public.bank_statement_lines (bank_account_id, is_reconciled, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_bank_statement_lines_org_fecha_desc
  ON public.bank_statement_lines (organization_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_bank_statement_lines_external_id
  ON public.bank_statement_lines (external_id)
  WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bank_statement_lines_rut_tercero
  ON public.bank_statement_lines (rut_tercero)
  WHERE rut_tercero IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bank_reconciliations_bank_line_id
  ON public.bank_reconciliations (bank_line_id)
  WHERE bank_line_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bank_reconciliations_journal_entry_line_id
  ON public.bank_reconciliations (journal_entry_line_id);

CREATE INDEX IF NOT EXISTS idx_dte_issued_org_fecha_emision_desc
  ON public.dte_issued (organization_id, fecha_emision DESC);

CREATE INDEX IF NOT EXISTS idx_dte_issued_org_submission_checked
  ON public.dte_issued (organization_id, sii_submission_status, sii_checked_at);

CREATE INDEX IF NOT EXISTS idx_dte_caf_folios_active_lookup
  ON public.dte_caf_folios (organization_id, company_id, tipo_dte, environment, is_active);

CREATE INDEX IF NOT EXISTS idx_dte_items_dte_line
  ON public.dte_items (dte_id, line_number);

CREATE INDEX IF NOT EXISTS idx_vacation_requests_employee_status_start
  ON public.vacation_requests (employee_id, status, fecha_inicio DESC);

CREATE INDEX IF NOT EXISTS idx_vacation_requests_org_pending
  ON public.vacation_requests (organization_id, status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_vacation_ledger_employee_fecha
  ON public.vacation_ledger (employee_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_treasury_payments_org_fecha
  ON public.treasury_payments (organization_id, fecha_pago DESC);

CREATE INDEX IF NOT EXISTS idx_treasury_payment_documents_document
  ON public.treasury_payment_documents (organization_id, document_type, document_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_lookup
  ON public.audit_logs (organization_id, entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
  ON public.audit_logs (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc
  ON public.audit_logs (created_at DESC);

-- ---------------------------------------------------------------------------
-- 2. Critical uniqueness guards. These should be preceded by the preflight
--    audit in production; earlier REST audit showed these datasets clean.
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS uq_dte_issued_company_tipo_folio_env
  ON public.dte_issued (
    company_id,
    tipo_dte,
    folio,
    (COALESCE(sii_environment, 'certification'))
  );

CREATE UNIQUE INDEX IF NOT EXISTS uq_dte_items_dte_line
  ON public.dte_items (dte_id, line_number);

CREATE UNIQUE INDEX IF NOT EXISTS uq_accounting_periods_org_ano_mes
  ON public.accounting_periods (organization_id, ano, mes);

CREATE UNIQUE INDEX IF NOT EXISTS uq_organization_members_org_user
  ON public.organization_members (organization_id, user_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_sales_records_natural_document
  ON public.sales_records (organization_id, periodo, tipo_documento, folio, rut_receptor);

CREATE UNIQUE INDEX IF NOT EXISTS uq_purchase_records_natural_document
  ON public.purchase_records (organization_id, periodo, tipo_documento, folio, rut_emisor);

CREATE UNIQUE INDEX IF NOT EXISTS uq_liquidations_employee_period_active
  ON public.liquidations (employee_id, periodo)
  WHERE status::text <> 'anulada';

-- ---------------------------------------------------------------------------
-- 3. Vacation overlap guard. Only approved requests block another approved
--    request; pending drafts can overlap until approval.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_validate_vacation_approved_overlap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status <> 'approved' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.vacation_requests vr
    WHERE vr.organization_id = NEW.organization_id
      AND vr.employee_id = NEW.employee_id
      AND vr.id <> NEW.id
      AND vr.status = 'approved'
      AND vr.fecha_inicio <= NEW.fecha_fin
      AND vr.fecha_fin >= NEW.fecha_inicio
  ) THEN
    RAISE EXCEPTION 'Solapamiento de vacaciones aprobadas para employee_id=%', NEW.employee_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vacation_approved_overlap ON public.vacation_requests;
CREATE TRIGGER trg_vacation_approved_overlap
  BEFORE INSERT OR UPDATE OF fecha_inicio, fecha_fin, status, employee_id
  ON public.vacation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_validate_vacation_approved_overlap();

-- ---------------------------------------------------------------------------
-- 4. Atomic DTE folio reservation. Backend should call this RPC before building
--    the DTE. It locks the selected CAF row and advances last_used_folio in the
--    same database transaction executed by Postgres.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reserve_dte_folio(
  p_organization_id uuid,
  p_company_id uuid,
  p_tipo_dte integer,
  p_environment text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_caf public.dte_caf_folios%ROWTYPE;
  v_next_folio integer;
BEGIN
  IF p_environment IS NOT NULL AND p_environment NOT IN ('certification', 'production') THEN
    RAISE EXCEPTION 'Ambiente SII inválido: %', p_environment;
  END IF;

  LOOP
    SELECT *
    INTO v_caf
    FROM public.dte_caf_folios
    WHERE organization_id = p_organization_id
      AND company_id = p_company_id
      AND tipo_dte = p_tipo_dte
      AND is_active = true
      AND (p_environment IS NULL OR environment = p_environment)
    ORDER BY range_start ASC, created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No hay CAF activo para company_id=%, tipo_dte=%, environment=%',
        p_company_id, p_tipo_dte, COALESCE(p_environment, '<any>');
    END IF;

    v_next_folio := v_caf.last_used_folio + 1;

    IF v_next_folio > v_caf.range_end THEN
      UPDATE public.dte_caf_folios
      SET is_active = false,
          updated_at = now()
      WHERE id = v_caf.id;
      CONTINUE;
    END IF;

    UPDATE public.dte_caf_folios
    SET last_used_folio = v_next_folio,
        updated_at = now()
    WHERE id = v_caf.id
    RETURNING * INTO v_caf;

    RETURN jsonb_build_object(
      'folio', v_next_folio,
      'caf', to_jsonb(v_caf)
    );
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reserve_dte_folio(uuid, uuid, integer, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reserve_dte_folio(uuid, uuid, integer, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reserve_dte_folio(uuid, uuid, integer, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_dte_folio(uuid, uuid, integer, text) TO service_role;

COMMENT ON FUNCTION public.reserve_dte_folio(uuid, uuid, integer, text)
IS 'Reserva atómicamente el siguiente folio DTE con SELECT FOR UPDATE sobre dte_caf_folios. Uso previsto: backend service_role.';

-- ---------------------------------------------------------------------------
-- 5. Read-only diagnostics for accounting balance checks.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_unbalanced_journal_entries(
  p_organization_id uuid DEFAULT NULL,
  p_from date DEFAULT NULL,
  p_to date DEFAULT NULL
)
RETURNS TABLE (
  entry_id uuid,
  organization_id uuid,
  fecha date,
  total_debe bigint,
  total_haber bigint,
  diferencia bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    je.id AS entry_id,
    je.organization_id,
    je.fecha,
    COALESCE(SUM(jel.monto) FILTER (WHERE jel.tipo = 'debe'), 0)::bigint AS total_debe,
    COALESCE(SUM(jel.monto) FILTER (WHERE jel.tipo = 'haber'), 0)::bigint AS total_haber,
    (
      COALESCE(SUM(jel.monto) FILTER (WHERE jel.tipo = 'debe'), 0)
      - COALESCE(SUM(jel.monto) FILTER (WHERE jel.tipo = 'haber'), 0)
    )::bigint AS diferencia
  FROM public.journal_entries je
  JOIN public.journal_entry_lines jel ON jel.entry_id = je.id
  WHERE (p_organization_id IS NULL OR je.organization_id = p_organization_id)
    AND (p_from IS NULL OR je.fecha >= p_from)
    AND (p_to IS NULL OR je.fecha <= p_to)
  GROUP BY je.id, je.organization_id, je.fecha
  HAVING
    COALESCE(SUM(jel.monto) FILTER (WHERE jel.tipo = 'debe'), 0)
    <> COALESCE(SUM(jel.monto) FILTER (WHERE jel.tipo = 'haber'), 0);
$$;

COMMENT ON FUNCTION public.fn_unbalanced_journal_entries(uuid, date, date)
IS 'Diagnóstico read-only de asientos descuadrados. No bloquea inserciones progresivas.';

NOTIFY pgrst, 'reload schema';
