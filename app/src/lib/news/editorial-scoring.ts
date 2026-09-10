export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  image_url: string;
  published_at: string;
  is_featured: boolean;
  source_name: string;
  source_url: string;
}

export function newsRelevanceScoring(news: NewsArticle[]): { hero: NewsArticle | null; secondary: NewsArticle[] } {
  if (news.length === 0) return { hero: null, secondary: [] };

  const sortedByDate = [...news].sort((a, b) => 
    new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  const recentPool = sortedByDate.slice(0, 10);
  const scoredRecent = recentPool.map(article => {
    let score = 0;
    const cat = article.category?.toUpperCase() || "";

    if (cat.includes("SII") || cat.includes("LEGAL")) score += 50;
    else if (cat.includes("FINANZAS")) score += 40;
    else if (cat.includes("ECONOMÍA")) score += 35;
    else if (cat.includes("INVERSIONES")) score += 30;
    else score += 10;

    if (article.is_featured) score += 100;

    return { article, score };
  });

  scoredRecent.sort((a, b) => b.score - a.score);
  const hero = scoredRecent[0]?.article || sortedByDate[0] || null;
  const secondary = sortedByDate.filter(n => !hero || n.id !== hero.id).slice(0, 8);

  return { hero, secondary };
}

export function generateNewsAnalysis(article: NewsArticle) {
  const category = article.category?.toUpperCase() || "";
  const title = article.title?.toUpperCase() || "";

  let impact = "Esta noticia o evento regional afecta de forma indirecta la planificación financiera y los costos operativos de las PYMEs locales en la Patagonia.";
  let advice = "Recomendamos evaluar el impacto presupuestario de este hecho económico y mantener el control de gastos a través de la conciliación automática.";

  if (category.includes("SII") || category.includes("LEGAL")) {
    impact = "Esta normativa legal o tributaria afecta directamente la estructura de costos operativos de las PYMEs en Magallanes. Las modificaciones en derechos laborales o regulaciones del SII exigen un ajuste inmediato en la planificación mensual de egresos para evitar contingencias y multas.";
    advice = "Recomendamos agendar una auditoría interna con tu contador para revisar los contratos de trabajo vigentes y la parametrización de haberes en tu software de remuneraciones. Asegúrate de registrar las modificaciones en el Libro de Remuneraciones Electrónico (LRE) antes del plazo legal.";
  } else if (category.includes("ECONOMÍA") || category.includes("FINANZAS") || category.includes("INVERSIONES")) {
    impact = "Los ajustes presupuestarios o movimientos macroeconómicos regionales influyen en el flujo de caja local y en el poder adquisitivo de los consumidores en Punta Arenas. Un recorte o redistribución de fondos públicos puede contraer la demanda en ciertos sectores de servicios y comercio.";
    advice = "Es aconsejable revisar y proyectar un escenario conservador de flujo de caja para los próximos 3 meses. Evita adquirir deudas a tasa variable y prioriza la optimización de gastos operativos fijos. Utiliza herramientas de conciliación automática para mantener un control exhaustivo del presupuesto diario.";
  }

  return { impact, advice };
}

const CLIENT_UNIQUE_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&fit=crop&q=80",
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1280&fit=crop&q=80",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1280&fit=crop&q=80",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1280&fit=crop&q=80",
  "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1280&fit=crop&q=80"
];

export function ensureUniqueNewsImages(hero: NewsArticle | null, secondary: NewsArticle[]): { hero: NewsArticle | null; secondary: NewsArticle[] } {
  const seenImages = new Set<string>();
  
  const cleanHero = hero ? { ...hero } : null;
  if (cleanHero && cleanHero.image_url) {
    seenImages.add(cleanHero.image_url);
  }

  const cleanSecondary = secondary.map((item, idx) => {
    let currentImg = item.image_url;
    
    if (!currentImg || seenImages.has(currentImg) || currentImg === "/news-placeholder.png") {
      const fallback = CLIENT_UNIQUE_FALLBACK_IMAGES.find(img => !seenImages.has(img)) 
        || CLIENT_UNIQUE_FALLBACK_IMAGES[idx % CLIENT_UNIQUE_FALLBACK_IMAGES.length];
      currentImg = fallback;
    }
    
    seenImages.add(currentImg);
    return { ...item, image_url: currentImg };
  });

  return { hero: cleanHero, secondary: cleanSecondary };
}
