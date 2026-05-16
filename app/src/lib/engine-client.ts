import { createClient } from "@/lib/supabase/server";

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL || "http://localhost:8000";

/**
 * Cliente de red para el Motor Python (Engine).
 * Inyecta automáticamente el JWT de Supabase en todas las peticiones
 * para cumplir con el protocolo de seguridad mutua.
 */
export const engineFetch = async (path: string, options: any = {}) => {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  const jwt = session?.access_token;
  
  const headers = new Headers(options.headers || {});
  
  if (jwt) {
    headers.set("Authorization", `Bearer ${jwt}`);
  }

  // Si el body es un objeto, lo convertimos a JSON automáticamente
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    options.body = JSON.stringify(options.body);
  }

  // Permite que el navegador establezca el boundary automáticamente para FormData
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${ENGINE_URL}${path}`, {
    ...options,
    headers,
  });

  return response;
};
