-- 🚀 MIGRACIÓN PAYROLL LOAN DEDUCTIONS (ContaPymePUQ v20.0)
-- DATE: 2026-09-04
-- DESCRIPTION: Soporte para amortización y descuentos de créditos sociales CCAF / Coopeuch / Seguros.

CREATE TABLE IF NOT EXISTS public.payroll_loan_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    tipo_credito TEXT NOT NULL DEFAULT 'Crédito CCAF',
    institucion TEXT NOT NULL DEFAULT 'Caja Los Andes',
    monto_cuota BIGINT NOT NULL CHECK (monto_cuota > 0),
    cuota_actual INTEGER NOT NULL DEFAULT 1 CHECK (cuota_actual > 0),
    num_cuotas INTEGER NOT NULL CHECK (num_cuotas >= cuota_actual),
    moneda TEXT NOT NULL DEFAULT 'CLP' CHECK (moneda IN ('CLP', 'UF')),
    dia_uf TEXT DEFAULT '',
    activo BOOLEAN NOT NULL DEFAULT true,
    comentario TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payroll_loan_employee ON public.payroll_loan_deductions (organization_id, employee_id, activo);

ALTER TABLE public.payroll_loan_deductions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'payroll_loan_deductions' AND policyname = 'loan_deductions_member_select'
    ) THEN
        CREATE POLICY "loan_deductions_member_select"
            ON public.payroll_loan_deductions
            FOR SELECT
            TO authenticated
            USING (private.is_org_member(organization_id));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'payroll_loan_deductions' AND policyname = 'loan_deductions_member_manage'
    ) THEN
        CREATE POLICY "loan_deductions_member_manage"
            ON public.payroll_loan_deductions
            FOR ALL
            TO authenticated
            USING (private.has_org_role(organization_id, ARRAY['owner', 'admin', 'accountant']));
    END IF;
END $$;
