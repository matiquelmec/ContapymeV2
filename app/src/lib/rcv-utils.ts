/**
 * Utilidades compartidas para el módulo Registro de Compras y Ventas (RCV)
 */

export const clpFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export const formatCLP = (amount: number) => clpFormatter.format(amount);

export const formatPeriodo = (periodo: string) => {
  if (!periodo) return "";
  const [y, m] = periodo.split("-");
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  return `${months[parseInt(m) - 1]} ${y}`;
};

/**
 * Detecta el periodo tributario (YYYY-MM-01) a partir del nombre del archivo del SII
 */
export function extractPeriodFromFilename(filename: string): string | null {
  // 1. Priorizar el final del nombre del archivo (donde el SII suele poner el periodo)
  const siiPattern = /_(\d{4})_?(\d{2})\.csv$/i;
  const matchSii = filename.match(siiPattern);
  if (matchSii) return `${matchSii[1]}-${matchSii[2]}-01`;

  // 2. Buscar patrón YYYY_MM en cualquier parte
  const pattern1 = /_(\d{4})_(\d{2})/; 
  const match1 = filename.match(pattern1);
  if (match1) return `${match1[1]}-${match1[2]}-01`;
  
  // 3. Buscar patrón YYYYMM (compacto)
  const pattern2 = /[_ \-](\d{4})(\d{2})([_ \-\.]|$)/;
  const match2 = filename.match(pattern2);
  if (match2) {
    const year = parseInt(match2[1]);
    const month = parseInt(match2[2]);
    if (year >= 2020 && year < 2100 && month >= 1 && month <= 12) {
      return `${match2[1]}-${match2[2]}-01`;
    }
  }

  // 4. Búsqueda genérica
  const generic = /(\d{4})[-_]?(\d{2})/;
  const matchGen = filename.match(generic);
  if (matchGen) {
    const year = parseInt(matchGen[1]);
    const month = parseInt(matchGen[2]);
    if (year >= 2020 && year < 2100 && month >= 1 && month <= 12) {
      return `${matchGen[1]}-${matchGen[2]}-01`;
    }
  }

  return null;
}
