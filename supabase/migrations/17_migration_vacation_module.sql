-- ============================================================
-- 🏛️ MIGRACIÓN 17: Módulo de Gestión de Vacaciones
-- Objetivo: Registro, aprobación e integridad de solicitudes
-- ============================================================

-- 1. Crear tabla de Solicitudes de Vacaciones
CREATE TABLE IF NOT EXISTS public.vacation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL CHECK (fecha_fin >= fecha_inicio),
  dias_solicitados NUMERIC(6,2) NOT NULL CHECK (dias_solicitados > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  comentarios TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS y políticas en vacation_requests
ALTER TABLE public.vacation_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vacation_requests_all ON public.vacation_requests;
CREATE POLICY vacation_requests_all ON public.vacation_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = vacation_requests.organization_id
        AND om.user_id = auth.uid()
    )
  );

-- 2. Crear tabla Historial de Cuenta de Vacaciones (Ledger)
CREATE TABLE IF NOT EXISTS public.vacation_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo TEXT NOT NULL CHECK (tipo IN ('accrual', 'usage', 'adjustment')),
  dias NUMERIC(6,2) NOT NULL, -- Positivo para acumulados (accrual), Negativo para tomados (usage)
  request_id UUID REFERENCES public.vacation_requests(id) ON DELETE SET NULL,
  comentarios TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.vacation_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vacation_ledger_all ON public.vacation_ledger;
CREATE POLICY vacation_ledger_all ON public.vacation_ledger FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = vacation_ledger.organization_id
        AND om.user_id = auth.uid()
    )
  );

-- 3. Trigger protector: Al aprobar una solicitud, validar si hay saldo suficiente de días
CREATE OR REPLACE FUNCTION public.fn_validate_and_book_vacation()
RETURNS TRIGGER AS $$
DECLARE
  v_dias_disponibles NUMERIC(6,2);
BEGIN
  -- Solo actuar cuando pasa a 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Calcular días acumulados netos desde el Ledger
    SELECT COALESCE(SUM(dias), 0) INTO v_dias_disponibles
    FROM public.vacation_ledger
    WHERE employee_id = NEW.employee_id;

    -- Validar si el saldo cubre la solicitud
    IF v_dias_disponibles < NEW.dias_solicitados THEN
      RAISE EXCEPTION 'El empleado no posee suficientes dias de vacaciones. Disponibles: %, Solicitados: %', 
        v_dias_disponibles, NEW.dias_solicitados;
    END IF;

    -- Registrar el uso en el ledger automáticamente
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

  -- Manejo de reversión si una solicitud aprobada se cancela
  IF OLD.status = 'approved' AND NEW.status = 'cancelled' THEN
    -- Eliminar registro de uso en el ledger
    DELETE FROM public.vacation_ledger 
    WHERE request_id = NEW.id AND tipo = 'usage';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_and_book_vacation ON public.vacation_requests;
CREATE TRIGGER trg_validate_and_book_vacation
  BEFORE UPDATE ON public.vacation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_validate_and_book_vacation();

-- Notificar recarga de esquemas
NOTIFY pgrst, 'reload schema';
