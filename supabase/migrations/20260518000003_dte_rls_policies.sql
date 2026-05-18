-- Añadir políticas RLS faltantes para las tablas del módulo DTE
-- Sin estas políticas, la inserción y actualización es denegada por defecto (Violates row-level security policy)

CREATE POLICY "dte_companies_isolation" ON public.dte_companies 
    FOR ALL
    USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE POLICY "dte_caf_folios_isolation" ON public.dte_caf_folios 
    FOR ALL
    USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));
