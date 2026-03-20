"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPayrollSettings(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_payroll_settings")
    .select("*")
    .eq("organization_id", organizationId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("error getPayrollSettings:", error);
    return null;
  }
  return data;
}

export async function savePayrollSettings(settings: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase
    .from("organization_payroll_settings")
    .upsert({
      ...settings,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error("error savePayrollSettings:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/payroll/settings");
  return { success: true, data };
}
