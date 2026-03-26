"use server";

import { engineFetch } from "@/lib/engine-client";

export async function suggestAccountWithSovereignAI(data: {
  organization_id: string;
  description: string;
}) {
  try {
    const response = await engineFetch(`/api/v1/ai/suggest`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
        return { success: false, data: null };
    }
    
    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error("Error en Sovereign AI Suggest:", error);
    return { success: false, data: null };
  }
}
