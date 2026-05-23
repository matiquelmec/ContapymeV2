-- ============================================================
-- 🛡️ SINCRONIZACIÓN AUTOMÁTICA: CONTRATOS ──► FICHA EMPLEADO
-- Fecha: 2026-05-23
-- Objetivo: Garantizar que el sueldo base y el tipo de contrato se
--          mantengan alineados en la ficha del empleado al activarse.
-- ============================================================

-- 1. Crear función trigger PL/pgSQL
CREATE OR REPLACE FUNCTION public.fn_sync_contract_to_employee()
RETURNS trigger AS $$
BEGIN
    -- Solo sincroniza si el contrato cambia a estado 'activo'
    IF NEW.status = 'activo' THEN
        UPDATE public.employees
        SET sueldo_base = NEW.sueldo_base,
            tipo_contrato = NEW.tipo_contrato::text::contract_type, -- Conversión al enum de Postgres
            cargo = NEW.cargo
        WHERE id = NEW.employee_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear Trigger
DROP TRIGGER IF EXISTS trg_sync_contract_to_employee ON public.employment_contracts;
CREATE TRIGGER trg_sync_contract_to_employee
AFTER INSERT OR UPDATE ON public.employment_contracts
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_contract_to_employee();
