-- ============================================================================
-- MIGRACIÓN DE ÍNDICES DE RENDIMIENTO DE PRODUCCIÓN (B-TREE COMPUESTOS)
-- Proyecto: Contapymepuq (Chilean SaaS & Regional Newspaper)
-- Optimizado para: PostgreSQL en Supabase
-- ============================================================================

-- 1. MÓDULO CONTABLE Y LIBRO DIARIO
-- Consultas de asientos por organización y rango de fechas (Balance, Libro Diario, Mayor)
CREATE INDEX IF NOT EXISTS idx_journal_entries_org_fecha 
ON public.journal_entries (organization_id, fecha DESC);

-- Consultas de líneas de asientos por entrada y por cuenta contable
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_org_entry 
ON public.journal_entry_lines (organization_id, entry_id);

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account 
ON public.journal_entry_lines (account_id, is_reconciled);

-- 2. MÓDULO DE REMUNERACIONES Y NÓMINA
-- Filtro de empleados activos por organización
CREATE INDEX IF NOT EXISTS idx_employees_org_active 
ON public.employees (organization_id, activo);

-- Búsqueda de liquidaciones por período y empleado
CREATE INDEX IF NOT EXISTS idx_liquidations_org_period 
ON public.liquidations (organization_id, periodo DESC, employee_id);

-- Libros de remuneraciones LRE por período
CREATE INDEX IF NOT EXISTS idx_payroll_books_org_period 
ON public.payroll_books (organization_id, periodo DESC);

-- 3. MÓDULO DE FACTURACIÓN Y REGISTRO COMPRAS/VENTAS (RCV)
-- Consultas de RCV compras por período
CREATE INDEX IF NOT EXISTS idx_purchase_records_org_period 
ON public.purchase_records (organization_id, periodo DESC);

-- Consultas de RCV ventas por período
CREATE INDEX IF NOT EXISTS idx_sales_records_org_period 
ON public.sales_records (organization_id, periodo DESC);

-- Facturación Electrónica (DTE Emitidos por folio y tipo)
CREATE INDEX IF NOT EXISTS idx_dte_issued_org_tipo_folio 
ON public.dte_issued (organization_id, tipo_dte, folio DESC);

-- 4. MÓDULO DE CONCILIACIÓN BANCARIA Y TESORERÍA
-- Cartolas bancarias sin conciliar
CREATE INDEX IF NOT EXISTS idx_bank_statement_lines_reconciled 
ON public.bank_statement_lines (organization_id, bank_account_id, is_reconciled);

-- Pagos de tesorería por fecha de pago
CREATE INDEX IF NOT EXISTS idx_treasury_payments_org_date 
ON public.treasury_payments (organization_id, fecha_pago DESC);

-- 5. CINTA DE INDICADORES ECONÓMICOS Y TELEMETRÍA (REALTIME)
-- Búsqueda rápida del indicador más reciente por código y timestamp
CREATE INDEX IF NOT EXISTS idx_economic_indicators_code_updated 
ON public.economic_indicators (codigo, updated_at DESC);

-- 6. DIARIO REGIONAL DE NOTICIAS MAGALLANES
-- Publicaciones ordenadas por fecha y destacadas para SEO y Sitemap
CREATE INDEX IF NOT EXISTS idx_regional_news_featured_date 
ON public.regional_news (is_featured, published_at DESC);

-- ============================================================================
-- COMPROBACIÓN DE AUDITORÍA Y ESTADO DE ÍNDICES
-- ============================================================================
COMMENT ON INDEX idx_journal_entries_org_fecha IS 'Acelera la generación de Libro Diario y Mayor multi-tenant.';
COMMENT ON INDEX idx_economic_indicators_code_updated IS 'Garantiza la lectura en sub-milisegundos para la cinta de indicadores de mercado.';
