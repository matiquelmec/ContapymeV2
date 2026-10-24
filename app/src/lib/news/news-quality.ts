import { z } from 'zod';

/**
 * Decodifica entidades HTML tanto nombradas como numéricas (&amp;, &#124;, &#8211;, etc.)
 */
export function decodeHTMLEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '...')
    .replace(/&middot;/g, '·')
    .replace(/&bull;/g, '•')
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(parseInt(dec, 10));
      } catch {
        return '';
      }
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return '';
      }
    });
}

/**
 * Limpia tags HTML, scripts, estilos y normaliza espacios en blanco
 */
export function cleanHTML(html: string): string {
  if (!html) return '';
  let cleaned = html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<a[^>]*href=["'][^"']*news\.google\.com[^"']*["'][^>]*>[\s\S]*?<\/a>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  cleaned = decodeHTMLEntities(cleaned);
  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Normaliza títulos para comparaciones semánticas libres de acentos y caracteres raros
 */
export function normalizeTitle(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Truncado inteligente a nivel de palabra completa para resúmenes editoriales.
 * Garantiza que nunca se corte una palabra por la mitad ni se dejen caracteres mutilados.
 */
export function createCleanSummary(text: string, maxLen = 260): string {
  if (!text) return '';
  const clean = cleanHTML(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) {
    return clean.endsWith('.') ? clean : `${clean}.`;
  }
  const cut = clean.substring(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  const wordClean = lastSpace > 0 ? cut.substring(0, lastSpace) : cut;
  const stripped = wordClean.replace(/[,;:\-\s]+$/, '').replace(/\.{2,}$/, '').trim();
  return `${stripped}...`;
}

/**
 * Filtro estricto de nicho temático: exige relevancia en economía, negocios,
 * marco laboral, tributario o desarrollo regional de Magallanes.
 * Rechaza de forma taxativa deportes, crónica roja/policial cotidiana y sucesos domésticos.
 */
export function isNicheRelevant(title: string, description: string): boolean {
  const normTitle = normalizeTitle(title);
  const normDesc = normalizeTitle(description).substring(0, 800);
  const text = `${normTitle} ${normDesc}`;

  // 1. Rechazo taxativo de deportes, crónica roja cotidiana y anécdotas barriales
  const forbiddenPatterns = [
    /\b(basquetbol|básquetbol|futbol|fútbol|baloncesto|padel|pádel|ciclismo|maraton|maratón|voley|rugby)\b/i,
    /\b(campeonato|torneo|semifinal|semifinales|gimnasio del espanol|gimnasio del español|maxibasquetbol|maxibásquetbol)\b/i,
    /\b(tiktoker preso|chofer sorprendido|quebrantamiento de condena|rotura de matriz)\b/i,
    /\b(necrologicas|necrológicas|funeraria|fallecimiento|sepelio|inmemorian)\b/i,
    /\b(club hipico en los anos setenta|club hípico en los años setenta)\b/i
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) {
      return false;
    }
  }

  // 2. Requerir explícitamente palabras clave del ecosistema Contapymepuq
  const relevantKeywords = [
    'magallanes', 'punta arenas', 'natales', 'porvenir', 'williams', 'tierra del fuego', 'antartica', 'antártica',
    'sii', 'ipc', 'dolar', 'dólar', 'hacienda', 'economia', 'economía', 'presupuesto', 'gore', 'enap',
    'h2v', 'hidrogeno', 'hidrógeno', 'puerto', 'empleo', 'trabajo', 'laboral', 'empresa', 'comercio',
    'turismo', 'inversion', 'inversión', 'sercotec', 'corfo', 'banco central', 'fisco', 'tributario',
    'ley 40 horas', 'previred', 'pib', 'zona franca', 'asmar', 'metanex'
  ];

  return relevantKeywords.some(kw => text.includes(kw));
}

/**
 * Esquema de validación runtime Zod para inserción de noticias regionales.
 */
export const RegionalNewsInsertSchema = z.object({
  title: z.string().min(10, 'Título demasiado corto'),
  slug: z.string().min(3),
  category: z.string().min(2),
  content: z.string().min(350, 'El contenido debe tener al menos 350 caracteres para ser sustantivo'),
  summary: z.string().min(40, 'El resumen debe tener al menos 40 caracteres').max(350),
  image_url: z.string().url(),
  source_url: z.string().url(),
  source_name: z.string().min(2),
  normalized_title: z.string().min(5),
  published_at: z.string(),
  is_featured: z.boolean()
});

export type RegionalNewsInsert = z.infer<typeof RegionalNewsInsertSchema>;
