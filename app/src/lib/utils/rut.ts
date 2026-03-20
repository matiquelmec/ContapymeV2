/**
 * Contapyme V2 - Validaciones de RUT Chileno
 * Utilidad transversal para el frontend (Next.js).
 */

export function cleanRUT(rut: string): string {
  if (!rut) return '';
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

export function validateRUT(rut: string): boolean {
  if (typeof rut !== 'string') return false;
  
  const cleaned = cleanRUT(rut);
  if (cleaned.length < 2) return false;

  const bodyStr = cleaned.slice(0, -1);
  const vdv = cleaned.slice(-1).toUpperCase();

  let body = parseInt(bodyStr, 10);
  if (isNaN(body)) return false;

  let sum = 0;
  let multiplier = 2;

  while (body > 0) {
    sum += (body % 10) * multiplier;
    body = Math.floor(body / 10);
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  let expectedVdv = remainder.toString();

  if (remainder === 11) {
    expectedVdv = '0';
  } else if (remainder === 10) {
    expectedVdv = 'K';
  }

  return expectedVdv === vdv;
}

export function formatRUT(rut: string): string {
  const cleaned = cleanRUT(rut);
  if (cleaned.length < 2) return cleaned;

  const bodyStr = cleaned.slice(0, -1);
  const vdv = cleaned.slice(-1);

  // Formatear el cuerpo con separador de miles
  const formattedBody = Number(bodyStr).toLocaleString('es-CL');
  return `${formattedBody}-${vdv}`;
}
