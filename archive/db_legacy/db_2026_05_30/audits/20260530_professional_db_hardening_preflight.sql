-- Professional DB hardening preflight.
-- Read-only checks. Run before supabase/migrations/20260530002820_professional_db_hardening_phase1.sql.

-- 1. DTE duplicate identities by company/type/folio/environment.
SELECT
  company_id,
  tipo_dte,
  folio,
  COALESCE(sii_environment, 'certification') AS normalized_environment,
  COUNT(*) AS duplicate_count
FROM public.dte_issued
GROUP BY company_id, tipo_dte, folio, COALESCE(sii_environment, 'certification')
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, company_id, tipo_dte, folio;

-- 2. DTE item duplicate line numbers.
SELECT
  dte_id,
  line_number,
  COUNT(*) AS duplicate_count
FROM public.dte_items
GROUP BY dte_id, line_number
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, dte_id, line_number;

-- 3. Accounting period duplicates.
SELECT
  organization_id,
  ano,
  mes,
  COUNT(*) AS duplicate_count
FROM public.accounting_periods
GROUP BY organization_id, ano, mes
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, organization_id, ano, mes;

-- 4. Duplicate organization memberships.
SELECT
  organization_id,
  user_id,
  COUNT(*) AS duplicate_count
FROM public.organization_members
GROUP BY organization_id, user_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, organization_id, user_id;

-- 5. Sales RCV duplicate natural documents.
SELECT
  organization_id,
  periodo,
  tipo_documento,
  folio,
  rut_receptor,
  COUNT(*) AS duplicate_count
FROM public.sales_records
GROUP BY organization_id, periodo, tipo_documento, folio, rut_receptor
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, organization_id, periodo, tipo_documento, folio;

-- 6. Purchase RCV duplicate natural documents.
SELECT
  organization_id,
  periodo,
  tipo_documento,
  folio,
  rut_emisor,
  COUNT(*) AS duplicate_count
FROM public.purchase_records
GROUP BY organization_id, periodo, tipo_documento, folio, rut_emisor
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, organization_id, periodo, tipo_documento, folio;

-- 7. Active overlapping CAF ranges.
SELECT
  a.id AS caf_a_id,
  b.id AS caf_b_id,
  a.company_id,
  a.tipo_dte,
  a.environment,
  a.range_start AS a_start,
  a.range_end AS a_end,
  b.range_start AS b_start,
  b.range_end AS b_end
FROM public.dte_caf_folios a
JOIN public.dte_caf_folios b
  ON b.company_id = a.company_id
 AND b.tipo_dte = a.tipo_dte
 AND b.environment = a.environment
 AND b.id > a.id
WHERE a.is_active = true
  AND b.is_active = true
  AND a.range_start <= b.range_end
  AND b.range_start <= a.range_end
ORDER BY a.company_id, a.tipo_dte, a.environment, a.range_start;

-- 8. Approved vacation requests with overlapping dates.
SELECT
  a.id AS request_a_id,
  b.id AS request_b_id,
  a.organization_id,
  a.employee_id,
  a.fecha_inicio AS a_inicio,
  a.fecha_fin AS a_fin,
  b.fecha_inicio AS b_inicio,
  b.fecha_fin AS b_fin
FROM public.vacation_requests a
JOIN public.vacation_requests b
  ON b.organization_id = a.organization_id
 AND b.employee_id = a.employee_id
 AND b.id > a.id
WHERE a.status = 'approved'
  AND b.status = 'approved'
  AND a.fecha_inicio <= b.fecha_fin
  AND b.fecha_inicio <= a.fecha_fin
ORDER BY a.organization_id, a.employee_id, a.fecha_inicio;

-- 9. Active liquidations duplicated by employee/month.
SELECT
  employee_id,
  periodo,
  COUNT(*) AS duplicate_count
FROM public.liquidations
WHERE status IN ('borrador', 'aprobada')
GROUP BY employee_id, periodo
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, employee_id, periodo;

-- 10. Unbalanced journal entries.
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
GROUP BY je.id, je.organization_id, je.fecha
HAVING
  COALESCE(SUM(jel.monto) FILTER (WHERE jel.tipo = 'debe'), 0)
  <> COALESCE(SUM(jel.monto) FILTER (WHERE jel.tipo = 'haber'), 0)
ORDER BY je.fecha DESC, je.id;
