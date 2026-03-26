# 🎯 PROJECT: CONTAPYME V2 — BLUEPRINT MAESTRO
## "Precisión Institucional y Escalabilidad Organizacional para el Contador Moderno."
> **Versión:** 3.2 (Magallanes 2077 — Master Centralization 🛡️💎) | **Fecha:** 2026-03-26 | **Estado:** EN DESARROLLO 🚧 — Idempotencia F29 & Limpieza de Fechas IFRS

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
>
> [!TIP]
> **AUDITORÍA DE ESQUEMA (SINCRO 26-03 FINAL):** 
> El estado maestro de todas las tablas se encuentra consolidado en:
> `supabase/snapshots/master_snapshot_20260326.sql` (Única Fuente de Verdad Sincronizada).

---

## 🔬 1. EL PIVOTE TECNOLÓGICO: UNA AUDITORÍA DEL PASADO (V1)

El proyecto heredado (`Contapyme_V2/docs/BLUEPRINT_MAESTRO.md`) fue construido como un monolito en Next.js donde toda la carga recaía sobre el ecosistema JavaScript del cliente o Node.js. Esto generó tres grandes fallas arquitectónicas críticas:
1. **Inestabilidad del Parser F29:** El análisis de PDFs tributarios se hacía a fuerza bruta buscando cadenas binarias. Confiabilidad inaceptable para el ecosistema contable (85-95%) y problemas graves de *Memory Leaks* (Cuelgues y Error 500).
2. **Seguridad Multi-Tenant Inexistente:** Todos los usuarios operaban sobre una capa precaria sin Row Level Security (RLS) en base de datos.
3. **Mezcla de Visualización y Lógica Pesada:** Next.js se ahogaba intentando correr matemáticas de liquidaciones de sueldo e IRPF de segunda categoría de forma local en el navegador del cliente en vez de confiarlo a un motor de procesamiento.

**La nueva visión (V2/V3):** Contapyme V2 se mueve a la arquitectura **Slingshot**: una división rígida pero fluida entre la **Fuerza Bruta de Cómputo** (FastAPI / Python) y la **Visualización Ejecutiva Premium** (Next.js / TypeScript). **V2 utiliza la base de código de `Contapyme_V2` como fundación**, rescatando su diseño, sus layouts y componentes funcionales (Liquidaciones, Dashboard), mientras refactoriza e independiza el core conflictivo bajo un estándar estético de **"Luxury ERP"**.

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
│  - UI Institucional: Estética "Luxury ERP" (Glassmorphism + Neon).   │
│  - Autenticación Frontal con Middleware SSR.                         │
│  - Visualización Reactiva: Dashboard Multi-Empresa para Contadores.  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 3. DEEP DIVE Y ESPECIFICACIÓN DE MÓDULOS (LOW LEVEL DESIGN)

Cada sistema interno de Contapyme opera bajo el modelo de responsabilidades duales:

### 3.1 📊 Módulo Base: Autenticación y Arquitectura Multi-Tenant (B2B)
El sistema abandona el 1 a 1 y asume que el usuario es un Contador gestionando decenas de carpetas.
*   **Base de Datos:** Tablas troncales de `organizations` y `organization_members`. **Toda** tabla transaccional (Ej. `f29_forms`, `employees`, `bank_reconciliations`) hereda y se amarra al `organization_id`.
*   **Next.js:** Provee la selección activa del cliente (El "Company Switcher" en el Header) que filtra localmente y visualmente todas las tablas y dashboards.

### 3.2 🧾 Módulo F29: Auditoría Tributaria Inteligente (V2 Elevada)
El corazón comercial del producto. Convierte papeleo en analítica estratégica "Clase Mundial".
*   **Next.js:** Dashboard interactivo que visualiza ratios críticos: **Margen Operacional Proyectado**, **Carga Tributaria**, **Efectividad de IVA** y **Ratio Crédito/Débito**. 
    - **Gestión Dinámica:** Sistema de checkboxes para comparación selectiva de periodos y tabla de historial con eliminación de registros (Consola de Control).
    - **Visualización:** Gráficos de tendencias (Recharts) con renderizado optimizado por debouncing y claves dinámicas.
    - **Insights:** Alertas automáticas sobre tendencias de pago (Alza/Baja) y coherencia fiscal.
*   **Python Engine:** `parsers/f29_plumber.py` (Proximidad Global V2.1). Captura códigos 563 (Ventas), 538, 537, 062, 151 y 049. Ejecuta una **Lógica de Auditoría Multidimensional** que genera alertas inteligentes ante anomalías o discrepancias de IVA.
    - **Centralización Contable Automática (Idempotente):** Endpoint `POST /centralize` convierte mágicamente los campos en un asiento perfecto IFRS.
    - **API Endpoint:** Soporte para `DELETE` por ID con **Limpieza en Cascada** automática hacia el Libro Mayor/Diario.

### 3.3 👥 Módulo Remuneraciones (Payroll) y Finiquitos
Extensa lógica progresiva y normativa chilena completa con **Estética Institucional**.
*   **Next.js (Luxury UI):** CRUD de empleados mejorado con perfiles demográficos (RUT, Sexo, Estado Civil, Nacionalidad).
    - **Motor de Finiquito (V3.0):** Interfaz táctica con glasmorfismo, franjas de neón y selectores de causales legales de alta visibilidad (Popper Engine).
    - **Acciones:** Procesar nómina individual/masiva, exportar Previred, generar contratos DOCX.
*   **Python Engine:** `calculators/chilean_payroll.py` — Motor puro con tabla IRPF SII progresiva, topes AFP/Salud por UF, gratificación legal topada (Art. 50 CT), AFC, SIS y cargos empresa. Soporta cálculos complejos de finiquitos (Vacaciones proporcionales, Indemnización por años de servicio, Mes de Aviso).

### 3.4 🏢 Módulo de Activos Fijos (Depreciación e Inventario IFRS) — [ESTADO: ✅ INTEGRADO]
Sistema centralizado para el control de propiedad, planta y equipo (PPE) bajo normativa IIFRS/NIC16.
*   **Python Engine (`api/routers/assets.py`):** Cálculos automatizados de depreciación (Lineal y Acelerada) con protecciones anti-duplicación por periodo.
    - **Centralización Atómica:** Inyección de asientos contables mediante la RPC `create_journal_entry_with_lines`, vinculando el gasto (`5.1.03.001`) contra la depreciación acumulada (`1.1.05.001`) de forma automática.
    - **Trazabilidad:** Cada asiento del Libro Diario guarda el `fixed_asset_id` para auditorías históricas.
*   **Next.js (Luxury UI):** Dashboard de activos con visualización de valor libro, valor residual y depreciación acumulada.
    - **Gestión de Inventario Física:** Control detallado de metadatos: Categoría, Marca, Modelo, Ubicación y Responsable asignado.
    - **Acciones Rápidas:** Botón de "Ejecutar Depreciación" que gatilla el cierre contable del módulo en un solo clic.

### 3.5 📉 Módulo Indicadores Económicos
*   **Python Engine:** `workers/indicators_scheduler.py` — APScheduler que corre **automáticamente Lun-Vie a las 09:00 AM (hora Santiago)** consultando mindicador.cl y almacenando en Supabase. También se ejecuta al iniciar el servidor (lifespan FastAPI).

### 3.7 🏦 Módulo de Conciliación Bancaria (Persistencia Avanzada)
Supera al Master mediante la persistencia de movimientos y reglas de aprendizaje.
*   **Next.js:** Centro de Conciliación. Visualización de "Cruce de Datos" entre Cartola vs Libro Mayor. Sistema semi-automático para marcar transacciones conciliadas.
    - **Gestión de Cuentas:** CRUD de bancos y cuentas corrientes vinculadas a cuentas contables.
    - **Upload Manager:** Historial de archivos procesados y saldos de cuadratura.
*   **Python Engine:** `routers/bank_reconciliation.py` — Motor de parsing (Regex + IA) que identifica tipos de movimiento, RUTs de origen y patrones.
    - **Inteligencia de Mapeo:** Aplica `bank_mapping_rules` para pre-clasificar gastos (Ej: "TELEFONIA" -> Cuenta Gastos Comunicaciones).

### 3.8 📚 Módulo Contabilidad IFRS y RCV (Blindaje de Integridad)
El pilar de la salud contable con **Arquitectura de Integridad Inquebrantable**.
*   **Python Engine:** Procesa XML/CSV del RCV del SII. Cuadra compras y ventas, genera asientos para el Libro Diario.
*   **Blindaje SQL e Integridad Multitenencia (V3.0):** 
    - **Aislamiento Total:** Implementación de `organization_id` denormalizado en tablas hijo (`journal_entry_lines`, `bank_statement_lines`, `f29_box_details`, `bank_reconciliations`) para RLS ultra-rápido y seguridad absoluta.
    - **Automatización de Integridad:** Triggers `fill_org_id_from_parent` que garantizan que el ID de empresa se asigne automáticamente en cada inserción desde la base de datos, eliminando el riesgo de "datos huérfanos".
    - **Idempotencia Transaccional:** Uso estratégico de campos de metadatos `source_type` y `source_id` que purgan antiguos clones de un asiento al procesarlo, previniendo para siempre el Error de Desfase de Saldos.
    - **Sincronización de Tiempos IFRS:** Frontend fortificado para convertir `YYYY-MM-DD` sin manipulaciones Timezone UTC, protegiendo 100% las visualizaciones del último día del mes (Ej: 31-03 no renderiza como 30-03).
    - **Optimización de Rendimiento:** Índices compuestos en todas las llaves de organización para consultas de Libro Mayor y Cartolas en milisegundos.
*   **Next.js:** RCV Dashboard con **Visión de Inteligencia Pasiva**:
    - **Detección Automática:** El sistema detecta el mes/año desde el archivo (Zero-Click Awareness).
    - **Orden Cronológico:** Priorización automática de los periodos más recientes.
    - **Integridad:** Sincronizado con triggers SQL y lógica de aislamiento por organización.
*   **3.9 🚀 Módulo de Onboarding Institucional (UX Premium)**
    - **Paso 1: Perfil Profesional:** Captura de datos extendidos del contador (Teléfono, Especialidad/Rol).
    - **Paso 2: Constitución de Empresa:** Registro de RUT, Nombre, Giro y **Régimen Tributario** (Pro Pyme, General, etc.).
    - **Paso 3: Aprovisionamiento Automático:** Ejecución de RPCs para sembrar el Plan de Cuentas estándar Chile y la Configuración Previsional (AFPs/Isapres) de forma atómica.
    - **Paso 4: Activación:** Marcado de `onboarding_completed` y redirección al Dashboard operativo.

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
│       ├── 📁 actions/                  # 18 Server Actions (intermedian Client ↔ Engine/Supabase)
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

### Server Actions activos (18 archivos)

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
| `actions/termination-causes.ts` | `getTerminationCausesAction` | ✅ |

---

## 🚀 6. ROADMAP: LAS FASES DE DESPLIEGUE

### FASE 1 - 7 ✅ COMPLETADAS (Módulos Core e Infraestructura Base)

## 🗓️ Hoja de Ruta (Q1-Q2 2026)

### Fase 8: Hardening Maestro (Sincro Total) 🛡️ — **100% COMPLETADO**
*   [x] **Auditoría Virtual B2B:** Registro de acciones críticas (Logs) y visualización en Settings.
*   [x] **Roles Granulares:** Implementación de RBAC (Owner/Admin/Accountant) en Engine y Frontend.
*   [x] **Invitaciones de Equipo:** Sistema de invitaciones vía email y gestión de miembros (Activo).
*   [x] **Stress-Test:** Validaciones masivas del Payroll Calculator (1000+ iters) y pruebas unitarias.
*   [x] **Automatización de Indicadores:** Worker cronometrado (APScheduler) integrado en el Lifespan.
*   [x] **Sincronización de Esquema:** Generación de snapshots SQL y validación de tipos TS.
*   [x] **Flujo de Onboarding:** Implementación de registro paso a paso con seeding automático de configuración.
*   [x] **CI/CD Ready:** Dockerfile y railway.json configurados para despliegue automático.

### Fase 9: Consolidación Transaccional y Auditoría Final 💎 — **EN PROCESO AVANZADO**
*   [x] **Sincronización Contable:** Generación de un Sistema de Asientos Automático (Idempotencia en Nómina y F29).
*   [x] **Integridad Temporal Completa:** Resolución de "Timezone Shift Bugs" en Libro Mayor y Diario.
*   [x] **Limpieza en Cascada:** Borrado seguro de Impuestos vs Contabilidad sin dejar sombras en el Ledger.
*   [x] **Sovereign AI (Memoria Cognitiva):** Predictor Naive Bayes inyectado en conciliación bancaria mapeando con Chart of Accounts.
*   [x] **Visualización Ejecutiva & Diario Regional:** Sankey Flow Chart vivo en Dashboard y Módulo de Periodismo Sintético (Worker de noticias locales).
*   [x] **Alineación de IA (Skills):** Normativas `magallanes-regional-newspaper` y `ai-journalism-synthesis` para blindaje legal anti-copyright y prevención de alucinación NLP.
*   [ ] **Seguridad Avanzada:** Copias de seguridad automáticas (Supabase PITR).
*   [ ] **Exportador Autorizado:** XML LCE SII con firma `ds:Signature` instalada.

---

## 🗺️ 7. INVENTARIO DE MIGRACIÓN V1 → V2/V3 (Sincro Maestro)

| Módulo V1 (`Contapyme_V2`) | Estado en V2/V3 |
|---|---|
| Login / Auth multi-tenant | ✅ Migrado con RLS Hardening |
| F29 Individual (Auditoría Inteligente V2 Elevada) | ✅ Migrado y Elevado |
| RCV Análisis + Historial de Proveedores | ✅ Completado y Potenciado (Fase 8.1) |
| Plan de Cuentas IFRS completo | ✅ Completado (Sincro Unique Constraints) |
| Liquidaciones de Sueldo (motor REAL) | ✅ Motor con normativa chilena completa (UF/IMM Sincro) |
| **Motor de Finiquitos (Luxury UI)** | ✅ Completado (Art. 159, 161, 163 CT) |
| Asistente IA Descriptores de Cargo | ✅ Completado |
| Reportes Financieros (EE.RR, Balance) | ✅ Completado |
| Company Switcher activo | ✅ Completado |
| Roles y permisos granulares | ✅ Completado (Fase 8) |

---

## 🔧 8. DEUDAS TÉCNICAS CONOCIDAS

| ID | Descripción | Severidad | Estado |
|---|---|---|---|
| DT-14 | Seguridad de Engine: Auth Middleware JWT implementado | Crítica | **✅ CUMPLIDO** |
| DT-17 | Auditoría: Tabla `audit_logs` y motor de logging centralizado | Crítica | **✅ CUMPLIDO** |
| DT-15 | Atomicidad: Importación RCV y Asientos bajo transacción única (`batch_create_journal_entries` RPC) | Crítica | **✅ CUMPLIDO** |
| DT-16 | Observabilidad: `log_system_error()` registra fallos de parsers (F29, RCV) en Bitácora Central | Media | **✅ CUMPLIDO** |


---

> *"Al centralizar lo pesado en Python y lo hermoso en React, dejamos de construir una plantilla web compleja y empezamos a construir un **SaaS Contable de Clase Mundial**."*
