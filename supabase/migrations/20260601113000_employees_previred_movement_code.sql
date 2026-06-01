alter table public.employees
  add column if not exists previred_movement_code text not null default '0';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'employees_previred_movement_code_valid'
      and conrelid = 'public.employees'::regclass
  ) then
    alter table public.employees
      add constraint employees_previred_movement_code_valid
      check (previred_movement_code in ('0', '3', '6'))
      not valid;
  end if;
end $$;

alter table public.employees
  validate constraint employees_previred_movement_code_valid;
