import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/admin/",
        "/api/",
        "/login",
        "/register",
        "/ecosistema/",
        "/tributario/",
        "/contabilidad/",
        "/rrhh/",
        "/registro-rcv",
        "/facturacion-dte",
        "/contabilidad-f29",
        "/analisis-f29",
        "/plan-de-cuentas",
        "/libro-diario",
        "/libro-mayor",
        "/balance-de-comprobacion",
        "/cierre-de-periodos",
        "/reportes-financieros",
        "/configuracion-de-cuentas",
        "/tesoreria",
        "/conciliacion-bancaria",
        "/remuneraciones",
        "/liquidaciones/",
        "/gestion-de-vacaciones",
        "/contratos",
        "/finiquitos",
        "/libro-lre",
        "/configuracion-previsional",
        "/activos-fijos",
        "/configuracion-empresa",
      ],
    },
    sitemap: [
      "https://www.contapymepuq.cl/sitemap.xml",
      "https://www.contapymepuq.cl/sitemap-news.xml",
      "https://www.contapymepuq.cl/sitemap-jobs.xml",
    ],
  };
}
