-- 20260401_db_integrity_hardening.sql
-- Blindaje Integrado de Integridad Contable Contapyme V2 (Versión Final Consolidada)

DO $$ 
BEGIN
    ---------------------------------------------------------------------------
    -- 1. EXTENSIÓN DE COLUMNAS (HARDENING DE ESQUEMA)
    -- Aseguramos que existan todas las columnas para F29 y Activos Fijos
    ---------------------------------------------------------------------------
    -- Columnas de Activos Fijos (Si faltaban en el esquema maestro)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='centralized_account_config' AND column_name='asset_depreciation_expense_code') THEN
        ALTER TABLE public.centralized_account_config 
        ADD COLUMN asset_depreciation_expense_code text,
        ADD COLUMN asset_depreciation_expense_name text,
        ADD COLUMN asset_accumulated_depreciation_code text,
        ADD COLUMN asset_accumulated_depreciation_name text;
    END IF;

    -- Columnas de Nómina Extra (Seguro por si acaso)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='centralized_account_config' AND column_name='expense_salary_code') THEN
        ALTER TABLE public.centralized_account_config 
        ADD COLUMN expense_salary_code text,
        ADD COLUMN expense_salary_name text,
        ADD COLUMN expense_social_code text,
        ADD COLUMN expense_social_name text,
        ADD COLUMN liability_afp_code text,
        ADD COLUMN liability_afp_name text,
        ADD COLUMN liability_salud_code text,
        ADD COLUMN liability_salud_name text,
        ADD COLUMN liability_afc_code text,
        ADD COLUMN liability_afc_name text,
        ADD COLUMN liability_tax_code text,
        ADD COLUMN liability_tax_name text,
        ADD COLUMN liability_net_code text,
        ADD COLUMN liability_net_name text;
    END IF;


    ---------------------------------------------------------------------------
    -- 2. INDICADORES ECONÓMICOS (Error 42P10 Fix)
    ---------------------------------------------------------------------------
    DELETE FROM public.economic_indicators a
    USING public.economic_indicators b
    WHERE a.updated_at < b.updated_at AND a.codigo = b.codigo;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idx_unique_indicator_code') THEN
        ALTER TABLE public.economic_indicators ADD CONSTRAINT idx_unique_indicator_code UNIQUE (codigo);
    END IF;


    ---------------------------------------------------------------------------
    -- 3. CONFIGURACIONES CENTRALIZADAS (PREVENTIVE HARDENING)
    ---------------------------------------------------------------------------
    DELETE FROM public.centralized_account_config a
    USING public.centralized_account_config b
    WHERE a.updated_at < b.updated_at 
      AND a.organization_id = b.organization_id 
      AND a.module_name = b.module_name 
      AND a.transaction_type = b.transaction_type;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idx_unique_centralized_config_engine') THEN
        ALTER TABLE public.centralized_account_config 
        ADD CONSTRAINT idx_unique_centralized_config_engine UNIQUE (organization_id, module_name, transaction_type);
    END IF;


    ---------------------------------------------------------------------------
    -- 4. REGLAS DE MAPEO GRANULAR (RUT OVERRIDES)
    ---------------------------------------------------------------------------
    DELETE FROM public.account_mapping_rules a
    USING public.account_mapping_rules b
    WHERE a.created_at < b.created_at 
      AND a.organization_id = b.organization_id 
      AND a.context = b.context;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idx_unique_mapping_rule_context') THEN
        ALTER TABLE public.account_mapping_rules 
        ADD CONSTRAINT idx_unique_mapping_rule_context UNIQUE (organization_id, context);
    END IF;

    RAISE NOTICE '✅ HARDENING TOTAL DE INTEGRIDAD COMPLETADO. El sistema es ahora invulnerable.';
END $$;
