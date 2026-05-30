-- Secure multi-tenant RLS - Phase 2.
-- Scope: consolidate organization isolation, protect public tables, secure
-- materialized balance access, and harden onboarding/admin membership flows.

-- ---------------------------------------------------------------------------
-- 1. Private authorization helpers used by RLS policies.
-- ---------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE OR REPLACE FUNCTION private.is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p_org_id IS NOT NULL
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = p_org_id
        AND om.user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION private.has_org_role(p_org_id uuid, p_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p_org_id IS NOT NULL
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = p_org_id
        AND om.user_id = auth.uid()
        AND om.role::text = ANY(p_roles)
    );
$$;

REVOKE EXECUTE ON FUNCTION private.is_org_member(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.is_org_member(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION private.is_org_member(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION private.has_org_role(uuid, text[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.has_org_role(uuid, text[]) FROM anon;
GRANT EXECUTE ON FUNCTION private.has_org_role(uuid, text[]) TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_organization_members_org_user_role
  ON public.organization_members (organization_id, user_id, role);

-- ---------------------------------------------------------------------------
-- 2. Consolidated RLS for direct organization_id tables.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_table text;
  v_policy record;
  v_tables text[] := ARRAY[
    'account_config_entries',
    'account_mapping_rules',
    'accounting_events',
    'accounting_periods',
    'audit_logs',
    'bank_accounts',
    'bank_mapping_rules',
    'bank_reconciliations',
    'bank_statement_lines',
    'bank_statements',
    'centralized_account_config',
    'certified_reports',
    'chart_of_accounts',
    'contract_modifications',
    'dte_caf_folios',
    'dte_companies',
    'dte_issued',
    'dte_items',
    'dte_sii_raw_archive',
    'employee_documents',
    'employee_terminations',
    'employees',
    'employment_contracts',
    'f29_box_details',
    'f29_forms',
    'fixed_assets',
    'journal_entries',
    'journal_entry_lines',
    'journal_entry_sequences',
    'liquidations',
    'organization_payroll_settings',
    'payment_methods',
    'payroll_books',
    'purchase_records',
    'rcv_imports',
    'sales_records',
    'treasury_payment_documents',
    'treasury_payments',
    'vacation_ledger',
    'vacation_requests'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    IF to_regclass(format('public.%I', v_table)) IS NULL
      OR NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = v_table
          AND column_name = 'organization_id'
      ) THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table);

    FOR v_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = v_table
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_policy.policyname, v_table);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY tenant_member_select ON public.%I FOR SELECT TO authenticated USING (private.is_org_member(organization_id))',
      v_table
    );
    EXECUTE format(
      'CREATE POLICY tenant_member_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (private.is_org_member(organization_id))',
      v_table
    );
    EXECUTE format(
      'CREATE POLICY tenant_member_update ON public.%I FOR UPDATE TO authenticated USING (private.is_org_member(organization_id)) WITH CHECK (private.is_org_member(organization_id))',
      v_table
    );
    EXECUTE format(
      'CREATE POLICY tenant_member_delete ON public.%I FOR DELETE TO authenticated USING (private.is_org_member(organization_id))',
      v_table
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Organization and membership control tables.
-- ---------------------------------------------------------------------------

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
  v_policy record;
BEGIN
  FOR v_policy IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organizations'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.organizations', v_policy.policyname);
  END LOOP;
END $$;

CREATE POLICY organizations_member_select
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (private.is_org_member(id));

CREATE POLICY organizations_admin_update
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (private.has_org_role(id, ARRAY['owner', 'admin']))
  WITH CHECK (private.has_org_role(id, ARRAY['owner', 'admin']));

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
  v_policy record;
BEGIN
  FOR v_policy IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organization_members'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.organization_members', v_policy.policyname);
  END LOOP;
END $$;

CREATE POLICY organization_members_member_select
  ON public.organization_members
  FOR SELECT
  TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY organization_members_admin_insert
  ON public.organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (private.has_org_role(organization_id, ARRAY['owner', 'admin']));

CREATE POLICY organization_members_admin_update
  ON public.organization_members
  FOR UPDATE
  TO authenticated
  USING (private.has_org_role(organization_id, ARRAY['owner', 'admin']))
  WITH CHECK (private.has_org_role(organization_id, ARRAY['owner', 'admin']));

CREATE POLICY organization_members_admin_delete
  ON public.organization_members
  FOR DELETE
  TO authenticated
  USING (private.has_org_role(organization_id, ARRAY['owner', 'admin']));

DO $$
DECLARE
  v_policy record;
BEGIN
  IF to_regclass('public.organization_invitations') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

  FOR v_policy IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organization_invitations'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.organization_invitations', v_policy.policyname);
  END LOOP;

  CREATE POLICY organization_invitations_admin_select
    ON public.organization_invitations
    FOR SELECT
    TO authenticated
    USING (private.has_org_role(organization_id, ARRAY['owner', 'admin']));

  CREATE POLICY organization_invitations_admin_insert
    ON public.organization_invitations
    FOR INSERT
    TO authenticated
    WITH CHECK (
      private.has_org_role(organization_id, ARRAY['owner', 'admin'])
      AND invited_by = auth.uid()
    );

  CREATE POLICY organization_invitations_admin_update
    ON public.organization_invitations
    FOR UPDATE
    TO authenticated
    USING (private.has_org_role(organization_id, ARRAY['owner', 'admin']))
    WITH CHECK (private.has_org_role(organization_id, ARRAY['owner', 'admin']));

  CREATE POLICY organization_invitations_admin_delete
    ON public.organization_invitations
    FOR DELETE
    TO authenticated
    USING (private.has_org_role(organization_id, ARRAY['owner', 'admin']));
END $$;

-- ---------------------------------------------------------------------------
-- 4. Public/global tables.
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
  v_policy record;
BEGIN
  FOR v_policy IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', v_policy.policyname);
  END LOOP;
END $$;

CREATE POLICY profiles_select_related
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.organization_members viewer
      JOIN public.organization_members target
        ON target.organization_id = viewer.organization_id
      WHERE viewer.user_id = auth.uid()
        AND target.user_id = profiles.id
    )
  );

CREATE POLICY profiles_insert_self
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_self_no_privilege_escalation
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  -- SQL admins and service_role must be able to manage roles/plans intentionally.
  IF auth.uid() IS NULL OR COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role OR NEW.plan IS DISTINCT FROM OLD.plan THEN
    RAISE EXCEPTION 'No se permite modificar role o plan desde el cliente.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE OF role, plan ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
  v_policy record;
BEGIN
  FOR v_policy IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'contact_messages'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.contact_messages', v_policy.policyname);
  END LOOP;
END $$;

CREATE POLICY contact_messages_public_insert
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

ALTER TABLE public.regional_news ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
  v_policy record;
BEGIN
  FOR v_policy IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'regional_news'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.regional_news', v_policy.policyname);
  END LOOP;
END $$;

CREATE POLICY regional_news_public_select
  ON public.regional_news
  FOR SELECT
  TO anon, authenticated
  USING (true);

ALTER TABLE public.economic_indicators ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
  v_policy record;
BEGIN
  FOR v_policy IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'economic_indicators'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.economic_indicators', v_policy.policyname);
  END LOOP;
END $$;

CREATE POLICY economic_indicators_public_select
  ON public.economic_indicators
  FOR SELECT
  TO anon, authenticated
  USING (true);

ALTER TABLE public.national_payroll_params ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
  v_policy record;
BEGIN
  FOR v_policy IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'national_payroll_params'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.national_payroll_params', v_policy.policyname);
  END LOOP;
END $$;

CREATE POLICY national_payroll_params_public_select
  ON public.national_payroll_params
  FOR SELECT
  TO anon, authenticated
  USING (true);

ALTER TABLE public.termination_causes ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
  v_policy record;
BEGIN
  FOR v_policy IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'termination_causes'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.termination_causes', v_policy.policyname);
  END LOOP;
END $$;

CREATE POLICY termination_causes_public_select
  ON public.termination_causes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- 5. Nested table and materialized balance access.
-- ---------------------------------------------------------------------------

ALTER TABLE public.payroll_book_details ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
  v_policy record;
BEGIN
  FOR v_policy IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'payroll_book_details'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.payroll_book_details', v_policy.policyname);
  END LOOP;
END $$;

CREATE POLICY payroll_book_details_member_select
  ON public.payroll_book_details
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.payroll_books pb
      WHERE pb.id = payroll_book_details.payroll_book_id
        AND private.is_org_member(pb.organization_id)
    )
  );

CREATE POLICY payroll_book_details_member_insert
  ON public.payroll_book_details
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.payroll_books pb
      WHERE pb.id = payroll_book_details.payroll_book_id
        AND private.is_org_member(pb.organization_id)
    )
  );

CREATE POLICY payroll_book_details_member_update
  ON public.payroll_book_details
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.payroll_books pb
      WHERE pb.id = payroll_book_details.payroll_book_id
        AND private.is_org_member(pb.organization_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.payroll_books pb
      WHERE pb.id = payroll_book_details.payroll_book_id
        AND private.is_org_member(pb.organization_id)
    )
  );

CREATE POLICY payroll_book_details_member_delete
  ON public.payroll_book_details
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.payroll_books pb
      WHERE pb.id = payroll_book_details.payroll_book_id
        AND private.is_org_member(pb.organization_id)
    )
  );

DO $$
BEGIN
  IF to_regclass('public.mv_account_balances') IS NOT NULL THEN
    REVOKE ALL ON public.mv_account_balances FROM anon;
    REVOKE ALL ON public.mv_account_balances FROM authenticated;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_account_balances(p_organization_id uuid)
RETURNS TABLE (
  total_debe bigint,
  total_haber bigint,
  saldo bigint,
  account_id uuid,
  codigo character varying,
  nombre text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    mab.total_debe,
    mab.total_haber,
    mab.saldo,
    mab.account_id,
    coa.codigo,
    coa.nombre
  FROM public.mv_account_balances mab
  JOIN public.chart_of_accounts coa
    ON coa.id = mab.account_id
   AND coa.organization_id = mab.organization_id
  WHERE mab.organization_id = p_organization_id
    AND private.is_org_member(p_organization_id)
  ORDER BY coa.codigo;
$$;

REVOKE EXECUTE ON FUNCTION public.get_account_balances(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_account_balances(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_account_balances(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. Harden onboarding RPC and SECURITY DEFINER search paths.
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.create_new_company(text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.create_new_company(
  p_rut text,
  p_nombre text,
  p_giro text,
  p_direccion text,
  p_comuna text,
  p_region text DEFAULT NULL,
  p_regimen text DEFAULT 'pro_pyme'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado.';
  END IF;

  INSERT INTO public.organizations (
    rut_empresa,
    nombre,
    giro,
    direccion,
    comuna,
    region,
    regimen_tributario
  )
  VALUES (
    p_rut,
    p_nombre,
    p_giro,
    p_direccion,
    p_comuna,
    p_region,
    COALESCE(p_regimen, 'pro_pyme')
  )
  RETURNING id INTO v_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_org_id, auth.uid(), 'owner');

  RETURN v_org_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_new_company(text, text, text, text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_new_company(text, text, text, text, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_new_company(text, text, text, text, text, text, text) TO authenticated;

DO $$
DECLARE
  v_function text;
  v_functions text[] := ARRAY[
    'public.handle_new_user()',
    'public.refresh_accounting_balances()',
    'public.get_my_org_ids()',
    'public.get_effective_contract_data(uuid, date)',
    'public.create_journal_entry_with_lines(uuid, date, text, jsonb)',
    'public.batch_create_journal_entries(uuid, jsonb)',
    'public.seed_payroll_settings(uuid)',
    'public.seed_payroll_settings(uuid, text, text, text)',
    'public.check_org_access(uuid)',
    'public.check_user_in_org(uuid)',
    'public.decrypt_cert_password(text, uuid)',
    'public.encrypt_cert_password(text, uuid)',
    'public.reserve_dte_folio(uuid, uuid, integer, text)'
  ];
BEGIN
  FOREACH v_function IN ARRAY v_functions LOOP
    IF to_regprocedure(v_function) IS NOT NULL THEN
      EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', v_function);
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE
  v_function text;
  v_service_only_functions text[] := ARRAY[
    'public.create_journal_entry_with_lines(uuid, date, text, jsonb)',
    'public.batch_create_journal_entries(uuid, jsonb)',
    'public.get_effective_contract_data(uuid, date)',
    'public.seed_payroll_settings(uuid)',
    'public.seed_payroll_settings(uuid, text, text, text)',
    'public.decrypt_cert_password(text, uuid)',
    'public.encrypt_cert_password(text, uuid)',
    'public.reserve_dte_folio(uuid, uuid, integer, text)'
  ];
BEGIN
  FOREACH v_function IN ARRAY v_service_only_functions LOOP
    IF to_regprocedure(v_function) IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', v_function);
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', v_function);
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', v_function);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', v_function);
    END IF;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
