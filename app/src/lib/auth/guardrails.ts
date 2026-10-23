import { z } from "zod";

export type OrganizationRole = 'owner' | 'admin' | 'accountant' | 'member';

export interface AuthenticatedOrgUser {
  userId: string;
  email: string;
  organizationId: string;
  role: OrganizationRole;
}

export type GuardrailResult =
  | { success: true; data: AuthenticatedOrgUser }
  | { success: false; error: string; code: 'UNAUTHORIZED' | 'FORBIDDEN' };

/**
 * Cliente Supabase inyectable para facilitar pruebas unitarias o ejecución en Node.
 */
export interface SupabaseAuthContext {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string; email?: string } | null }; error: unknown }>;
  };
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col1: string, val1: string) => {
        eq: (col2: string, val2: string) => {
          single: () => Promise<{ data: { role: string; is_active: boolean } | null; error: unknown }>;
        };
      };
    };
  };
}

/**
 * Doble Cerrojo Anti-IDOR:
 * Valida que la solicitud provenga de un usuario autenticado y que además
 * sea miembro activo de la organización especificada con el rol necesario.
 */
export async function getSafeAuthenticatedOrgUserWithClient(
  client: SupabaseAuthContext,
  organizationId: string,
  allowedRoles: OrganizationRole[] = ['owner', 'admin', 'accountant', 'member']
): Promise<GuardrailResult> {
  try {
    if (!organizationId || typeof organizationId !== 'string') {
      return { success: false, error: "Identificador de organización inválido.", code: 'FORBIDDEN' };
    }

    const { data: { user }, error: authError } = await client.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Sesión no autenticada o expirada.", code: 'UNAUTHORIZED' };
    }

    const { data: member, error: memberError } = await client
      .from('organization_members')
      .select('role, is_active')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !member || !member.is_active) {
      return { success: false, error: "Acceso denegado: no eres miembro activo de esta empresa.", code: 'FORBIDDEN' };
    }

    if (!allowedRoles.includes(member.role as OrganizationRole)) {
      return { success: false, error: "Privilegios insuficientes para realizar esta operación.", code: 'FORBIDDEN' };
    }

    return {
      success: true,
      data: {
        userId: user.id,
        email: user.email || '',
        organizationId,
        role: member.role as OrganizationRole
      }
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Error de verificación de seguridad: ${errorMsg}`, code: 'FORBIDDEN' };
  }
}

/**
 * Versión estándar para Server Actions (instancia el cliente Next.js server en tiempo de ejecución).
 */
export async function getSafeAuthenticatedOrgUser(
  organizationId: string,
  allowedRoles: OrganizationRole[] = ['owner', 'admin', 'accountant', 'member']
): Promise<GuardrailResult> {
  const { createClient } = await import("../supabase/server.js");
  const supabase = await createClient();
  return getSafeAuthenticatedOrgUserWithClient(supabase as unknown as SupabaseAuthContext, organizationId, allowedRoles);
}

/**
 * Helper de validación de entradas con Zod.
 * Garantiza que ninguna entrada pase al backend sin cumplir el contrato de tipos en tiempo de ejecución.
 */
export function validateInput<T>(schema: z.ZodType<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const formattedError = result.error.issues
      .map(issue => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('; ');
    return { success: false, error: `Validación fallida: ${formattedError}` };
  }
  return { success: true, data: result.data };
}
