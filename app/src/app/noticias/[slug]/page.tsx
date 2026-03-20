import { Metadata, ResolvingMetadata } from "next";
import { getRegionalNews } from "@/actions/news";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe } from "lucide-react";
import { NewsArticleContent } from "@/components/news-article-content";

interface Props {
  params: Promise<{ slug: string }>;
}

// 🌐 SEO & SOCIAL MEDIA PREVIEWS
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const newsRes = await getRegionalNews();
  const news = newsRes.success ? newsRes.data.find((n: any) => n.slug === slug) : null;

  if (!news) return { title: "Noticia no encontrada" };

  const excerpt = news.summary || news.content.substring(0, 160) + "...";

  return {
    title: `${news.title} | Diario Punta Arenas`,
    description: excerpt,
    openGraph: {
      title: news.title,
      description: excerpt,
      images: [news.image_url || "/news-placeholder.png"],
      type: "article",
      publishedTime: news.published_at,
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
  const newsRes = await getRegionalNews();
  const news = newsRes.success ? newsRes.data.find((n: any) => n.slug === slug) : null;

  if (!news) notFound();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
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
