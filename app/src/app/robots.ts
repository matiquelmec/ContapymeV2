import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/admin/", "/api/"],
    },
    sitemap: [
      "https://www.contapymepuq.cl/sitemap.xml",
      "https://www.contapymepuq.cl/sitemap-news.xml",
      "https://www.contapymepuq.cl/sitemap-jobs.xml",
    ],
  };
}
