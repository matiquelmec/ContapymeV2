import { createAdminClient } from "../supabase/admin.ts";

/**
 * Normaliza un slug eliminando números y caracteres no alfanuméricos
 */
export function normalizeSlugTokens(slug: string): string[] {
  return (slug || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split("-")
    .map((w) => w.trim())
    .filter((w) => w.length >= 4 && !/^\d+$/.test(w));
}

/**
 * Corrige patrones conocidos de slugs deformados donde se perdieron vocales con acento:
 * 'martima' -> 'maritima', 'comisin' -> 'comision', 'hormign' -> 'hormigon', etc.
 */
export function repairCorruptedSlugPattern(slug: string): string {
  return slug
    .replace(/martima/g, "maritima")
    .replace(/comit/g, "comite")
    .replace(/pblicoprivado/g, "publicoprivado")
    .replace(/hormign/g, "hormigon")
    .replace(/comisin/g, "comision")
    .replace(/votacin/g, "votacion")
    .replace(/reconstruccin/g, "reconstruccion")
    .replace(/legislacin/g, "legislacion")
    .replace(/reactivacin/g, "reactivacion")
    .replace(/inversin/g, "inversion")
    .replace(/educacin/g, "educacion")
    .replace(/regin/g, "region")
    .replace(/produccin/g, "produccion")
    .replace(/administracin/g, "administracion");
}

/**
 * Busca si existe una noticia activa alternativa para un slug que devuelve 404
 * para realizar una redirección 301 permanente en vez de perder el rastreo de Googlebot.
 */
export async function resolveAlternativeNewsSlug(corruptedSlug: string): Promise<string | null> {
  if (!corruptedSlug) return null;

  const repairedSlug = repairCorruptedSlugPattern(corruptedSlug);
  const supabase = createAdminClient();

  // 1. Intento directo con el slug reparado
  if (repairedSlug !== corruptedSlug) {
    const { data: exactRepaired } = await supabase
      .from("regional_news")
      .select("slug")
      .eq("slug", repairedSlug)
      .maybeSingle();

    if (exactRepaired?.slug) {
      return exactRepaired.slug;
    }
  }

  // 2. Búsqueda difusa por palabras clave principales del slug
  const tokens = normalizeSlugTokens(corruptedSlug);
  if (tokens.length >= 2) {
    const primaryToken = tokens[0];
    const secondaryToken = tokens[1];

    const { data: candidates } = await supabase
      .from("regional_news")
      .select("slug, title")
      .or(`slug.ilike.%${primaryToken}%,slug.ilike.%${secondaryToken}%`)
      .limit(10);

    if (candidates && candidates.length > 0) {
      // Encontrar el candidato con mayor coincidencia de tokens
      let bestMatch: { slug: string; score: number } | null = null;

      for (const candidate of candidates) {
        const candidateTokens = new Set(normalizeSlugTokens(candidate.slug));
        let matchCount = 0;
        for (const token of tokens) {
          if (candidateTokens.has(token)) {
            matchCount++;
          }
        }

        if (!bestMatch || matchCount > bestMatch.score) {
          bestMatch = { slug: candidate.slug, score: matchCount };
        }
      }

      // Si coincide al menos 2 palabras clave, redirigir
      if (bestMatch && bestMatch.score >= 2) {
        return bestMatch.slug;
      }
    }
  }

  return null;
}
