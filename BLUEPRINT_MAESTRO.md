# 🎯 PROJECT: CONTAPYMEPUQ — BLUEPRINT MAESTRO
## "Precisión Institucional y Escalabilidad Organizacional para el Contador Moderno."
> **Versión:** 5.0 (Magallanes 2077 — Integrity Hardening 🛡️💎) | **Fecha:** 2026-05-16 | **Estado:** ESTABLE — Producción Ready & Auditoría Real 🚀

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

> [!TIP]
> **CADENA DE INTEGRIDAD (SSoT 2026):** 
> El sistema ahora implementa una **Hash Chain SHA-256** para documentos tributarios, garantizando que los registros sean inalterables y auditables.

---

## 🏗️ 2. ARQUITECTURA TÉCNICA Y DIAGRAMA LÓGICO

El ecosistema ahora consta de 3 actores independientes que se comunican de forma ágil mediante APIs REST:

```text
┌──────────────────────────────────────────────────────────────────────┐
│  MOTOR DE PROCESAMIENTO Y FISCALIZACIÓN (Python + FastAPI)           │
│  - RCV Auditor 2.0: Agregación real de documentos vs Bitácoras.      │
│  - DTE Core: Generación de XML, Firma Digital y Timbrado Electrónico.│
│  - calculators/chilean_payroll.py: Motor de Remuneraciones REAL.     │
│  - Scraping & Workers: Sincronización automática de indicadores.     │
└───────────────────────────────────┬──────────────────────────────────┘
                                    │ API REST / JSON Struct
┌───────────────────────────────────▼──────────────────────────────────┐
│  CENTRO DE DATOS Y SEGURIDAD (Supabase PostgreSQL)                   │
│  - RLS (Row Level Security): EL MURO MULTI-TENANT. Datos Aislados.   │
│  - Integrity Chain: SHA-256 Hash vinculando cada DTE emitido.        │
│  - Audit Logs: Trazabilidad total de acciones por organización.      │
└───────────────────────────────────┬──────────────────────────────────┘
                                    │ Supabase Client / Server Actions
┌───────────────────────────────────▼──────────────────────────────────┐
│  FRONTEND INSTITUCIONAL (Next.js 16 App Router)                      │
│  - UI "Seamless": MarketTicker global (Bloomberg style).             │
│  - Billing Module: Emisión de DTE con autocompletado inteligente.    │
│  - RCV Intelligence: Análisis profundo de compras y ventas.          │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 3. DEEP DIVE Y ESPECIFICACIÓN DE MÓDULOS (LOW LEVEL DESIGN)

### 3.1 📊 Módulo Base: Autenticación e Integridad Multi-Tenant
*   **Base de Datos:** Tablas troncales de `organizations` y `organization_members`.
*   **Seguridad:** RLS (Row Level Security) nivel Dios en todas las tablas transaccionales.
*   **Audit Logs:** Registro de cada acción crítica (entity_type, action, details) para trazabilidad GRC.

### 3.2 🧾 Módulo RCV: Auditoría Real e Inteligencia
*   **RCV 2.0:** Motor de agregación que suma documentos físicos en lugar de confiar en bitácoras externas.
*   **Selector Inteligente:** Solo muestra periodos con datos reales, eliminando meses "fantasma".

### 3.3 📄 Módulo DTE: Facturación Electrónica (SII Compliance)
*   **XML Builder:** Generación de esquemas DTE según estándar del SII.
*   **Signer Core:** Firma digital usando PKCS1v15 y SHA1 con canonización C14N.
*   **CAF Manager:** Gestión automática de folios y avisos de agotamiento de rangos.

### 3.4 👥 Módulo Remuneraciones y Finiquitos
*   **Motor Real:** Normativa laboral chilena completa (Topes UF, Gratificación Art. 50, IRPF).
*   **Firmas Digitales:** Soporte para `signature_base64` en liquidaciones y finiquitos.

---

## 🚀 4. INTEGRIDAD DE BASE DE DATOS (SINCRO 2026-05)

| Tabla | Propósito Crítico | Campos de Elite Sincronizados |
|---|---|---|
| `dte_issued` | Facturación Emitida | `integrity_hash`, `previous_hash`, `xml_content`, `folio` |
| `dte_caf_folios` | Gestión SII | `range_start`, `range_end`, `last_used_folio`, `caf_xml` |
| `purchase_records` | Auditoría Compras | `monto_total`, `periodo`, `organization_id` |
| `audit_logs` | GRC (Gobierno/Riesgo) | `user_id`, `action`, `details` (jsonb), `ip_address` |

---

## 🚀 6. ROADMAP: LAS FASES DE DESPLIEGUE

### FASE 11: Facturación y Auditoría Profunda 💎 — **EN PROGRESO**
*   [x] **RCV Auditor 2.0:** Motor de agregación real implementado.
*   [x] **DTE Core Engine:** Generador y firmador de XML operativo.
*   [x] **Integrity Chain:** Implementación de Hashes SHA-256 en DB.
*   [ ] **SII Connector:** Envío automático a la API del SII (Soap/Rest).
*   [ ] **PDF Generation:** Generación de representación impresa (Acrobat PDF).

---

> *"Al centralizar lo pesado en Python y lo hermoso en React, dejamos de construir una plantilla web compleja y empezamos a construir un **SaaS Contable de Clase Mundial**."*
ddress` |

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
