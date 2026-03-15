# 🎯 PROJECT: CONTAPYME V2 — BLUEPRINT MAESTRO
## "Precisión Institucional y Escalabilidad Organizacional para el Contador Moderno."
> **Versión:** 2.0 (Arquitectura Híbrida: Slingshot Style) | **Fecha:** 2026-03-15 | **Estado:** EN DESARROLLO 🚧 — Fases 1–4 Completadas ✅

> [!IMPORTANT]
> **PROYECTO DE REFERENCIA (SOURCE OF TRUTH):** 
> Todas las funcionalidades, lógica de negocio y estética deben basarse y evolucionar desde el proyecto maestro:
> `C:\Users\Matías Riquelme\Desktop\Contapymepuq_Master` (anteriormente en scratch/01_Proyectos).

---

## 🔬 1. EL PIVOTE TECNOLÓGICO: UNA AUDITORÍA DEL PASADO (V1)

El proyecto heredado (`Contapymepuq_Master`) fue construido como un monolito en Next.js donde toda la carga recaía sobre el ecosistema JavaScript del cliente o Node.js. Esto generó tres grandes fallas arquitectónicas críticas:
1. **Inestabilidad del Parser F29:** El análisis de PDFs tributarios se hacía a fuerza bruta buscando cadenas binarias. Confiabilidad inaceptable para el ecosistema contable (85-95%) y problemas graves de *Memory Leaks* (Cuelgues y Error 500).
2. **Seguridad Multi-Tenant Inexistente:** Todos los usuarios operaban sobre una capa precaria sin Row Level Security (RLS) en base de datos.
3. **Mezcla de Visualización y Lógica Pesada:** Next.js se ahogaba intentando correr matemáticas de liquidaciones de sueldo e IRPF de segunda categoría de forma local en el navegador del cliente en vez de confiarlo a un motor de procesamiento.

**La nueva visión (V2):** Contapyme V2 se mueve a la arquitectura **Slingshot**: una división rígida pero fluida entre la **Fuerza Bruta de Cómputo** (FastAPI / Python) y la **Visualización Ejecutiva** (Next.js / TypeScript). **Fundamentalmente, V2 utilizará la base de código de `Contapymepuq_Master` como fundación**, rescatando su diseño, sus layouts y componentes funcionales (Liquidaciones, Dashboard), mientras refactoriza e independiza el core conflictivo.

---

## 🏗️ 2. ARQUITECTURA TÉCNICA Y DIAGRAMA LÓGICO

El ecosistema ahora consta de 3 actores independientes que se comunican de forma ágil mediante APIs y WebSockets:

```text
┌──────────────────────────────────────────────────────────────────────┐
│  MOTOR DE PROCESAMIENTO MATEMÁTICO (Python + FastAPI)                │
│  Carpeta: /engine                                                    │
│  - PyMuPDF / Tesseract OCR: Precisión 100% en PDFs (F29, etc.).      │
│  - Engine Tributario: Cálculos matemáticos limpios de Remuneraciones.│
│  - Scraping Cronometrado: Actualiza indicadores (UF, Dólar) 1x/día.  │
└───────────────────────────────────┬──────────────────────────────────┘
                                    │ API REST / JSON Struct
┌───────────────────────────────────▼──────────────────────────────────┐
│  CENTRO DE DATOS Y SEGURIDAD (Supabase PostgreSQL)                   │
│  - Supabase Auth: Manejo estricto de roles.                          │
│  - RLS (Row Level Security): EL MURO MULTI-TENANT. Datos Aislados.   │
│  - Supabase Storage: Bóveda de archivos nativa y segura.             │
└───────────────────────────────────┬──────────────────────────────────┘
                                    │ Supabase Client / React Server Components
┌───────────────────────────────────▼──────────────────────────────────┐
│  FRONTEND EJECUTIVO (Next.js 15 App Router)                          │
│  Carpeta: /app                                                       │
│  - UI Institucional: TailwindCSS + shadcn/ui.                        │
│  - Autenticación Frontal.                                            │
│  - Visualización Reactiva: Dashboard Multi-Empresa para Contadores.  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 3. DEEP DIVE Y ESPECIFICACIÓN DE MÓDULOS (LOW LEVEL DESIGN)

Cada sistema interno de Contapyme operará bajo este modelo de responsabilidades duales:

### 3.1 📊 Módulo Base: Autenticación y Arquitectura Multi-Tenant (B2B)
El sistema abandona el 1 a 1 y asume que el usuario es un Contador gestionando decenas de carpetas.
*   **Base de Datos:** Tablas troncales de `organizations` y `organization_members`. **Toda** tabla transaccional (Ej. `f29_forms`, `employees`) hereda y se amarra al `organization_id`.
*   **Next.js:** Provee la selección activa del cliente (El "Company Switcher" en el Header) que filtra localmente y visualmente todas las tablas y dashboards.

### 3.2 🧾 Módulo F29: Análisis, Comparativa y Tendencia
El corazón comercial del producto. Convierte papeleo en inteligencia de negocios.
*   **Next.js:** Recibe el "Drag & Drop" del contador y lo inyecta a un balde ciego en `Supabase Storage`. Visualiza luego el Dashboard de Tendencias con gráficos interactivos `Recharts`.
*   **Python Engine:** Detecta el PDF nuevo, aplica extractores geométricos (`PyMuPDF`) buscando las cajas de los códigos del SII. Si falla, acciona un motor `OCR`. Realiza los cruces comparativos, hace el Upsert a PostgreSQL con los diferenciales (D-1), y devuelve un `HTTP 200`. Además, maneja el **Análisis Comparativo Histórico** procesando lotes de hasta 24 meses de F29 continuos para detectar tendencias y anomalías estacionales.

### 3.3 👥 Módulo Remuneraciones (Payroll) y Finiquitos
Extensa lógica progresiva y normativa chilena (AFC, AFP, IRPF 2da Cat).
*   **Next.js:** Contiene las tablas CRUD masivas (con `shadcn/ui` Data Table) de trabajadores y sus fichas técnicas. Permite la orden unificada: "Generar Liquidaciones de Marzo 2026". También gestiona la **generación de Contratos, Anexos y Finiquitos** en pantalla.
*   **Python Engine:** Funciones puras alimentadas por las tablas de parámetros legales (UF, Topes SIS/AFC). Calcula todos los haberes y descuentos, rinde planillas PDF masivas devolviendo URLs y grabando registros en la base de datos de auditoría. Es el encargado de generar el **Libro de Remuneraciones Electrónico** y compilar el **archivo TXT de carga masiva para Previred**.

### 3.4 🏢 Módulo de Activos Fijos (Depreciación IFRS)
*   **Python Engine:** Cálculos en *batch* que se ejecutan sobre las tablas PostgreSQL. Calcula vidas útiles restantes, valores libros y genera los asientos contables propuestos de depreciación del período.
*   **Next.js:** Muestra listados de activos a punto de expirar y los valores residuales en formatos amigables al CFO.

### 3.5 📉 Módulo Indicadores Económicos
*   **Python Engine:** Script *cronometrado* (Scheduler) diario que sondea fuentes oficiales (Mindicador, API SII) y escribe 1 sola vez en la tabla global de PostgreSQL. Esto centraliza la métrica y previene bloqueos de IP externos y ralentizaciones asíncronas en el frontend de Next.js.

### 3.6 📚 Módulo Contabilidad IFRS y RCV (Registro Compras y Ventas)
El pilar de la salud contable, rescatado de la V1 como el "Executive Dashboard".
*   **Python Engine:** Procesa los XML/CSV del RCV del SII. Cuadra compras y ventas, verifica la integridad matemática y genera mecánicamente los asientos para inyectarlos en el Libro Diario.
*   **Next.js:** Muestra el Plan de Cuentas IFRS editable, el Libro Diario con filtrado avanzado, y el **Dashboard Ejecutivo Interactivo** que correlaciona RCV, F29 e Indicadores Económicos en tiempo real.

---

## 📁 4. ESTRUCTURA DE DIRECTORIOS FÍSICA

```text
/Contapyme_V2/                           # Raíz del nuevo proyecto
├── 📁 engine/                           # 🔥 1. Python Engine (El Músculo)
│   ├── 📁 api/                          # Endpoints (f29, payroll, core)
│   ├── 📁 parsers/                      # f29_plumber.py, core_ocr.py
│   ├── 📁 calculators/                  # chilean_tax.py, asset_depreciation.py
│   ├── 📁 workers/                      # scrapers y schedulers (Mindicador)
│   ├── 📁 utils/                        # validador_rut_chileno.py
│   ├── requirements.txt                 # Dependencias Python
│   └── main.py                          # Boot de FastAPI (Uvicorn)
│
├── 📁 app/                              # 🎨 2. Next.js App (El Cerebro Visual)
│   ├── 📁 src/
│   │   ├── 📁 app/
│   │   │   ├── 📁 (auth)/               # Login y Registro B2B
│   │   │   └── 📁 (dashboard)/          # Vistas blindadas (F29, Payroll, Assets)
│   │   ├── 📁 components/               # shadcn/ui, layouts, charts
│   │   └── 📁 lib/                      # Supabase SSR clients, actions, zod schemas
│   ├── package.json                     # Dependencias Node
│   └── tailwind.config.ts               # Setup visual corporativo (Glassmorphism)
│
├── 📁 docs/                             # 📚 3. Documentación (BLUEPRINT MAESTRO)
└── .gitignore                           # Exclusiones de venvs, node_modules.
```

---

## 🖥️ 5. MAPA DE RUTAS FRONTEND (Next.js App Router)

Estado de cada ruta del dashboard. Guía de trabajo para el frontend.

### Rutas existentes y su estado

| Ruta (`/dashboard/...`) | Archivo | Server Action | Estado |
|---|---|---|---|
| `/` (Dashboard Principal) | `page.tsx` | `actions/dashboard.ts` | ✅ Completo |
| `/accounting` | `accounting/page.tsx` | `actions/accounting.ts` | ✅ Completo |
| `/accounting/journal` | `accounting/journal/` | `actions/accounting.ts` | ✅ Completo |
| `/accounting/rcv` | `accounting/rcv/` | `actions/rcv.ts` | ✅ Completo |
| `/accounting/trial-balance` | `accounting/trial-balance/` | — | 🔧 Stub vacío |
| `/accounting/ledger` | `accounting/ledger/` | — | 🔧 Stub vacío |
| `/reconciliation` | `reconciliation/` | — | ✅ Completo (mock upload) |
| `/assets` | `assets/` | `actions/assets.ts` | ✅ Completo |
| `/payroll` | `payroll/page.tsx` | `actions/payroll.ts` | ✅ Completo |
| `/payroll/terminations` | `payroll/terminations/` | `actions/terminations.ts` | ✅ Completo |
| `/payroll/lre` | `payroll/lre/` | `actions/lre.ts` | ✅ Completo |
| `/settings` | — | — | ⏳ Pendiente |

### Rutas pendientes de crear

| Ruta a crear | Prioridad | Fase | Datos de | Descripción |
|---|---|---|---|---|
| `/payroll/settings` | 🔴 Alta | 5 | `organization_payroll_settings` | ~~Config. AFP, Isapres, Topes, Representante Legal~~ ✅ |
| `/payroll/contracts` | 🔴 Alta | 5 | `employment_contracts` | ~~Lista y creación de contratos laborales~~ ✅ |
| `/payroll/lre` | 🟡 Media | 5 | `liquidations` | ~~Libro de Remuneraciones Electrónico (LRE)~~ ✅ |
| `/accounting/chart-of-accounts` | `accounting/chart-of-accounts/` | `actions/accounting.ts` | ✅ Completo |
| `/accounting/ledger` | `accounting/ledger/` | `actions/accounting.ts` | ✅ Completo |
| `/accounting/reports` | `accounting/reports/` | `actions/accounting.ts` | ✅ Completo |
| `/accounting/f29-comparative` | 🟢 Baja | 6 | `f29_forms` | Análisis comparativo multi-período |
| `/settings` | 🟡 Media | 8 | `organizations` | Config. de la organización activa |

### Convenciones de arquitectura de cada ruta

Cada ruta nueva sigue el patrón estricto de la arquitectura **Slingshot**:

```
/dashboard/[modulo]/[sub]/
├── page.tsx               ← Server Component (RSC): auth, fetch DB, pasa data a client
├── [modulo]-client.tsx    ← Client Component: UI interactiva, estados, toasts
└── (components)/          ← Componentes específicos de la vista (botones, dialogs, etc.)

/actions/
└── [modulo].ts            ← Server Actions: intermedian entre Client y Engine Python / Supabase
```

### Server Actions existentes

| Archivo | Funciones exportadas | Conecta con |
|---|---|---|
| `actions/auth.ts` | `signIn`, `signOut` | Supabase Auth |
| `actions/f29.ts` | `uploadF29`, `getF29List` | Engine `/api/f29` |
| `actions/payroll.ts` | `getEmployees`, `createEmployee` | Supabase directo |
| `actions/terminations.ts` | `calculateTerminationAction`, `deleteTerminationAction` | Engine `/api/terminations` |
| `actions/assets.ts` | `getAssets`, `depreciate` | Engine `/api/assets` |
| `actions/rcv.ts` | `uploadRCV`, `getRCVList` | Engine `/api/rcv` |
| `actions/accounting.ts` | `generateJournal` | Engine `/api/accounting` |
| `actions/dashboard.ts` | `getExecutiveMetrics` | Engine `/api/dashboard` |
| `actions/indicators.ts` | `getIndicators` | Supabase directo |
| `actions/previred.ts` | `exportPrevired` | Engine `/api/previred` |

### Server Actions por crear

| Archivo a crear | Funciones necesarias | Módulo |
|---|---|---|
| `actions/payroll-settings.ts` | `getPayrollSettings`, `savePayrollSettings`, `syncFromPrevired` | Config. Previsional |
| `actions/contracts.ts` | `getContracts`, `createContract`, `generateContractPDF` | Contratos |
| `actions/chart-of-accounts.ts` | `getChartOfAccounts`, `createAccount`, `toggleAccount` | Plan de Cuentas |
| `actions/reports.ts` | `getIncomeStatement`, `getBalanceSheet`, `getCashFlow` | Reportes Financieros |

---

## 🚀 6. ROADMAP: LAS FASES DE DESPLIEGUE


### FASE 1: Inicialización del Casco Vacío ✅ COMPLETADA
- [x] Construir árbol de directorios `Contapymepuq/` con `/app` y `/engine`.
- [x] Inicializar ecosistema Node (`npx create-next-app`) en `/app` (Next.js 15 + TypeScript + Tailwind + App Router).
- [x] Crear entorno virtual Python y FastAPI en `/engine` con todas las dependencias instaladas (`requirements.txt` generado).
- [x] Validar Motor Python: endpoint `/health` respondiendo `{status: ok}` correctamente.
- [x] Crear `start.ps1` — launcher unificado para ambos servidores con un solo comando.
- [x] Instalar y configurar 10 Skills en `.agents/skills/` y workflow `/start_local` en `.agent/workflows/`.
- [x] Instalar y configurar `shadcn/ui` en `/app` — componentes: `button`, `input`, `label`, `card`, `form`.

### FASE 2: Los Cimientos Invisibles (DB, Auth & Seguridad) ✅ COMPLETADA
- [x] Crear proyecto Supabase con Data API y RLS automático activados.
- [x] Configurar `.env.local` (Next.js) y `.env` (Engine Python) con credenciales separadas por rol.
- [x] Crear `.gitignore` raíz que protege los archivos de entorno.
- [x] Crear esquema SQL completo: 8 tablas, ENUMs, índices, triggers y políticas RLS multi-tenant.
- [x] Instalar `@supabase/supabase-js` + `@supabase/ssr` en el frontend.
- [x] Crear clientes Supabase tipados: `server.ts` (RSC) y `client.ts` (Client Components).
- [x] Crear middleware Next.js que protege `/dashboard` y refresca sesiones.
- [x] Crear conector Supabase singleton para el Engine Python (`core/database.py`).
- [x] Validar conexión Python → Supabase: `[OK] Conexión exitosa`.
- [x] Implementar UI de Login con Supabase Auth: Server Action `signInWithEmail`, pantalla de login con diseño glassmorphism oscuro.

### FASE 3: Desarrollo Motor e Inserción de Módulos Core ✅ COMPLETADA
- [x] Programar `/engine/parsers/f29_plumber.py` como baluarte de precisión.
- [x] Exponer API de FastAPI con endpoints (`/api/v1/f29/process`).
- [x] Esculpir el Dashboard UI (Client Components) — Layout, Sidebar, App Header y Selector B2B.
- [x] Integrar el Módulo F29 en `/app` con selector de meses y carga visual.
- [x] Probar validaciones (RUT Chileno transversal en Python y JS).

### FASE 4: El resto de la Flota (Nómina y Activos) ✅ COMPLETADA
- [x] Implementar Módulo de Remuneraciones: UI de Empleados y Motor de Liquidaciones.
- [x] Implementar Módulo de Activos Fijos: Motor de Depreciación (Lineal/Acelerada), norma SII Chile (mes siguiente), protección anti-duplicación.
- [x] Implementar Dashboard Económico: Worker Python → mindicador.cl → Supabase → UI reactiva (UF, UTM, USD, EUR, IPC).

### FASE 5: Remuneraciones Avanzadas y Documentos Legales (EN PROGRESO 🚧)
Alcanzando la madurez en el control de personal.
- [x] **Configuración Previsional Avanzada** (`/dashboard/payroll/settings`): Tabla `organization_payroll_settings` en DB. UI con 5 pestañas completada. ✅
- [x] **Generador Documental de Contratos y Anexos**: Motor Python genera DOCX desde plantillas. Soporta Contrato y Anexo. ✅
- [x] **Motor de Finiquitos (Python)**: Vacaciones proporcionales, Indemnización por años de servicio, mes de aviso, bonos extra y horas extras pendientes.
- [x] **Dashboard de Finiquitos** (`/dashboard/payroll/terminations`): Tabla de historial, estados borrador/firmado, impresión de carta y finiquito.
- [x] **Asistente IA de Descriptores de Cargo**: Editor asistido por IA integrado en el panel de contratos. ✅
- [x] **Generación archivo plano Previred** (TXT/CSV): Exportación del período procesado en formato de carga masiva. ✅
- [x] **Dashboard Libro de Remuneraciones Electrónico (LRE)**: Exportación formato DT exigida por la Dirección del Trabajo. ✅

### FASE 6: Contabilidad IFRS, RCV y Business Intelligence ✅ (Casi Completo)
Recuperando el potencial total de análisis financiero del V1.
- [x] Módulo RCV: Parser Python de Registro de Compras y Ventas del SII (CSV/UTF-8).
- [x] Asientos contables automáticos desde RCV → Libro Diario.
- [x] Executive Dashboard: Ventas RCV vs Activos Fijos vs Indicadores Económicos con análisis BI.
- [x] Módulo Conciliación Bancaria: Subida de cartola y match inteligente con Asientos.
- [x] **Plan de Cuentas IFRS Completo**: Tabla `chart_of_accounts` con árbol editable. ✅
- [x] **Libro Mayor** (`/dashboard/accounting/ledger`): Vista por cuenta contable del movimiento en el período. ✅
- [x] **Historial RCV con análisis de proveedores y clientes**: Top proveedores/clientes por monto, filtrado por período y exportación. ✅
- [x] **Análisis Comparativo F29 Histórico** (Batch): Lector masivo hasta 24 meses con detección de tendencias y anomalías estacionales con IA. ✅
- [x] **Balance de Comprobación y Saldos**: Cuadratura de sumas y saldos entre periodos. ✅

### FASE 7: Herramientas de Inteligencia Avanzada (NUEVA 🔮)
El salto de software contable a plataforma de inteligencia de gestión.
- [ ] **Indicadores Económicos en Tiempo Real**: Panel UF, UTM, USD, EUR, IPC desde Mindicador.cl. Consumidos automáticamente por los motores de cálculo (Liquidaciones, Finiquitos, Activos).
- [ ] **Análisis de Cartolas Bancarias con IA**: Subida de PDF/CSV de cartola bancaria, categorización automática de movimientos y detección de patrones de gasto recurrente.
- [x] **Motor de Reportes Financieros**: Generación automática de Estado de Resultados, Balance General y Flujo de Caja desde el Libro Diario. ✅
- [ ] **Asistente Tributario IA**: Análisis predictivo de posición fiscal (PPM subestimado, IVA a favor no recuperado) basado en RCV + F29 histórico.

### FASE 8: Optimización y Lanzamiento Corporativo
Puesta en marcha productiva de alto estrés.
- [ ] Reemplazar copias locales por entornos de CI/CD (Vercel + Render/Railway para el Engine Python).
- [ ] Stress-Test y validaciones unitarias en FastAPI (pytest) y Next.js (Vitest).
- [ ] Implementar **Company Switcher** real en el Header (multi-empresa activa con cambio de contexto).
- [ ] Automatizar Worker de Indicadores con cron scheduler (APScheduler o Celery Beat).
- [ ] **Roles granulares**: owner / accountant / viewer con permisos diferenciados en sidebar y acciones CRUD.
- [ ] **Módulo de Auditoría y Logs**: Registro de acciones críticas (quién procesó qué F29, qué liquidación generó quién) para trazabilidad legal.

---

## 🗺️ 6. INVENTARIO DE MIGRACIÓN V1 → V2

| Módulo V1 (`Contapymepuq_Master`) | Estado en V2 |
|---|---|
| Login / Auth multi-tenant | ✅ Migrado con RLS |
| F29 Individual (Upload + Parser Python) | ✅ Migrado y mejorado |
| F29 Comparativo Histórico (24 meses) | ✅ Completado |
| RCV Análisis + Historial de Proveedores | ✅ Completado |
| Libro Diario (Journal + Asientos) | ✅ Migrado |
| Libro Mayor (Ledger por cuenta) | ✅ Completado |
| Balance de Comprobación | ✅ Completado |
| Plan de Cuentas IFRS completo | ✅ Completado |
| Activos Fijos + Depreciación | ✅ Migrado y mejorado |
| Indicadores Económicos en tiempo real | ⏳ Fase 7 |
| Análisis Cartolas Bancarias | ✅ Conciliación migrada |
| Executive Dashboard BI | ✅ Migrado |
| Empleados (CRUD completo) | ✅ Migrado |
| Liquidaciones de Sueldo | ✅ Migrado |
| Configuración Previsional (AFP/Salud/Topes) | ⏳ Fase 5 |
| Contratos y Anexos (PDF) | ⏳ Fase 5 |
| Finiquitos / Desvinculaciones | ✅ Migrado |
| Libro de Remuneraciones (LRE) | ⏳ Fase 5 |
| Archivo Previred (TXT) | ⏳ Fase 5 |
| Asistente IA Descriptores de Cargo | ⏳ Fase 5 |
| Reportes Financieros (EE.RR, Balance) | ⏳ Fase 7 |
| Asistente Tributario IA | ⏳ Fase 7 |
| Company Switcher activo | ⏳ Fase 8 |
| Roles y permisos granulares | ⏳ Fase 8 |
| Auditoría y logs de acciones | ⏳ Fase 8 |

---

> *"Al centralizar lo pesado en Python y lo hermoso en React, dejamos de construir una plantilla web compleja y empezamos a construir Software as a Service para PyMEs."*
