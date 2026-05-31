-- FASE 1: EXPAND MIGRATION SQL

-- 1. Crear Dominios Contables si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'clp_amount') THEN
        CREATE DOMAIN clp_amount AS bigint CHECK (VALUE >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'uf_amount') THEN
        CREATE DOMAIN uf_amount AS numeric(10,4) CHECK (VALUE >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'percentage') THEN
        CREATE DOMAIN percentage AS numeric(5,4) CHECK (VALUE BETWEEN 0 AND 1);
    END IF;
END $$;

-- 2. Modificaciones en Plan de Cuentas (chart_of_accounts)
-- Añadir parent_id si no existe
ALTER TABLE public.chart_of_accounts 
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL;

-- Trigger para sincronizar parent_codigo a parent_id
CREATE OR REPLACE FUNCTION sync_coa_parent_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_codigo IS NOT NULL AND NEW.parent_id IS NULL THEN
        SELECT id INTO NEW.parent_id 
        FROM public.chart_of_accounts 
        WHERE organization_id = NEW.organization_id AND codigo = NEW.parent_codigo
        LIMIT 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_coa_parent_id ON public.chart_of_accounts;
CREATE TRIGGER trg_sync_coa_parent_id
BEFORE INSERT OR UPDATE OF parent_codigo, parent_id ON public.chart_of_accounts
FOR EACH ROW
EXECUTE FUNCTION sync_coa_parent_id();

-- 3. Crear Nueva Tabla de Configuración Centralizada de Cuentas (normalizada)
CREATE TABLE IF NOT EXISTS public.account_config_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  module_name character varying NOT NULL,      -- 'payroll', 'tax', 'assets'
  entry_key  character varying NOT NULL,       -- 'iva_debito', 'afp_liability', 'expense_salary', etc.
  account_id uuid REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  is_active  boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (organization_id, module_name, entry_key)
);

-- Función auxiliar para upsert de configuraciones
CREATE OR REPLACE FUNCTION upsert_config_entry(
    p_org_id uuid,
    p_module text,
    p_key text,
    p_code text
) RETURNS void AS $$
DECLARE
    v_account_id uuid;
BEGIN
    IF p_code IS NULL OR p_code = '' THEN
        DELETE FROM public.account_config_entries 
        WHERE organization_id = p_org_id AND module_name = p_module AND entry_key = p_key;
    ELSE
        SELECT id INTO v_account_id 
        FROM public.chart_of_accounts 
        WHERE organization_id = p_org_id AND codigo = p_code
        LIMIT 1;
        
        IF v_account_id IS NOT NULL THEN
            INSERT INTO public.account_config_entries (organization_id, module_name, entry_key, account_id)
            VALUES (p_org_id, p_module, p_key, v_account_id)
            ON CONFLICT (organization_id, module_name, entry_key)
            DO UPDATE SET account_id = EXCLUDED.account_id, updated_at = now();
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar desde la tabla ancha legacy centralized_account_config a la nueva normalizada
CREATE OR REPLACE FUNCTION sync_legacy_config()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM upsert_config_entry(NEW.organization_id, 'tax', 'tax_iva_debito', NEW.tax_iva_debito_code);
    PERFORM upsert_config_entry(NEW.organization_id, 'tax', 'tax_iva_credito', NEW.tax_iva_credito_code);
    PERFORM upsert_config_entry(NEW.organization_id, 'tax', 'tax_ppm', NEW.tax_ppm_code);
    PERFORM upsert_config_entry(NEW.organization_id, 'tax', 'tax_retentions', NEW.tax_retentions_code);
    PERFORM upsert_config_entry(NEW.organization_id, 'tax', 'tax_f29_payable', NEW.tax_f29_payable_code);
    PERFORM upsert_config_entry(NEW.organization_id, 'tax', 'tax_iva_remanente', NEW.tax_iva_remanente_code);
    
    PERFORM upsert_config_entry(NEW.organization_id, 'assets', 'depreciation_expense', NEW.asset_depreciation_expense_code);
    PERFORM upsert_config_entry(NEW.organization_id, 'assets', 'accumulated_depreciation', NEW.asset_accumulated_depreciation_code);
    
    PERFORM upsert_config_entry(NEW.organization_id, 'payroll', 'expense_salary', NEW.expense_salary_code);
    PERFORM upsert_config_entry(NEW.organization_id, 'payroll', 'expense_social', NEW.expense_social_code);
    PERFORM upsert_config_entry(NEW.organization_id, 'payroll', 'liability_afp', NEW.liability_afp_code);
    PERFORM upsert_config_entry(NEW.organization_id, 'payroll', 'liability_salud', NEW.liability_salud_code);
    PERFORM upsert_config_entry(NEW.organization_id, 'payroll', 'liability_afc', NEW.liability_afc_code);
    PERFORM upsert_config_entry(NEW.organization_id, 'payroll', 'liability_tax', NEW.liability_tax_code);
    PERFORM upsert_config_entry(NEW.organization_id, 'payroll', 'liability_net', NEW.liability_net_code);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_legacy_config ON public.centralized_account_config;
CREATE TRIGGER trg_sync_legacy_config
AFTER INSERT OR UPDATE ON public.centralized_account_config
FOR EACH ROW
EXECUTE FUNCTION sync_legacy_config();
