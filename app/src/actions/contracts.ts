"use server";

import { createClient } from "@/lib/supabase/server";

export async function getContractsList(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employment_contracts")
    .select("*, employees(nombres, apellido_paterno, activo)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("error getContractsList:", error);
    return [];
  }
  return data;
}

export async function getActiveEmployees(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, nombres, apellido_paterno, rut, cargo")
    .eq("organization_id", organizationId)
    .eq("activo", true);
  
  if (error) return [];
  return data;
}
