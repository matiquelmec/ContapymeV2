# 🎯 PROJECT: CONTAPYMEPUQ — BLUEPRINT MAESTRO
## "Precisión Institucional y Escalabilidad Organizacional para el Contador Moderno."
> **Versión:** 6.0 (Magallanes 2077 — Institutional Grade 🏛️) | **Fecha:** 2026-05-16 | **Estado:** SINCRO TOTAL — Auditada y Refactorizada 🚀

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
> **CADENA DE INTEGRIDAD Y SOT (2026):** 
> - **Blockchain-like Ledger**: Hash Chain SHA-256 para documentos DTE.
> - **Unified Logic**: Lógica compartida en `engine/core/utils/shared_utils.py` para coherencia total.
> - **Central Testing**: Suite unificada en `/tests` para validación continua.

---

## 🏗️ 1. ARQUITECTURA TÉCNICA Y DIAGRAMA LÓGICO

El ecosistema consta de 3 actores independientes comunicados mediante APIs REST:

```text
┌──────────────────────────────────────────────────────────────────────┐
│  MOTOR DE PROCESAMIENTO Y FISCALIZACIÓN (Python + FastAPI)           │
│  - RCV Auditor 2.0: Agregación real de documentos vs Bitácoras.      │
│  - DTE Core: Generación de XML, Firma Digital y Timbrado Electrónico.│
│  - calculators/chilean_payroll.py: Motor de Remuneraciones REAL.     │
│  - core/utils/shared_utils.py: SSoT de lógica matemática y RUT.      │
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

## 🛠️ 2. ESPECIFICACIÓN DE MÓDULOS (LOW LEVEL DESIGN)

### 2.1 📊 Módulo Base: Autenticación e Integridad
*   **Seguridad:** RLS nivel Dios en todas las tablas transaccionales.
*   **Audit Logs:** Registro GRC (Gobierno/Riesgo/Cumplimiento) de cada acción crítica.
*   **Gobernanza SQL:** Uso mandatorio de `gen_random_uuid()` y migraciones de 14 dígitos.

### 2.2 🧾 Módulo RCV e Inteligencia
*   **RCV 2.0:** Motor de agregación real (físico) para auditoría de cumplimiento.
*   **Selector Inteligente:** Interfaz proactiva que solo muestra periodos con data.

### 2.3 📄 Módulo DTE y Remuneraciones
*   **SII Compliance:** Generación y firma de XML (SHA1/C14N).
*   **Motor Laboral:** Normativa 2026 (Tope UF, 42 Horas, Art. 47).
*   **Firmas Digitales:** Integración de `signature_base64` en documentos legales.

---

## 🚀 3. ROADMAP: LAS FASES DE EVOLUCIÓN

### FASE 9: Institucionalización Maestro 💎 — **100% COMPLETADO**
*   [x] **Rebranding:** Migración total a **CONTAPYMEPUQ**.
*   [x] **MarketTicker:** Cinta de indicadores global sincronizada.
*   [x] **Alineación Geométrica:** Horizonte visual estandarizado.

### FASE 10: Inteligencia y Expansión 🚀 — **EN PLANIFICACIÓN**
*   [ ] **Cashflow Predictor:** Análisis basado en RCV histórico.
*   [ ] **API Partner:** Integración con POS locales.

### FASE 11: Facturación y Auditoría Profunda 💎 — **EN PROGRESO**
*   [x] **RCV Auditor 2.0:** Implementado.
*   [x] **DTE Core Engine:** Operativo.
*   [x] **Integrity Chain:** Implementado en DB.
*   [ ] **SII Connector:** Conexión con endpoints de certificación.

### FASE 12: Consolidación Institutional Grade 🏛️ — **COMPLETADO**
*   [x] **SSoT Utility Engine:** Módulo `shared_utils.py` operativo.
*   [x] **Master Audit Suite:** Directorio raíz `/tests` unificado.
*   [x] **Higiene de Proyecto:** Eliminación de redundancias y archivos zombie.

---

> *"Al centralizar lo pesado en Python y lo hermoso en React, dejamos de construir una plantilla web compleja y empezamos a construir un **SaaS Contable de Clase Mundial**."*

---
© 2026 Contapymepuq — Propiedad Intelectual Reservada. Magallanes, Chile.
