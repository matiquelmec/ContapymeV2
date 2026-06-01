-- ============================================================
-- MIGRACIÓN: 20260601030000 — Blindaje de Integridad Contable
-- Propósito: Garantizar la partida doble y evitar movimientos en cuentas consolidadoras.
-- ============================================================

-- 1. Restricción CHECK en chart_of_accounts para la naturaleza de la cuenta
ALTER TABLE public.chart_of_accounts
  DROP CONSTRAINT IF EXISTS check_account_nature;

ALTER TABLE public.chart_of_accounts
  ADD CONSTRAINT check_account_nature CHECK (naturaleza = ANY (ARRAY['deudora'::text, 'acreedora'::text]));

-- 2. Función y Trigger para evitar apuntes en cuentas consolidadoras o inactivas
CREATE OR REPLACE FUNCTION public.check_journal_entry_line_account()
RETURNS TRIGGER AS $$
DECLARE
    v_acepta_movimiento boolean;
    v_activo boolean;
    v_codigo text;
    v_nombre text;
BEGIN
    SELECT acepta_movimiento, activo, codigo, nombre
    INTO v_acepta_movimiento, v_activo, v_codigo, v_nombre
    FROM public.chart_of_accounts
    WHERE id = NEW.account_id;

    IF NOT v_acepta_movimiento THEN
        RAISE EXCEPTION 'No se pueden registrar movimientos en la cuenta consolidatoria [%] %.', v_codigo, v_nombre;
    END IF;

    IF NOT v_activo THEN
        RAISE EXCEPTION 'La cuenta contable [%] % se encuentra inactiva.', v_codigo, v_nombre;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_journal_entry_line_account ON public.journal_entry_lines;
CREATE TRIGGER trigger_check_journal_entry_line_account
BEFORE INSERT OR UPDATE ON public.journal_entry_lines
FOR EACH ROW
EXECUTE FUNCTION public.check_journal_entry_line_account();

-- 3. Función y CONSTRAINT TRIGGER diferido para la Partida Doble (Cuadratura de Asientos)
CREATE OR REPLACE FUNCTION public.check_journal_entry_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_debe_sum bigint;
    v_haber_sum bigint;
    v_glosa text;
    v_fecha date;
    v_entry_id uuid;
BEGIN
    -- Determinar el entry_id (soportando DELETE con OLD, INSERT/UPDATE con NEW)
    IF TG_OP = 'DELETE' THEN
        v_entry_id := OLD.entry_id;
    ELSE
        v_entry_id := NEW.entry_id;
    END IF;

    -- Obtener información básica del asiento para un mensaje de error claro
    SELECT glosa, fecha
    INTO v_glosa, v_fecha
    FROM public.journal_entries
    WHERE id = v_entry_id;

    -- Sumar Debe y Haber para el asiento correspondiente
    SELECT 
        COALESCE(SUM(monto) FILTER (WHERE tipo = 'debe'), 0),
        COALESCE(SUM(monto) FILTER (WHERE tipo = 'haber'), 0)
    INTO v_debe_sum, v_haber_sum
    FROM public.journal_entry_lines
    WHERE entry_id = v_entry_id;

    -- Validar balance
    IF v_debe_sum <> v_haber_sum THEN
        RAISE EXCEPTION 'Asiento contable descuadrado: % (Fecha: %). Total Debe: %, Total Haber: % (Diferencia: %)',
            v_glosa, v_fecha, v_debe_sum, v_haber_sum, ABS(v_debe_sum - v_haber_sum);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_journal_entry_balance ON public.journal_entry_lines;
CREATE CONSTRAINT TRIGGER trigger_check_journal_entry_balance
AFTER INSERT OR UPDATE OR DELETE ON public.journal_entry_lines
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION public.check_journal_entry_balance();
