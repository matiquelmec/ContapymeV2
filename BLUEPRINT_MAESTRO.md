# 🎯 PROJECT: CONTAPYMEPUQ — BLUEPRINT MAESTRO
**Versión:** 8.6 (Certified Financial Integrity 📜)
**Estado:** Production & Audit-Ready 🚀
**Última Auditoría:** 16 de Mayo, 2026

---

> [!IMPORTANT]
> **PROYECTO DE REFERENCIA (SOURCE OF TRUTH):**
> Todas las funcionalidades, lógica de negocio y estética deben basarse y evolucionar desde:
> `C:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq`
> **Modelos de Inspiración:** `SistemaOC` (Datos Legacy) y `Cliclaboral` (Arquitectura Institucional).

> [!NOTE]
> **PARA INICIAR EL SISTEMA LOCAL:** Ejecutar `.\start.ps1` desde la raíz del proyecto.
> - Frontend: http://localhost:3000
> - Engine API + Docs: http://localhost:8000/docs

> [!TIP]
> **CERTIFIED ARCHIVAL (v8.6):** 
> - **Financial Repository**: Implementado archivado inmutable de reportes con SHA-256 en `certified_reports`.
> - **Blockchain-like Ledger**: SHA-256 Hash Chaining para DTEs en `engine/core/dte/dte_logic.py`.
> - **Dossier Técnico**: Ver `docs/audit/DOC_CUMPLIMIENTO_TECNICO.md` para estándares normativos.
> - **SSoT Utility**: Lógica unificada en `engine/core/utils/shared_utils.py`.

---

## 🏗️ 1. ARQUITECTURA TÉCNICA Y DIAGRAMA LÓGICO

El ecosistema consta de 3 actores independientes comunicados mediante APIs REST:

```text
┌──────────────────────────────────────────────────────────────────────┐
│  MOTOR DE PROCESAMIENTO Y FISCALIZACIÓN (Python + FastAPI)           │
│  - RCV Auditor 2.0: Agregación real de documentos vs Bitácoras.      │
│  - DTE Core: Generación de XML, Firma Digital y Timbrado Electrónico.│
│  - INTEGRITY ENGINE: Cómputo de SHA-256 Chaining (Blockchain Ledger).│
│  - shared_utils.py: SSoT de lógica matemática y RUT.                 │
└───────────────────────────────────┬──────────────────────────────────┘
                                    │ API REST / JSON Struct
┌───────────────────────────────────▼──────────────────────────────────┐
│  CENTRO DE DATOS Y SEGURIDAD (Supabase PostgreSQL)                   │
│  - RLS (Row Level Security): EL MURO MULTI-TENANT. Datos Aislados.   │
│  - integrity_hash: Registro forense de inmutabilidad documental.     │
│  - Audit Logs: Trazabilidad total de acciones por organización.      │
└───────────────────────────────────┬──────────────────────────────────┘
                                    │ Supabase Client / Server Actions
┌───────────────────────────────────▼──────────────────────────────────┐
│  FRONTEND INSTITUCIONAL (Next.js 16 App Router)                      │
│  - UI "Seamless": MarketTicker global (Bloomberg style).             │
│  - Billing Module: Emisión de DTE con Integridad Verificada.         │
│  - RCV Intelligence: Análisis profundo de compras y ventas.          │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 2. ESPECIFICACIÓN DE MÓDULOS (LOW LEVEL DESIGN)

### 2.1 📊 Módulo Base: Autenticación e Integridad
*   **Seguridad:** RLS nivel Dios en todas las tablas transaccionales.
*   **Integrity Chain:** Modelo `Hash(n) = SHA256(Record(n) + Hash(n-1))` para DTEs.
*   **Audit Logs:** Registro GRC (Gobierno/Riesgo/Cumplimiento) de cada acción crítica.

### 2.2 🧾 Módulo RCV e Inteligencia
*   **RCV 2.0:** Motor de agregación real (físico) para auditoría de cumplimiento.
*   **Selector Inteligente:** Interfaz proactiva que solo muestra periodos con data.

### 2.3 📄 Módulo DTE y Remuneraciones
*   **SII Compliance:** Generación y firma de XML (SHA1/C14N).
*   **Blockchain Ledger:** Auditoría forense integrada en `DTELogic`.
*   **Firmas Digitales:** Integración de `signature_base64` en documentos legales.

### 2.4 📜 Módulo de Reportes Certificados
*   **Archivado Inmutable:** Repositorio en la nube (Supabase Storage) con metadatos en DB.
*   **Certificación Digital:** Sello SHA-256 único por reporte para auditoría forense.
*   **Gestión de Historial:** Interfaz de usuario para descarga, validación y borrado seguro.

---

## 🚀 3. ROADMAP: LAS FASES DE EVOLUCIÓN

### FASE 12: Consolidación Institutional Grade 🏛️ — **COMPLETADO**
*   [x] **SSoT Utility Engine:** Módulo `shared_utils.py` operativo.
*   [x] **Higiene de Proyecto:** Eliminación de redundancias y scripts inseguros.
*   [x] **Blockchain Integrity:** Implementación de SHA-256 Integrity Chaining en DTEs.
*   [x] **Financial Certification:** Módulo de Reportes Certificados y Repositorio en la nube (v8.6).
*   [x] **Dossier Técnico:** `DOC_CUMPLIMIENTO_TECNICO.md` creado.

### FASE 13: Despliegue a Producción 🌐 — **EN PROGRESO**
> **Presupuesto:** $7 — $20 USD/mes | **Plan completo:** `docs/plan_despliegue_produccion.md`

| Servicio | Proveedor | Costo |
| :--- | :--- | ---: |
| Frontend (Next.js 16) | Vercel Hobby | $0 |
| Engine (FastAPI/Docker) | Render Starter | $7 |
| Base de Datos (PostgreSQL) | Supabase Free | $0 |
| **TOTAL MÍNIMO** | | **$7/mes** |

*   [x] **IaC (Infrastructure as Code):** `render.yaml` creado.
*   [ ] **Deploy Engine:** Conectar repo a Render, configurar env vars.
*   [ ] **Deploy Frontend:** Conectar repo a Vercel, apuntar a `/app`.
*   [ ] **Dominio:** Registrar `contapymepuq.cl` en NIC Chile.
*   [ ] **Test E2E Final:** Validación de cadena de integridad en producción.

---

## 🏛️ VISIÓN ESTRATÉGICA
Contapymepuq es el ecosistema de confianza institucional líder en Magallanes. La versión 8.0 consagra la **Inmutabilidad por Diseño**, transformando la contabilidad tradicional en un sistema de registro criptográfico de clase mundial.

> *"Al centralizar lo pesado en Python y lo hermoso en React, dejamos de construir una plantilla web compleja y empezamos a construir un **SaaS Contable de Clase Mundial**."*

---
© 2026 Contapymepuq — Propiedad Intelectual Reservada. Magallanes, Chile.
