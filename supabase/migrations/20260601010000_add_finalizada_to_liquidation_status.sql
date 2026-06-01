-- ============================================================
-- MIGRACIÓN: 20260601010000 — Agregar valores al enum liquidation_status
-- Propósito: Prevenir error 22P02 al procesar o finalizar liquidaciones.
-- ============================================================

DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'liquidation_status') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'liquidation_status' AND e.enumlabel = 'finalizada') THEN
            ALTER TYPE liquidation_status ADD VALUE 'finalizada';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'liquidation_status' AND e.enumlabel = 'pagada') THEN
            ALTER TYPE liquidation_status ADD VALUE 'pagada';
        END IF;
    END IF;
END $$;
