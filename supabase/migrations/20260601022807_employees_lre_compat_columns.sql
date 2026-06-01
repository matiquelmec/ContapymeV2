-- Compatibility columns for payroll exports.
-- Older running engine instances may still select these employee fields during
-- LRE/Previred export. Keep them nullable/defaulted while the app calculates
-- the values from payroll details.

alter table public.employees
  add column if not exists tramo_asignacion varchar(1);

alter table public.employees
  add column if not exists es_zona_extrema boolean not null default false;

alter table public.employees
  add column if not exists zona_extrema text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'employees_tramo_asignacion_valid'
      and conrelid = 'public.employees'::regclass
  ) then
    alter table public.employees
      add constraint employees_tramo_asignacion_valid
      check (tramo_asignacion is null or tramo_asignacion in ('A', 'B', 'C', 'D'))
      not valid;
  end if;
end $$;

alter table public.employees
  validate constraint employees_tramo_asignacion_valid;
