-- Phase 1 payroll parity with the legacy remuneration system.
-- Keep this migration additive: existing production data and API contracts remain valid.

alter table public.employees
  add column if not exists centro_costo text,
  add column if not exists jornada_parcial boolean not null default false,
  add column if not exists tiene_semana_corrida boolean not null default false,
  add column if not exists extranjero boolean not null default false,
  add column if not exists fun_isapre text,
  add column if not exists credito_ccaf bigint not null default 0;

alter table public.organization_payroll_settings
  add column if not exists tasa_mutual numeric(6,3) not null default 0.93,
  add column if not exists dias_vacaciones_anuales numeric(5,2) not null default 15,
  add column if not exists es_zona_extrema boolean not null default false,
  add column if not exists zona_extrema text;

alter table public.liquidations
  add column if not exists credito_ccaf bigint not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'organization_payroll_settings_tasa_mutual_valid'
      and conrelid = 'public.organization_payroll_settings'::regclass
  ) then
    alter table public.organization_payroll_settings
      add constraint organization_payroll_settings_tasa_mutual_valid
      check (tasa_mutual >= 0 and tasa_mutual <= 100)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'organization_payroll_settings_vacation_days_valid'
      and conrelid = 'public.organization_payroll_settings'::regclass
  ) then
    alter table public.organization_payroll_settings
      add constraint organization_payroll_settings_vacation_days_valid
      check (dias_vacaciones_anuales > 0 and dias_vacaciones_anuales <= 30)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'employees_credito_ccaf_nonnegative'
      and conrelid = 'public.employees'::regclass
  ) then
    alter table public.employees
      add constraint employees_credito_ccaf_nonnegative
      check (credito_ccaf >= 0)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'liquidations_credito_ccaf_nonnegative'
      and conrelid = 'public.liquidations'::regclass
  ) then
    alter table public.liquidations
      add constraint liquidations_credito_ccaf_nonnegative
      check (credito_ccaf >= 0)
      not valid;
  end if;
end $$;

alter table public.organization_payroll_settings
  validate constraint organization_payroll_settings_tasa_mutual_valid;

alter table public.organization_payroll_settings
  validate constraint organization_payroll_settings_vacation_days_valid;

alter table public.employees
  validate constraint employees_credito_ccaf_nonnegative;

alter table public.liquidations
  validate constraint liquidations_credito_ccaf_nonnegative;

comment on column public.employees.centro_costo is
  'Payroll cost center used by reports, accounting allocation, contracts, and legacy parity.';

comment on column public.employees.fun_isapre is
  'Optional health plan/FUN identifier used in labor documents and future Previred validation.';

comment on column public.organization_payroll_settings.tasa_mutual is
  'Company accident insurance rate percentage for mutual/ISL calculations and Previred export.';

comment on column public.organization_payroll_settings.dias_vacaciones_anuales is
  'Company default annual vacation days. Standard is 15; special zones or company policies may use 20.';
