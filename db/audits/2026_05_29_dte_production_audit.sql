-- Read-only production audit for DTE/SII hardening.
-- Run before applying stricter unique constraints or operational cleanup.

-- 1) Oversized raw SII responses that must be archived before enforcing 64 KB.
select
  count(*) as oversized_sii_raw_response_count,
  max(char_length(sii_raw_response)) as max_sii_raw_response_length
from public.dte_issued
where coalesce(char_length(sii_raw_response), 0) > 65536;

-- 2) Potential duplicate issued DTEs by company/type/folio/environment.
select
  company_id,
  tipo_dte,
  folio,
  coalesce(sii_environment, 'certification') as normalized_environment,
  count(*) as duplicate_count
from public.dte_issued
group by company_id, tipo_dte, folio, coalesce(sii_environment, 'certification')
having count(*) > 1
order by duplicate_count desc, company_id, tipo_dte, folio;

-- 3) Potential duplicate item line numbers inside the same DTE.
select
  dte_id,
  line_number,
  count(*) as duplicate_count
from public.dte_items
group by dte_id, line_number
having count(*) > 1
order by duplicate_count desc, dte_id, line_number;

-- 4) CAF ranges that overlap within the same company/type/environment.
select
  a.id as caf_a_id,
  b.id as caf_b_id,
  a.company_id,
  a.tipo_dte,
  a.environment,
  a.range_start as a_start,
  a.range_end as a_end,
  b.range_start as b_start,
  b.range_end as b_end
from public.dte_caf_folios a
join public.dte_caf_folios b
  on b.company_id = a.company_id
 and b.tipo_dte = a.tipo_dte
 and b.environment = a.environment
 and b.id > a.id
where a.range_start <= b.range_end
  and b.range_start <= a.range_end
order by a.company_id, a.tipo_dte, a.environment, a.range_start;

-- 5) Accounting periods that should be unique per organization/month.
select
  organization_id,
  ano,
  mes,
  count(*) as duplicate_count
from public.accounting_periods
group by organization_id, ano, mes
having count(*) > 1
order by duplicate_count desc, organization_id, ano, mes;

-- 6) Duplicate organization memberships.
select
  organization_id,
  user_id,
  count(*) as duplicate_count
from public.organization_members
group by organization_id, user_id
having count(*) > 1
order by duplicate_count desc, organization_id, user_id;

-- 7) RCV sales duplicates by natural document identity.
select
  organization_id,
  periodo,
  tipo_documento,
  folio,
  rut_receptor,
  count(*) as duplicate_count
from public.sales_records
group by organization_id, periodo, tipo_documento, folio, rut_receptor
having count(*) > 1
order by duplicate_count desc, organization_id, periodo, tipo_documento, folio;

-- 8) RCV purchase duplicates by natural document identity.
select
  organization_id,
  periodo,
  tipo_documento,
  folio,
  rut_emisor,
  count(*) as duplicate_count
from public.purchase_records
group by organization_id, periodo, tipo_documento, folio, rut_emisor
having count(*) > 1
order by duplicate_count desc, organization_id, periodo, tipo_documento, folio;

-- 9) RLS status for public tables in the current schema snapshot.
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- 10) DTE/SII indexes expected by the hardening migration.
select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'dte_issued_org_company_tipo_folio_env_idx',
    'dte_issued_org_status_track_idx',
    'dte_issued_org_submission_checked_idx',
    'dte_caf_folios_active_lookup_idx',
    'dte_sii_raw_archive_dte_id_idx',
    'dte_sii_raw_archive_org_created_idx',
    'dte_items_dte_line_idx'
  )
order by indexname;
