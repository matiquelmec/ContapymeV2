-- ============================================================
-- 📄 MIGRACIÓN: Tipo de contrato "honorarios"
-- Objetivo: habilitar el régimen de honorarios en employees.tipo_contrato.
-- El motor lo trata sin cotizaciones legales y con retención de boletas.
-- ============================================================

-- ADD VALUE IF NOT EXISTS es idempotente (Postgres 12+). Se agrega el valor
-- sin usarlo en la misma transacción, por lo que es seguro en la migración.
ALTER TYPE contract_type ADD VALUE IF NOT EXISTS 'honorarios';
