import React from "react";

export function JsonLdSchema() {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "AccountingService",
    "name": "Contapymepuq - Servicios Contables & Software Pyme Magallanes",
    "alternateName": "Contapymepuq",
    "url": "https://contapymepuq.cl",
    "logo": "https://contapymepuq.cl/logo-contapyme.png",
    "image": "https://contapymepuq.cl/og-image.png",
    "description": "Estudio contable digital, remuneraciones, facturación electrónica SII y diario regional en Punta Arenas, Región de Magallanes y Antártica Chilena.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Punta Arenas",
      "addressRegion": "Magallanes y de la Antártica Chilena",
      "addressCountry": "CL"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -53.1638,
      "longitude": -70.9171
    },
    "areaServed": [
      "Punta Arenas",
      "Puerto Natales",
      "Porvenir",
      "Región de Magallanes",
      "Chile"
    ],
    "priceRange": "$$",
    "openingHours": "Mo-Fr 08:30-18:30",
    "telephone": "+56-61-200000"
  };

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Calculadora de Sueldo Líquido y Costo Empleador Chile",
    "url": "https://contapymepuq.cl/calculadora",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "All",
    "description": "Simulador contable de sueldos chilenos con retenciones de AFP, Salud, AFC, Impuesto Único y beneficios de Zona Extrema (Magallanes - DL 889).",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "CLP"
    }
  };

  const newsOrgSchema = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    "name": "Diario Regional Contapymepuq",
    "url": "https://contapymepuq.cl/noticias",
    "logo": "https://contapymepuq.cl/logo-contapyme.png"
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsOrgSchema) }}
      />
    </>
  );
}
