# 💎 AUDITORÍA INTEGRAL & DOCUMENTACIÓN MAESTRA DEL ECOSISTEMA
# CONTAPYMEPUQ (v20.0 — Production & Audit-Ready)

**Fecha de Auditoría:** Agosto 2026  
**Clasificación:** Documentación Técnica de Grado Institucional (Source of Truth - SSoT)  
**Estado:** 100% Operativo | 202/202 Pruebas Unitarias Aprobadas | 61 Rutas en Producción  

---

## 🏛️ 1. RESUMEN EJECUTIVO DEL ECOSISTEMA

**ContaPymePUQ** ha evolucionado desde un ERP regional hacia un **Ecosistema Descentralizado Tripartito** para la Región de Magallanes y la Antártica Chilena:

```
                              💎 CONTAPYMEPUQ v20.0
       ┌────────────────────────────────┼────────────────────────────────┐
       │                                │                                │
       ▼                                ▼                                ▼
🏢 1. ERP & NÓMINA AUSTRAL       💼 2. CONTAEMPLEOS & IA          📰 3. DIARIO & MEDIA KIT
 • DTE Oficial SII (XML/Firma)    • Bolsa Empleos Self-Serve       • Diario Regional Autónomo
 • Ley 40 Horas / Ley Karin       • Art. 2° Código Trabajo         • Publirreportajes Comerciales
 • LRE Dirección del Trabajo      • Extracción Color (Canvas)      • Mega Banner Header Superior
 • Conciliación Criptográfica     • Generador IA Nano Banana       • Pasarela/Carrusel 6s
 • Modo "Acceso Lanzamiento"      • Pasarela Mercado Pago          • Capacidad 5 cupos (Anti-Spam)
```

---

## 🛠️ 2. ESPECIFICACIÓN DETALLADA DE MÓDULOS

### 2.1 🏢 Pilar 1: Software ERP, Contabilidad & Nómina Austral
* **Facturación Electrónica DTE (SII):**
  * Generación y validación de XML timbrados (Facturas afectas, exentas, notas de crédito/débito).
  * Cadena de custodia criptográfica `Hash(n) = SHA256(Record(n) + Hash(n-1))`.
* **Motor de Remuneraciones & Nómina Legal:**
  * Parámetros previsionales chilenos en tiempo real (UF, UTM, Topes AFP/FONASA/AFC).
  * Adaptado al estándar **Ley 40 Horas** (jornadas especiales y zona extrema Magallanes).
  * Generador de contratos, anexos y liquidaciones descargables en PDF con validación pública en `/verify/[id]`.
  * Generación del **Libro de Remuneraciones Electrónico (LRE)** para la Dirección del Trabajo (DT).
* **Control de Acceso & Suscripción:**
  * Modo **Acceso Lanzamiento (100% Habilitado)** que permite uso irrestricto sin bloqueos de prueba prematuros.
  * Pasarela Mercado Pago para suscripciones recurrentes con retorno dinámico a la pantalla de origen (`returnTo`).

---

### 2.2 💼 Pilar 2: ContaEmpleos Magallanes & Generador IA Multimodal
* **Bolsa de Trabajo Regional Autoservicio (`/empleos` y `/publicar-empleo`):**
  * Publicación con 3 modalidades: **Gratis (30 días)**, **Destacado ($9.990)** y **Patrocinado ($19.990)**.
  * Detección de sesión con modal de registro ágil (30s) y preservación de borrador en `localStorage`.
  * Indexación automática para **Google for Jobs** y generación de tarjetas Open Graph dinámicas (`/api/og/job/[slug]`).
* **Auditoría Legal Algorítmica (Art. 2° Código del Trabajo):**
  * Bloqueo en tiempo real de ofertas que exijan fotos obligatorias, edad, dicom o antecedentes comerciales.
* **Motor de Co-Branding y Generador IA Multimodal:**
  * Cuantización cromática de logotipos mediante Canvas HTML5 (`color-extractor.ts`).
  * Generador de artes para redes sociales: **Post Cuadrado 1:1** e **Historia 9:16** con QR de alta definición.
  * Especificación JSON SSoT para **Nano Banana 2 / Gemini 3.1 Flash Image**.
* **Gestión en Panel (`/dashboard/empleos`):**
  * Supervisión de vacantes, postulaciones y botón directo *"Generar Contrato ➔"* hacia Nómina.

---

### 2.3 📰 Pilar 3: Diario Regional, Banners & Media Kit Digital
* **Diario Regional Descentralizado (`/noticias` y `/publicar-comunicado`):**
  * Pipeline de noticias con deduplicación semántica y auditoría anti-alucinación.
  * Publirreportajes comerciales: Comunicado Estándar ($19.990), Portada ($39.990) y Cobertura ($79.990).
* **Mega Banner Superior & Espacios Comerciales:**
  * **Ubicaciones:**
    1. `header_top`: Mega Banner Cabecera en todo el portal público ($59.990/mes).
    2. `calculator`: Banner exclusivo en Calculadora de Sueldos ($49.990/mes).
    3. `news_sidebar`: Banner lateral en artículos y portada ($39.990/mes).
  * **Facturación Multiciclo:** Mensual (30d), Semestral (180d, 15% OFF) y Anual (365d, 25% OFF / 3 meses gratis).
* **🎠 Pasarela y Carrusel Inteligente (`<AdBannerSlot />`):**
  * Auto-play cada 6 segundos con transición Cross-Fade suave.
  * **Pausa en Hover:** Se congela automáticamente al pasar el cursor para permitir clics cómodos.
  * Puntos indicadores, flechas laterales y contador `Patrocinado (1/X)`.
* **🔒 Control de Capacidad Máxima (5 Marcas por Espacio):**
  * Límite estricto de 5 marcas por slot para proteger el Share of Voice (>20% visibilidad garantizada).
  * Badges de disponibilidad: `🟢 X Cupos Libres`, `🔥 ¡Último Cupo!`, `🔒 CUPOS AGOTADOS (5/5)`.
  * Bloqueo en Frontend y rechazo HTTP 400 en Backend ante intentos de sobreventa.
* **🖼️ Optimización WebP en el Navegador:**
  * Dropzone con compresión Canvas HTML5 (`image-compressor.ts`): reduce 70%-90% de peso (<100KB) antes de subir a Supabase Storage.
* **Panel de Control Publicitario (`/dashboard/publicidad`):**
  * Gestión centralizada de creatividades, links de WhatsApp y renovaciones.

---

## 🔒 3. SEGURIDAD, INTEGRIDAD & PROCEDIMIENTOS CRIPTOGRÁFICOS

| Mecanismo de Seguridad | Implementación | Propósito |
| :--- | :--- | :--- |
| **Row Level Security (RLS)** | PostgreSQL en Supabase | Aislamiento multi-tenant estricto por organización. |
| **Firma Criptográfica Webhook** | HMAC SHA-256 (Mercado Pago) | Validación matemática de pagos reales sin riesgo de spoofing. |
| **Anti-XSS / Anti-SSRF** | Sanitización de URLs en API | Restricción exclusiva a protocolos `https:` y `wa.me`, bloqueando esquemas `javascript:` o `data:`. |
| **Compresión Segura WebP** | HTML5 Canvas Client-Side | Sanitización de metadatos EXIF peligrosos antes de la subida a Storage. |
| **Control Anti-Sobreventa** | Verificación atómica en DB | Conteo estricto de cupos activos (`count < 5`) antes de emitir preferencias. |

---

## 🧪 4. AUDITORÍA DE CALIDAD Y SUITE DE PRUEBAS

```text
============================= TEST SUMMARY =============================
Plataforma: Python 3.12 / Pytest / Next.js 16.3.3 Turbopack
Estado: 202 PASSED / 0 FAILED / 3 SKIPPED
Tiempo de Ejecución: ~39.6s

Desglose de Cobertura:
 • Tests de Empleos, Legalidad Art. 2° y Previsión:     45 tests (100% OK)
 • Tests de Noticias, Editorial y Anti-Alucinación:      38 tests (100% OK)
 • Tests de ERP, DTE, RCV, Nómina y Criptografía:        82 tests (100% OK)
 • Tests de Mercado Pago, Webhook HMAC y Suscripciones:  27 tests (100% OK)
 • Tests de Banners, Rotación, Carrusel y Capacidad:    10 tests (100% OK)
========================================================================
```

---

## 🗺️ 5. MAPA COMPLETO DE RUTAS Y ARQUITECTURA (61 RUTAS NEXT.JS)

```text
/ (Portada Diario Regional & Mega Banner)
├─ /anunciar (Media Kit & Contratación de Banners Self-Serve)
├─ /calculadora (Calculadora de Sueldos & Banner Laboral)
├─ /empleos (Bolsa de Empleos Magallanes)
│  └─ /empleos/[slug] (Ficha de Empleo + Generador Social IA)
├─ /publicar-empleo (Publicación Autoservicio de Vacantes)
├─ /noticias (Diario Regional)
│  └─ /noticias/[slug] (Artículo con Rutas Interceptadas)
├─ /publicar-comunicado (Publirreportajes Autoservicio)
├─ /precios (Tarifario Software, Empleos, Noticias y Media Kit)
├─ /checkout/success (Confirmación de Pago y Activación)
├─ /checkout/failure (Cancelación Contextual con Retorno Dinámico)
├─ /verify/[id] (Portal Público de Verificación Criptográfica)
│
└─ /dashboard (Panel Empresarial Autenticado)
   ├─ /dashboard/accounting (Contabilidad, RCV, F29, Balance, Libro Diario)
   ├─ /dashboard/payroll (Nómina, Contratos Ley 40h, LRE, Liquidaciones)
   ├─ /dashboard/billing (Facturación SII y Órdenes de Compra)
   ├─ /dashboard/treasury (Tesorería & Flujo de Caja 360°)
   ├─ /dashboard/empleos (Gestión de Ofertas Laborales)
   ├─ /dashboard/noticias (Gestión de Comunicados de Prensa)
   └─ /dashboard/publicidad (Gestión de Banners y Media Kit)
```
