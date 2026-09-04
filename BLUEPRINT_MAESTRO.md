# 🎯 PROJECT: CONTAPYMEPUQ — BLUEPRINT MAESTRO
**Versión:** 20.1 (Ecosistema Integral: ERP, Órdenes de Compra, Créditos CCAF, Diario Regional, ContaEmpleos & Media Kit Digital 👑)  
**Estado:** Production & Audit-Ready 🚀  
**Última Actualización:** Septiembre 2026  

---

> [!IMPORTANT]
> **PROYECTO DE REFERENCIA (SOURCE OF TRUTH - SSoT):**
> Todas las funcionalidades, lógica de negocio, arquitectura y estética se basan y evolucionan desde:
> `C:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq`

> [!NOTE]
> **PARA INICIAR EL SISTEMA LOCAL:** Ejecutar `.\start.ps1` desde la raíz del proyecto.
> - Frontend: http://localhost:3000
> - Engine API + Docs: http://localhost:8000/docs
> - Suite de Pruebas: `python -m pytest tests/ -v` (281 Tests Aprobados al 100%)

---

## 🏗️ 1. ARQUITECTURA TÉCNICA Y DIAGRAMA LÓGICO

```text
┌────────────────────────────────────────────────────────────────────────┐
│  MOTOR FISCAL, PREVISIONAL Y DE AUDITORÍA (Python 3.12 + FastAPI)     │
│  - Job Worker: Ingesta periódica, deduplicación y filtro Art. 2° DT.   │
│  - News Worker: Pipeline de noticias regionales y anti-alucinación.    │
│  - Payroll Engine: Ley 40 Horas, Ley Karin y Libro de Remuneraciones.  │
│  - DTE Core: Generación XML, Firma Digital y Timbrado SII.             │
│  - INTEGRITY ENGINE: Criptografía SHA-256 Chaining & QRs Certificados. │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ API REST / JSON Struct
┌───────────────────────────────────▼────────────────────────────────────┐
│  CENTRO DE DATOS Y SEGURIDAD (Supabase PostgreSQL + RLS)               │
│  - Aislamiento Multi-Tenant estricto por organización.                 │
│  - job_postings: Almacenamiento auditado y auto-expiración a 30 días.  │
│  - regional_news: Repositorio descentralizado con publirreportajes.    │
│  - ad_banners: Control de 3 posiciones, rotación y límite de 5 marcas. │
│  - storage: Buckets protegidos para imágenes optimizadas WebP.         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Supabase Client / Server Actions
┌───────────────────────────────────▼────────────────────────────────────┐
│  FRONTEND & PORTALES PÚBLICOS DE MONETIZACIÓN (Next.js 16.3.3)         │
│  - ContaEmpleos: Directorio /empleos y publicador autoservicio.        │
│  - Diario Regional: Noticias /noticias y publirreportajes pagados.     │
│  - Media Kit Publicitario: /anunciar con selector de ciclo y WebP.     │
│  - Pasarela Inteligente: <AdBannerSlot /> con carrusel 6s y hover.     │
│  - ERP Dashboard: Tesorería 360°, Conciliación, Nómina y Publicidad.   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Checkout Pro / Webhooks HMAC
┌───────────────────────────────────▼────────────────────────────────────┐
│  PASARELA DE PAGO AUTOMATIZADA (Mercado Pago Engine)                  │
│  - Validación criptográfica HMAC SHA-256 en Webhooks.                  │
│  - Activación instantánea de órdenes (Empleos, Notas de Prensa, Ads).  │
│  - Cancelación contextual (/checkout/failure) con retorno dinámico.    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 2. ESPECIFICACIÓN DE MÓDULOS EN PRODUCCIÓN (v20.0)

### 2.1 💼 Módulo ContaEmpleos Magallanes
* **Directorio y Publicador Autoservicio (`/publicar-empleo`):**
  * 3 Paquetes: Gratis ($0), Destacado ($9.990) y Patrocinado ($19.990).
  * Preservación de borradores en `localStorage` y modal de registro ágil en 30s.
  * Filtro algorítmico contra patrones discriminatorios (Art. 2° Código del Trabajo).
  * Estimador previsional de sueldo líquido regional.
  * Módulo interno en `/dashboard/empleos` con acción directa *"Generar Contrato ➔"*.

### 2.2 🎨 Módulo de Branding e IA Multimodal
* **Cuantización Cromática (`color-extractor.ts`):** Extracción de colores HEX del logo corporativo.
* **Formatos de Redes:** Post 1:1 ($1080	imes 1080	ext{px}$) e Historia 9:16 ($1080	imes 1920	ext{px}$) con QR y zona de Sticker de Enlace.
* **Especificación JSON para Nano Banana 2 (Gemini 3.1 Flash Image).**

### 2.3 📰 Módulo Diario Regional & Publirreportajes
* **Noticias y Publirreportajes (`/publicar-comunicado`):**
  * Modalidades Comercial Estándar ($19.990), Portada ($39.990) y Cobertura ($79.990).
  * Rutas interceptadas para lectura instantánea sin recarga.
  * Módulo de gestión en `/dashboard/noticias`.

### 2.4 📢 Módulo de Publicidad, Mega Banner y Media Kit Digital
* **3 Posiciones Comerciales:**
  1. `header_top`: Mega Banner en cabecera de todo el portal ($59.990/mes).
  2. `calculator`: Banner en la Calculadora de Sueldos ($49.990/mes).
  3. `news_sidebar`: Banner lateral en artículos y portada ($39.990/mes).
* **Facturación Multiciclo:** Mensual (30d), Semestral (180d, 15% OFF) y Anual (365d, 25% OFF / 3 meses gratis).
* **Carrusel Inteligente (`<AdBannerSlot />`):** Auto-play cada 6s con pausa al pasar el cursor y navegación por puntos/flechas.
* **Límite de Capacidad (Máx 5 cupos por slot):** Detección en tiempo real con badges (`🟢 X Cupos`, `🔥 ¡Último Cupo!`, `🔒 CUPOS AGOTADOS`), bloqueo en frontend y rechazo HTTP 400 en backend.
* **Subida WebP en Navegador (`image-compressor.ts`):** Dropzone con compresión client-side (-80% peso) a WebP.
* **Módulo de Publicidad en Panel (`/dashboard/publicidad`):** Supervisión y renovación de banners.

### 2.5 🏢 Módulo ERP & Contabilidad Austral
* **Modo "Acceso Lanzamiento (100% Habilitado)":** Sin límites restrictivos de días de prueba para acelerar adopción.
* **Ley 40 Horas & LRE:** Cumplimiento total con Dirección del Trabajo y SII.
* **Integrity Chaining SHA-256:** Trazabilidad documental inmutable.

---

## 🚀 3. ROADMAP Y FASES DE EVOLUCIÓN

### FASE 14 a 16: Ecosistema Jurídico, Diario y ContaEmpleos Base — **COMPLETADO**
### FASE 17: Pasarela de Pagos y Autoservicio de Empleos — **COMPLETADO**
* [x] Integración de Mercado Pago Checkout Pro en `/publicar-empleo`.
* [x] Webhook con validación criptográfica HMAC SHA-256.
* [x] Pantalla de fallo dinámica con retorno contextual (`/checkout/failure`).

### FASE 18: Publirreportajes Comerciales y Gestión en Dashboard — **COMPLETADO**
* [x] Autoservicio de notas de prensa en `/publicar-comunicado`.
* [x] Módulos de administración `/dashboard/empleos` y `/dashboard/noticias`.
* [x] Activación del modo *"Acceso Lanzamiento (100% Habilitado)"*.

### FASE 19: Mega Banner Superior y Media Kit Multiciclo — **COMPLETADO**
* [x] Despliegue de Mega Banner Superior en cabecera pública de todo el portal.
* [x] Planes semestrales (-15%) y anuales (-25% OFF) en `/anunciar` y `/precios`.
* [x] Módulo ejecutivo en `/dashboard/publicidad`.

### FASE 20: Pasarela de Banners, Capacidad y Compresión WebP — **COMPLETADO**
* [x] Carrusel visual inteligente con rotación de 6s y pausa automática en hover.
* [x] Control estricto de capacidad máxima (5 marcas por slot) con badges de escasez y bloqueo de sobreventa.
* [x] Dropzone con compresión WebP en el navegador (-80% peso) y subida a Supabase.
* [x] Suite de 202 pruebas unitarias base aprobadas al 100%.

### FASE 21: Saneamiento, Órdenes de Compra, Créditos CCAF & Consolidación Multi-Empresa — **COMPLETADO**
* [x] Auditoría forense de 11 sistemas periféricos y migración ETL desde `remuneraciones.db`.
* [x] Expansión del centro de datos Supabase: 37 organizaciones activas, 189 colaboradores, 400 liquidaciones históricas y 1.126 haberes desglosados.
* [x] Creación de esquemas y migraciones SQL para `purchase_orders`, `purchase_order_items` y `payroll_loan_deductions`.
* [x] Conexión real del frontend de Órdenes de Compra con Server Actions y emisión de Factura DTE con un solo clic.
* [x] Eliminación de código muerto y scripts ajenos (`run_sync.js`, `query_supabase_js.js`, `news-mocks.ts`, `video-story-generator.ts`).
* [x] Reubicación de guías técnicas a `docs/guides/` y formalización de Procedimientos Operativos Estándar de Seguridad (`docs/technical/security_and_compliance_sops.md`).
* [x] Deduplicación del helper de RUT en `dj1887.py` hacia `core.utils.shared_utils`.
* [x] Expansión de suite de pruebas a **281 pruebas unitarias (100% aprobadas)** y compilación limpia TypeScript.

### FASE 22: Portal de Autoatención Laboral WhatsApp & Asistente Legal Tributario SII — **COMPLETADO**
* [x] **Autoatención Laboral vía WhatsApp (`/dashboard/payroll/whatsapp`):**
  - Esquema en Supabase: `whatsapp_org_settings`, `whatsapp_sessions`, `whatsapp_message_logs` activado en las 37 empresas.
  - Clasificador NLP de intenciones (liquidación, vacaciones, certificados, RIOHS/Ley Karin).
  - Cálculo de vacaciones ajustado a la normativa regional de Magallanes (20 días hábiles / Art. 67 inc. 2 Código del Trabajo).
  - Verificación 2FA por últimos 4 dígitos del RUT y consulta de solicitudes aprobadas reales.
  - Simulador interactivo en vivo (Sandbox) en el panel administrativo.
  - 22 pruebas unitarias en `test_whatsapp_bot_intents.py`.
* [x] **Asistente Legal Tributario y Generador de Escritos SII (.docx):**
  - Esquema en Supabase: `sii_defense_documents` con aislamiento multi-tenant RLS.
  - Generador DOCX formal con tipografía reglamentaria (Times New Roman 11pt, márgenes 3.5cm/3.0cm) dirigido al Director Regional del SII Magallanes (Punta Arenas).
  - Cobertura de las 4 causas críticas: Boletas vs Facturas (Art. 53 Ley IVA), Citación Art. 63, Rectificatoria F29 (Art. 127 CT) y Condonación Circular 50.
  - Integración en frontend con Next.js BFF Route Handler (`/api/sii/generate`) y modal interactivo en `/dashboard/accounting`.
  - Normalización de cabeceras HTTP y blindaje contra accesos cruzados (403 Forbidden).
  - 6 pruebas unitarias en `test_sii_defense_generator.py` y suite global de **312 tests aprobados al 100%**.

### FASE 23: Optimización de Ciclos, Rendimiento de Base de Datos & Resiliencia Visual — **COMPLETADO**
* [x] **Agregación Atómica en Supabase (PostgreSQL RPC):**
  - Creación de migración `20260907000000_optimize_dashboard_financial_aggregates.sql`.
  - Función `get_organization_financial_aggregates(p_organization_id, p_year)` que computa ventas, compras, nómina y activos en un solo paso dentro del motor SQL, reduciendo la transferencia de miles de filas a 1 solo objeto JSON consolidado.
  - Índices compuestos estratégicos en `sales_records`, `purchase_records`, `liquidations` e `economic_indicators`.
# 🎯 PROJECT: CONTAPYMEPUQ — BLUEPRINT MAESTRO
**Versión:** 20.1 (Ecosistema Integral: ERP, Órdenes de Compra, Créditos CCAF, Diario Regional, ContaEmpleos & Media Kit Digital 👑)  
**Estado:** Production & Audit-Ready 🚀  
**Última Actualización:** Septiembre 2026  

---

> [!IMPORTANT]
> **PROYECTO DE REFERENCIA (SOURCE OF TRUTH - SSoT):**
> Todas las funcionalidades, lógica de negocio, arquitectura y estética se basan y evolucionan desde:
> `C:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq`

> [!NOTE]
> **PARA INICIAR EL SISTEMA LOCAL:** Ejecutar `.\start.ps1` desde la raíz del proyecto.
> - Frontend: http://localhost:3000
> - Engine API + Docs: http://localhost:8000/docs
> - Suite de Pruebas: `python -m pytest tests/ -v` (281 Tests Aprobados al 100%)

---

## 🏗️ 1. ARQUITECTURA TÉCNICA Y DIAGRAMA LÓGICO

```text
┌────────────────────────────────────────────────────────────────────────┐
│  MOTOR FISCAL, PREVISIONAL Y DE AUDITORÍA (Python 3.12 + FastAPI)     │
│  - Job Worker: Ingesta periódica, deduplicación y filtro Art. 2° DT.   │
│  - News Worker: Pipeline de noticias regionales y anti-alucinación.    │
│  - Payroll Engine: Ley 40 Horas, Ley Karin y Libro de Remuneraciones.  │
│  - DTE Core: Generación XML, Firma Digital y Timbrado SII.             │
│  - INTEGRITY ENGINE: Criptografía SHA-256 Chaining & QRs Certificados. │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ API REST / JSON Struct
┌───────────────────────────────────▼────────────────────────────────────┐
│  CENTRO DE DATOS Y SEGURIDAD (Supabase PostgreSQL + RLS)               │
│  - Aislamiento Multi-Tenant estricto por organización.                 │
│  - job_postings: Almacenamiento auditado y auto-expiración a 30 días.  │
│  - regional_news: Repositorio descentralizado con publirreportajes.    │
│  - ad_banners: Control de 3 posiciones, rotación y límite de 5 marcas. │
│  - storage: Buckets protegidos para imágenes optimizadas WebP.         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Supabase Client / Server Actions
┌───────────────────────────────────▼────────────────────────────────────┐
│  FRONTEND & PORTALES PÚBLICOS DE MONETIZACIÓN (Next.js 16.3.3)         │
│  - ContaEmpleos: Directorio /empleos y publicador autoservicio.        │
│  - Diario Regional: Noticias /noticias y publirreportajes pagados.     │
│  - Media Kit Publicitario: /anunciar con selector de ciclo y WebP.     │
│  - Pasarela Inteligente: <AdBannerSlot /> con carrusel 6s y hover.     │
│  - ERP Dashboard: Tesorería 360°, Conciliación, Nómina y Publicidad.   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Checkout Pro / Webhooks HMAC
┌───────────────────────────────────▼────────────────────────────────────┐
│  PASARELA DE PAGO AUTOMATIZADA (Mercado Pago Engine)                  │
│  - Validación criptográfica HMAC SHA-256 en Webhooks.                  │
│  - Activación instantánea de órdenes (Empleos, Notas de Prensa, Ads).  │
│  - Cancelación contextual (/checkout/failure) con retorno dinámico.    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 2. ESPECIFICACIÓN DE MÓDULOS EN PRODUCCIÓN (v20.0)

### 2.1 💼 Módulo ContaEmpleos Magallanes
* **Directorio y Publicador Autoservicio (`/publicar-empleo`):**
  * 3 Paquetes: Gratis ($0), Destacado ($9.990) y Patrocinado ($19.990).
  * Preservación de borradores en `localStorage` y modal de registro ágil en 30s.
  * Filtro algorítmico contra patrones discriminatorios (Art. 2° Código del Trabajo).
  * Estimador previsional de sueldo líquido regional.
  * Módulo interno en `/dashboard/empleos` con acción directa *"Generar Contrato ➔"*.

### 2.2 🎨 Módulo de Branding e IA Multimodal
* **Cuantización Cromática (`color-extractor.ts`):** Extracción de colores HEX del logo corporativo.
* **Formatos de Redes:** Post 1:1 ($1080	imes 1080	ext{px}$) e Historia 9:16 ($1080	imes 1920	ext{px}$) con QR y zona de Sticker de Enlace.
* **Especificación JSON para Nano Banana 2 (Gemini 3.1 Flash Image).**

### 2.3 📰 Módulo Diario Regional & Publirreportajes
* **Noticias y Publirreportajes (`/publicar-comunicado`):**
  * Modalidades Comercial Estándar ($19.990), Portada ($39.990) y Cobertura ($79.990).
  * Rutas interceptadas para lectura instantánea sin recarga.
  * Módulo de gestión en `/dashboard/noticias`.

### 2.4 📢 Módulo de Publicidad, Mega Banner y Media Kit Digital
* **3 Posiciones Comerciales:**
  1. `header_top`: Mega Banner en cabecera de todo el portal ($59.990/mes).
  2. `calculator`: Banner en la Calculadora de Sueldos ($49.990/mes).
  3. `news_sidebar`: Banner lateral en artículos y portada ($39.990/mes).
* **Facturación Multiciclo:** Mensual (30d), Semestral (180d, 15% OFF) y Anual (365d, 25% OFF / 3 meses gratis).
* **Carrusel Inteligente (`<AdBannerSlot />`):** Auto-play cada 6s con pausa al pasar el cursor y navegación por puntos/flechas.
* **Límite de Capacidad (Máx 5 cupos por slot):** Detección en tiempo real con badges (`🟢 X Cupos`, `🔥 ¡Último Cupo!`, `🔒 CUPOS AGOTADOS`), bloqueo en frontend y rechazo HTTP 400 en backend.
* **Subida WebP en Navegador (`image-compressor.ts`):** Dropzone con compresión client-side (-80% peso) a WebP.
* **Módulo de Publicidad en Panel (`/dashboard/publicidad`):** Supervisión y renovación de banners.

### 2.5 🏢 Módulo ERP & Contabilidad Austral
* **Modo "Acceso Lanzamiento (100% Habilitado)":** Sin límites restrictivos de días de prueba para acelerar adopción.
* **Ley 40 Horas & LRE:** Cumplimiento total con Dirección del Trabajo y SII.
* **Integrity Chaining SHA-256:** Trazabilidad documental inmutable.

---

## 🚀 3. ROADMAP Y FASES DE EVOLUCIÓN

### FASE 14 a 16: Ecosistema Jurídico, Diario y ContaEmpleos Base — **COMPLETADO**
### FASE 17: Pasarela de Pagos y Autoservicio de Empleos — **COMPLETADO**
* [x] Integración de Mercado Pago Checkout Pro en `/publicar-empleo`.
* [x] Webhook con validación criptográfica HMAC SHA-256.
* [x] Pantalla de fallo dinámica con retorno contextual (`/checkout/failure`).

### FASE 18: Publirreportajes Comerciales y Gestión en Dashboard — **COMPLETADO**
* [x] Autoservicio de notas de prensa en `/publicar-comunicado`.
* [x] Módulos de administración `/dashboard/empleos` y `/dashboard/noticias`.
* [x] Activación del modo *"Acceso Lanzamiento (100% Habilitado)"*.

### FASE 19: Mega Banner Superior y Media Kit Multiciclo — **COMPLETADO**
* [x] Despliegue de Mega Banner Superior en cabecera pública de todo el portal.
* [x] Planes semestrales (-15%) y anuales (-25% OFF) en `/anunciar` y `/precios`.
* [x] Módulo ejecutivo en `/dashboard/publicidad`.

### FASE 20: Pasarela de Banners, Capacidad y Compresión WebP — **COMPLETADO**
* [x] Carrusel visual inteligente con rotación de 6s y pausa automática en hover.
* [x] Control estricto de capacidad máxima (5 marcas por slot) con badges de escasez y bloqueo de sobreventa.
* [x] Dropzone con compresión WebP en el navegador (-80% peso) y subida a Supabase.
* [x] Suite de 202 pruebas unitarias base aprobadas al 100%.

### FASE 21: Saneamiento, Órdenes de Compra, Créditos CCAF & Consolidación Multi-Empresa — **COMPLETADO**
* [x] Auditoría forense de 11 sistemas periféricos y migración ETL desde `remuneraciones.db`.
* [x] Expansión del centro de datos Supabase: 37 organizaciones activas, 189 colaboradores, 400 liquidaciones históricas y 1.126 haberes desglosados.
* [x] Creación de esquemas y migraciones SQL para `purchase_orders`, `purchase_order_items` y `payroll_loan_deductions`.
* [x] Conexión real del frontend de Órdenes de Compra con Server Actions y emisión de Factura DTE con un solo clic.
* [x] Eliminación de código muerto y scripts ajenos (`run_sync.js`, `query_supabase_js.js`, `news-mocks.ts`, `video-story-generator.ts`).
* [x] Reubicación de guías técnicas a `docs/guides/` y formalización de Procedimientos Operativos Estándar de Seguridad (`docs/technical/security_and_compliance_sops.md`).
* [x] Deduplicación del helper de RUT en `dj1887.py` hacia `core.utils.shared_utils`.
* [x] Expansión de suite de pruebas a **281 pruebas unitarias (100% aprobadas)** y compilación limpia TypeScript.

### FASE 22: Portal de Autoatención Laboral WhatsApp & Asistente Legal Tributario SII — **COMPLETADO**
* [x] **Autoatención Laboral vía WhatsApp (`/dashboard/payroll/whatsapp`):**
  - Esquema en Supabase: `whatsapp_org_settings`, `whatsapp_sessions`, `whatsapp_message_logs` activado en las 37 empresas.
  - Clasificador NLP de intenciones (liquidación, vacaciones, certificados, RIOHS/Ley Karin).
  - Cálculo de vacaciones ajustado a la normativa regional de Magallanes (20 días hábiles / Art. 67 inc. 2 Código del Trabajo).
  - Verificación 2FA por últimos 4 dígitos del RUT y consulta de solicitudes aprobadas reales.
  - Simulador interactivo en vivo (Sandbox) en el panel administrativo.
  - 22 pruebas unitarias en `test_whatsapp_bot_intents.py`.
* [x] **Asistente Legal Tributario y Generador de Escritos SII (.docx):**
  - Esquema en Supabase: `sii_defense_documents` con aislamiento multi-tenant RLS.
  - Generador DOCX formal con tipografía reglamentaria (Times New Roman 11pt, márgenes 3.5cm/3.0cm) dirigido al Director Regional del SII Magallanes (Punta Arenas).
  - Cobertura de las 4 causas críticas: Boletas vs Facturas (Art. 53 Ley IVA), Citación Art. 63, Rectificatoria F29 (Art. 127 CT) y Condonación Circular 50.
  - Integración en frontend con Next.js BFF Route Handler (`/api/sii/generate`) y modal interactivo en `/dashboard/accounting`.
  - Normalización de cabeceras HTTP y blindaje contra accesos cruzados (403 Forbidden).
  - 6 pruebas unitarias en `test_sii_defense_generator.py` y suite global de **312 tests aprobados al 100%**.

### FASE 23: Optimización de Ciclos, Rendimiento de Base de Datos & Resiliencia Visual — **COMPLETADO**
* [x] **Agregación Atómica en Supabase (PostgreSQL RPC):**
  - Creación de migración `20260907000000_optimize_dashboard_financial_aggregates.sql`.
  - Función `get_organization_financial_aggregates(p_organization_id, p_year)` que computa ventas, compras, nómina y activos en un solo paso dentro del motor SQL, reduciendo la transferencia de miles de filas a 1 solo objeto JSON consolidado.
  - Índices compuestos estratégicos en `sales_records`, `purchase_records`, `liquidations` e `economic_indicators`.
* [x] **Optimización de Ciclos y Caché:**
  - Amortización en memoria en `indicators.ts` (TTL 15 min), reduciendo drásticamente más de 13.000 `seq_scan` innecesarios en `economic_indicators`.
  - Integración transparente en `dashboard_metrics.py` con fallback resiliente.
* [x] **Resiliencia de UI y Empty States Asistidos:**
  - `AssetSummaryCard`: Componente optimizado que detecta empresas sin inventario de activos fijos (ej. *Inversiones Riquelme*) y renderiza un *Empty State* asistido con enlace directo a `/dashboard/accounting/assets`.
  - Contextualización de Salud Financiera: Empresas con costos o nómina pero sin facturación emitida se categorizan como `"PREOPERATIONAL"` (Fase Preoperativa o de Inversión) en vez de un fallo crítico ciego.
* [x] **Métricas de Calidad y Suite de Pruebas:**
  - 5 pruebas unitarias en `tests/test_financial_metrics_and_health.py` evaluando EBITDA, margen IFRS, casos preoperativos, activos en cero y blindaje multi-tenant.
  - Verificación estática TypeScript aprobada con 0 errores.

### FASE 24: Auditoría Preventiva F29 ↔ RCV (Pre-SII Shield) & Smart Matching Bancario — **COMPLETADO**
* [x] **Auditoría Preventiva F29 ↔ RCV (Pre-SII Shield):**
  - Creación del endpoint `POST /api/v1/f29/audit-against-rcv` en FastAPI.
  - Cruce automatizado en tiempo real entre el Formulario 29 declarado (Código 142 Débito, Código 538 Crédito) y los registros reales emitidos en `sales_records` y `purchase_records`.
  - Diagnóstico de riesgo fiscal (`CONSISTENT`, `MEDIUM_RISK`, `HIGH_RISK`) con advertencia de discrepancias antes de fiscalizaciones del SII.
  - Integración en frontend mediante Server Action `auditF29AgainstRCVAction` y botón interactivo con badges de riesgo en `/dashboard/accounting/f29-comparative`.
* [x] **Smart Matching Bancario con Tolerancias de Comisión:**
  - Extensión del algoritmo de sugerencias en `bank_reconciliation.py`.
  - Detección de depósitos netos de pasarelas de adquirencia (Transbank / Mercado Pago / Getnet con deducción de comisión del 0.8% al 4.0%).
  - Marcado automático como `commission_adjusted` con cálculo de la comisión estimada en CLP.
* [x] **Blindaje de Endpoints y Procedimientos de Seguridad:**
  - Sustitución de peticiones inseguras directas a `localhost:8000` en el navegador por Server Actions protegidos (`deleteF29Action`).
  - Cascada lógica con reversión y purga atómica del asiento en el Libro Mayor mediante `accounting_events`.
* [x] **Pruebas Unitarias y Métricas de Calidad:**
  - 5 pruebas unitarias en `tests/test_f29_rcv_audit_and_reconciliation.py` (100% aprobadas).
  - TypeScript sin errores de compilación (`tsc --noEmit`).
