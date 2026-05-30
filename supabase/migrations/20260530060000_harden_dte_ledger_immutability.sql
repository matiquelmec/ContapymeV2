-- 🚀 MIGRACIÓN HARDEN DTE LEDGER IMMUTABILITY (Contapymepuq)
-- DATE: 2026-05-30
-- DESCRIPTION: Agrega un trigger de inmutabilidad estricta a dte_issued para impedir modificaciones o eliminaciones de documentos tributarios ya firmados o enviados.

CREATE OR REPLACE FUNCTION public.fn_prevent_dte_alteration()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Bloquear eliminaciones físicas para documentos emitidos (no borradores)
  IF TG_OP = 'DELETE' THEN
    IF OLD.status <> 'draft' THEN
      RAISE EXCEPTION 'Inmutabilidad del Ledger: No se permite eliminar documentos tributarios en estado % (ID: %).', OLD.status, OLD.id;
    END IF;
    RETURN OLD;
  END IF;

  -- Para operaciones UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Si el estado antiguo ya no es borrador, prohibir cambios en columnas críticas
    IF OLD.status <> 'draft' THEN
      IF NEW.monto_total <> OLD.monto_total OR
         NEW.receptor_rut <> OLD.receptor_rut OR
         NEW.folio <> OLD.folio OR
         NEW.tipo_dte <> OLD.tipo_dte OR
         NEW.organization_id <> OLD.organization_id OR
         NEW.company_id <> OLD.company_id OR
         NEW.previous_hash <> OLD.previous_hash OR
         NEW.integrity_hash <> OLD.integrity_hash THEN
        RAISE EXCEPTION 'Inmutabilidad del Ledger: No se permite modificar los datos criticos de un documento tributario en estado % (ID: %).', OLD.status, OLD.id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_dte_alteration ON public.dte_issued;
CREATE TRIGGER trg_prevent_dte_alteration
  BEFORE UPDATE OR DELETE ON public.dte_issued
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_prevent_dte_alteration();

NOTIFY pgrst, 'reload schema';
