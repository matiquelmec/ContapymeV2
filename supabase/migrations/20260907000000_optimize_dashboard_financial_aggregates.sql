-- ============================================================
-- 🏛️ MIGRACIÓN 20260907000000: Optimización de Agregaciones Financieras y Rendimiento
-- Objetivo: Procesar métricas ejecutivas agrupadas directamente en PostgreSQL
-- ============================================================

-- 1. ÍNDICES COMPUESTOS PARA ACELERAR FILTRADO POR ORGANIZACIÓN, AÑO Y FECHAS
CREATE INDEX IF NOT EXISTS idx_sales_records_org_fecha_neto
  ON public.sales_records(organization_id, fecha_docto)
  INCLUDE (monto_neto);

CREATE INDEX IF NOT EXISTS idx_purchase_records_org_fecha_neto
  ON public.purchase_records(organization_id, fecha_docto)
  INCLUDE (monto_neto);

CREATE INDEX IF NOT EXISTS idx_liquidations_org_periodo_totales
  ON public.liquidations(organization_id, periodo)
  INCLUDE (total_haberes_brutos, afc_empresa, sis_empresa);

CREATE INDEX IF NOT EXISTS idx_indicators_latest_lookup
  ON public.economic_indicators(codigo, updated_at DESC);

-- 2. FUNCIÓN DE AGREGACIÓN ATÓMICA DE CICLO ANUAL (12 MESES)
-- Reduce miles de transferencias HTTP a 1 solo objeto JSON estructurado
CREATE OR REPLACE FUNCTION public.get_organization_financial_aggregates(
    p_organization_id uuid,
    p_year int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_start_date date := make_date(p_year, 1, 1);
    v_end_date date := make_date(p_year, 12, 31);
    v_result jsonb;
BEGIN
    WITH months AS (
        SELECT generate_series(1, 12) AS m
    ),
    monthly_sales AS (
        SELECT 
            EXTRACT(MONTH FROM fecha_docto)::int AS m,
            COALESCE(SUM(monto_neto), 0)::bigint AS total
        FROM public.sales_records
        WHERE organization_id = p_organization_id
          AND fecha_docto >= v_start_date
          AND fecha_docto <= v_end_date
        GROUP BY 1
    ),
    monthly_purchases AS (
        SELECT 
            EXTRACT(MONTH FROM fecha_docto)::int AS m,
            COALESCE(SUM(monto_neto), 0)::bigint AS total
        FROM public.purchase_records
        WHERE organization_id = p_organization_id
          AND fecha_docto >= v_start_date
          AND fecha_docto <= v_end_date
        GROUP BY 1
    ),
    monthly_payroll AS (
        SELECT 
            EXTRACT(MONTH FROM periodo)::int AS m,
            COALESCE(SUM(COALESCE(total_haberes_brutos, 0) + COALESCE(afc_empresa, 0) + COALESCE(sis_empresa, 0)), 0)::bigint AS total
        FROM public.liquidations
        WHERE organization_id = p_organization_id
          AND periodo >= v_start_date
          AND periodo <= v_end_date
        GROUP BY 1
    ),
    consolidated_trend AS (
        SELECT 
            m.m AS month_num,
            to_char(to_date(m.m::text, 'MM'), 'Mon') AS month_name,
            COALESCE(s.total, 0) AS sales,
            COALESCE(p.total, 0) AS purchases,
            COALESCE(pay.total, 0) AS payroll,
            (COALESCE(s.total, 0) - (COALESCE(p.total, 0) + COALESCE(pay.total, 0))) AS margin
        FROM months m
        LEFT JOIN monthly_sales s ON s.m = m.m
        LEFT JOIN monthly_purchases p ON p.m = m.m
        LEFT JOIN monthly_payroll pay ON pay.m = m.m
        ORDER BY m.m
    ),
    totals AS (
        SELECT 
            COALESCE(SUM(sales), 0)::bigint AS total_sales,
            COALESCE(SUM(purchases), 0)::bigint AS total_purchases,
            COALESCE(SUM(payroll), 0)::bigint AS total_payroll
        FROM consolidated_trend
    ),
    assets_calc AS (
        SELECT 
            COALESCE(SUM(valor_adquisicion), 0)::bigint AS total_value,
            COALESCE(SUM(depreciacion_acumulada), 0)::bigint AS total_depreciation
        FROM public.fixed_assets
        WHERE organization_id = p_organization_id
    )
    SELECT jsonb_build_object(
        'year', p_year,
        'totals', (SELECT row_to_json(t.*) FROM totals t),
        'assets', (SELECT row_to_json(a.*) FROM assets_calc a),
        'trend', (SELECT jsonb_agg(row_to_json(c.*)) FROM consolidated_trend c)
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- 3. PERMISOS
GRANT EXECUTE ON FUNCTION public.get_organization_financial_aggregates(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_financial_aggregates(uuid, int) TO service_role;
