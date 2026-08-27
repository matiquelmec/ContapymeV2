import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/"],
    },
    sitemap: [
      "https://contapymepuq.cl/sitemap.xml",
      "https://contapymepuq.cl/sitemap-news.xml",
      "https://contapymepuq.cl/sitemap-jobs.xml"
    ],
  };
}
