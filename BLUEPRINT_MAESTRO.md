# 🎯 PROJECT: CONTAPYMEPUQ — BLUEPRINT MAESTRO
**Versión:** 9.5 (Certified Financial, Payroll & Contractual Integrity 📜)
**Estado:** Production & Audit-Ready 🚀
**Última Auditoría:** 12 de Agosto, 2026

---

> [!IMPORTANT]
> **PROYECTO DE REFERENCIA (SOURCE OF TRUTH):**
> Todas las funcionalidades, lógica de negocio y estética deben basarse y evolucionar desde:
> `C:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq`

> [!NOTE]
> **PARA INICIAR EL SISTEMA LOCAL:** Ejecutar `.\start.ps1` desde la raíz del proyecto.
> - Frontend: http://localhost:3000
> - Engine API + Docs: http://localhost:8000/docs

> [!TIP]
> **CERTIFIED ARCHIVAL & INTEGRITY (v9.5):** 
> - **Portal Público de Verificación (`/verify/[id]`)**: Validación pública inmutable de Liquidaciones, Vacaciones, Contratos, Finiquitos y Balances de 8 Columnas sin requerir autenticación.
> - **Estándar Legal de Contratos (10 Cláusulas - 2026)**: Cumplimiento de la Ley 21.561 (40 Horas), Ley Karin 21.643, Ley 17.336 (Propiedad Intelectual) y Ley 19.628 (Protección de Datos).
> - **Diferenciación Modalidades Contractuales**: Lógica diferenciada para contratos Indefinidos, Plazo Fijo, Honorarios (Retención 15.25%), Obra o Faena, Part-Time y Teletrabajo.
> - **Tesorería 360° & Conciliación Bancaria**: Sincronización inmutable transaccional en tiempo real con Libro Diario y pruebas de estrés pasadas (100%).
> - **Factor Feriado Zona Extrema Magallanes**: 20 días hábiles de feriado anual (factor 1.6667) aplicado en finiquitos y comprobantes de vacaciones.

---

## 🏗️ 1. ARQUITECTURA TÉCNICA Y DIAGRAMA LÓGICO

El ecosistema consta de 3 actores independientes comunicados mediante APIs REST:

```text
┌──────────────────────────────────────────────────────────────────────┐
│  MOTOR DE PROCESAMIENTO Y FISCALIZACIÓN (Python + FastAPI)           │
│  - RCV Auditor 2.0: Agregación real de documentos vs Bitácoras.      │
│  - DTE Core: Generación de XML, Firma Digital y Timbrado Electrónico.│
│  - INTEGRITY ENGINE: Cómputo de SHA-256 Chaining & QRs de Verificación│
│  - Documents Router: Contratos legal-grade 10 cláusulas & Finiquitos.│
│  - Conciliación API: API de cierre contable y blindaje bancario.     │
└───────────────────────────────────┬──────────────────────────────────┘
                                    │ API REST / JSON Struct
┌───────────────────────────────────▼──────────────────────────────────┐
│  CENTRO DE DATOS Y SEGURIDAD (Supabase PostgreSQL)                   │
│  - RLS (Row Level Security): EL MURO MULTI-TENANT. Datos Aislados.   │
│  - integrity_hash: Registro forense de inmutabilidad documental.     │
│  - Audit Logs: Trazabilidad total de acciones por organización.      │
│  - Database Triggers: Sincronización inmutable de estados de banco.  │
└───────────────────────────────────┬──────────────────────────────────┘
                                    │ Supabase Client / Server Actions
┌───────────────────────────────────▼──────────────────────────────────┐
│  FRONTEND INSTITUCIONAL (Next.js 16 App Router)                      │
│  - UI "Seamless": MarketTicker global & Footer Premium Magallanes.   │
│  - Verification Portal: /verify/[id] público para auditorías.        │
│  - Treasury 360°: Cobros RCV, Pagos a Proveedores y Nómina.          │
│  - Conciliación Bancaria: Interfaz interactiva de cuadratura contable.│
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 2. ESPECIFICACIÓN DE MÓDULOS (LOW LEVEL DESIGN)

### 2.1 📊 Módulo Base: Autenticación e Integridad
*   **Seguridad:** RLS nivel Dios en todas las tablas transaccionales.
*   **Integrity Chain:** Modelo `Hash(n) = SHA256(Record(n) + Hash(n-1))` para DTEs y sellos digitales en PDFs/DOCX.
*   **Audit Logs:** Registro GRC (Gobierno/Riesgo/Cumplimiento) de cada acción crítica.

### 2.2 🧾 Módulo RCV e Inteligencia
*   **RCV 2.0:** Motor de agregación real (físico) para auditoría de cumplimiento.
*   **Selector Inteligente:** Interfaz proactiva que solo muestra periodos con data.

### 2.3 📄 Módulo DTE, Contratos y Remuneraciones
*   **Contratos 10 Cláusulas:** Norma legal 2026 (Ley 40 horas & Ley Karin).
*   **Finiquitos Magallanes:** Factor de 20 días hábiles de feriado proporcional (1.6667/mes) y cálculo de años de servicio.
*   **SII Compliance:** Generación y firma de XML (SHA1/C14N).

### 2.4 📜 Módulo de Reportes Certificados & Verificación Pública
*   **Archivado Inmutable:** Repositorio en la nube (Supabase Storage) con metadatos en DB.
*   **Portal /verify/[id]:** Consulta pública directa de validez documental por QR o UUID.

### 2.5 🏦 Módulo de Tesorería & Conciliación Bancaria (v9.5)
*   **Sincronización Transaccional:** Centralización automática de cobros y pagos en Libro Diario.
*   **Gobernanza por Triggers:** La función de base de datos `sync_reconciliation_status` gestiona de forma inmutable el estado de reconciliación.

---

## 🚀 3. ROADMAP: LAS FASES DE EVOLUCIÓN

### FASE 12: Consolidación Institutional Grade 🏛️ — **COMPLETADO**
*   [x] **SSoT Utility Engine:** Módulo `shared_utils.py` operativo.
*   [x] **Blockchain Integrity:** Implementación de SHA-256 Integrity Chaining en DTEs.
*   [x] **Financial Certification:** Módulo de Reportes Certificados y Repositorio en la nube.

### FASE 13: Despliegue a Producción y Estabilización Bancaria 🌐 — **COMPLETADO**
*   [x] **IaC (Infrastructure as Code):** `render.yaml` y `railway.json` creados.
*   [x] **Sincronización de Conciliación:** Implementación del endpoint `/save-reconciliation` y migración SQL de triggers.
*   [x] **Test E2E Final:** Validación de cadena de integridad en producción.

### FASE 14: Ecosistema Jurídico, Verificación Criptográfica y UI World-Class 🛡️ — **COMPLETADO**
*   [x] **Portal Público de Verificación (`/verify/[id]`):** Soporte multi-documento para liquidaciones, contratos, finiquitos y balances.
*   [x] **Estándar Legal de Contratos 2026:** Plantilla Word de 10 cláusulas (Ley 40 Horas & Ley Karin).
*   [x] **Diferenciación de Contratos:** Adaptación matemática y gráfica para Indefinido, Plazo Fijo, Honorarios y Part-Time.
*   [x] **Tesoreria & Flujo de Caja:** Integración 360° con Libro Diario y pruebas de estrés aprobadas (100%).
*   [x] **Rediseño Footer Público:** Estética corporativa de 5 columnas con sellos de garantía y marca regional Magallanes.

---

## 🏛️ VISIÓN ESTRATÉGICA
Contapymepuq es el ecosistema de confianza institucional líder en Magallanes. La versión 9.5 consagra la **Inmutabilidad por Diseño, el Cumplimiento Legal 2026 y la Cuadratura Bancaria de Alto Estándar**.

---
© 2026 Contapymepuq — Propiedad Intelectual Reservada. Magallanes, Chile.
