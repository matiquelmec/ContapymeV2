-- ============================================================
-- MIGRACION 20: Reporting y Performance de Tesoreria
-- Objetivo: optimizar consultas frecuentes y exponer vistas estables
--           para cuentas por pagar/cobrar sin duplicar logica en app.
-- ============================================================

-- Indices parciales para consultas por contraparte con saldos abiertos.
-- No se usa CONCURRENTLY para que la migracion pueda ejecutarse dentro de
-- transacciones de Supabase/CI. En produccion grande, aplicar fuera de
-- transaccion con CONCURRENTLY si se requiere cero lock de escritura.
CREATE INDEX IF NOT EXISTS idx_purchase_records_pending_by_supplier
  ON public.purchase_records(organization_id, payment_status, rut_emisor, fecha_docto)
  WHERE payment_status IN ('pending', 'partial');

CREATE INDEX IF NOT EXISTS idx_sales_records_pending_by_customer
  ON public.sales_records(organization_id, payment_status, rut_receptor, fecha_docto)
  WHERE payment_status IN ('pending', 'partial');

-- Refuerzo explicito de los patrones de relacion pago-documento.
CREATE INDEX IF NOT EXISTS idx_treasury_payment_docs_payment_lookup
  ON public.treasury_payment_documents(payment_id);

CREATE INDEX IF NOT EXISTS idx_treasury_payment_docs_document_lookup
  ON public.treasury_payment_documents(organization_id, document_type, document_id);

-- Cuentas por pagar abiertas. SECURITY INVOKER mantiene RLS de las tablas base.
CREATE OR REPLACE VIEW public.v_cuentas_por_pagar
WITH (security_invoker = true)
AS
SELECT
  pr.id,
  pr.organization_id,
  pr.rut_emisor,
  pr.razon_social_emisor,
  pr.tipo_documento,
  pr.folio,
  pr.fecha_docto,
  pr.periodo,
  pr.monto_total,
  pr.payment_status,
  COALESCE(SUM(tpd.monto_aplicado), 0)::bigint AS monto_pagado,
  GREATEST(pr.monto_total - COALESCE(SUM(tpd.monto_aplicado), 0), 0)::bigint AS monto_pendiente
FROM public.purchase_records pr
LEFT JOIN public.treasury_payment_documents tpd
  ON tpd.organization_id = pr.organization_id
  AND tpd.document_id = pr.id
  AND tpd.document_type = 'purchase_record'
WHERE pr.payment_status IN ('pending', 'partial')
GROUP BY
  pr.id,
  pr.organization_id,
  pr.rut_emisor,
  pr.razon_social_emisor,
  pr.tipo_documento,
  pr.folio,
  pr.fecha_docto,
  pr.periodo,
  pr.monto_total,
  pr.payment_status;

-- Cuentas por cobrar abiertas.
CREATE OR REPLACE VIEW public.v_cuentas_por_cobrar
WITH (security_invoker = true)
AS
SELECT
  sr.id,
  sr.organization_id,
  sr.rut_receptor,
  sr.razon_social_receptor,
  sr.tipo_documento,
  sr.folio,
  sr.fecha_docto,
  sr.periodo,
  sr.monto_total,
  sr.payment_status,
  COALESCE(SUM(tpd.monto_aplicado), 0)::bigint AS monto_cobrado,
  GREATEST(sr.monto_total - COALESCE(SUM(tpd.monto_aplicado), 0), 0)::bigint AS monto_pendiente
FROM public.sales_records sr
LEFT JOIN public.treasury_payment_documents tpd
  ON tpd.organization_id = sr.organization_id
  AND tpd.document_id = sr.id
  AND tpd.document_type = 'sales_record'
WHERE sr.payment_status IN ('pending', 'partial')
GROUP BY
  sr.id,
  sr.organization_id,
  sr.rut_receptor,
  sr.razon_social_receptor,
  sr.tipo_documento,
  sr.folio,
  sr.fecha_docto,
  sr.periodo,
  sr.monto_total,
  sr.payment_status;

GRANT SELECT ON public.v_cuentas_por_pagar TO authenticated;
GRANT SELECT ON public.v_cuentas_por_cobrar TO authenticated;

COMMENT ON VIEW public.v_cuentas_por_pagar IS
'Documentos de compra con saldo pendiente y monto pagado acumulado desde treasury_payment_documents.';

COMMENT ON VIEW public.v_cuentas_por_cobrar IS
'Documentos de venta con saldo pendiente y monto cobrado acumulado desde treasury_payment_documents.';
