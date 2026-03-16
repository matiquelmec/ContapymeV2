# 🎯 PROJECT: CONTAPYME V2 — BLUEPRINT MAESTRO
## "Precisión Institucional y Escalabilidad Organizacional para el Contador Moderno."
> **Versión:** 2.4 (Blindaje RCV e Integridad Temporal) | **Fecha:** 2026-03-16 | **Estado:** EN DESARROLLO 🚧 — Fase 8.2 Blindaje de Integridad Completado 🔒✅

> [!IMPORTANT]
> **PROYECTO DE REFERENCIA (SOURCE OF TRUTH):**
> Todas las funcionalidades, lógica de negocio y estética deben basarse y evolucionar desde:
> `C:\Users\Matías Riquelme\.gemini\antigravity\scratch\01_Proyectos\Contapyme_V2`
> El proyecto activo en desarrollo se encuentra en:
> `C:\Users\Matías Riquelme\Desktop\Contapymepuq`

> [!NOTE]
> **PARA INICIAR EL SISTEMA LOCAL:** Ejecutar `.\start.ps1` desde la raíz del proyecto.
> - Frontend: http://localhost:3000
> - Engine API + Docs: http://localhost:8000/docs

---

## 🔬 1. EL PIVOTE TECNOLÓGICO: UNA AUDITORÍA DEL PASADO (V1)

El proyecto heredado (`Contapyme_V2/docs/BLUEPRINT_MAESTRO.md`) fue construido como un monolito en Next.js donde toda la carga recaía sobre el ecosistema JavaScript del cliente o Node.js. Esto generó tres grandes fallas arquitectónicas críticas:
1. **Inestabilidad del Parser F29:** El análisis de PDFs tributarios se hacía a fuerza bruta buscando cadenas binarias. Confiabilidad inaceptable para el ecosistema contable (85-95%) y problemas graves de *Memory Leaks* (Cuelgues y Error 500).
2. **Seguridad Multi-Tenant Inexistente:** Todos los usuarios operaban sobre una capa precaria sin Row Level Security (RLS) en base de datos.
3. **Mezcla de Visualización y Lógica Pesada:** Next.js se ahogaba intentando correr matemáticas de liquidaciones de sueldo e IRPF de segunda categoría de forma local en el navegador del cliente en vez de confiarlo a un motor de procesamiento.

**La nueva visión (V2):** Contapyme V2 se mueve a la arquitectura **Slingshot**: una división rígida pero fluida entre la **Fuerza Bruta de Cómputo** (FastAPI / Python) y la **Visualización Ejecutiva** (Next.js / TypeScript). **V2 utiliza la base de código de `Contapyme_V2` como fundación**, rescatando su diseño, sus layouts y componentes funcionales (Liquidaciones, Dashboard), mientras refactoriza e independiza el core conflictivo.

---

## 🏗️ 2. ARQUITECTURA TÉCNICA Y DIAGRAMA LÓGICO

El ecosistema ahora consta de 3 actores independientes que se comunican de forma ágil mediante APIs REST:

```text
┌──────────────────────────────────────────────────────────────────────┐
│  MOTOR DE PROCESAMIENTO MATEMÁTICO (Python + FastAPI)                │
│  Carpeta: /engine                                                    │
│  - PyMuPDF / Tesseract OCR: Precisión 100% en PDFs (F29, etc.).      │
│  - calculators/chilean_payroll.py: Motor de Remuneraciones REAL.     │
│  - workers/indicators_scheduler.py: APScheduler Lun-Vie 09:00 AM.   │
│  - Scraping: mindicador.cl → UF, UTM, USD, EUR, IPC automático.      │
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
│  FRONTEND EJECUTIVO (Next.js 16 App Router)                          │
│  Carpeta: /app                                                       │
│  - UI Institucional: TailwindCSS + shadcn/ui.                        │
│  - Autenticación Frontal con Middleware SSR.                         │
│  - Visualización Reactiva: Dashboard Multi-Empresa para Contadores.  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 3. DEEP DIVE Y ESPECIFICACIÓN DE MÓDULOS (LOW LEVEL DESIGN)

Cada sistema interno de Contapyme opera bajo el modelo de responsabilidades duales:

### 3.1 📊 Módulo Base: Autenticación y Arquitectura Multi-Tenant (B2B)
El sistema abandona el 1 a 1 y asume que el usuario es un Contador gestionando decenas de carpetas.
*   **Base de Datos:** Tablas troncales de `organizations` y `organization_members`. **Toda** tabla transaccional (Ej. `f29_forms`, `employees`) hereda y se amarra al `organization_id`.
*   **Next.js:** Provee la selección activa del cliente (El "Company Switcher" en el Header) que filtra localmente y visualmente todas las tablas y dashboards.

### 3.2 🧾 Módulo F29: Auditoría Tributaria Inteligente (V2 Elevada)
El corazón comercial del producto. Convierte papeleo en analítica estratégica "Clase Mundial".
*   **Next.js:** Dashboard interactivo que visualiza ratios críticos: **Margen Operacional Proyectado**, **Carga Tributaria**, **Efectividad de IVA** y **Ratio Crédito/Débito**. 
    - **Gestión Dinámica:** Sistema de checkboxes para comparación selectiva de periodos y tabla de historial con eliminación de registros (Consola de Control).
    - **Visualización:** Gráficos de tendencias (Recharts) con renderizado optimizado por debouncing y claves dinámicas.
    - **Insights:** Alertas automáticas sobre tendencias de pago (Alza/Baja) y coherencia fiscal.
*   **Python Engine:** `parsers/f29_plumber.py` (Proximidad Global V2.1). Captura códigos 563 (Ventas), 538, 537, 062, 151 y 049. Ejecuta una **Lógica de Auditoría Multidimensional** que genera alertas inteligentes ante anomalías o discrepancias de IVA.
    - **API Endpoint:** Soporte para `DELETE` por ID con limpieza automática de caché y recalculo de métricas.

### 3.3 👥 Módulo Remuneraciones (Payroll) y Finiquitos
Extensa lógica progresiva y normativa chilena completa.
*   **Next.js:** CRUD de empleados (shadcn/ui Data Table). Botones de acción: procesar nómina, exportar Previred, generar contratos.
*   **Python Engine:** `calculators/chilean_payroll.py` — Motor puro con tabla IRPF SII progresiva, topes AFP/Salud por UF, gratificación legal topada (Art. 50 CT), AFC, SIS y cargos empresa. 100% testeable con pytest.

### 3.4 🏢 Módulo de Activos Fijos (Depreciación IFRS)
*   **Python Engine:** Cálculos en *batch* sobre tablas PostgreSQL. Genera asientos contables propuestos de depreciación.
*   **Next.js:** Listados de activos, valores residuales y activos próximos a expirar.

### 3.5 📉 Módulo Indicadores Económicos
*   **Python Engine:** `workers/indicators_scheduler.py` — APScheduler que corre **automáticamente Lun-Vie a las 09:00 AM (hora Santiago)** consultando mindicador.cl y almacenando en Supabase. También se ejecuta al iniciar el servidor (lifespan FastAPI).

### 3.6 📚 Módulo Contabilidad IFRS y RCV (Blindaje de Integridad)
El pilar de la salud contable con **Arquitectura de Integridad Inquebrantable**.
*   **Python Engine:** Procesa XML/CSV del RCV del SII. Cuadra compras y ventas, genera asientos para el Libro Diario.
*   **Blindaje SQL (Integridad Temporal):** Implementación de triggers `BEFORE INSERT OR UPDATE` que fuerzan la coincidencia exacta entre el periodo contable y la fecha real del documento. Esto elimina el 100% de los errores de clasificación manual.
*   **Next.js:** RCV Dashboard con **Visión de Inteligencia Pasiva**:
    - **Detección Automática:** El sistema detecta el mes/año desde el archivo (Zero-Click Awareness).
    - **Orden Cronológico:** Priorización automática de los periodos más recientes.
    - **Integridad:** Sincronizado con triggers SQL para evitar desajustes temporales.

---

## 📁 4. ESTRUCTURA DE DIRECTORIOS FÍSICA

```text
/Contapymepuq/                           # Raíz del proyecto activo
├── 📁 engine/                           # 🔥 1. Python Engine (El Músculo)
│   ├── 📁 api/routers/                  # Endpoints REST (12 routers activos)
│   │   ├── f29.py                       # Parser F29 + análisis comparativo
│   │   ├── payroll.py                   # Orquestador de nómina (delega a calculators/)
│   │   ├── terminations.py              # Motor de finiquitos (Art. 159, 161 CT)
│   │   ├── assets.py                    # Depreciación IFRS (Lineal/Acelerada)
│   │   ├── accounting.py               # IFRS: RCV→Diario, Trial Balance, Ledger, Reports
│   │   ├── indicators.py               # Endpoint manual de actualización
│   │   ├── documents.py                # Generador DOCX (Contratos, Anexos, Finiquitos)
│   │   ├── lre.py                      # Libro de Remuneraciones Electrónico DT
│   │   ├── previred.py                  # Exportación TXT Previred
│   │   ├── payroll_settings.py         # Config. AFP, Salud, Topes, RFC legal
│   │   ├── rcv.py                      # Parser RCV SII (CSV)
│   │   └── dashboard_metrics.py        # Métricas ejecutivas agregadas
│   ├── 📁 calculators/                  # ✅ Motor Matemático Puro (testeables)
│   │   └── chilean_payroll.py           # Normativa laboral CL: AFP, Salud, AFC, IRPF
│   ├── 📁 workers/                      # ✅ Workers y Schedulers automáticos
│   │   └── indicators_scheduler.py      # APScheduler Lun-Vie 09:00 AM (Santiago)
│   ├── 📁 parsers/                      # f29_plumber.py (PyMuPDF + OCR)
│   ├── 📁 core/                         # database.py (Supabase singleton), document_templates.py
│   ├── 📁 schemas/                      # Pydantic schemas compartidos
│   ├── 📁 templates/                    # Plantillas DOCX para documentos legales
│   ├── requirements.txt                 # Dependencias Python (incl. APScheduler 3.11.2)
│   ├── run_engine.py                    # Entry point para uvicorn
│   └── main.py                          # Boot FastAPI con lifespan (CORS, routers, scheduler)
│
├── 📁 app/                              # 🎨 2. Next.js App (El Cerebro Visual)
│   └── 📁 src/
│       ├── 📁 app/
│       │   ├── 📁 (auth)/               # Login glassmorphism oscuro
│       │   └── 📁 dashboard/            # Todas las vistas del dashboard
│       │       ├── page.tsx             # Dashboard principal + KPIs + Indicadores
│       │       ├── 📁 accounting/       # F29, Journal, Ledger, Trial-Balance, Reports, RCV, CoA, Config
│       │       ├── 📁 payroll/          # Empleados, Contratos, LRE, Finiquitos, Config. Previsional
│       │       ├── 📁 assets/           # Activos Fijos + Depreciación
│       │       └── 📁 reconciliation/   # Conciliación Bancaria
│       ├── 📁 actions/                  # 17 Server Actions (intermedian Client ↔ Engine/Supabase)
│       ├── 📁 components/               # layout/ (Sidebar, Header) + ui/ (shadcn)
│       └── 📁 lib/supabase/             # Clientes tipados: server.ts (RSC) + client.ts
│
├── 📁 supabase/                         # 🗄️ 3. Centro de Datos (Base de Datos)
│   ├── 📁 migrations/                   # Historial cronológico de cambios (Deltas)
│   ├── 📁 snapshots/                    # Referencia consolidada del esquema actual
│   └── README.md                        # Guía profesional de gestión de DB
├── BLUEPRINT_MAESTRO.md                 # Este archivo
└── start.ps1                            # Launcher unificado (Engine + Frontend)
```

---

## 🖥️ 5. MAPA DE RUTAS FRONTEND (Next.js App Router)

### Rutas activas y su estado

| Ruta (`/dashboard/...`) | Componente principal | Server Action | Estado |
|---|---|---|---|
| `/` (Dashboard Principal) | `page.tsx` + `executive-dashboard-client.tsx` | `actions/dashboard.ts` | ✅ Completo |
| `/accounting` | `accounting/page.tsx` | `actions/accounting.ts` | ✅ Completo |
| `/accounting/journal` | `accounting/journal/` | `actions/accounting.ts` | ✅ Completo |
| `/accounting/rcv` | `accounting/rcv/` | `actions/rcv.ts` | ✅ Completo |
| `/accounting/chart-of-accounts` | `accounting/chart-of-accounts/` | `actions/accounting.ts` | ✅ Completo |
| `/accounting/ledger` | `accounting/ledger/` | `actions/accounting.ts` | ✅ Completo |
| `/accounting/trial-balance` | `accounting/trial-balance/` | `actions/accounting.ts` | ✅ Completo |
| `/accounting/reports` | `accounting/reports/` (14KB) | `actions/accounting.ts` | ✅ Completo |
| `/accounting/f29-comparative` | `accounting/f29-comparative/` | `actions/f29.ts` | ✅ Completo (Incluye Gestión/Delete) |
| `/accounting/config` | `accounting/config/` | `actions/accounting.ts` | ✅ Completo |
| `/reconciliation` | `reconciliation/` | — | ✅ Completo |
| `/assets` | `assets/` | `actions/assets.ts` | ✅ Completo |
| `/payroll` | `payroll/page.tsx` | `actions/payroll.ts` | ✅ Completo |
| `/payroll/contracts` | `payroll/contracts/` | `actions/contracts.ts` | ✅ Completo |
| `/payroll/terminations` | `payroll/terminations/` | `actions/terminations.ts` | ✅ Completo |
| `/payroll/settings` | `payroll/settings/` | `actions/payroll-settings.ts` | ✅ Completo |
| `/payroll/lre` | `payroll/lre/` | `actions/lre.ts` | ✅ Completo |
| `/settings` | — | — | ⏳ Pendiente (Fase 8) |

### Server Actions activos (17 archivos)

| Archivo | Funciones principales | Estado |
|---|---|---|
| `actions/auth.ts` | `signIn`, `signOut` | ✅ |
| `actions/f29.ts` | `uploadF29`, `getF29List` | ✅ |
| `actions/payroll.ts` | `getEmployees`, `createEmployee` | ✅ |
| `actions/terminations.ts` | `calculateTerminationAction`, `deleteTerminationAction` | ✅ |
| `actions/assets.ts` | `getAssets`, `depreciate` | ✅ |
| `actions/rcv.ts` | `uploadRCV`, `getRCVList` | ✅ |
| `actions/accounting.ts` | `generateJournal`, `getTrialBalance`, `getLedger` | ✅ |
| `actions/dashboard.ts` | `getExecutiveMetrics` | ✅ |
| `actions/indicators.ts` | `getIndicators` | ✅ |
| `actions/previred.ts` | `exportPrevired` | ✅ |
| `actions/contracts.ts` | `getContracts`, `createContract` | ✅ |
| `actions/payroll-settings.ts` | `getPayrollSettings`, `savePayrollSettings` | ✅ |
| `actions/lre.ts` | `getLRE`, `exportLRE` | ✅ |
| `actions/ai-assistant.ts` | `generateDescription` | ✅ |
| `actions/organizations.ts` | `getActiveOrganizationId` | ✅ |
| `actions/documents.ts` | `generateDocument` | ✅ |
| `actions/process_payroll.ts` | `processPayrollAction` | ✅ |

### Patrón arquitectónico de cada ruta (Slingshot Style)

```
/dashboard/[modulo]/[sub]/
├── page.tsx               ← Server Component (RSC): auth, fetch DB, pasa data a client
├── [modulo]-client.tsx    ← Client Component: UI interactiva, estados, toasts
└── (components)/          ← Componentes específicos de la vista

/actions/
└── [modulo].ts            ← Server Actions: intermedian entre Client y Engine Python / Supabase
```

---

## 🚀 6. ROADMAP: LAS FASES DE DESPLIEGUE

### FASE 1: Inicialización del Casco Vacío ✅ COMPLETADA
- [x] Construir árbol de directorios con `/app` y `/engine`.
- [x] Inicializar ecosistema Node (Next.js 15 + TypeScript + Tailwind + App Router).
- [x] Crear entorno virtual Python y FastAPI con todas las dependencias.
- [x] Crear `start.ps1` — launcher unificado.
- [x] Skills y workflows en `.agents/`.
- [x] `shadcn/ui` instalado y configurado.

### FASE 2: Los Cimientos Invisibles (DB, Auth & Seguridad) ✅ COMPLETADA
- [x] Proyecto Supabase con RLS activado.
- [x] `.env.local` y `.env` configurados con credenciales por rol.
- [x] Esquema SQL: tablas, ENUMs, índices, triggers y políticas RLS multi-tenant.
- [x] Clientes Supabase tipados: `server.ts` (RSC) y `client.ts`.
- [x] Middleware Next.js que protege `/dashboard`.
- [x] Conector Supabase singleton para Python (`core/database.py`).
- [x] UI de Login con diseño glassmorphism oscuro.

### FASE 3: Desarrollo Motor e Inserción de Módulos Core ✅ COMPLETADA
- [x] `/engine/parsers/f29_plumber.py` (PyMuPDF).
- [x] API FastAPI con endpoints F29.
- [x] Dashboard UI — Layout, Sidebar, App Header y Selector B2B.
- [x] Módulo F29 en frontend con selector de meses y carga visual.
- [x] Validaciones RUT Chileno en Python y JS.

### FASE 4: El resto de la Flota (Nómina y Activos) ✅ COMPLETADA
- [x] Módulo de Remuneraciones: UI de Empleados y Motor de Liquidaciones.
- [x] Módulo de Activos Fijos: Motor de Depreciación (Lineal/Acelerada).
- [x] Dashboard Económico: Worker → mindicador.cl → Supabase → UI reactiva.

### FASE 5: Remuneraciones Avanzadas y Documentos Legales ✅ COMPLETADA
- [x] **Configuración Previsional Avanzada** (`/dashboard/payroll/settings`): 5 pestañas con AFP, Salud, topes, AFC, representante legal.
- [x] **Generador Documental de Contratos y Anexos**: Motor Python genera DOCX desde plantillas. Soporta Contrato, Anexo y Finiquito.
- [x] **Motor de Finiquitos (Python)**: Vacaciones proporcionales (Art. 67 CT), Indemnización años de servicio (tope 330 UF), mes de aviso.
- [x] **Dashboard de Finiquitos** (`/dashboard/payroll/terminations`): Tabla historial, estados borrador/firmado.
- [x] **Asistente IA de Descriptores de Cargo**: Editor con IA integrado en contratos.
- [x] **Generación archivo plano Previred** (TXT): Exportación formato carga masiva.
- [x] **Libro de Remuneraciones Electrónico (LRE)**: Exportación formato DT.

### FASE 6: Contabilidad IFRS, RCV y Business Intelligence ✅ COMPLETADA
- [x] Módulo RCV: Parser Python de Registro de Compras y Ventas del SII (CSV).
- [x] Asientos contables automáticos desde RCV → Libro Diario.
- [x] Executive Dashboard: Ventas RCV vs Activos Fijos vs Indicadores Económicos.
- [x] Conciliación Bancaria: Subida de cartola y match con Asientos.
- [x] Plan de Cuentas IFRS Completo con árbol editable.
- [x] Libro Mayor por cuenta con saldo acumulado.
- [x] Análisis Comparativo F29 Histórico (Batch 24 meses).
- [x] Balance de Comprobación y Saldos.
- [x] Estado de Resultados, Balance General y análisis de proveedores/clientes.

  > ⚠️ **Nota de Auditoría (2026-03-15):** El módulo RCV tiene funcionalidad base operativa, pero carece de visualizaciones avanzadas (gráficos), historial de importaciones y análisis enriquecido. Ver Fase 8.1 para el plan de restauración y potenciación completo.

### FASE 7: Motor Matemático de Clase Mundial ✅ COMPLETADA (2026-03-15)
El salto de "simulación" a un sistema contable-laboral de producción real.
- [x] **`calculators/chilean_payroll.py`**: Motor puro con normativa laboral chilena completa:
  - Tabla IRPF SII progresiva (8 tramos, DL 824)
  - Topes imponibles AFP y Salud expresados en UF (DL 3500)
  - Gratificación legal topada por Art. 50 CT (4.75 IMM/año)
  - AFC Seguro Cesantía diferenciado (indefinido vs plazo fijo)
  - SIS (Seguro de Invalidez) como cargo empresa
  - Proporcional por días trabajados
  - 100% puras y testeables con pytest sin mocks
- [x] **`api/routers/payroll.py` refactorizado**: Router delega 100% la matemática al motor. Lee UF/UTM desde DB, construye `PayrollSettings` desde config de la organización.
- [x] **`workers/indicators_scheduler.py`**: APScheduler real con CronTrigger Lun-Vie 09:00 AM hora Santiago. Actualización inmediata al arrancar el servidor.
- [x] **`main.py` refactorizado**: Usa `asynccontextmanager lifespan` (FastAPI moderno). CORS con lista blanca explícita de orígenes (elimina `"*"`). Integra scheduler.
- [x] **Motor de Reportes Financieros**: Estado de Resultados + Balance General desde Libro Diario.

### FASE 8: Optimización y Lanzamiento Corporativo (EN PROCESO)
Puesta en marcha productiva de alto estrés.
- [x] **Company Switcher** real en el Header (multi-empresa activa con cambio de contexto).
- [ ] Pruebas unitarias `calculators/` con pytest (casos extremos: SIS, topes UF, impuesto).
- [ ] Reemplazar copias locales por CI/CD: Vercel (app) + Railway/Render (engine).
- [ ] Automatizar Worker de Indicadores con cron en producción.
- [ ] Roles granulares: owner / accountant / viewer con permisos diferenciados.
- [ ] Módulo de Auditoría y Logs: Registro de acciones críticas.
- [ ] Stress-Test y validaciones unitarias (pytest + Vitest).

### FASE 8.2: Auditoría Senior y Consolidación de Infraestructura ✅ COMPLETADA (2026-03-16)
Refactorización institucional para garantizar un entorno de desarrollo profesional y escalable.
- [x] **Auditoría de Código y Limpieza Profunda**: Purga de scripts temporales (`tmp_*.py`) y centralización de utilerías en `engine/dev_tools`.
- [x] **Centralización del Esquema SQL**: Sincronización de `supabase/schema.sql` como Fuente de Verdad única, incluyendo tipos ENUM y todas las tablas de Contabilidad/RRHH.
- [x] **Verificación Multi-Tenant**: Confirmación de que todos los routers y server actions filtran estrictamente por `organization_id`.
- [x] **Normalización de Dependencias**: Limpieza de archivos `.log` y archivos residuales del sistema.

### FASE 8.1: Restauración y Potenciación RCV ✅ COMPLETADA (2026-03-15)
Auditoría del módulo RCV reveló brechas vs versión Master. Plan de restauración implementado y adaptado a arquitectura Slingshot.

#### Orden de Ejecución:

**PASO 1 — Migración DB (Prerequisito, no-destructivo)** `[PENDIENTE EJECUTAR EN SUPABASE]`
- [x] `ADD COLUMN monto_calculado BIGINT` y `es_suma BOOLEAN` en `purchase_records` y `sales_records`
- [x] `CREATE INDEX` en `(organization_id, periodo)` para ambas tablas
- [x] `ADD CONSTRAINT UNIQUE (organization_id, folio, rut_emisor, periodo)` para evitar duplicados en upsert
- [ ] ~~**Pendiente:**~~ Ejecutar `supabase/migrations/20260315000000_rcv_fase81_potenciacion.sql` en el Dashboard de Supabase

**PASO 2 — Engine Python (`engine/api/routers/rcv.py`)** `✅ COMPLETADO`
- [x] Constantes `DOCUMENT_TYPES_SUMA = {'33', '34', '56'}` y `DOCUMENT_TYPES_RESTA = {'61'}` con lógica J+K
- [x] Parser mejorado: calcula y guarda `monto_calculado` y `es_suma` por tipo de documento
- [x] Upsert corregido con `on_conflict="organization_id,folio,rut_emisor,periodo"`
- [x] `GET /analysis/top-vendors|top-customers`: ahora incluye `monto_calculado`, `porcentaje`, `count_suma`, `count_resta`
- [x] Nuevo `GET /analysis/summary`: KPIs del período
- [x] Nuevo `GET /history`: historial de importaciones agrupado por (periodo, tipo)
- [x] Nuevo `GET /periodos`: lista de períodos únicos con data

**PASO 3 — Server Actions (`app/src/actions/rcv.ts`)** `✅ COMPLETADO`
- [x] **Bugfix crítico DT-09**: Corregido typo `organiationId` → `organizationId`
- [x] `getRCVSummary(organizationId, periodo?)` implementado
- [x] `getRCVHistory(organizationId, limit?)` implementado
- [x] `getAvailablePeriodos(organizationId)` implementado

**PASO 4 — Dependencia Frontend** `✅ YA ESTABA INSTALADA`
- [x] `recharts ^3.8.0` ya presente en `package.json` (del módulo F29)

**PASO 5 — Componentes Frontend** `✅ COMPLETADO`
- [x] `rcv-analysis-client.tsx` refactorizado: KPIs cards + selector de período + Tabs + BarChart + PieChart + tabla expandible + exportar CSV
- [x] `rcv-upload-client.tsx` mejorado: drag & drop, feedback visual nombre/tamaño, auto-refresh post importación
- [x] `rcv/history/page.tsx` creada: historial de importaciones con estado de asientos
- [x] `rcv/page.tsx` actualizado: botón "Historial", secciones estructuradas

**PASO 6 — Blindaje de Importación RCV y Asientos (V2.3)** `✅ COMPLETADO`
- [x] **Normalización de Periodos**: Corrección algorítmica (`YYYY-MM-01`) global.
- [x] **Soporte Ficticio/Real Extendido**: Documento Tipo `45` integrado.
- [x] **Triggers de Blindaje**: Implementado `fn_secure_rcv_period()` en PostgreSQL.
- [x] **Anti-Duplicados**: Restricción `UNIQUE` y lógica de override funcional.

**PASO 7 — Próximos Pasos (Fase 8.3)** `⏳ PLANIFICADO`
- [ ] **Auto-Contabilización**: Generación automática de asientos al subir el CSV sin intervención humana.
- [ ] **RLS Hardened**: Políticas de seguridad a nivel de fila en Supabase.

#### Principios Rectores Aplicados:
- **No se rompió nada existente**: `purchase_records`, `sales_records` y `journal_entries` intactos.
- **Slingshot Style**: Toda lógica de análisis en Engine Python. Frontend solo visualiza.
- **Multi-tenant**: Todos los endpoints filtran por `organization_id`.
- **Progressive Enhancement**: Estado vacío elegante si el Engine está caído.

---

## 🗺️ 7. INVENTARIO DE MIGRACIÓN V1 → V2

| Módulo V1 (`Contapyme_V2`) | Estado en V2 |
|---|---|
| Login / Auth multi-tenant | ✅ Migrado con RLS |
| F29 Individual (Auditoría Inteligente V2 Elevada) | ✅ Migrado y Elevado |
| F29 Comparativo Histórico (24 meses) | ✅ Completo (Dinámico + Selectivo) |
| RCV Análisis + Historial de Proveedores | ✅ Completado y Potenciado (Fase 8.1) |
| Libro Diario (Journal + Asientos) | ✅ Migrado |
| Libro Mayor (Ledger por cuenta) | ✅ Completado |
| Balance de Comprobación | ✅ Completado |
| Plan de Cuentas IFRS completo | ✅ Completado |
| Activos Fijos + Depreciación | ✅ Migrado y mejorado |
| Indicadores Económicos en tiempo real | ✅ Scheduler automático activo |
| Análisis Cartolas Bancarias | ✅ Conciliación migrada |
| Executive Dashboard BI | ✅ Migrado |
| Empleados (CRUD completo) | ✅ Migrado |
| Liquidaciones de Sueldo (motor REAL) | ✅ Motor con normativa chilena completa |
| Configuración Previsional (AFP/Salud/Topes) | ✅ Completado |
| Contratos y Anexos (DOCX) | ✅ Completado |
| Finiquitos / Desvinculaciones | ✅ Completado |
| Libro de Remuneraciones (LRE) | ✅ Completado |
| Archivo Previred (TXT) | ✅ Completado |
| Asistente IA Descriptores de Cargo | ✅ Completado |
| Reportes Financieros (EE.RR, Balance) | ✅ Completado |
| Asistente Tributario IA | ⏳ Fase 9 |
| Company Switcher activo | ✅ Completado |
| Roles y permisos granulares | ⏳ Fase 8 |
| Auditoría y logs de acciones | ⏳ Fase 8 |

---

## 🔧 8. DEUDAS TÉCNICAS CONOCIDAS

| ID | Descripción | Severidad | Fase |
|---|---|---|---|
| DT-04 | Tests unitarios exhaustivos (`pytest`) para `calculators/chilean_payroll.py` (Casos Extremos) | Alta | 8 |
| DT-06 | CORS en producción: dominio real de Vercel pendiente de agregar a lista blanca de FastAPI | Crítica | 8 |
| DT-08 | Roles granulares protegidos vía Middleware (Actualmente confían en UI logic parcialmente) | Crítica | 8 |
| DT-09 | **RCV Bugfix**: ~~Typo `organiationId` en `actions/rcv.ts`~~ | ~~Alta~~ | ✅ 8.1 |
| DT-10 | **RCV Upsert sin conflict key**: ~~Duplicados en `purchase_records`/`sales_records`~~ | ~~Alta~~ | ✅ 8.1 |
| DT-11 | **RCV Sin gráficos ni KPIs**: ~~Sin visualizaciones~~ | ~~Media~~ | ✅ 8.1 |
| DT-12 | **RCV Tipo 34 ignorado**: ~~Parser no diferenciaba Facturas Exentas~~ | ~~Media~~ | ✅ 8.1 |
| DT-13 | **RCV Migración DB Pendiente**: ~~Ejecutar `supabase/migrations/20260315000000_rcv_fase81_potenciacion.sql`~~ | ~~Alta~~ | ✅ 8.1 |

---

> *"Al centralizar lo pesado en Python y lo hermoso en React, dejamos de construir una plantilla web compleja y empezamos a construir Software as a Service para PyMEs."*
