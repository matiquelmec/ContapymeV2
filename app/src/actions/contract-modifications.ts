"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ModificationType = 'salary_change' | 'hours_change' | 'position_change' | 'contract_type_change' | 'other';

export interface ContractModification {
  id?: string;
  organization_id: string;
  employee_id: string;
  effective_date: string;
  modification_type: ModificationType;
  changes: Record<string, any>;
  old_values: Record<string, any>;
  reason?: string;
  document_reference_id?: string;
  created_at?: string;
}

export async function getEmployeeModifications(employeeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contract_modifications")
    .select("*")
    .eq("employee_id", employeeId)
    .order("effective_date", { ascending: false });

  if (error) {
    console.error("Error getEmployeeModifications:", error);
    return [];
  }
  return data as ContractModification[];
}

export async function createContractModification(mod: ContractModification) {
  const supabase = await createClient();
  
  // 1. Get current values for audit (Snapshot)
  const { data: emp, error: empErr } = await supabase
    .from("employees")
    .select("*")
    .eq("id", mod.employee_id)
    .single();

  if (empErr) throw new Error("Empleado no encontrado");

  const old_values: Record<string, any> = {};
  Object.keys(mod.changes).forEach(key => {
    old_values[key] = emp[key];
  });

  // 2. Insert modification
  const { data, error } = await supabase
    .from("contract_modifications")
    .insert({
      ...mod,
      old_values
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating modification:", error);
    return { success: false, error: error.message };
  }

  // 3. Proactively update the employee table if the effective date is today or past
  // (This keeps the main table as a "current snapshot" for quick queries)
  const today = new Date().toISOString().split('T')[0];
  if (mod.effective_date <= today) {
    await supabase
      .from("employees")
      .update(mod.changes)
      .eq("id", mod.employee_id);
  }

  revalidatePath("/dashboard/payroll/contracts");
  return { success: true, data };
}

export async function deleteModification(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("contract_modifications")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  
  revalidatePath("/dashboard/payroll/contracts");
  return { success: true };
}
