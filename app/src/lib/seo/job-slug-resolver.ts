import { createAdminClient } from "../supabase/admin"

/**
 * Normaliza y tokeniza un slug de empleo para búsqueda semántica/difusa.
 */
export function normalizeJobSlugTokens(slug: string): string[] {
  return (slug || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split('-')
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !/^[0-9a-f]{6,8}$/i.test(w) && !/^\d+$/.test(w))
}

/**
 * Extrae el prefijo base del slug removiendo sufijos hash hexadecimales típicos (de 6 a 8 chars).
 */
export function extractBaseJobSlugPrefix(slug: string): string {
  if (!slug) return ''
  return slug.replace(/-[0-9a-f]{6,8}$/i, '').trim()
}

/**
 * Busca si existe una oferta laboral activa equivalente para un slug histórico
 * que devuelva 404, permitiendo emitir una redirección 308 permanente.
 */
export async function resolveAlternativeJobSlug(corruptedSlug: string): Promise<string | null> {
  if (!corruptedSlug) return null

  const supabase = createAdminClient()
  const basePrefix = extractBaseJobSlugPrefix(corruptedSlug)

  // 1. Intento por prefijo base (misma vacante pero con sufijo hash actualizado)
  if (basePrefix && basePrefix.length >= 8) {
    const { data: prefixCandidates } = await supabase
      .from('job_postings')
      .select('slug, status')
      .eq('status', 'active')
      .ilike('slug', `${basePrefix}%`)
      .limit(5)

    if (prefixCandidates && prefixCandidates.length > 0) {
      return prefixCandidates[0].slug
    }
  }

  // 2. Búsqueda difusa por palabras clave principales
  const tokens = normalizeJobSlugTokens(corruptedSlug)
  if (tokens.length >= 2) {
    const primaryToken = tokens[0]
    const secondaryToken = tokens[1]

    const { data: candidates } = await supabase
      .from('job_postings')
      .select('slug, title, company_name, status')
      .eq('status', 'active')
      .or(`slug.ilike.%${primaryToken}%,slug.ilike.%${secondaryToken}%`)
      .limit(10)

    if (candidates && candidates.length > 0) {
      let bestMatch: { slug: string; score: number } | null = null

      for (const candidate of candidates) {
        const candidateTokens = new Set(normalizeJobSlugTokens(candidate.slug))
        let matchCount = 0
        for (const token of tokens) {
          if (candidateTokens.has(token)) {
            matchCount++
          }
        }

        if (!bestMatch || matchCount > bestMatch.score) {
          bestMatch = { slug: candidate.slug, score: matchCount }
        }
      }

      // Si coincide al menos con 2 palabras clave relevantes
      if (bestMatch && bestMatch.score >= 2) {
        return bestMatch.slug
      }
    }
  }

  return null
}
