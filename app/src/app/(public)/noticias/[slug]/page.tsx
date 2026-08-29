import { Metadata, ResolvingMetadata } from "next";

export const revalidate = 0 // Dinamismo para noticias individuales
import { getRegionalNews, getNewsBySlug } from "@/actions/news";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe } from "lucide-react";
import { NewsArticleContent } from "@/components/news-article-content";

interface Props {
  params: Promise<{ slug: string }>;
}

// 🌐 SEO & SOCIAL MEDIA PREVIEWS (2026 Standards & Google Discover)
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const newsRes = await getNewsBySlug(slug);
  const news = newsRes.success ? newsRes.data : null;

  if (!news) return { title: "Noticia no encontrada" };

  const excerpt = news.seo_description || news.summary || news.content.substring(0, 160) + "...";
  const canonicalUrl = `https://www.contapymepuq.cl/noticias/${slug}`;
  const keywordsList = news.seo_keywords 
    ? news.seo_keywords.split(',').map((k: string) => k.trim())
    : ['noticias magallanes', 'punta arenas', 'diario regional'];

  return {
    title: `${news.title} | Contapymepuq Diario Regional`,
    description: excerpt,
    keywords: keywordsList,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    openGraph: {
      title: news.title,
      description: excerpt,
      url: canonicalUrl,
      siteName: "Contapymepuq",
      locale: "es_CL",
      images: [
        {
          url: news.image_url || "/news-placeholder.png",
          width: 1200,
          height: 630,
          alt: news.title,
        }
      ],
      type: "article",
      publishedTime: news.published_at,
      modifiedTime: news.updated_at || news.published_at,
      section: news.category || "Regional",
    },
    twitter: {
      card: "summary_large_image",
      title: news.title,
      description: excerpt,
      images: [news.image_url || "/news-placeholder.png"],
    },
  };
}

export default async function NewsPage({ params }: Props) {
  const { slug } = await params;
  const newsRes = await getNewsBySlug(slug);
  const news = newsRes.success ? newsRes.data : null;

  if (!news) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: news.title,
    description: news.seo_description || news.summary || news.content.substring(0, 160),
    image: [
      news.image_url || "https://www.contapymepuq.cl/news-placeholder.png"
    ],
    datePublished: news.published_at,
    dateModified: news.updated_at || news.published_at,
    author: [{
      "@type": "Organization",
      name: "Equipo Editorial Contapymepuq",
      url: "https://www.contapymepuq.cl"
    }],
    publisher: {
      "@type": "NewsMediaOrganization",
      name: "Contapymepuq",
      url: "https://www.contapymepuq.cl",
      logo: {
        "@type": "ImageObject",
        url: "https://www.contapymepuq.cl/logo-contapyme.png"
      }
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.contapymepuq.cl/noticias/${slug}`
    },
    articleSection: news.category || "Regional",
    keywords: news.seo_keywords || "noticias magallanes, punta arenas",
    inLanguage: "es-CL",
    isAccessibleForFree: true,
    isPartOf: {
      "@type": ["CreativeWork", "Product"],
      name: "ContaPymePUQ Diario Regional",
      productID: "CAowzMLhCw:openaccess"
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".news-summary", "article p"]
    }
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Diario Regional Magallanes",
        item: "https://www.contapymepuq.cl/noticias"
      },
      {
        "@type": "ListItem",
        position: 2,
        name: news.category || "Regional",
        item: `https://www.contapymepuq.cl/noticias?cat=${encodeURIComponent(news.category || "Regional")}`
      },
      {
        "@type": "ListItem",
        position: 3,
        name: news.title,
        item: `https://www.contapymepuq.cl/noticias/${slug}`
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* 🤖 SCHEMA.ORG NEWSARTICLE & BREADCRUMBS (Google News, Discover & Voice AEO) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* 🧭 NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto h-20 flex items-center justify-between px-6 lg:px-12">
           <Link href="/" className="group flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Regresar al Portal
           </Link>
           <div className="flex items-center gap-4">
              <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Punta Arenas, CL</span>
              <Globe className="h-5 w-5 text-primary/40 animate-pulse" />
           </div>
        </div>
      </header>

      {/* 📜 CORE CONTENT (Single Source of Truth) */}
      <main className="container mx-auto px-6 lg:px-12 py-16 md:py-24">
        <NewsArticleContent news={news} />
      </main>

      {/* 🏁 INSTITUTIONAL FOOTER */}
      <footer className="py-20 bg-muted/5 border-t border-border/50">
         <div className="container mx-auto px-6 flex flex-col items-center gap-6">
            <Image 
               src="/logo-contapyme.png" 
               alt="Logo" 
               width={160} 
               height={40} 
               className="h-auto w-[140px] opacity-40 grayscale hover:grayscale-0 transition-all cursor-crosshair"
            />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/30">
              © 2026 ContaPyme V2 — Magallanes, Chile.
            </p>
         </div>
      </footer>
    </div>
  );
}
