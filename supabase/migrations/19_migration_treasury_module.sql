-- ============================================================
-- MIGRACION 19: Modulo de Tesoreria y Normalizacion de RUT
-- Objetivo: pagos/cobros, medios de pago, aplicacion a documentos,
--           contabilizacion automatica y conciliacion bancaria.
-- ============================================================

CREATE OR REPLACE FUNCTION public.normalize_rut(p_rut text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  clean_rut text;
BEGIN
  IF p_rut IS NULL OR trim(p_rut) = '' THEN
    RETURN NULL;
  END IF;

  clean_rut := regexp_replace(upper(trim(p_rut)), '[^0-9K]', '', 'g');

  IF length(clean_rut) < 2 THEN
    RETURN clean_rut;
  END IF;

  RETURN left(clean_rut, length(clean_rut) - 1) || '-' || right(clean_rut, 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_fn_normalize_rut()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_TABLE_NAME = 'purchase_records' THEN
    NEW.rut_emisor := public.normalize_rut(NEW.rut_emisor);
  ELSIF TG_TABLE_NAME = 'sales_records' THEN
    NEW.rut_receptor := public.normalize_rut(NEW.rut_receptor);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_purchase_rut ON public.purchase_records;
CREATE TRIGGER trg_normalize_purchase_rut
  BEFORE INSERT OR UPDATE OF rut_emisor ON public.purchase_records
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_normalize_rut();

DROP TRIGGER IF EXISTS trg_normalize_sales_rut ON public.sales_records;
CREATE TRIGGER trg_normalize_sales_rut
  BEFORE INSERT OR UPDATE OF rut_receptor ON public.sales_records
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_normalize_rut();

ALTER TABLE public.purchase_records
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'partial', 'paid'));

ALTER TABLE public.sales_records
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'partial', 'paid'));

CREATE INDEX IF NOT EXISTS idx_purchase_records_payment_status
  ON public.purchase_records(organization_id, payment_status, fecha_docto);

CREATE INDEX IF NOT EXISTS idx_sales_records_payment_status
  ON public.sales_records(organization_id, payment_status, fecha_docto);

CREATE TABLE IF NOT EXISTS public.account_config_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  module_name character varying NOT NULL,
  entry_key character varying NOT NULL,
  account_id uuid REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (organization_id, module_name, entry_key)
);

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('transferencia', 'cheque', 'efectivo', 'tarjeta', 'compensacion')),
  bank_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  chart_account_id uuid NOT NULL REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (organization_id, nombre)
);

ALTER TABLE public.payment_methods
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_methods_select_org_members" ON public.payment_methods;
CREATE POLICY "payment_methods_select_org_members"
  ON public.payment_methods
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = payment_methods.organization_id
        AND om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "payment_methods_write_org_admins" ON public.payment_methods;
CREATE POLICY "payment_methods_write_org_admins"
  ON public.payment_methods
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = payment_methods.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = payment_methods.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

CREATE TABLE IF NOT EXISTS public.treasury_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('pago_proveedor', 'cobro_cliente')),
  payment_method_id uuid NOT NULL REFERENCES public.payment_methods(id) ON DELETE RESTRICT,
  monto bigint NOT NULL CHECK (monto > 0),
  fecha_pago date NOT NULL,
  referencia text,
  notas text,
  journal_entry_id uuid REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  bank_statement_line_id uuid REFERENCES public.bank_statement_lines(id) ON DELETE SET NULL,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT treasury_payments_unique_bank_line UNIQUE (bank_statement_line_id)
);

ALTER TABLE public.treasury_payments
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.treasury_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "treasury_payments_org_members" ON public.treasury_payments;
CREATE POLICY "treasury_payments_org_members"
  ON public.treasury_payments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = treasury_payments.organization_id
        AND om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = treasury_payments.organization_id
        AND om.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.treasury_payment_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.treasury_payments(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('purchase_record', 'sales_record', 'dte_issued')),
  document_id uuid NOT NULL,
  monto_aplicado bigint NOT NULL CHECK (monto_aplicado > 0),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'treasury_payment_documents'
      AND column_name = 'monto_applied'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'treasury_payment_documents'
      AND column_name = 'monto_aplicado'
  ) THEN
    ALTER TABLE public.treasury_payment_documents RENAME COLUMN monto_applied TO monto_aplicado;
  END IF;
END $$;

ALTER TABLE public.treasury_payment_documents
  ADD COLUMN IF NOT EXISTS monto_aplicado bigint,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.treasury_payment_documents
  ALTER COLUMN monto_aplicado SET NOT NULL;

DO $$
DECLARE
  v_constraint record;
BEGIN
  FOR v_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.treasury_payment_documents'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%document_type%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.treasury_payment_documents DROP CONSTRAINT IF EXISTS %I',
      v_constraint.conname
    );
  END LOOP;
END $$;

ALTER TABLE public.treasury_payment_documents
  ADD CONSTRAINT treasury_payment_documents_document_type_check
  CHECK (document_type IN ('purchase_record', 'sales_record', 'dte_issued'));

ALTER TABLE public.treasury_payment_documents
  DROP CONSTRAINT IF EXISTS treasury_payment_documents_monto_aplicado_check,
  ADD CONSTRAINT treasury_payment_documents_monto_aplicado_check
  CHECK (monto_aplicado > 0);

ALTER TABLE public.treasury_payment_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "treasury_payment_documents_org_members" ON public.treasury_payment_documents;
CREATE POLICY "treasury_payment_documents_org_members"
  ON public.treasury_payment_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = treasury_payment_documents.organization_id
        AND om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = treasury_payment_documents.organization_id
        AND om.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_payment_methods_org_active
  ON public.payment_methods(organization_id, is_active);

CREATE INDEX IF NOT EXISTS idx_treasury_payments_org_fecha
  ON public.treasury_payments(organization_id, fecha_pago DESC);

CREATE INDEX IF NOT EXISTS idx_treasury_payments_method
  ON public.treasury_payments(payment_method_id);

CREATE INDEX IF NOT EXISTS idx_treasury_payment_documents_doc
  ON public.treasury_payment_documents(organization_id, document_type, document_id);

CREATE INDEX IF NOT EXISTS idx_treasury_payment_documents_payment
  ON public.treasury_payment_documents(payment_id);

CREATE OR REPLACE FUNCTION public.treasury_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER trg_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.treasury_touch_updated_at();

DROP TRIGGER IF EXISTS trg_treasury_payments_updated_at ON public.treasury_payments;
CREATE TRIGGER trg_treasury_payments_updated_at
  BEFORE UPDATE ON public.treasury_payments
  FOR EACH ROW EXECUTE FUNCTION public.treasury_touch_updated_at();

CREATE OR REPLACE FUNCTION public.treasury_find_account(
  p_org_id uuid,
  p_module text,
  p_keys text[],
  p_fallback_codes text[]
)
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_account_id uuid;
BEGIN
  SELECT ace.account_id INTO v_account_id
  FROM public.account_config_entries ace
  JOIN public.chart_of_accounts coa ON coa.id = ace.account_id
  WHERE ace.organization_id = p_org_id
    AND ace.module_name = p_module
    AND ace.entry_key = ANY(p_keys)
    AND ace.is_active = true
    AND coa.organization_id = p_org_id
    AND coa.activo = true
  LIMIT 1;

  IF v_account_id IS NOT NULL THEN
    RETURN v_account_id;
  END IF;

  SELECT id INTO v_account_id
  FROM public.chart_of_accounts
  WHERE organization_id = p_org_id
    AND codigo = ANY(p_fallback_codes)
    AND activo = true
  ORDER BY array_position(p_fallback_codes, codigo)
  LIMIT 1;

  RETURN v_account_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.book_treasury_payment_accounting()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_journal_id uuid;
  v_payment_account_id uuid;
  v_counterpart_account_id uuid;
  v_counterpart_line_id uuid;
  v_payment_line_id uuid;
  v_payment_account public.chart_of_accounts%ROWTYPE;
  v_counterpart_account public.chart_of_accounts%ROWTYPE;
  v_payment_method_org uuid;
  v_bank_line_org uuid;
  v_bank_line_type text;
BEGIN
  IF NEW.journal_entry_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT pm.organization_id, pm.chart_account_id
  INTO v_payment_method_org, v_payment_account_id
  FROM public.payment_methods pm
  WHERE pm.id = NEW.payment_method_id
    AND pm.is_active = true;

  IF v_payment_method_org IS NULL OR v_payment_method_org <> NEW.organization_id THEN
    RAISE EXCEPTION 'El medio de pago no pertenece a la organizacion del pago.';
  END IF;

  SELECT * INTO v_payment_account
  FROM public.chart_of_accounts
  WHERE id = v_payment_account_id
    AND organization_id = NEW.organization_id
    AND activo = true;

  IF v_payment_account.id IS NULL THEN
    RAISE EXCEPTION 'El medio de pago no tiene una cuenta contable activa asociada.';
  END IF;

  IF NEW.bank_statement_line_id IS NOT NULL THEN
    SELECT organization_id, tipo INTO v_bank_line_org, v_bank_line_type
    FROM public.bank_statement_lines
    WHERE id = NEW.bank_statement_line_id;

    IF v_bank_line_org IS NULL OR v_bank_line_org <> NEW.organization_id THEN
      RAISE EXCEPTION 'La linea bancaria no pertenece a la organizacion del pago.';
    END IF;

    IF NEW.tipo = 'pago_proveedor' AND v_bank_line_type <> 'cargo' THEN
      RAISE EXCEPTION 'Un pago a proveedor debe vincularse con una linea bancaria tipo cargo.';
    ELSIF NEW.tipo = 'cobro_cliente' AND v_bank_line_type <> 'abono' THEN
      RAISE EXCEPTION 'Un cobro de cliente debe vincularse con una linea bancaria tipo abono.';
    END IF;
  END IF;

  IF NEW.tipo = 'pago_proveedor' THEN
    v_counterpart_account_id := public.treasury_find_account(
      NEW.organization_id,
      'treasury',
      ARRAY['ap_payable', 'accounts_payable', 'liability_accounts_payable', 'proveedores_por_pagar'],
      ARRAY['2.1.01.001', '2.1.01', '2.1.04.001']
    );
  ELSE
    v_counterpart_account_id := public.treasury_find_account(
      NEW.organization_id,
      'treasury',
      ARRAY['ar_receivable', 'accounts_receivable', 'asset_accounts_receivable', 'clientes_por_cobrar'],
      ARRAY['1.1.02.001', '1.1.02', '1.1.01.002']
    );
  END IF;

  SELECT * INTO v_counterpart_account
  FROM public.chart_of_accounts
  WHERE id = v_counterpart_account_id
    AND organization_id = NEW.organization_id
    AND activo = true;

  IF v_counterpart_account.id IS NULL THEN
    RAISE EXCEPTION 'No se encontro la cuenta contable de contrapartida para tesoreria.';
  END IF;

  INSERT INTO public.journal_entries (
    organization_id,
    fecha,
    glosa
  )
  VALUES (
    NEW.organization_id,
    NEW.fecha_pago,
    CASE
      WHEN NEW.tipo = 'pago_proveedor' THEN 'Pago a proveedor - Ref ' || COALESCE(NEW.referencia, '')
      ELSE 'Cobro a cliente - Ref ' || COALESCE(NEW.referencia, '')
    END
  )
  RETURNING id INTO v_journal_id;

  IF NEW.tipo = 'pago_proveedor' THEN
    INSERT INTO public.journal_entry_lines (
      entry_id, organization_id, account_id, tipo, monto
    )
    VALUES (
      v_journal_id, NEW.organization_id, v_counterpart_account.id,
      'debe', NEW.monto
    )
    RETURNING id INTO v_counterpart_line_id;

    INSERT INTO public.journal_entry_lines (
      entry_id, organization_id, account_id, tipo, monto
    )
    VALUES (
      v_journal_id, NEW.organization_id, v_payment_account.id,
      'haber', NEW.monto
    )
    RETURNING id INTO v_payment_line_id;
  ELSE
    INSERT INTO public.journal_entry_lines (
      entry_id, organization_id, account_id, tipo, monto
    )
    VALUES (
      v_journal_id, NEW.organization_id, v_payment_account.id,
      'debe', NEW.monto
    )
    RETURNING id INTO v_payment_line_id;

    INSERT INTO public.journal_entry_lines (
      entry_id, organization_id, account_id, tipo, monto
    )
    VALUES (
      v_journal_id, NEW.organization_id, v_counterpart_account.id,
      'haber', NEW.monto
    )
    RETURNING id INTO v_counterpart_line_id;
  END IF;

  IF NEW.bank_statement_line_id IS NOT NULL THEN
    INSERT INTO public.bank_reconciliations (
      organization_id,
      bank_line_id,
      journal_entry_line_id,
      match_type,
      confidence_score,
      reconciled_by,
      status,
      notes
    )
    VALUES (
      NEW.organization_id,
      NEW.bank_statement_line_id,
      v_payment_line_id,
      'automatic',
      1.0,
      NEW.created_by,
      'reconciled',
      'Conciliacion automatica desde tesoreria'
    );
  END IF;

  NEW.journal_entry_id := v_journal_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_book_treasury_payment ON public.treasury_payments;
CREATE TRIGGER trg_book_treasury_payment
  BEFORE INSERT ON public.treasury_payments
  FOR EACH ROW EXECUTE FUNCTION public.book_treasury_payment_accounting();

CREATE OR REPLACE FUNCTION public.validate_treasury_payment_document()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_payment public.treasury_payments%ROWTYPE;
  v_doc_org uuid;
  v_doc_total bigint;
  v_doc_paid bigint;
  v_payment_applied bigint;
BEGIN
  SELECT * INTO v_payment
  FROM public.treasury_payments
  WHERE id = NEW.payment_id;

  IF v_payment.id IS NULL THEN
    RAISE EXCEPTION 'El pago indicado no existe.';
  END IF;

  IF NEW.organization_id <> v_payment.organization_id THEN
    RAISE EXCEPTION 'La aplicacion no pertenece a la organizacion del pago.';
  END IF;

  IF v_payment.tipo = 'pago_proveedor' AND NEW.document_type <> 'purchase_record' THEN
    RAISE EXCEPTION 'Un pago a proveedor solo puede aplicarse a compras.';
  ELSIF v_payment.tipo = 'cobro_cliente' AND NEW.document_type NOT IN ('sales_record', 'dte_issued') THEN
    RAISE EXCEPTION 'Un cobro de cliente solo puede aplicarse a ventas o DTE emitidos.';
  END IF;

  IF NEW.document_type = 'purchase_record' THEN
    SELECT organization_id, monto_total INTO v_doc_org, v_doc_total
    FROM public.purchase_records
    WHERE id = NEW.document_id;
  ELSIF NEW.document_type = 'sales_record' THEN
    SELECT organization_id, monto_total INTO v_doc_org, v_doc_total
    FROM public.sales_records
    WHERE id = NEW.document_id;
  ELSE
    SELECT organization_id, monto_total INTO v_doc_org, v_doc_total
    FROM public.dte_issued
    WHERE id = NEW.document_id;
  END IF;

  IF v_doc_org IS NULL THEN
    RAISE EXCEPTION 'El documento indicado no existe.';
  END IF;

  IF v_doc_org <> NEW.organization_id THEN
    RAISE EXCEPTION 'El documento no pertenece a la organizacion del pago.';
  END IF;

  SELECT COALESCE(SUM(tpd.monto_aplicado), 0) INTO v_doc_paid
  FROM public.treasury_payment_documents tpd
  WHERE tpd.organization_id = NEW.organization_id
    AND tpd.document_type = NEW.document_type
    AND tpd.document_id = NEW.document_id
    AND (TG_OP = 'INSERT' OR tpd.id <> NEW.id);

  IF v_doc_paid + NEW.monto_aplicado > v_doc_total THEN
    RAISE EXCEPTION 'El monto aplicado excede el saldo del documento.';
  END IF;

  SELECT COALESCE(SUM(tpd.monto_aplicado), 0) INTO v_payment_applied
  FROM public.treasury_payment_documents tpd
  WHERE tpd.payment_id = NEW.payment_id
    AND (TG_OP = 'INSERT' OR tpd.id <> NEW.id);

  IF v_payment_applied + NEW.monto_aplicado > v_payment.monto THEN
    RAISE EXCEPTION 'El monto aplicado excede el monto del pago.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_treasury_payment_document ON public.treasury_payment_documents;
CREATE TRIGGER trg_validate_treasury_payment_document
  BEFORE INSERT OR UPDATE ON public.treasury_payment_documents
  FOR EACH ROW EXECUTE FUNCTION public.validate_treasury_payment_document();

CREATE OR REPLACE FUNCTION public.update_document_payment_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_paid bigint;
  v_doc_total bigint;
  v_status text;
  v_doc_id uuid;
  v_doc_type text;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    v_doc_id := NEW.document_id;
    v_doc_type := NEW.document_type;
  ELSE
    v_doc_id := OLD.document_id;
    v_doc_type := OLD.document_type;
  END IF;

  SELECT COALESCE(SUM(monto_aplicado), 0) INTO v_total_paid
  FROM public.treasury_payment_documents
  WHERE document_id = v_doc_id
    AND document_type = v_doc_type;

  IF v_doc_type = 'purchase_record' THEN
    SELECT COALESCE(monto_total, 0) INTO v_doc_total
    FROM public.purchase_records
    WHERE id = v_doc_id;
  ELSIF v_doc_type = 'sales_record' THEN
    SELECT COALESCE(monto_total, 0) INTO v_doc_total
    FROM public.sales_records
    WHERE id = v_doc_id;
  ELSE
    RETURN NULL;
  END IF;

  IF v_total_paid >= v_doc_total AND v_doc_total > 0 THEN
    v_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    v_status := 'partial';
  ELSE
    v_status := 'pending';
  END IF;

  IF v_doc_type = 'purchase_record' THEN
    UPDATE public.purchase_records
    SET payment_status = v_status
    WHERE id = v_doc_id;
  ELSE
    UPDATE public.sales_records
    SET payment_status = v_status
    WHERE id = v_doc_id;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_payment_status ON public.treasury_payment_documents;
CREATE TRIGGER trg_update_payment_status
  AFTER INSERT OR UPDATE OR DELETE ON public.treasury_payment_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_document_payment_status();
