"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================
// PROFILE ACTIONS
// ============================================

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    // Si no existe el perfil (PGRST116), podemos ignorar sin lanzar un error.
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching profile:", JSON.stringify(error));
    return null;
  }
  return data;
}

export async function updateProfile(formData: { full_name: string, avatar_url?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  const { error } = await supabase
    .from("profiles")
    .upsert({ 
      id: user.id,
      full_name: formData.full_name,
      avatar_url: formData.avatar_url,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ============================================
// ORGANIZATION ACTIONS
// ============================================

export async function getOrganizationDetails(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  if (error) {
    console.error("Error fetching organization:", error);
    return null;
  }
  return data;
}

export async function updateOrganization(orgId: string, formData: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  // Verificar si es owner o admin
  const { data: memberCheck } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .single();

  if (!memberCheck || (memberCheck.role !== 'owner' && memberCheck.role !== 'admin')) {
    return { success: false, error: "Permisos insuficientes para editar la organización" };
  }

  const { error } = await supabase
    .from("organizations")
    .update({
      nombre: formData.nombre,
      rut_empresa: formData.rut_empresa,
      giro: formData.giro,
      direccion: formData.direccion,
      comuna: formData.comuna,
      region: formData.region,
      email: formData.email,
      telefono: formData.telefono,
      updated_at: new Date().toISOString()
    })
    .eq("id", orgId);

  if (error) {
    console.error("Error updating organization:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ============================================
// TEAM / MEMBERS ACTIONS
// ============================================

export async function getOrganizationMembers(orgId: string) {
  const supabase = await createClient();
  
  // Paso 1: Obtenemos los miembros
  const { data: members, error: membersError } = await supabase
    .from("organization_members")
    .select("id, role, created_at, user_id")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });

  if (membersError) {
    console.error("Error fetching members:", JSON.stringify(membersError));
    return [];
  }

  if (!members || members.length === 0) return [];

  // Paso 2: Obtenemos los perfiles de esos miembros
  const userIds = members.map(m => m.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", userIds);

  if (profilesError) {
    console.error("Error fetching profiles for members:", JSON.stringify(profilesError));
    // Continuamos, mapearemos a nulo
  }

  // Paso 3: Combinar (JOIN manual)
  const merged = members.map(m => {
    const p = (profiles || []).find(profile => profile.id === m.user_id);
    return {
      ...m,
      profiles: p || { id: m.user_id, full_name: null, avatar_url: null }
    };
  });

  return merged;
}
