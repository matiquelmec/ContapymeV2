# 🎯 PROJECT: CONTAPYMEPUQ — BLUEPRINT MAESTRO
**Versión:** 16.0 (Ecosistema Integral: ERP, Diario Regional & ContaEmpleos Magallanes 👑)  
**Estado:** Production & Audit-Ready 🚀  
**Última Actualización:** Agosto 2026  

---

> [!IMPORTANT]
> **PROYECTO DE REFERENCIA (SOURCE OF TRUTH):**
> Todas las funcionalidades, lógica de negocio, arquitectura y estética se basan y evolucionan desde:
> `C:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq`

> [!NOTE]
> **PARA INICIAR EL SISTEMA LOCAL:** Ejecutar `.\start.ps1` desde la raíz del proyecto.
> - Frontend: http://localhost:3000
> - Engine API + Docs: http://localhost:8000/docs

> [!TIP]
> **CERTIFIED ARCHIVAL & BRANDING INTEGRITY (v16.0):** 
> - **ContaEmpleos Magallanes (`/empleos`)**: Portal de empleo regional descentralizado con auditoría legal bajo el **Art. 2° del Código del Trabajo**.
> - **Motor de Extracción Cromática y Co-Branding**: Análisis de paleta de colores de logos de empresas vía Canvas HTML5 y adaptación visual en tiempo real.
> - **Generador Publicitario IA Multimodal (Nano Banana 2 / Gemini 3.1 Flash Image)**: Generación determinista de anuncios en formato **Post 1:1** e **Historia 9:16** con QR y llamado para Sticker de Enlace de Instagram.
> - **Google SEO & Schema.org**: `JobPosting`, `AccountingService`, `NewsMediaOrganization`, sitemaps dinámicos (`/sitemap.xml`, `/sitemap-jobs.xml`, `/sitemap-news.xml`).
> - **Next.js 16.3.3 + Supabase + Python 3.12**: Cero vulnerabilidades en `npm audit` y suite completa de 162+ pruebas unitarias aprobadas al 100%.

---

## 🏗️ 1. ARQUITECTURA TÉCNICA Y DIAGRAMA LÓGICO

El ecosistema consta de 4 capas integradas comunicadas mediante APIs REST y Server Actions:

```text
┌────────────────────────────────────────────────────────────────────────┐
│  MOTOR DE INGESTA, AUDITORÍA LEGAL E IA (Python + FastAPI)             │
│  - Job Worker: Ingesta periódica, deduplicación y filtro Art. 2° DT.   │
│  - News Worker: Pipeline de noticias regionales con verificación IA.   │
│  - RCV Auditor 2.0: Agregación real de documentos vs Bitácoras SII.   │
│  - DTE Core: Generación XML, Firma Digital y Timbrado Electrónico.     │
│  - INTEGRITY ENGINE: Criptografía SHA-256 Chaining & QRs Certificados. │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ API REST / JSON Struct
┌───────────────────────────────────▼────────────────────────────────────┐
│  CENTRO DE DATOS Y SEGURIDAD (Supabase PostgreSQL)                     │
│  - RLS (Row Level Security): Blindaje Multi-Tenant por Organización.   │
│  - job_postings: Almacenamiento auditado con auto-expiración a 21 días.│
│  - news_articles: Repositorio descentralizado de noticias australes.  │
│  - integrity_hash: Registro forense de inmutabilidad documental.       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Supabase Client / Server Actions
┌───────────────────────────────────▼────────────────────────────────────┐
│  FRONTEND INSTITUCIONAL & PORTALES PÚBLICOS (Next.js 16.3.3)           │
│  - ContaEmpleos: Directorio /empleos y vista /empleos/[slug].          │
│  - Generador de Anuncios: Co-branding, extracción de color y QR HD.   │
│  - Diario Regional: Noticias /noticias con modal interactivo.         │
│  - Portal de Verificación: /verify/[id] público para auditorías.       │
│  - ERP Dashboard: Tesorería 360°, Conciliación Bancaria y Nómina.      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Exportación JSON / Multimodal
┌───────────────────────────────────▼────────────────────────────────────┐
│  GENERACIÓN MULTIMODAL & REDES SOCIALES (Nano Banana 2 Studio SSoT)    │
│  - Gemini 3.1 Flash Image Preview con Thinking Mode de alta fidelidad. │
│  - Especificación JSON para anuncios 1:1 Feed y 9:16 Instagram Stories.│
│  - Sincronización Web Share API y portapapeles automático de enlaces.  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 2. ESPECIFICACIÓN DE MÓDULOS

### 2.1 💼 Módulo ContaEmpleos Magallanes (v16.0)
*   **Directorio Regional:** Catálogo interactivo con filtros por Comuna (Punta Arenas, Puerto Natales, Porvenir, etc.), Sector Productivo y Turnos de Faena.
*   **Auditoría Jurídica Automática:** Filtro algorítmico contra patrones discriminatorios (edad, fotos, género, DICOM) según el **Artículo 2° del Código del Trabajo**.
*   **Calculadora Previsional Integrada:** Estimador automático de sueldo líquido regional con retenciones de AFP, Salud, AFC e Impuesto Único.
*   **Expiración Autónoma:** Ciclos de depuración cada 6 horas para vacantes inactivas o con más de 21 días.

### 2.2 🎨 Módulo de Branding, Extracción Cromática y Generación Publicitaria
*   **Extracción de Paleta de Marca (`color-extractor.ts`):** Análisis de píxeles vía Canvas HTML5 que cuantiza los colores corporativos del logo de la empresa (Primario, Acento y Contraste WCAG AAA).
*   **Co-Branding en Vivo:** Inyección instantánea del logo de la empresa empleadora junto al sello *ContaEmpleos Magallanes*.
*   **Generador JSON Nano Banana 2:** Exportación de especificaciones de grado de estudio para modelos de difusión de IA (Gemini 3.1 Flash Image / Midjourney) con la *Regla de Distancia de Texto* y parámetros ópticos de cámara *Hasselblad X2D 100C*.
*   **Formatos para Redes:**
    *   **Post Cuadrado (1:1):** $1080\times 1080\text{px}$ optimizado para Feed de Instagram y LinkedIn.
    *   **Historia Vertical (9:16):** $1080\times 1920\text{px}$ con caja de llamado para el **Sticker de Enlace de Instagram** y copia automática de URL al portapapeles.

### 2.3 📊 Módulo Base: Autenticación, RLS e Integridad
*   **Seguridad:** RLS en todas las tablas transaccionales de PostgreSQL.
*   **Integrity Chain:** Modelo `Hash(n) = SHA256(Record(n) + Hash(n-1))` para DTEs y sellos digitales en documentos.
*   **Audit Logs:** Registro GRC (Gobierno/Riesgo/Cumplimiento) de cada acción crítica.

### 2.4 📰 Módulo Diario Regional Descentralizado
*   **Noticias Magallánicas:** Noticias de Punta Arenas, Última Esperanza, Tierra del Fuego y Antártica.
*   **Widgets en Tiempo Real:** Clima austral, indicadores económicos (UF, UTM, Dólar, Euro) y horóscopo.

---

## 🚀 3. ROADMAP Y FASES DE EVOLUCIÓN

### FASE 14: Ecosistema Jurídico, Verificación Criptográfica y UI World-Class 🛡️ — **COMPLETADO**
*   [x] Portal Público de Verificación (`/verify/[id]`) multi-documento.
*   [x] Estándar Legal de Contratos 2026 (Ley 40 Horas & Ley Karin).
*   [x] Tesorería & Flujo de Caja 360° con Libro Diario.

### FASE 15: Diario Regional e Inteligencia Descentralizada 📰 — **COMPLETADO**
*   [x] Pipeline autónomo de noticias regionales (`news_worker.py`).
*   [x] Modal interactivo de lectura rápida con rutas interceptadas de Next.js.
*   [x] Widgets en vivo de indicadores macroeconómicos y meteorología de Magallanes.

### FASE 16: ContaEmpleos, Co-Branding y Generación Publicitaria con IA Multimodal 💼 — **COMPLETADO**
*   [x] Portal de empleos regional `/empleos` y páginas individuales `/empleos/[slug]`.
*   [x] Auditoría algorítmica legal bajo Art. 2° Código del Trabajo y auto-expiración a 21 días.
*   [x] Motor de extracción cromática (`color-extractor.ts`) y soporte para carga de logotipos de empresas.
*   [x] Generador publicitario con proporciones nativas 1:1 e Historia 9:16 ajustadas a pantallas móviles.
*   [x] Especificación JSON SSoT de grado de estudio para **Nano Banana 2** (Gemini 3.1 Flash Image).
*   [x] Copia automática de enlace al portapapeles para Sticker de Enlace de Instagram.
*   [x] Actualización de dependencias a **Next.js 16.3.3** con **0 vulnerabilidades** en `npm audit`.

---

## 🏛️ VISIÓN ESTRATÉGICA
Contapymepuq es el ecosistema de confianza institucional y productivo líder en Magallanes, uniendo la **gestión financiera empresarial, la información regional descentralizada y la empleabilidad austral auditada**.

---
© 2026 Contapymepuq — Propiedad Intelectual Reservada. Magallanes, Chile.
