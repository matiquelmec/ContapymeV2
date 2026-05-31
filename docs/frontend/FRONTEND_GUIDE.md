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

## 🗺️ Mapa de Navegación (Sidebar Menu)

La interfaz organiza sus módulos operativos a través de una barra lateral segmentada en las siguientes áreas de negocio:

| Categoría Principal | Módulos / Páginas de Destino | Descripción Funcional |
| :--- | :--- | :--- |
| **VISIÓN GENERAL** | 📈 `Dashboard` | Métricas generales, MarketTicker y KPIs de negocio en tiempo real. |
| **TRIBUTARIO & RCV** | 📄 `Registro RCV`<br>📦 `Facturación (DTE)`<br>🧮 `Contabilidad (F29)`<br>📊 `Análisis F29` | Declaraciones mensuales, emisión de folios reales DTE y comparación contable F29 vs RCV. |
| **CONTABILIDAD FINANCIERA** | ⚙️ `Plan de Cuentas`<br>📖 `Libro Diario`<br>📂 `Libro Mayor`<br>⚖️ `Balance de Comprobación`<br>📅 `Cierre de Periodos`<br>💳 `Tesorería`<br>🏛️ `Conciliación Bancaria`<br>📈 `Reportes Financieros`<br>🔧 `Config. de Cuentas` | Gestión de asientos diarios, cuadratura de saldos, control de caja/banco y conciliación por triggers Postgres. |
| **RECURSOS HUMANOS (RRHH)**| 👥 `Remuneraciones`<br>📅 `Gestión de Vacaciones`<br>📋 `Contratos`<br>📄 `Finiquitos`<br>📊 `Libro LRE`<br>🛡️ `Config. Previsional` | Liquidaciones de sueldos chilenos, cálculo de vacaciones acumuladas, contratos, finiquitos y archivo LRE DT. |
| **ACTIVOS FIJOS** | 📦 `Inventario y Depreciación` | Gestión de depreciación lineal mensual contable y control físico de activos. |
| **ADMINISTRACIÓN B2B** | ⚙️ `Configuración de Empresa` | Administración del perfil organizacional, RUT, giro e invitaciones de miembros. |

## 🛡️ Estándar de Calidad
Cada componente en este repositorio sigue el estándar de **Contapymepuq**:
1. **Multi-Tenant**: Aislamiento total de datos por `organization_id`.
2. **Resilient**: Manejo de estados de carga y errores con elegancia (Skeleton screens).
3. **Responsive**: Optimizado para contadores en movimiento (Desktop & Tablet).

---
> *"Construyendo el futuro de la contabilidad regional, un commit a la vez."*
