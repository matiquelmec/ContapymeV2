-- ============================================================
-- FASE 3: Consolidacion de Integridad Contable y Tesoreria
-- Fecha: 2026-05-30
-- Objetivo:
--   1) Unificar control de periodos contables (journal_entries + lines)
--   2) Reforzar partida doble (Debe = Haber)
--   3) Endurecer validacion de aplicaciones de pagos de tesoreria
-- ============================================================

SET search_path = public;

-- ------------------------------------------------------------
-- 1) Helper unico para validar periodo abierto
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_open_accounting_period(
  p_organization_id uuid,
  p_fecha date,
  p_context text DEFAULT 'journal'
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_status text;
  v_year integer;
  v_month integer;
BEGIN
  IF p_organization_id IS NULL OR p_fecha IS NULL THEN
    RAISE EXCEPTION 'No se puede validar periodo contable sin organizacion y fecha.';
  END IF;

  v_year := EXTRACT(YEAR FROM p_fecha)::integer;
  v_month := EXTRACT(MONTH FROM p_fecha)::integer;

  SELECT ap.status
    INTO v_status
  FROM public.accounting_periods ap
  WHERE ap.organization_id = p_organization_id
    AND ap.ano = v_year
    AND ap.mes = v_month
  LIMIT 1;

  IF v_status IN ('closed', 'locked') THEN
    RAISE EXCEPTION
      'Periodo contable %-% para organizacion % esta % (%).',
      v_year, v_month, p_organization_id, v_status, p_context;
  END IF;
END;
$$;

-- ------------------------------------------------------------
-- 2) Triggers de periodo en encabezado y lineas
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_check_journal_entry_period()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.enforce_open_accounting_period(OLD.organization_id, OLD.fecha, 'journal_entries:delete');
    RETURN OLD;
  END IF;

  PERFORM public.enforce_open_accounting_period(NEW.organization_id, NEW.fecha, 'journal_entries:' || lower(TG_OP));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_check_journal_entry_lines_period()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_entry_id uuid;
  v_org_id uuid;
  v_fecha date;
BEGIN
  v_entry_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.entry_id ELSE NEW.entry_id END;

  SELECT je.organization_id, je.fecha
    INTO v_org_id, v_fecha
  FROM public.journal_entries je
  WHERE je.id = v_entry_id;

  IF NOT FOUND THEN
    -- Si el encabezado no existe al momento de evaluar (orden interno de borrado), no bloqueamos.
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  PERFORM public.enforce_open_accounting_period(v_org_id, v_fecha, 'journal_entry_lines:' || lower(TG_OP));
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_journal_entry_period ON public.journal_entries;
DROP TRIGGER IF EXISTS trg_journal_period_check ON public.journal_entries;
CREATE TRIGGER trg_check_journal_entry_period
  BEFORE INSERT OR UPDATE OR DELETE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_check_journal_entry_period();

DROP TRIGGER IF EXISTS trg_check_journal_entry_lines_period ON public.journal_entry_lines;
CREATE TRIGGER trg_check_journal_entry_lines_period
  BEFORE INSERT OR UPDATE OR DELETE ON public.journal_entry_lines
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_check_journal_entry_lines_period();

-- ------------------------------------------------------------
-- 3) Constraint trigger de partida doble (diferible)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_journal_entry_balance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_entry_id uuid;
  v_debe bigint;
  v_haber bigint;
BEGIN
  v_entry_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.entry_id ELSE NEW.entry_id END;

  SELECT
    COALESCE(SUM(CASE WHEN jel.tipo = 'debe' THEN jel.monto ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN jel.tipo = 'haber' THEN jel.monto ELSE 0 END), 0)
  INTO v_debe, v_haber
  FROM public.journal_entry_lines jel
  WHERE jel.entry_id = v_entry_id;

  IF v_debe = 0 AND v_haber = 0 THEN
    RETURN NULL;
  END IF;

  IF v_debe <> v_haber THEN
    RAISE EXCEPTION
      'Asiento % descuadrado: debe=% haber=% diferencia=%.',
      v_entry_id, v_debe, v_haber, (v_debe - v_haber);
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_journal_entry_balance ON public.journal_entry_lines;
CREATE CONSTRAINT TRIGGER trg_check_journal_entry_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.journal_entry_lines
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.check_journal_entry_balance();

-- ------------------------------------------------------------
-- 4) Validacion reforzada de aplicaciones en tesoreria
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_treasury_payment_document()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_payment public.treasury_payments%ROWTYPE;
  v_doc_org uuid;
  v_doc_total bigint;
  v_doc_applied bigint;
  v_payment_applied bigint;
BEGIN
  IF NEW.monto_aplicado IS NULL OR NEW.monto_aplicado <= 0 THEN
    RAISE EXCEPTION 'monto_aplicado debe ser mayor a 0.';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.payment_id <> OLD.payment_id
       OR NEW.document_type <> OLD.document_type
       OR NEW.document_id <> OLD.document_id
       OR NEW.organization_id <> OLD.organization_id THEN
      RAISE EXCEPTION 'No se permite reasignar una aplicacion existente; elimine y cree una nueva.';
    END IF;
  END IF;

  SELECT *
    INTO v_payment
  FROM public.treasury_payments tp
  WHERE tp.id = NEW.payment_id;

  IF v_payment.id IS NULL THEN
    RAISE EXCEPTION 'El pago indicado no existe.';
  END IF;

  IF NEW.organization_id <> v_payment.organization_id THEN
    RAISE EXCEPTION 'La aplicacion no pertenece a la organizacion del pago.';
  END IF;

  IF v_payment.tipo = 'pago_proveedor' AND NEW.document_type <> 'purchase_record' THEN
    RAISE EXCEPTION 'Un pago a proveedor solo puede aplicarse a purchase_record.';
  ELSIF v_payment.tipo = 'cobro_cliente' AND NEW.document_type NOT IN ('sales_record', 'dte_issued') THEN
    RAISE EXCEPTION 'Un cobro de cliente solo puede aplicarse a sales_record o dte_issued.';
  END IF;

  IF NEW.document_type = 'purchase_record' THEN
    SELECT pr.organization_id, pr.monto_total
      INTO v_doc_org, v_doc_total
    FROM public.purchase_records pr
    WHERE pr.id = NEW.document_id;
  ELSIF NEW.document_type = 'sales_record' THEN
    SELECT sr.organization_id, sr.monto_total
      INTO v_doc_org, v_doc_total
    FROM public.sales_records sr
    WHERE sr.id = NEW.document_id;
  ELSE
    SELECT di.organization_id, di.monto_total
      INTO v_doc_org, v_doc_total
    FROM public.dte_issued di
    WHERE di.id = NEW.document_id;
  END IF;

  IF v_doc_org IS NULL THEN
    RAISE EXCEPTION 'El documento indicado no existe.';
  END IF;

  IF v_doc_org <> NEW.organization_id THEN
    RAISE EXCEPTION 'El documento no pertenece a la organizacion del pago.';
  END IF;

  SELECT COALESCE(SUM(tpd.monto_aplicado), 0)
    INTO v_doc_applied
  FROM public.treasury_payment_documents tpd
  WHERE tpd.organization_id = NEW.organization_id
    AND tpd.document_type = NEW.document_type
    AND tpd.document_id = NEW.document_id
    AND (TG_OP = 'INSERT' OR tpd.id <> NEW.id);

  IF v_doc_applied + NEW.monto_aplicado > v_doc_total THEN
    RAISE EXCEPTION 'El monto aplicado excede el saldo del documento.';
  END IF;

  SELECT COALESCE(SUM(tpd.monto_aplicado), 0)
    INTO v_payment_applied
  FROM public.treasury_payment_documents tpd
  WHERE tpd.payment_id = NEW.payment_id
    AND (TG_OP = 'INSERT' OR tpd.id <> NEW.id);

  IF v_payment_applied + NEW.monto_aplicado > v_payment.monto THEN
    RAISE EXCEPTION 'El monto aplicado excede el monto total del pago.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_treasury_payment_document ON public.treasury_payment_documents;
CREATE TRIGGER trg_validate_treasury_payment_document
  BEFORE INSERT OR UPDATE ON public.treasury_payment_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_treasury_payment_document();

NOTIFY pgrst, 'reload schema';
