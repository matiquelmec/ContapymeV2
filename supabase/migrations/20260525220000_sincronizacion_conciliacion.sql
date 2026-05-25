-- ============================================================
-- 🏛️ MIGRACIÓN DE CONCILIACIÓN: TRIGGERS DE SINCRONIZACIÓN DE ESTADO
-- Versión: 2.0 (State Synchronization)
-- Fecha: 25 de Mayo, 2026
-- ============================================================

-- 1. Agregar columna is_reconciled a la tabla journal_entry_lines
ALTER TABLE public.journal_entry_lines 
  ADD COLUMN IF NOT EXISTS is_reconciled boolean DEFAULT false NOT NULL;

-- 2. Asegurar que las líneas que ya tienen conciliación queden marcadas como is_reconciled = true
UPDATE public.journal_entry_lines jel
SET is_reconciled = true
FROM public.bank_reconciliations br
WHERE jel.id = br.journal_entry_line_id;

UPDATE public.bank_statement_lines bsl
SET is_reconciled = true
FROM public.bank_reconciliations br
WHERE bsl.id = br.bank_line_id;

-- 3. Crear función de trigger para mantener sincronizados los estados de is_reconciled
CREATE OR REPLACE FUNCTION public.sync_reconciliation_status()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Al insertar una conciliación, marcamos como conciliadas las líneas asociadas
    IF NEW.bank_line_id IS NOT NULL THEN
      UPDATE public.bank_statement_lines 
      SET is_reconciled = true 
      WHERE id = NEW.bank_line_id;
    END IF;

    UPDATE public.journal_entry_lines 
    SET is_reconciled = true 
    WHERE id = NEW.journal_entry_line_id;

  ELSIF TG_OP = 'DELETE' THEN
    -- Al eliminar una conciliación, marcamos como no conciliadas las líneas asociadas (si no participan en otra conciliación)
    IF OLD.bank_line_id IS NOT NULL THEN
      -- Verificar si la línea del banco está en alguna otra conciliación activa (debido a relación flexible N-a-M o 1-a-N)
      IF NOT EXISTS (
        SELECT 1 FROM public.bank_reconciliations 
        WHERE bank_line_id = OLD.bank_line_id AND id <> OLD.id
      ) THEN
        UPDATE public.bank_statement_lines 
        SET is_reconciled = false 
        WHERE id = OLD.bank_line_id;
      END IF;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.bank_reconciliations 
      WHERE journal_entry_line_id = OLD.journal_entry_line_id AND id <> OLD.id
    ) THEN
      UPDATE public.journal_entry_lines 
      SET is_reconciled = false 
      WHERE id = OLD.journal_entry_line_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear Trigger en la tabla bank_reconciliations
DROP TRIGGER IF EXISTS trg_sync_reconciliation_status ON public.bank_reconciliations;
CREATE TRIGGER trg_sync_reconciliation_status
AFTER INSERT OR DELETE
ON public.bank_reconciliations
FOR EACH ROW
EXECUTE FUNCTION public.sync_reconciliation_status();
