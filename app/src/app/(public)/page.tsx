import { Metadata } from "next";
import { getLatestIndicators } from "@/actions/indicators";
import { getRegionalNews } from "@/actions/news";
import { DiarioRegionalSection } from "@/components/diario-regional-section";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Contapymepuq — Diario Regional & ERP Contable en Punta Arenas, Magallanes",
  description: "Portal líder de noticias regionales de Magallanes, indicadores económicos en tiempo real (UF, UTM, Dólar) y software contable profesional para PYMEs.",
  keywords: [
    "noticias magallanes",
    "punta arenas",
    "puerto natales",
    "diario regional",
    "indicadores economicos chile",
    "software contable magallanes",
    "calculadora de sueldos chile",
    "contabilidad pyme punta arenas",
  ],
  alternates: {
    canonical: "https://www.contapymepuq.cl",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
  openGraph: {
    title: "Contapymepuq — Diario Regional & Plataforma Empresarial de Magallanes",
    description: "Noticias regionales de Punta Arenas, indicadores económicos al día y software contable ERP.",
    url: "https://www.contapymepuq.cl",
    siteName: "Contapymepuq",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: "https://www.contapymepuq.cl/og-cover.png",
        width: 1200,
        height: 630,
        alt: "Contapymepuq Diario Regional y ERP",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contapymepuq — Diario Regional & ERP Magallanes",
    description: "Noticias regionales de Punta Arenas, indicadores económicos y software contable.",
    images: ["https://www.contapymepuq.cl/og-cover.png"],
  },
};

export default async function HomePage() {
  const indicatorsRes = await getLatestIndicators();
  const indicators = indicatorsRes.success ? indicatorsRes.data : [];

  const newsRes = await getRegionalNews();
  const regionalNews = newsRes.success ? newsRes.data : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsMediaOrganization",
        "@id": "https://www.contapymepuq.cl/#organization",
        name: "Contapymepuq",
        url: "https://www.contapymepuq.cl",
        logo: "https://www.contapymepuq.cl/logo-contapyme.png",
        description: "Medio digital de noticias regionales, actualidad económica y herramientas contables para la Región de Magallanes.",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Punta Arenas",
          addressRegion: "Magallanes y de la Antártica Chilena",
          addressCountry: "CL",
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://www.contapymepuq.cl/#website",
        url: "https://www.contapymepuq.cl",
        name: "Contapymepuq Diario Regional",
        publisher: {
          "@id": "https://www.contapymepuq.cl/#organization",
        },
        inLanguage: "es-CL",
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://www.contapymepuq.cl/#software",
        name: "ContaPyme V2 ERP",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: "Software contable, remuneraciones, facturación electrónica DTE y gestión tributaria para empresas de la Patagonia.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "CLP",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DiarioRegionalSection initialNews={regionalNews} indicators={indicators} />
    </>
  );
}
