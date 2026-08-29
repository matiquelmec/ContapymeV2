import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Providers } from "@/components/providers";
import { JsonLdSchema } from "@/components/json-ld";

export const metadata: Metadata = {
  metadataBase: new URL("https://contapymepuq.cl"),
  title: {
    default: "Contapymepuq | Software Contable, Nómina & Noticias en Punta Arenas",
    template: "%s | Contapymepuq"
  },
  description: "Plataforma integral en Punta Arenas para contabilidad IFRS, remuneraciones (LRE DT), facturación electrónica SII, calculadora de sueldo y diario regional de Magallanes.",
  keywords: [
    "calculadora de sueldos",
    "calculadora sueldo liquido chile",
    "contador en punta arenas",
    "servicios de contabilidad punta arenas",
    "diario punta arenas",
    "noticias punta arenas magallanes",
    "software contable chile",
    "remuneraciones lre dt",
    "facturacion electronica sii",
    "pyme magallanes"
  ],
  authors: [{ name: "Contapymepuq Team" }],
  creator: "Contapymepuq",
  publisher: "Contapymepuq",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: "https://contapymepuq.cl",
    siteName: "Contapymepuq",
    title: "Contapymepuq | Software Contable, Nómina & Noticias en Punta Arenas",
    description: "Estudio contable digital, simulador de sueldos y noticias regionales en tiempo real para Magallanes.",
    images: [
      {
        url: "https://contapymepuq.cl/og-image.png",
        width: 1200,
        height: 630,
        alt: "Contapymepuq SaaS Contable Magallanes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contapymepuq | Contabilidad & Sueldos en Punta Arenas",
    description: "Gestión contable avanzada y remuneraciones para la Región de Magallanes.",
    images: ["https://contapymepuq.cl/og-image.png"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ContaPymePuq",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <JsonLdSchema />
        <Providers>
          {children}
        </Providers>
        <Toaster 
          theme="dark" 
          position="bottom-right" 
          richColors 
          toastOptions={{
            style: {
              background: 'rgba(10, 10, 10, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '16px 24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              color: '#fff',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            },
            className: "font-sans",
          }}
        />
        {/* 📰 Google Reader Revenue Manager / Subscribe with Google (SwG Basic) */}
        <Script
          async
          type="application/javascript"
          src="https://news.google.com/swg/js/v1/swg-basic.js"
          strategy="afterInteractive"
        />
        <Script id="google-swg-basic" strategy="afterInteractive">
          {`
            (self.SWG_BASIC = self.SWG_BASIC || []).push( basicSubscriptions => {
              basicSubscriptions.init({
                type: "NewsArticle",
                isPartOfType: ["Product"],
                isPartOfProductId: "CAowzMLhCw:openaccess",
                clientOptions: { theme: "light", lang: "es" },
              });
            });
          `}
        </Script>
      </body>
    </html>
  );
}
