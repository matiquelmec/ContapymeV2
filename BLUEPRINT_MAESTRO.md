# 🎯 PROJECT: CONTAPYMEPUQ — BLUEPRINT MAESTRO
## "Precisión Institucional y Escalabilidad Organizacional para el Contador Moderno."
> **Versión:** 4.0 (Magallanes 2077 — Institutional Hardening 🛡️💎) | **Fecha:** 2026-04-01 | **Estado:** ESTABLE — Producción Ready & Sincronización Automática 🚀

> [!IMPORTANT]
> **PROYECTO DE REFERENCIA (SOURCE OF TRUTH):**
> Todas las funcionalidades, lógica de negocio y estética deben basarse y evolucionar desde:
> `C:\Users\Matías Riquelme\.gemini\antigravity\scratch\01_Proyectos\Contapymepuq`
> El proyecto activo en desarrollo se encuentra en:
> `C:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq`

> [!NOTE]
> **PARA INICIAR EL SISTEMA LOCAL:** Ejecutar `.\start.ps1` desde la raíz del proyecto.
> - Frontend: http://localhost:3000
> - Engine API + Docs: http://localhost:8000/docs
>
> [!TIP]
> **AUDITORÍA DE ESQUEMA (SINCRO 01-04 INSTITUCIONAL):** 
> El estado maestro de todas las tablas se encuentra consolidado en:
> `supabase/snapshots/master_snapshot_20260401.sql` (Única Fuente de Verdad Sincronizada).

---

## 🏗️ 2. ARQUITECTURA TÉCNICA Y DIAGRAMA LÓGICO

El ecosistema ahora consta de 3 actores independientes que se comunican de forma ágil mediante APIs REST:

```text
┌──────────────────────────────────────────────────────────────────────┐
│  MOTOR DE PROCESAMIENTO MATEMÁTICO (Python + FastAPI)                │
│  - PyMuPDF / Tesseract OCR: Precisión 100% en PDFs (F29, etc.).      │
│  - calculators/chilean_payroll.py: Motor de Remuneraciones REAL.     │
│  - Scraping & Workers: Sincronización automática de indicadores.     │
│  - Synthesis Engine: Redacción automática de noticias regionales.     │
└───────────────────────────────────┬──────────────────────────────────┘
                                    │ API REST / JSON Struct
┌───────────────────────────────────▼──────────────────────────────────┐
│  CENTRO DE DATOS Y SEGURIDAD (Supabase PostgreSQL)                   │
│  - RLS (Row Level Security): EL MURO MULTI-TENANT. Datos Aislados.   │
│  - Protocolo de Integridad: Triggers org_id auto-fill.               │
└───────────────────────────────────┬──────────────────────────────────┘
                                    │ Supabase Client / Server Actions
┌───────────────────────────────────▼──────────────────────────────────┐
│  FRONTEND INSTITUCIONAL (Next.js 16 App Router)                      │
│  - UI "Seamless": MarketTicker global (Bloomberg style).             │
│  - Executive Dashboard: Análisis Financiero Contapymepuq.            │
│  - Zero-Maintenance: Sincronización proactiva y estados inteligentes.│
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 3. DEEP DIVE Y ESPECIFICACIÓN DE MÓDULOS (LOW LEVEL DESIGN)

### 3.1 📊 Módulo Base: Autenticación e Integridad Multi-Tenant
*   **Base de Datos:** Tablas troncales de `organizations` y `organization_members`.
*   **Seguridad:** RLS (Row Level Security) nivel Dios en todas las tablas transaccionales.
*   **Audit Logs:** Registro de cada acción crítica (entity_type, action, details) para trazabilidad GRC.

### 3.2 🧾 Módulo F29: Auditoría Tributaria Inteligente
*   **Visualización:** Gráficos de tendencias e insights automáticos de carga tributaria.
*   **Centralización:** Generación idempotente de asientos contables IFRS desde el parser Python.

### 3.3 👥 Módulo Remuneraciones, Finiquitos y "Papel Cero"
*   **Motor Real:** Normativa laboral chilena completa (Topes UF, Gratificación Art. 50, IRPF).
*   **Firmas Digitales:** Soporte para `signature_base64` en liquidaciones y finiquitos.
*   **Folios:** Sistema de numeración de folios único por organización.
*   **Data Demográfica:** RUT, Sexo, Estado Civil, Nacionalidad y Plan de Salud UF integrados.

### 3.4 🏘️ Módulo de Periodismo Regional (Sovereign AI)
*   **News Engine:** Automatización de noticias locales Magallánicas con soporte para slugs SEO y resúmenes inteligentes.

### 3.5 📉 Módulo Indicadores y MarketPulse
*   **MarketTicker:** Cinta Bloomberg integrada en el Layout 108px.
*   **Automatización:** Actualización desatendida mediante APScheduler en el Engine Python.

---

## 🚀 4. INTEGRIDAD DE BASE DE DATOS (SINCRO 01-04)

El sistema opera bajo los siguientes esquemas validados (Contexto Institucional):

| Tabla | Propósito Crítico | Campos de Elite Sincronizados |
|---|---|---|
| `liquidations` | Nómina Mensual | `signature_base64`, `folio_number`, `salud_total`, `asignacion_familiar` |
| `employees` | Capital Humano | `plan_salud_uf`, `asignacion_colacion`, `sexo`, `estado_civil` |
| `regional_news` | Periodismo Sintético | `slug`, `normalized_title`, `summary`, `source_url` |
| `economic_indicators` | Market Data | `codigo`, `valor`, `fuente`, `updated_at` |
| `bank_accounts` | Tesorería | `bank_name`, `account_type`, `chart_account_id` |
| `audit_logs` | GRC (Gobierno/Riesgo) | `user_id`, `action`, `details` (jsonb), `ip_address` |

---

## 🚀 6. ROADMAP: LAS FASES DE DESPLIEGUE

### FASE 9: Institucionalización y Hardening Maestro 💎 — **100% COMPLETADO**
*   [x] **Rebranding:** Migración de V2 a **CONTAPYMEPUQ**.
*   [x] **MarketTicker Seamless:** Cinta de indicadores global (44px) integrada.
*   [x] **Zero-Button UI:** Sincronización proactiva de datos económicos.
*   [x] **Alineación Geométrica:** Horizonte alineado a 108px en todo el Dashboard.
*   [x] **Firmas de Liquidación:** Implementación de persistencia de firmas para validez legal.

### Fase 10: Inteligencia Predictiva y Expansión 🚀 — **EN PLANIFICACIÓN**
*   [ ] **Cashflow Predictor:** Análisis de tendencias basado en RCV histórico.
*   [ ] **Certificación LRE Automática:** Firma digital masiva delegada en la DT.
*   [ ] **API Partner:** Integración con puntos de venta (POS) locales.

---

> *"Al centralizar lo pesado en Python y lo hermoso en React, dejamos de construir una plantilla web compleja y empezamos a construir un **SaaS Contable de Clase Mundial**."*
