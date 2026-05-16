/**
 * Utilidad institucional para parsear errores del backend (Pydantic/FastAPI)
 * y asegurar que siempre se devuelva un string legible para la UI.
 * Evita el crash "Objects are not valid as a React child".
 */
export function parseError(error: any): string {
  if (!error) return "Error desconocido";

  // 1. Si ya es un string, lo devolvemos tal cual
  if (typeof error === 'string') return error;

  // 2. Si es un array (Caso típico de Pydantic validation errors)
  if (Array.isArray(error)) {
    return error
      .map((e: any) => {
        if (typeof e === 'string') return e;
        const field = e.loc ? `[${e.loc.join('.')}] ` : "";
        const message = e.msg || JSON.stringify(e);
        return `${field}${message}`;
      })
      .join("; ");
  }

  // 3. Si es un objeto de error estándar de JS/Next.js
  if (error instanceof Error) return error.message;

  // 4. Si es un objeto JSON (Error detail de FastAPI u otro)
  if (typeof error === 'object') {
    if (error.detail) return parseError(error.detail); // Recursivo para manejar err.detail
    if (error.message) return error.message;
    if (error.msg) return error.msg;
    return JSON.stringify(error);
  }

  // 5. Fallback final
  return String(error);
}
