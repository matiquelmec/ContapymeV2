-- Precheck duplicates before Phase 4 unique constraints/indexes

select 'dte_issued' as target, count(*) as duplicate_groups
from (
  select company_id, tipo_dte, folio
  from public.dte_issued
  group by company_id, tipo_dte, folio
  having count(*) > 1
) d

union all

select 'sales_records', count(*)
from (
  select organization_id, tipo_documento, folio, rut_receptor
  from public.sales_records
  group by organization_id, tipo_documento, folio, rut_receptor
  having count(*) > 1
) d

union all

select 'purchase_records', count(*)
from (
  select organization_id, tipo_documento, folio, rut_emisor
  from public.purchase_records
  group by organization_id, tipo_documento, folio, rut_emisor
  having count(*) > 1
) d

union all

select 'accounting_periods', count(*)
from (
  select organization_id, ano, mes
  from public.accounting_periods
  group by organization_id, ano, mes
  having count(*) > 1
) d

union all

select 'liquidations', count(*)
from (
  select organization_id, employee_id, periodo
  from public.liquidations
  group by organization_id, employee_id, periodo
  having count(*) > 1
) d
;
