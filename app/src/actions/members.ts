"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { recordAuditAction } from "@/actions/audit";

export async function inviteMember(orgId: string, email: string, role: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  // 1. Validar que el invitador sea admin/owner
  const { data: memberCheck } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .single();

  if (!memberCheck || (memberCheck.role !== 'owner' && memberCheck.role !== 'admin')) {
    return { success: false, error: "Permisos insuficientes" };
  }

  // 2. Insertar invitación
  const { error } = await supabase
    .from("organization_invitations")
    .insert({
      organization_id: orgId,
      email: email.toLowerCase(),
      role: role,
      invited_by: user.id
    });

  if (error) {
    console.error("Error creating invitation:", error);
    return { success: false, error: error.message };
  }

  // 3. AUDIT LOG
  await recordAuditAction({
    action: "INVITE_MEMBER",
    entity_type: "MEMBER",
    entity_id: email,
    details: { email, role }
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function deleteInvitation(invitationId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_invitations")
    .delete()
    .eq("id", invitationId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function getPendingInvitations(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_invitations")
    .select("*")
    .eq("organization_id", orgId)
    .eq("status", "pending");

  if (error) return [];
  return data;
}
