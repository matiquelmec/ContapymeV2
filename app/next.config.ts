import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Permitir subida de imágenes hasta 10MB
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 año de caché en CDN Edge para imágenes de noticias
    deviceSizes: [360, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mofkjgfrpfmtnktaepqi.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'laprensaaustral.cl',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'elpinguino.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.ovejeronoticias.cl',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      // 1. Tributario & RCV
      { source: '/registro-rcv', destination: '/dashboard/accounting/rcv' },
      { source: '/tributario/registro-rcv', destination: '/dashboard/accounting/rcv' },
      { source: '/registro-rcv/historial', destination: '/dashboard/accounting/rcv/history' },
      { source: '/tributario/registro-rcv/historial', destination: '/dashboard/accounting/rcv/history' },
      { source: '/facturacion-dte', destination: '/dashboard/billing' },
      { source: '/tributario/facturacion-dte', destination: '/dashboard/billing' },
      { source: '/facturacion-dte/ordenes-compra', destination: '/dashboard/billing/purchase-orders' },
      { source: '/tributario/facturacion-dte/ordenes-compra', destination: '/dashboard/billing/purchase-orders' },
      { source: '/contabilidad-f29', destination: '/dashboard/accounting' },
      { source: '/tributario/contabilidad-f29', destination: '/dashboard/accounting' },
      { source: '/analisis-f29', destination: '/dashboard/accounting/f29-comparative' },
      { source: '/tributario/analisis-f29', destination: '/dashboard/accounting/f29-comparative' },

      // 2. Contabilidad Financiera
      { source: '/plan-de-cuentas', destination: '/dashboard/accounting/chart-of-accounts' },
      { source: '/contabilidad/plan-de-cuentas', destination: '/dashboard/accounting/chart-of-accounts' },
      { source: '/libro-diario', destination: '/dashboard/accounting/journal' },
      { source: '/contabilidad/libro-diario', destination: '/dashboard/accounting/journal' },
      { source: '/libro-mayor', destination: '/dashboard/accounting/ledger' },
      { source: '/contabilidad/libro-mayor', destination: '/dashboard/accounting/ledger' },
      { source: '/balance-de-comprobacion', destination: '/dashboard/accounting/trial-balance' },
      { source: '/contabilidad/balance-de-comprobacion', destination: '/dashboard/accounting/trial-balance' },
      { source: '/cierre-de-periodos', destination: '/dashboard/accounting/periods' },
      { source: '/contabilidad/cierre-de-periodos', destination: '/dashboard/accounting/periods' },
      { source: '/reportes-financieros', destination: '/dashboard/accounting/reports' },
      { source: '/contabilidad/reportes-financieros', destination: '/dashboard/accounting/reports' },
      { source: '/configuracion-de-cuentas', destination: '/dashboard/accounting/config' },
      { source: '/contabilidad/configuracion-de-cuentas', destination: '/dashboard/accounting/config' },

      // 3. Tesorería & Conciliación
      { source: '/tesoreria', destination: '/dashboard/treasury' },
      { source: '/conciliacion-bancaria', destination: '/dashboard/reconciliation' },

      // 4. Recursos Humanos (RRHH)
      { source: '/remuneraciones', destination: '/dashboard/payroll' },
      { source: '/rrhh/remuneraciones', destination: '/dashboard/payroll' },
      { source: '/remuneraciones/liquidaciones/:id*', destination: '/dashboard/payroll/liquidations/:id*' },
      { source: '/rrhh/remuneraciones/liquidaciones/:id*', destination: '/dashboard/payroll/liquidations/:id*' },
      { source: '/liquidaciones/:id*', destination: '/dashboard/payroll/liquidations/:id*' },
      { source: '/gestion-de-vacaciones', destination: '/dashboard/payroll/vacations' },
      { source: '/rrhh/gestion-de-vacaciones', destination: '/dashboard/payroll/vacations' },
      { source: '/contratos', destination: '/dashboard/payroll/contracts' },
      { source: '/rrhh/contratos', destination: '/dashboard/payroll/contracts' },
      { source: '/finiquitos', destination: '/dashboard/payroll/terminations' },
      { source: '/rrhh/finiquitos', destination: '/dashboard/payroll/terminations' },
      { source: '/libro-lre', destination: '/dashboard/payroll/lre' },
      { source: '/rrhh/libro-lre', destination: '/dashboard/payroll/lre' },
      { source: '/configuracion-previsional', destination: '/dashboard/payroll/settings' },
      { source: '/rrhh/configuracion-previsional', destination: '/dashboard/payroll/settings' },

      // 5. Activos Fijos
      { source: '/activos-fijos', destination: '/dashboard/assets' },

      // 6. Administración B2B
      { source: '/configuracion-empresa', destination: '/dashboard/settings' },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
