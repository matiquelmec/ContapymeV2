# 🚀 CONTAPYMEPUQ — Frontend Institucional
## "La Interfaz de la Precisión Contable."

Este es el núcleo visual del ecosistema **Contapymepuq**, construido sobre **Next.js 16** con **Turbopack** para una experiencia de desarrollo y producción ultrarrápida.

---

## 🏛️ Arquitectura de Vanguardia
- **Framework**: Next.js 16 (App Router).
- **Estética**: "Luxury ERP" con animaciones suaves y Micro-interacciones.
- **Seguridad**: Integración nativa con Supabase Auth & RLS.
- **Comunicación**: Server Actions para mutaciones y Fetch optimizado para el Motor Python (FastAPI).

## 🛠️ Configuración del Entorno
Para que el frontend funcione en armonía con el motor matemático, asegúrate de tener las siguientes variables en tu `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
NEXT_PUBLIC_ENGINE_URL=http://localhost:8000
```

## 🚀 Inicio Rápido

1. **Instalación**:
   ```bash
   npm install
   ```

2. **Desarrollo**:
   ```bash
   npm run dev
   ```

3. **Producción**:
   ```bash
   npm run build
   npm run start
   ```

---

## 📈 Módulos Destacados
- **RCV Intelligence**: Auditoría en tiempo real de registros de compras y ventas.
- **Remuneraciones**: Gestión de nómina con cumplimiento legal chileno 2026.
- **Billing DTE**: Emisión de facturas electrónicas con firma digital integrada.
- **Executive Dashboard**: KPIs financieros con estética Bloomberg.

## 🛡️ Estándar de Calidad
Cada componente en este repositorio sigue el estándar de **Contapymepuq**:
1. **Multi-Tenant**: Aislamiento total de datos por `organization_id`.
2. **Resilient**: Manejo de estados de carga y errores con elegancia (Skeleton screens).
3. **Responsive**: Optimizado para contadores en movimiento (Desktop & Tablet).

---
> *"Construyendo el futuro de la contabilidad regional, un commit a la vez."*
