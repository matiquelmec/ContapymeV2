-- ============================================================
-- MIGRACION 21: Saldo legal de vacaciones Magallanes
-- Objetivo: calcular cupo proporcional con base 20 dias habiles
-- anuales, usando fecha_ingreso y movimientos de uso/ajuste.
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_employee_vacation_balance(p_employee_id uuid)
RETURNS numeric AS $$
DECLARE
  v_fecha_ingreso date;
  v_legal_accrued numeric(10,2);
  v_ledger_balance numeric(10,2);
BEGIN
  SELECT fecha_ingreso INTO v_fecha_ingreso
  FROM public.employees
  WHERE id = p_employee_id;

  IF v_fecha_ingreso IS NULL OR v_fecha_ingreso > CURRENT_DATE THEN
    v_legal_accrued := 0;
  ELSE
    v_legal_accrued := ROUND((((CURRENT_DATE - v_fecha_ingreso)::numeric * 20) / 365.25), 2);
  END IF;

  SELECT COALESCE(SUM(dias), 0) INTO v_ledger_balance
  FROM public.vacation_ledger
  WHERE employee_id = p_employee_id
    AND tipo IN ('usage', 'adjustment');

  RETURN COALESCE(v_legal_accrued, 0) + COALESCE(v_ledger_balance, 0);
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.fn_validate_and_book_vacation()
RETURNS TRIGGER AS $$
DECLARE
  v_dias_disponibles NUMERIC(10,2);
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    SELECT public.fn_employee_vacation_balance(NEW.employee_id)
    INTO v_dias_disponibles;

    IF v_dias_disponibles < NEW.dias_solicitados THEN
      RAISE EXCEPTION 'El empleado no posee suficientes dias de vacaciones. Disponibles: %, Solicitados: %',
        v_dias_disponibles, NEW.dias_solicitados;
    END IF;

    INSERT INTO public.vacation_ledger (organization_id, employee_id, fecha, tipo, dias, request_id, comentarios)
    VALUES (
      NEW.organization_id,
      NEW.employee_id,
      NEW.fecha_inicio,
      'usage',
      -NEW.dias_solicitados,
      NEW.id,
      'Vacaciones aprobadas desde ' || NEW.fecha_inicio || ' hasta ' || NEW.fecha_fin
    );
  END IF;

  IF OLD.status = 'approved' AND NEW.status = 'cancelled' THEN
    DELETE FROM public.vacation_ledger
    WHERE request_id = NEW.id AND tipo = 'usage';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.fn_employee_vacation_balance(uuid)
IS 'Calcula saldo legal proporcional de vacaciones con base Magallanes: 20 dias habiles anuales desde fecha_ingreso, menos usos y ajustes.';

NOTIFY pgrst, 'reload schema';
