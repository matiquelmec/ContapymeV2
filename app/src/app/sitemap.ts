import { MetadataRoute } from "next";
import { getRegionalNews } from "@/actions/news";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.contapymepuq.cl";

  const newsRes = await getRegionalNews();
  const newsList = newsRes.success ? newsRes.data : [];

  // Filtrar artículos que tengan contenido sustancial para evitar enviar thin content
  const newsUrls = newsList
    .filter((news) => (news.content || news.summary || '').length >= 100)
    .map((news) => ({
      url: `${baseUrl}/noticias/${news.slug}`,
      lastModified: new Date(news.updated_at || news.published_at || Date.now()),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "always" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/empleos`,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 0.95,
    },
    {
      url: `${baseUrl}/publicar-empleo`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/crear-empresa`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/nosotros`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/calculadora`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/software`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/precios`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/noticias`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacidad`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terminos`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
  ];

  return [...staticPages, ...newsUrls];
}
