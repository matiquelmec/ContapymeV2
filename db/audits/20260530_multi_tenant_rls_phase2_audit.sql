-- Multi-tenant RLS Phase 2 audit.
-- Run after supabase/migrations/20260530010034_secure_multi_tenant_rls_phase2.sql.

-- 1. Public base tables without RLS enabled.
SELECT
  'public_tables_without_rls' AS check_name,
  n.nspname AS schema_name,
  c.relname AS object_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname NOT LIKE 'pg_%'
  AND c.relrowsecurity = false
ORDER BY c.relname;

-- 2. Policies still using deprecated auth.role().
SELECT
  'policies_using_auth_role' AS check_name,
  schemaname,
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    COALESCE(qual, '') ILIKE '%auth.role()%'
    OR COALESCE(with_check, '') ILIKE '%auth.role()%'
  )
ORDER BY tablename, policyname;

-- 3. Organization-scoped tables without a tenant_member policy.
WITH org_tables AS (
  SELECT c.table_name
  FROM information_schema.columns c
  JOIN pg_class pc ON pc.relname = c.table_name
  JOIN pg_namespace pn ON pn.oid = pc.relnamespace AND pn.nspname = c.table_schema
  WHERE c.table_schema = 'public'
    AND c.column_name = 'organization_id'
    AND pc.relkind = 'r'
), tenant_policies AS (
  SELECT DISTINCT tablename
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname LIKE 'tenant_member_%'
)
SELECT
  'org_tables_missing_tenant_policy' AS check_name,
  ot.table_name
FROM org_tables ot
LEFT JOIN tenant_policies tp ON tp.tablename = ot.table_name
WHERE tp.tablename IS NULL
  AND ot.table_name NOT IN ('organization_members', 'organization_invitations')
ORDER BY ot.table_name;

-- 4. SECURITY DEFINER functions without explicit search_path.
SELECT
  'security_definer_without_search_path' AS check_name,
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public', 'private')
  AND p.prosecdef = true
  AND NOT EXISTS (
    SELECT 1
    FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) cfg
    WHERE cfg LIKE 'search_path=%'
  )
ORDER BY n.nspname, p.proname, args;

-- 5. Materialized views exposed directly to anon/authenticated.
SELECT
  'exposed_materialized_views' AS check_name,
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
  AND table_name IN (
    SELECT matviewname FROM pg_matviews WHERE schemaname = 'public'
  )
ORDER BY grantee, table_name, privilege_type;

-- 6. Views in public that are not security_invoker.
SELECT
  'views_without_security_invoker' AS check_name,
  n.nspname AS schema_name,
  c.relname AS view_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'v'
  AND NOT COALESCE((
    SELECT bool_or(option_name = 'security_invoker' AND option_value = 'true')
    FROM pg_options_to_table(c.reloptions)
  ), false)
ORDER BY c.relname;

-- 7. Expected RPCs/helpers existence.
SELECT
  'expected_functions' AS check_name,
  name,
  to_regprocedure(signature) IS NOT NULL AS exists
FROM (VALUES
  ('private.is_org_member', 'private.is_org_member(uuid)'),
  ('private.has_org_role', 'private.has_org_role(uuid, text[])'),
  ('public.get_account_balances', 'public.get_account_balances(uuid)'),
  ('public.create_new_company_7_args', 'public.create_new_company(text, text, text, text, text, text, text)')
) AS expected(name, signature)
ORDER BY name;
