-- Restricción para vincular audit_logs con public.organizations
ALTER TABLE public.audit_logs 
ADD CONSTRAINT fk_audit_logs_organization 
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) 
ON DELETE SET NULL;

-- Restricción para vincular audit_logs con auth.users
ALTER TABLE public.audit_logs 
ADD CONSTRAINT fk_audit_logs_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) 
ON DELETE SET NULL;
