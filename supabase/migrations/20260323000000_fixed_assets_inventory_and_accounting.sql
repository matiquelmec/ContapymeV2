-- ============================================================
-- CONTAPYME V2 — MIGRACIÓN: INVENTARIO DE ACTIVOS FIJOS Y CENTRALIZACIÓN
-- Fecha: 2026-03-23
-- Descripción: Enriquecimiento de metadatos de activos, link contable y RPC robusta.
-- ============================================================

-- 1. Enriquecer tabla de Activos Fijos con metadatos de Inventario
ALTER TABLE public.fixed_assets ADD COLUMN IF NOT EXISTS categoria character varying;
ALTER TABLE public.fixed_assets ADD COLUMN IF NOT EXISTS marca character varying;
ALTER TABLE public.fixed_assets ADD COLUMN IF NOT EXISTS modelo character varying;
ALTER TABLE public.fixed_assets ADD COLUMN IF NOT EXISTS ubicacion character varying;
ALTER TABLE public.fixed_assets ADD COLUMN IF NOT EXISTS responsable character varying;

-- 2. Link Contable en Journal Entries
-- Agregar el FK para rastrear qué asientos pertenecen a qué activos (Depreciaciones o Compras)
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS fixed_asset_id uuid REFERENCES public.fixed_assets(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_journal_entries_fixed_asset ON public.journal_entries(fixed_asset_id);

-- 3. RPC: create_journal_entry_with_lines (Garantizar existencia para el Engine)
-- Esta función permite al motor crear un asiento complejo con sus líneas en una sola transacción atómica.
CREATE OR REPLACE FUNCTION public.create_journal_entry_with_lines(
    p_organization_id uuid,
    p_fecha date,
    p_glosa text,
    p_lines jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_journal_id uuid;
    v_line jsonb;
BEGIN
    -- 1. Insertar el encabezado del asiento
    INSERT INTO public.journal_entries (
        organization_id,
        fecha,
        glosa
    ) VALUES (
        p_organization_id,
        p_fecha,
        p_glosa
    ) RETURNING id INTO v_journal_id;

    -- 2. Insertar las líneas del detalle
    FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
    LOOP
        INSERT INTO public.journal_entry_lines (
            entry_id,
            cuenta_codigo,
            cuenta_nombre,
            tipo,
            monto
        ) VALUES (
            v_journal_id,
            (v_line->>'cuenta_codigo'),
            (v_line->>'cuenta_nombre'),
            (v_line->>'tipo')::text,
            (v_line->>'monto')::numeric
        );
    END LOOP;

    RETURN v_journal_id;
END;
$$;

-- 4. Insertar Configuración Contable por Defecto para Activos Fijos (si no existe)
-- Esto permite que el sistema sepa a qué cuentas cargar las depreciaciones automáticamente.
INSERT INTO public.centralized_account_config 
(organization_id, module_name, transaction_type, display_name, tax_account_code, tax_account_name, revenue_account_code, revenue_account_name, asset_account_code, asset_account_name)
SELECT 
    id as organization_id,
    'assets' as module_name,
    'depreciation' as transaction_type,
    'Depreciación Mensual' as display_name,
    '5.1.03.001' as tax_account_code, -- Cuenta de Gasto: Depreciación del Ejercicio
    'Gasto Depreciación' as tax_account_name,
    '1.1.05.001' as revenue_account_code, -- Cuenta de Activo (Contra): Depreciación Acumulada
    'Depreciación Acumulada' as revenue_account_name,
    '1.1.05.000' as asset_account_code, -- Cuenta de Activo: Maquinaria/Equipo (Referencia)
    'Activo Fijo (Maq/Eq)' as asset_account_name
FROM public.organizations
ON CONFLICT DO NOTHING;

COMMENT ON COLUMN public.journal_entries.fixed_asset_id IS 'Vincula el asiento contable con un activo fijo específico (ej. para depreciaciones automáticas).';
