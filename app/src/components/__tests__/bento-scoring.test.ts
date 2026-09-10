import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { 
  newsRelevanceScoring, 
  ensureUniqueNewsImages, 
  type NewsArticle 
} from "../../lib/news/editorial-scoring.ts";

describe("Bento News Scoring & Deduplication Suite", () => {
  const mockArticles: NewsArticle[] = [
    {
      id: "news-1",
      title: "Actualidad general en Punta Arenas",
      slug: "actualidad-general",
      category: "Comunidad",
      summary: "Resumen comunidad",
      content: "Contenido",
      image_url: "https://example.com/img1.jpg",
      published_at: "2026-09-10T12:00:00Z",
      is_featured: false,
      source_name: "Prensa Austral",
      source_url: "https://example.com/1",
    },
    {
      id: "news-2",
      title: "Reforma tributaria y nuevas circulares SII",
      slug: "reforma-sii",
      category: "SII / Tributario",
      summary: "Resumen tributario",
      content: "Contenido",
      image_url: "https://example.com/img1.jpg",
      published_at: "2026-09-10T11:00:00Z",
      is_featured: false,
      source_name: "SII Magallanes",
      source_url: "https://example.com/2",
    },
    {
      id: "news-3",
      title: "Nueva planta de Hidrógeno Verde en Magallanes",
      slug: "hidrogeno-verde",
      category: "Economía & Energía",
      summary: "Resumen economia",
      content: "Contenido",
      image_url: "https://example.com/img2.jpg",
      published_at: "2026-09-09T10:00:00Z",
      is_featured: true,
      source_name: "Magallanes Hoy",
      source_url: "https://example.com/3",
    }
  ];

  test("1. newsRelevanceScoring prioriza artículos destacados y de alta relevancia económica/tributaria", () => {
    const { hero, secondary } = newsRelevanceScoring(mockArticles);
    assert.ok(hero, "Debe haber una noticia hero");
    assert.equal(hero.id, "news-3", "La noticia con is_featured debe ser la Hero principal");
    assert.equal(secondary.length, 2);
  });

  test("2. ensureUniqueNewsImages evita duplicación de imágenes entre hero y flujo secundario", () => {
    const { hero, secondary } = newsRelevanceScoring(mockArticles);
    const sanitized = ensureUniqueNewsImages(hero, secondary);

    const usedImages = new Set<string>();
    if (sanitized.hero?.image_url) {
      usedImages.add(sanitized.hero.image_url);
    }

    for (const item of sanitized.secondary) {
      assert.ok(!usedImages.has(item.image_url), `La imagen ${item.image_url} no debe estar duplicada`);
      usedImages.add(item.image_url);
    }
  });
});
