-- ============================================================
-- 🏥 MIGRACIÓN: Hardening RLS para medical_leaves
-- Objetivo: Homologar las políticas de seguridad de la tabla medical_leaves
-- con las políticas multi-tenant estandarizadas de fase 2.
-- ============================================================

ALTER TABLE public.medical_leaves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS medical_leaves_all ON public.medical_leaves;
DROP POLICY IF EXISTS tenant_member_select ON public.medical_leaves;
DROP POLICY IF EXISTS tenant_member_insert ON public.medical_leaves;
DROP POLICY IF EXISTS tenant_member_update ON public.medical_leaves;
DROP POLICY IF EXISTS tenant_member_delete ON public.medical_leaves;

-- Crear políticas estándar usando la función optimizada de membresía
CREATE POLICY tenant_member_select ON public.medical_leaves 
  FOR SELECT TO authenticated 
  USING (private.is_org_member(organization_id));

CREATE POLICY tenant_member_insert ON public.medical_leaves 
  FOR INSERT TO authenticated 
  WITH CHECK (private.is_org_member(organization_id));

CREATE POLICY tenant_member_update ON public.medical_leaves 
  FOR UPDATE TO authenticated 
  USING (private.is_org_member(organization_id)) 
  WITH CHECK (private.is_org_member(organization_id));

CREATE POLICY tenant_member_delete ON public.medical_leaves 
  FOR DELETE TO authenticated 
  USING (private.is_org_member(organization_id));

NOTIFY pgrst, 'reload schema';
