import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: {
    default: "Contapymepuq | Inteligencia Contable y Regional",
    template: "%s | Contapymepuq"
  },
  description: "La plataforma líder en Punta Arenas para la gestión contable inteligente y noticias regionales en tiempo real. Grado institucional para PyMEs de Magallanes.",
  keywords: ["contabilidad", "punta arenas", "magallanes", "pyme", "gestión financiera", "diario regional", "inteligencia artificial"],
  authors: [{ name: "Contapymepuq Team" }],
  creator: "Contapymepuq",
  publisher: "Contapymepuq",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: "https://www.contapymepuq.cl",
    siteName: "Contapymepuq",
    title: "Contapymepuq | Inteligencia Contable y Regional",
    description: "Gestión contable de vanguardia y noticias regionales para Magallanes.",
    images: [
      {
        url: "https://www.contapymepuq.cl/og-image.png",
        width: 1200,
        height: 630,
        alt: "Contapymepuq Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contapymepuq | Inteligencia Contable y Regional",
    description: "Gestión contable avanzada para Punta Arenas.",
    images: ["https://www.contapymepuq.cl/og-image.png"],
  },
};

import { Providers } from "@/components/providers";

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
      </body>
    </html>
  );
}
