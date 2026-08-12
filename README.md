# <p align="center">💎 CONTAPYMEPUQ 💎</p>
<p align="center">
  <strong>Ecosistema Contable Descentralizado de Magallanes (v9.0)</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-9.0--Certified-blue?style=for-the-badge&logo=opsgenie&logoColor=white&color=0D6EFD" alt="Version 9.0">
  <img src="https://img.shields.io/badge/Python-3.12-blue?style=for-the-badge&logo=python&logoColor=white&color=3776AB" alt="Python 3.12">
  <img src="https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 16">
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase&logoColor=white&color=3ECF8E" alt="Supabase">
</p>

<p align="center">
  <em>"Precisión Institucional, Lógica Superior y Robustez Criptográfica."</em>
</p>

---

## 📖 Descripción General

**Contapymepuq** es la plataforma líder de Software as a Service (SaaS) contable y remunerativo descentralizado, construida específicamente para responder a las exigencias operativas y tributarias de la región de **Magallanes y de la Antártica Chilena**. 

Este ecosistema combina el poder analítico de un motor financiero en **FastAPI (Python)** para el cálculo de sueldos chilenos, conciliación bancaria y firmas de documentos XML, con una interfaz premium basada en **Next.js 16** y el blindaje de seguridad multi-tenant provisto por **Supabase (PostgreSQL RLS)**.

---

## 📊 Flujo de Datos y Arquitectura del Sistema

A continuación se detalla cómo fluyen los datos y cómo opera el blindaje de seguridad y la cadena de integridad del sistema:

```mermaid
graph TD
    A[👤 Usuario / Contador] -->|1. Emite DTE / Concilia Banco / Genera Sueldos| B[🎨 Frontend Next.js 16]
    B -->|2. Valida Token JWT y Tenant ID| C{¿Autenticación OK?}
    C -->|No| D[🚫 Acceso Denegado / Login]
    C -->|Sí| E[⚙️ FastAPI Engine Backend]
    E -->|3. Verifica Rol de Organización en API| F{¿Autorizado?}
    F -->|No| D
    F -->|Sí| G[⚡ Procesamiento Financiero & Cálculos]
    G -->|A. Emisión & Firma DTE XML| H[🇨🇱 Servicio de Impuestos Internos - SII]
    G -->|B. Libro LRE / Remuneraciones DT| I[💼 Centralización de Asiento Contable]
    G -->|C. Reconciliación por Triggers| J[🔗 Sincronización Directa de Bancos]
    I -->|4. Escritura en DB con Service Role| K[(🔥 Supabase PostgreSQL DB)]
    J -->|4. Escritura en DB con Service Role| K
    K -->|5. Ejecuta Seguridad RLS| L[🔒 Aislamiento Multi-Tenant de Inquilinos]
    K -->|6. Trigger de Firma Criptográfica| M[⛓️ Encadenamiento Ledger SHA-256]
```

---

## 🛠️ Especificación de Stack Tecnológico

| Capa / Componente | Tecnologías Clave | Propósito en el Ecosistema |
| :--- | :--- | :--- |
| **Frontend UI/UX** | Next.js 16 (App Router), React, TypeScript, React-Bootstrap | Interfaz interactiva de alta fidelidad, MarketTicker de Bloomberg y paneles ERP. |
| **Backend Engine** | Python 3.12, FastAPI, Uvicorn, Pydantic v2 | Motor de cálculo de haberes, procesamiento XML, firmas electrónicas y API de conciliación. |
| **Persistencia** | Supabase PostgreSQL, Row Level Security (RLS) | Seguridad multi-tenant por diseño, aislamiento forense de datos. |
| **Criptografía** | SHA-256 Hash Chaining, cryptography (PyCA) | Encadenamiento inmutable de DTEs emitidos para auditorías SII. |
| **Procesamiento** | `lxml` (firmas C14N), `pdfplumber` | Generación y lectura de documentos tributarios oficiales. |

---

## 📁 Arquitectura del Repositorio (Project Structure)

```text
Contapymepuq/
├── app/                      # 🎨 Frontend Web (Next.js 16)
│   ├── src/
│   │   ├── actions/          # Server Actions para llamadas directas a Supabase
│   │   ├── app/              # Rutas físicas (Dashboard, Noticias, Auth)
│   │   ├── components/       # Componentes visuales UI/UX
│   │   └── lib/              # Inicializaciones de Supabase Client & Helpers
│   └── package.json
├── engine/                   # ⚙️ Motor de Procesamiento (Python FastAPI)
│   ├── api/
│   │   └── routers/          # Endpoints de API protegidos por JWT (18 controladores)
│   ├── calculators/          # Motor matemático de remuneraciones chilenas
│   ├── core/
│   │   ├── dte/              # Lógica de creación, firma y envío XML al SII
│   │   └── database.py       # Singleton del conector de Supabase (Service Role)
│   ├── templates/            # Plantillas Word/CSV de finiquitos y contratos
│   └── requirements.txt
├── supabase/                 # 🔥 Base de Datos & Despliegue
│   ├── migrations/           # 78 archivos de migración SQL ordenados cronológicamente
│   └── snapshots/            # Snapshots periódicos del esquema de base de datos
├── docs/                     # 📚 Repositorio de Conocimiento & Auditorías
│   ├── architecture/         # Lógica RLS y flujos de datos
│   ├── audit/                # Gap Analysis, plan técnico DTE y reportes de consistencia
│   └── db/                   # Guía de operaciones y Runbook de Base de Datos
├── tools/                    # 🛠️ Herramientas de Mantenimiento y Validación
│   └── db/                   # Scripts de auditoría, remediación y test multi-tenant
├── start.ps1                 # 🚀 Script único para iniciar el entorno de desarrollo local
└── BLUEPRINT_MAESTRO.md      # 🎯 Fuente Única de Verdad (SSoT) del Roadmap
```

---

## ✨ Características Principales (Features v9.5)

*   **🔒 Multi-Tenant Nivel Dios**: Todas las tablas transaccionales están blindadas con Políticas de Seguridad a Nivel de Fila (RLS) en PostgreSQL (`private.is_org_member`).
*   **🌐 Portal Público de Verificación Criptográfica (`/verify/[id]`)**: Autenticación inmutable pública de Liquidaciones, Vacaciones, Contratos, Finiquitos y Balances de 8 Columnas sin requerir inicio de sesión.
*   **📜 Estándar Legal de Contratos (10 Cláusulas - 2026)**: Plantilla jurídica de grado corporativo adaptada a la Ley 21.561 (40 Horas), Ley Karin 21.643, Ley 17.336 (Propiedad Intelectual) y Ley 19.628 (Protección de Datos).
*   **💼 Diferenciación Dinámica de Tipos de Contrato**: Lógica diferenciada para contratos Indefinidos, Plazo Fijo, Honorarios (Retención 15.25%), Obra o Faena, Part-Time 30h y Teletrabajo (Ley 21.220).
*   **🏦 Tesorería & Flujo de Caja 360°**: Cobros RCV, pagos a proveedores y nómina con centralización contable automática en Libro Diario y pruebas de estrés de conciliación bancaria.
*   **🔗 Blockchain-like Ledger & Sello SHA-256**: Encadenamiento inmutable de DTEs e inserción de sello digital con código QR de verificación en documentos.
*   **🧮 Motor de Remuneraciones Magallanes**: Cálculo preciso de cotizaciones previsionales, Impuesto Único de Segunda Categoría, asignación por zona extrema (20 días de vacaciones) y topes UF/UTM actualizados.
*   **📰 Diario Informativo Regional**: Motor agregador de noticias de la Región de Magallanes (`regional_news`) integrado con SEO avanzado y slugs inmutables.

---

## 🚀 Inicio Rápido para Desarrolladores

Para levantar el entorno completo de desarrollo de forma unificada, abre una terminal de **PowerShell** en la raíz del proyecto y ejecuta:

```powershell
.\start.ps1
```

Este script automatizado levantará concurrentemente:
*   El **Frontend** en `http://localhost:3000`
*   El **Backend Engine** en `http://localhost:8000` (Documentación Swagger interactiva en `/docs`)

---

## 🧪 Pruebas y Validación (Testing)

El ecosistema cuenta con tests automatizados para asegurar la integridad de la lógica financiera y la seguridad de los tenants:

```bash
# Correr tests unitarios y lógicos del motor de sueldos
engine\.venv\Scripts\python.exe -m pytest tests/engine

# Correr pruebas de integración de base de datos y consistencia
engine\.venv\Scripts\python.exe -m pytest tests/database
```

---

<p align="center">
  <sub>© 2026 Contapymepuq. Todos los derechos reservados. Desarrollado con ❤️ para la Región de Magallanes, Chile.</sub>
</p>
