import { MetadataRoute } from "next";
import { getRegionalNews } from "@/actions/news";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://contapymepuq.cl";

  const newsRes = await getRegionalNews();
  const newsList = newsRes.success ? newsRes.data : [];

  const newsUrls = newsList.map((news) => ({
    url: `${baseUrl}/noticias/${news.slug}`,
    lastModified: new Date(news.published_at || Date.now()),
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
