-- 🚀 MIGRACIÓN HARDEN CERTIFIED REPORTS IMMUTABILITY (Contapymepuq)
-- DATE: 2026-06-06
-- DESCRIPTION: Agrega un trigger de inmutabilidad estricta a certified_reports para impedir modificaciones o eliminaciones de reportes financieros certificados.

CREATE OR REPLACE FUNCTION public.fn_prevent_certified_reports_alteration()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Bloquear eliminaciones físicas
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Inmutabilidad del Ledger: No se permite eliminar reportes financieros certificados (ID: %).', OLD.id;
    RETURN OLD;
  END IF;

  -- Para operaciones UPDATE, prohibir cambios en columnas críticas
  IF TG_OP = 'UPDATE' THEN
    IF NEW.integrity_hash <> OLD.integrity_hash OR
       NEW.file_path <> OLD.file_path OR
       NEW.organization_id <> OLD.organization_id OR
       NEW.report_type <> OLD.report_type OR
       NEW.period_start <> OLD.period_start OR
       NEW.period_end <> OLD.period_end THEN
      RAISE EXCEPTION 'Inmutabilidad del Ledger: No se permite modificar los datos criticos de un reporte financiero certificado (ID: %).', OLD.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_certified_reports_alteration ON public.certified_reports;
CREATE TRIGGER trg_prevent_certified_reports_alteration
  BEFORE UPDATE OR DELETE ON public.certified_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_prevent_certified_reports_alteration();

NOTIFY pgrst, 'reload schema';
