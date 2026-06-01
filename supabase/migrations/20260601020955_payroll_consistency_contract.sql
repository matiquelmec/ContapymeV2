-- Payroll consistency contract
-- - Canonical liquidation flow: borrador -> aprobada -> finalizada -> pagada
-- - LRE is generated explicitly by the engine endpoint, not by a DB trigger.
-- - Natural uniqueness is enforced for payroll books and book details.

do $$
begin
  if exists (select 1 from pg_type where typname = 'liquidation_status') then
    if not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = 'liquidation_status'
        and e.enumlabel = 'aprobada'
    ) then
      alter type public.liquidation_status add value 'aprobada';
    end if;

    if not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = 'liquidation_status'
        and e.enumlabel = 'finalizada'
    ) then
      alter type public.liquidation_status add value 'finalizada';
    end if;

    if not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = 'liquidation_status'
        and e.enumlabel = 'pagada'
    ) then
      alter type public.liquidation_status add value 'pagada';
    end if;
  end if;
end $$;

drop trigger if exists trg_sync_liquidation_to_payroll_book on public.liquidations;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'fn_sync_liquidation_to_payroll_book'
  ) then
    comment on function public.fn_sync_liquidation_to_payroll_book() is
      'Deprecated 2026-06-01: LRE generation is explicit via engine endpoint to preserve validation and snapshot control.';
  end if;
end $$;

-- Merge duplicate payroll books for the same organization and period before
-- adding the natural unique index. Details are moved to the keeper book when
-- possible and duplicate employee rows are discarded from the duplicate books.
do $$
declare
  dup record;
begin
  for dup in
    select organization_id, periodo, min(id::text)::uuid as keeper_id
    from public.payroll_books
    group by organization_id, periodo
    having count(*) > 1
  loop
    delete from public.payroll_book_details d
    using public.payroll_book_details kept
    where d.payroll_book_id in (
        select id
        from public.payroll_books
        where organization_id = dup.organization_id
          and periodo = dup.periodo
          and id <> dup.keeper_id
      )
      and kept.payroll_book_id = dup.keeper_id
      and kept.employee_id = d.employee_id;

    update public.payroll_book_details
    set payroll_book_id = dup.keeper_id
    where payroll_book_id in (
      select id
      from public.payroll_books
      where organization_id = dup.organization_id
        and periodo = dup.periodo
        and id <> dup.keeper_id
    );

    delete from public.payroll_books
    where organization_id = dup.organization_id
      and periodo = dup.periodo
      and id <> dup.keeper_id;
  end loop;
end $$;

with ranked as (
  select ctid,
         row_number() over (
           partition by payroll_book_id, employee_id
           order by id::text
         ) as rn
  from public.payroll_book_details
)
delete from public.payroll_book_details d
using ranked r
where d.ctid = r.ctid
  and r.rn > 1;

create unique index if not exists payroll_books_org_period_uidx
  on public.payroll_books (organization_id, periodo);

create unique index if not exists payroll_books_org_book_number_uidx
  on public.payroll_books (organization_id, book_number);

create unique index if not exists payroll_book_details_book_employee_uidx
  on public.payroll_book_details (payroll_book_id, employee_id);

create index if not exists liquidations_org_period_status_idx
  on public.liquidations (organization_id, periodo, status);
