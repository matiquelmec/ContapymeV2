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
 * Ventana máxima de frescura editorial (5 días en milisegundos).
 */
export const MAX_ARTICLE_AGE_DAYS = 5;
export const MAX_ARTICLE_AGE_MS = MAX_ARTICLE_AGE_DAYS * 24 * 60 * 60 * 1000;

/**
 * Extrae la fecha real incrustada en una URL periodística (/YYYY/MM/DD/, /YYYY-MM-DD/ o /YYYY/MM/).
 */
export function extractDateFromUrl(url?: string | null): { date: Date; precision: 'day' | 'month' } | null {
  if (!url) return null;
  // 1. Patrón día completo: /2026/04/09/ o /2026-04-09/
  const fullMatch = url.match(/[\/\-](202\d)[\/\-](0[1-9]|1[0-2])[\/\-](0[1-9]|[12]\d|3[01])(?:[\/\-]|\b)/);
  if (fullMatch) {
    const y = parseInt(fullMatch[1], 10);
    const m = parseInt(fullMatch[2], 10) - 1;
    const d = parseInt(fullMatch[3], 10);
    const dt = new Date(Date.UTC(y, m, d));
    if (!isNaN(dt.getTime())) {
      return { date: dt, precision: 'day' };
    }
  }
  // 2. Patrón mensual: /2026/04/
  const monthMatch = url.match(/\/(202\d)\/(0[1-9]|1[0-2])\//);
  if (monthMatch) {
    const y = parseInt(monthMatch[1], 10);
    const m = parseInt(monthMatch[2], 10) - 1;
    const dt = new Date(Date.UTC(y, m, 1));
    if (!isNaN(dt.getTime())) {
      return { date: dt, precision: 'month' };
    }
  }
  return null;
}

/**
 * Extrae la fecha de publicación desde metadatos HTML (<meta property="article:published_time">, JSON-LD datePublished, <time datetime>).
 */
export function extractDateFromHtmlMeta(html: string): Date | null {
  if (!html) return null;
  const sample = html.substring(0, 60000);
  const patterns = [
    /<meta[^>]+(?:property|name|itemprop)=["'](?:article:published_time|og:published_time|pubdate|publishdate|date|DC\.date\.issued|datePublished)["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["'](?:article:published_time|og:published_time|pubdate|publishdate|date|DC\.date\.issued|datePublished)["']/gi,
    /"datePublished"\s*:\s*"([^"]+)"/gi,
    /<time[^>]+datetime=["']([^"']+)["']/gi
  ];

  const dates: Date[] = [];
  for (const regex of patterns) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(sample)) !== null) {
      const rawVal = match[1]?.trim();
      if (rawVal) {
        const d = new Date(rawVal);
        if (!isNaN(d.getTime()) && d.getUTCFullYear() >= 2020) {
          dates.push(d);
        }
      }
    }
  }

  if (dates.length === 0) return null;
  // Retornar la fecha más antigua (conservadora) encontrada en los metadatos
  return new Date(Math.min(...dates.map(d => d.getTime())));
}

/**
 * Detecta si el texto de la noticia contiene hitos estacionales o referencias temporales
 * anacrónicas respecto a la fecha de referencia (ej. Operación Renta de abril en octubre).
 */
export function hasAnachronisticContent(title: string, content: string, referenceDate: Date = new Date()): { anachronistic: boolean; reason?: string } {
  const combined = normalizeTitle(`${title || ''} ${content || ''}`);
  const currentMonth = referenceDate.getUTCMonth() + 1; // 1-12
  const currentDay = referenceDate.getUTCDate();

  // 1. Operación Renta / Devolución Anticipada de Abril (solo válido en marzo, abril y mayo)
  if (![3, 4, 5].includes(currentMonth)) {
    if (
      combined.includes('operacion renta') ||
      combined.includes('devolucion anticipada') ||
      combined.includes('29 de abril')
    ) {
      return {
        anachronistic: true,
        reason: 'Hito fuera de temporada: Operación Renta / Devolución de abril fuera de ventana marzo-mayo'
      };
    }
  }

  // 2. Fiestas Patrias / Corrida de Garzones de Septiembre (solo válido en agosto, septiembre y hasta el 3 de octubre)
  if (![8, 9].includes(currentMonth) && !(currentMonth === 10 && currentDay <= 3)) {
    if (
      combined.includes('corrida de garzones') ||
      combined.includes('fiestas patrias') ||
      combined.includes('18 de septiembre')
    ) {
      return {
        anachronistic: true,
        reason: 'Hito fuera de temporada: Fiestas Patrias / Septiembre fuera de ventana'
      };
    }
  }

  // 3. Menciones explícitas de fechas pasadas (> 1 mes atrás en el mismo año)
  const monthNames: Record<number, string> = {
    1: 'enero', 2: 'febrero', 3: 'marzo', 4: 'abril',
    5: 'mayo', 6: 'junio', 7: 'julio', 8: 'agosto',
    9: 'septiembre', 10: 'octubre', 11: 'noviembre', 12: 'diciembre'
  };

  for (const [mNumStr, mName] of Object.entries(monthNames)) {
    const mNum = Number(mNumStr);
    if (mNum < currentMonth - 1) {
      const explicitPastDateRegex = new RegExp(`\\b(?:el|este|pasado|pagara el)\\s+\\d{1,2}\\s+de\\s+${mName}\\b`, 'i');
      if (explicitPastDateRegex.test(combined)) {
        return {
          anachronistic: true,
          reason: `Mención explícita de fecha pasada (${mName}) en mes ${currentMonth}`
        };
      }
    }
  }

  return { anachronistic: false };
}

/**
 * Resuelve y certifica la frescura temporal de una noticia aplicando el principio
 * "Oldest Date Wins" (la fecha más antigua entre RSS, URL y HTML meta prevalece).
 * Jamás hace fallback a Date.now().
 */
export function resolveAndValidateArticleFreshness(params: {
  title: string;
  content: string;
  pubDate?: string | Date | null;
  sourceUrl?: string | null;
  htmlMetaDate?: Date | null;
  now?: Date;
  maxAgeDays?: number;
}): { valid: boolean; effectiveDate: Date | null; reason?: string } {
  const now = params.now || new Date();
  const maxAgeMs = (params.maxAgeDays ?? MAX_ARTICLE_AGE_DAYS) * 24 * 60 * 60 * 1000;

  let rssDate: Date | null = null;
  if (params.pubDate) {
    const d = params.pubDate instanceof Date ? params.pubDate : new Date(params.pubDate);
    if (!isNaN(d.getTime())) {
      rssDate = d;
    }
  }

  const urlExtracted = extractDateFromUrl(params.sourceUrl);
  const candidates: Date[] = [];

  if (rssDate) candidates.push(rssDate);
  if (params.htmlMetaDate && !isNaN(params.htmlMetaDate.getTime())) {
    candidates.push(params.htmlMetaDate);
  }
  if (urlExtracted) {
    const isSameMonthAsNow =
      urlExtracted.precision === 'month' &&
      urlExtracted.date.getUTCFullYear() === now.getUTCFullYear() &&
      urlExtracted.date.getUTCMonth() === now.getUTCMonth();

    if (isSameMonthAsNow && (rssDate || params.htmlMetaDate)) {
      // Si la URL solo tiene /YYYY/MM/ del mes en curso, usar la precisión diaria de rssDate o htmlMetaDate
    } else {
      candidates.push(urlExtracted.date);
    }
  }

  if (candidates.length === 0) {
    return { valid: false, effectiveDate: null, reason: 'Sin fecha verificable (cero fallback a Date.now)' };
  }

  // Regla de Oro: Prevalece la fecha más antigua (conservadora) para derrotar re-indexaciones de Google News
  const effectiveDate = new Date(Math.min(...candidates.map(c => c.getTime())));
  const ageMs = now.getTime() - effectiveDate.getTime();

  if (ageMs > maxAgeMs) {
    return {
      valid: false,
      effectiveDate,
      reason: `Noticia obsoleta: ${Math.floor(ageMs / (24 * 60 * 60 * 1000))} días de antigüedad (máx ${params.maxAgeDays ?? MAX_ARTICLE_AGE_DAYS} días)`
    };
  }

  if (ageMs < -24 * 60 * 60 * 1000) {
    return {
      valid: false,
      effectiveDate,
      reason: 'Fecha en el futuro inválida (>24h)'
    };
  }

  const anachCheck = hasAnachronisticContent(params.title, params.content, now);
  if (anachCheck.anachronistic) {
    return {
      valid: false,
      effectiveDate,
      reason: anachCheck.reason
    };
  }

  return { valid: true, effectiveDate };
}

/**
 * Escudo en Tiempo de Lectura (Read-Time Shield):
 * Verifica que un registro ya almacenado en base de datos no sea un anacronismo
 * (ej: URL de meses pasados disfrazada con published_at reciente o contenido fuera de estación).
 */
export function isStoredArticleTimely(article: {
  title?: string | null;
  summary?: string | null;
  content?: string | null;
  source_url?: string | null;
  published_at?: string | null;
}): boolean {
  const pubDate = article.published_at ? new Date(article.published_at) : null;
  if (!pubDate || isNaN(pubDate.getTime())) return false;

  const urlExtracted = extractDateFromUrl(article.source_url);
  if (urlExtracted) {
    if (urlExtracted.precision === 'day') {
      const diffDays = (pubDate.getTime() - urlExtracted.date.getTime()) / (24 * 60 * 60 * 1000);
      if (diffDays > 10) return false;
    } else if (urlExtracted.precision === 'month') {
      const monthDiff =
        (pubDate.getUTCFullYear() - urlExtracted.date.getUTCFullYear()) * 12 +
        (pubDate.getUTCMonth() - urlExtracted.date.getUTCMonth());
      if (monthDiff > 1 || (monthDiff === 1 && pubDate.getUTCDate() > 5)) {
        return false;
      }
    }
  }

  const anach = hasAnachronisticContent(
    article.title || '',
    `${article.summary || ''} ${article.content || ''}`,
    pubDate
  );
  if (anach.anachronistic) return false;

  return true;
}

/**
 * Esquema de validación runtime Zod para inserción de noticias regionales.
 * Incluye validación temporal estricta (.superRefine) contra URLs antiguas y contenido anacrónico.
 */
export const RegionalNewsInsertSchema = z.object({
  title: z.string().min(10, 'Título demasiado corto'),
  slug: z.string().min(3),
  category: z.string().min(2),
  content: z.string().min(350, 'El contenido debe tener al menos 350 caracteres para ser sustantivo'),
  summary: z.string().min(40, 'El resumen debe tener al menos 40 caracteres').max(350),
  image_url: z.string().url(),
  source_url: z.string().min(1),
  source_name: z.string().min(2),
  normalized_title: z.string().min(5),
  published_at: z.string(),
  is_featured: z.boolean()
}).superRefine((data, ctx) => {
  const pubDate = new Date(data.published_at);
  if (isNaN(pubDate.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['published_at'],
      message: 'Fecha de publicación inválida'
    });
    return;
  }

  // Verificar congruencia entre source_url y published_at
  const urlExtracted = extractDateFromUrl(data.source_url);
  if (urlExtracted) {
    if (urlExtracted.precision === 'day') {
      const diffDays = (pubDate.getTime() - urlExtracted.date.getTime()) / (24 * 60 * 60 * 1000);
      if (diffDays > MAX_ARTICLE_AGE_DAYS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['source_url'],
          message: `La URL contiene una fecha antigua (${urlExtracted.date.toISOString().slice(0, 10)}) incompatible con published_at`
        });
      }
    } else if (urlExtracted.precision === 'month') {
      const monthDiff =
        (pubDate.getUTCFullYear() - urlExtracted.date.getUTCFullYear()) * 12 +
        (pubDate.getUTCMonth() - urlExtracted.date.getUTCMonth());
      if (monthDiff > 1 || (monthDiff === 1 && pubDate.getUTCDate() > 5)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['source_url'],
          message: `La URL pertenece a un mes pasado (${urlExtracted.date.toISOString().slice(0, 7)})`
        });
      }
    }
  }

  // Verificar contenido anacrónico respecto a published_at
  const anach = hasAnachronisticContent(data.title, `${data.summary} ${data.content}`, pubDate);
  if (anach.anachronistic) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['content'],
      message: anach.reason || 'Contenido anacrónico fuera de temporada'
    });
  }
});

export type RegionalNewsInsert = z.infer<typeof RegionalNewsInsertSchema>;
