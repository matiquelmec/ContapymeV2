
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ Error: Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

supabase: Client = create_client(url, key)

sql = """
-- ====================================================================
-- MIGRACIÓN: CONVIRTIDOR A ESQUEMA DE NIVEL MUNDIAL (V2) - VIA RPC
-- ====================================================================

-- 1. IDENTIDAD Y PERFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  full_name text,
  avatar_url text,
  preferences jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Asegurar que organization_members tenga permisos granulares
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organization_members' AND column_name='permissions') THEN
        ALTER TABLE public.organization_members ADD COLUMN permissions jsonb DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 2. CONTABILIDAD IFRS: REGLAS DE MAPEO
CREATE TABLE IF NOT EXISTS public.account_mapping_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  context text NOT NULL,
  account_id uuid REFERENCES public.chart_of_accounts(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, context)
);

-- Mejorar journal_entry_lines para usar UUID si no lo hace ya
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='journal_entry_lines' AND column_name='account_id') THEN
        ALTER TABLE public.journal_entry_lines ADD COLUMN account_id uuid REFERENCES public.chart_of_accounts(id);
    END IF;
END $$;

-- 3. REMUNERACIONES: INMUTABILIDAD Y SNAPSHOTS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='liquidations' AND column_name='calculation_snapshot') THEN
        ALTER TABLE public.liquidations ADD COLUMN calculation_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='liquidations' AND column_name='account_id_neto') THEN
        ALTER TABLE public.liquidations ADD COLUMN account_id_neto uuid REFERENCES public.chart_of_accounts(id);
    END IF;
END $$;

-- Versionamiento de contratos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employment_contracts' AND column_name='version') THEN
        ALTER TABLE public.employment_contracts ADD COLUMN version integer DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employment_contracts' AND column_name='parent_contract_id') THEN
        ALTER TABLE public.employment_contracts ADD COLUMN parent_contract_id uuid REFERENCES public.employment_contracts(id);
    END IF;
END $$;

-- 4. INTELIGENCIA TRIBUTARIA (F29 GRANULAR)
CREATE TABLE IF NOT EXISTS public.f29_box_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  f29_id uuid REFERENCES public.f29_forms(id) ON DELETE CASCADE,
  box_code integer NOT NULL, 
  description text,
  value numeric(15,2) NOT NULL,
  box_type text DEFAULT 'determinativo',
  created_at timestamptz DEFAULT now()
);

-- 5. POLÍTICAS DE SEGURIDAD (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_mapping_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.f29_box_details ENABLE ROW LEVEL SECURITY;

-- Nota: Las políticas se asumen configuradas o se pueden añadir más aquí si el RPC tiene permisos.
"""

def apply_via_rpc():
    try:
        print(f"🚀 Iniciando migración de Nivel Mundial vía RPC para {url}...")
        res = supabase.rpc("exec_sql", {"query": sql}).execute()
        print("✅ ÉXITO: Esquema de Nivel Mundial aplicado correctamente.")
        print("Tablas actualizadas: profiles, organization_members, account_mapping_rules, liquidations, employment_contracts, f29_box_details.")
    except Exception as e:
        print(f"❌ Error al aplicar SQL vía RPC: {e}")

if __name__ == "__main__":
    apply_via_rpc()
