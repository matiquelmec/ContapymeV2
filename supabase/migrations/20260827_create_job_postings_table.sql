-- ==============================================================================
-- Migración: Creación de tabla 'job_postings' para ContaEmpleos Magallanes
-- Ecosistema: Contapymepuq v13.0
-- Estándar: Schema.org JobPosting, Art. 2° Código del Trabajo, Google for Jobs
-- ==============================================================================

create table if not exists public.job_postings (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    slug text unique not null,
    company_name text not null,
    company_rut text,
    company_logo_url text,
    location text not null default 'Punta Arenas',
    sector text not null default 'Comercio / Zona Franca',
    job_type text not null default 'Indefinido',
    work_shift text default '44 hrs',
    salary_raw text,
    salary_min numeric,
    salary_max numeric,
    salary_period text default 'MONTH',
    is_salary_public boolean default true,
    description text not null,
    requirements jsonb default '[]'::jsonb,
    benefits jsonb default '[]'::jsonb,
    contact_email text,
    contact_whatsapp text,
    application_url text,
    source_name text not null default 'ContaEmpleos PUQ',
    source_url text,
    is_verified boolean default false,
    status text default 'active' check (status in ('active', 'expired', 'filled')),
    published_at timestamptz default now(),
    expires_at timestamptz default (now() + interval '21 days'),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Índices de alto rendimiento
create index if not exists idx_job_postings_status_published on public.job_postings (status, published_at desc);
create index if not exists idx_job_postings_location on public.job_postings (location);
create index if not exists idx_job_postings_sector on public.job_postings (sector);
create index if not exists idx_job_postings_slug on public.job_postings (slug);
create index if not exists idx_job_postings_expires_at on public.job_postings (expires_at);

-- Habilitar Row Level Security (RLS)
alter table public.job_postings enable row level security;

-- Política 1: Lectura pública de ofertas activas
create policy "Public Read Active Jobs"
    on public.job_postings
    for select
    using (status = 'active' or auth.role() = 'service_role');

-- Política 2: Inserción y actualización protegida para service_role / admins
create policy "Service Role All Access on Jobs"
    on public.job_postings
    for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');
