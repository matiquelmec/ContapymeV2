-- Post-deploy validation checklist for 20260530023000_accounting_treasury_integrity_phase3.sql
-- Run in production after migration.

-- 1) Required functions exist
select n.nspname as schema, p.proname as function_name
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'enforce_open_accounting_period',
    'fn_check_journal_entry_period',
    'fn_check_journal_entry_lines_period',
    'check_journal_entry_balance',
    'validate_treasury_payment_document'
  )
order by p.proname;

-- 2) Required triggers active
select event_object_table as table_name, trigger_name, action_timing, event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
  and (
    (event_object_table = 'journal_entries' and trigger_name = 'trg_check_journal_entry_period') or
    (event_object_table = 'journal_entry_lines' and trigger_name in ('trg_check_journal_entry_lines_period', 'trg_check_journal_entry_balance')) or
    (event_object_table = 'treasury_payment_documents' and trigger_name = 'trg_validate_treasury_payment_document')
  )
order by event_object_table, trigger_name, event_manipulation;

-- 3) Detect unbalanced journal entries (must be zero rows)
select je.organization_id, je.id as entry_id,
       coalesce(sum(case when jel.tipo='debe' then jel.monto else 0 end),0) as total_debe,
       coalesce(sum(case when jel.tipo='haber' then jel.monto else 0 end),0) as total_haber
from public.journal_entries je
join public.journal_entry_lines jel on jel.entry_id = je.id
group by je.organization_id, je.id
having coalesce(sum(case when jel.tipo='debe' then jel.monto else 0 end),0)
    <> coalesce(sum(case when jel.tipo='haber' then jel.monto else 0 end),0)
order by je.organization_id, je.id;

-- 4) Detect over-applied treasury documents (must be zero rows)
with applied as (
  select organization_id, document_type, document_id, sum(monto_aplicado)::bigint as total_aplicado
  from public.treasury_payment_documents
  group by organization_id, document_type, document_id
), doc_totals as (
  select organization_id, 'purchase_record'::text as document_type, id as document_id, monto_total
  from public.purchase_records
  union all
  select organization_id, 'sales_record'::text, id, monto_total
  from public.sales_records
  union all
  select organization_id, 'dte_issued'::text, id, monto_total
  from public.dte_issued
)
select a.organization_id, a.document_type, a.document_id, a.total_aplicado, d.monto_total
from applied a
join doc_totals d
  on d.organization_id = a.organization_id
 and d.document_type = a.document_type
 and d.document_id = a.document_id
where a.total_aplicado > d.monto_total
order by a.organization_id, a.document_type, a.document_id;

-- 5) Detect over-applied payments (must be zero rows)
with payment_applied as (
  select payment_id, sum(monto_aplicado)::bigint as total_aplicado
  from public.treasury_payment_documents
  group by payment_id
)
select tp.organization_id, tp.id as payment_id, tp.monto as payment_total, pa.total_aplicado
from payment_applied pa
join public.treasury_payments tp on tp.id = pa.payment_id
where pa.total_aplicado > tp.monto
order by tp.organization_id, tp.id;
