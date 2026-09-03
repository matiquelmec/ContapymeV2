# <p align="center">💎 CONTAPYMEPUQ 💎</p>
<p align="center">
  <strong>Ecosistema Contable, Financiero, Previsional, Laboral y Publicitario de Magallanes (v22.1)</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-22.1--Certified-blue?style=for-the-badge&logo=opsgenie&logoColor=white&color=0D6EFD" alt="Version 22.1">
  <img src="https://img.shields.io/badge/Tests-312_PASSED-emerald?style=for-the-badge&logo=pytest&logoColor=white&color=10B981" alt="312 Tests Passed">
  <img src="https://img.shields.io/badge/Next.js-16.3.3_Turbopack-black?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 16.3.3">
  <img src="https://img.shields.io/badge/FastAPI-98_Endpoints-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase&logoColor=white&color=3ECF8E" alt="Supabase">
</p>

<p align="center">
  <em>"Precisión Institucional, Lógica Superior y Ecosistema Productivo para la Patagonia Austral."</em>
</p>

---

## 📖 Descripción General

**ContaPymePUQ** es la plataforma digital integral y descentralizada para la región de **Magallanes y de la Antártica Chilena**, unificando siete motores productivos de alto impacto:

1. **🏢 ERP, Nómina & Contabilidad Austral:** 
   * Facturación Electrónica DTE ante el SII (Facturas 33, Boletas 39, Guías 52).
   * **Gestión de Órdenes de Compra (OC):** Emisión, cálculo aritmético de impuestos y conversión a Factura DTE firmada con un solo clic (`/dashboard/billing/purchase-orders`).
   * Nómina legal con **Ley 40 Horas / Ley Karin**, generación del **Libro de Remuneraciones Electrónico (LRE)** para la DT.
   * **Amortización de Créditos Sociales CCAF:** Control y descuento en cuotas de créditos sociales (Caja Los Andes / Coopeuch) con tope legal del 15% de la renta líquida.
   * Conciliación Bancaria con cadena criptográfica SHA-256 e inmutabilidad de asientos contables.
2. **🤖 Portal de Autoatención Laboral vía WhatsApp (`/dashboard/payroll/whatsapp`):**
   * Canal automatizado para los 189 colaboradores de las 37 empresas clientes.
   * Reconocimiento inteligente por teléfono y validación de Segundo Factor (2FA).
   * Entrega inmediata de liquidaciones de sueldo oficiales en PDF.
   * Cálculo legal de vacaciones bajo el **Estatuto de Magallanes (20 días hábiles anuales / Art. 67 inc. 2 del Código del Trabajo)** descontando solicitudes aprobadas en tiempo real.
   * Generación de Certificados de Antigüedad y orientación normativa RIOHS / Ley Karin.
   * Simulador Sandbox en vivo integrado en el panel para administradores.
3. **⚖️ Asistente Legal Tributario & Generador de Escritos SII (.docx):**
   * Redacción automatizada de presentaciones legales formales para el **Director Regional del SII de Magallanes (Unidad Punta Arenas)**.
   * Descargos por ventas a consumidor final (Art. 53 Ley de IVA y Art. 35 Reglamento), citaciones Art. 63, rectificatorias voluntarias F29 y condonaciones de multas bajo la Circular 50.
   * Compilación directa en **Microsoft Word (.docx)** con tipografía oficial, márgenes reglamentarios (3.5 cm izquierdo, 3.0 cm superior) y montos de IVA declarados.
4. **💼 ContaEmpleos Magallanes (`/empleos` y `/publicar-empleo`):** Bolsa laboral regional de autoservicio (Self-Serve) con auditoría bajo el **Art. 2° del Código del Trabajo**, cálculo de sueldo líquido y cobros con Mercado Pago.
5. **🎨 Generador Publicitario Co-Branding con IA:** Cuantización cromática de marcas y generación determinista de piezas en formato **Post 1:1** e **Historia 9:16**.
6. **📰 Diario Regional & Media Kit Publicitario (`/noticias`, `/anunciar` y `/dashboard/publicidad`):**
   * Portal de noticias regionales de Punta Arenas, Puerto Natales, Porvenir y Cabo de Hornos con ingesta continua y deduplicación.
   * **Mega Banner Header**, Banner en Calculadora y Banner Lateral con **Carrusel Inteligente (6s)** y pausa en hover.
   * **Control de Capacidad (Máx 5 marcas)** con badges dinámicos de escasez.
   * **Subida de Archivos con Compresión WebP en el navegador** (-80% peso).
7. **🛡️ Seguridad & Compliance Criptográfico:** Verificación de webhooks con HMAC SHA-256, políticas RLS multi-tenant, sellado temporal y resguardo de certificados digitales PFX.

---

## 📊 Estado del Centro de Datos (Supabase PostgreSQL)

| Entidad / Módulo | Registros Activos | Estado de Cobertura |
| :--- | :---: | :--- |
| **Organizaciones Clientes** | **37 empresas** | Multi-tenant aislado con RLS en Magallanes. |
| **Colaboradores Registrados** | **189 trabajadores** | Contratos, AFP, Salud, haberes y descuentos. |
| **Liquidaciones Históricas** | **400 liquidaciones** | Con folios oficiales y cálculo previsional certificado. |
| **Haberes / Descuentos Detallados** | **1.126 conceptos** | En `payroll_custom_items` sincronizados. |
| **Autoatención WhatsApp** | **37 organizaciones** | Tabla `whatsapp_org_settings` activa (`is_active = true`). |
| **Defensa Tributaria SII** | Operativo | Tabla `sii_defense_documents` con RLS y descarga Word. |
| **Módulo Órdenes de Compra** | Operativo | Tablas `purchase_orders` y `purchase_order_items`. |
| **Módulo Créditos CCAF** | Operativo | Tabla `payroll_loan_deductions` con control de cuotas. |

---

## 🛠️ Especificación de Stack Tecnológico

| Capa / Componente | Tecnologías Clave | Propósito |
| :--- | :--- | :--- |
| **Frontend Web** | Next.js 16.3.3 (Turbopack), React 19, TypeScript, Tailwind CSS, Lucide | 64 rutas en producción: portales públicos, carrusel de banners y dashboard empresarial. |
| **Backend & Workers** | Python 3.12, FastAPI (98 endpoints), Pydantic v2, APScheduler | Motores de cálculo previsional, facturación DTE, auditoría legal, autoatención y RCV. |
| **Base de Datos** | Supabase PostgreSQL, Row Level Security (RLS) | Almacenamiento seguro multi-tenant con partición por organización. |
| **Generación Documental** | Python-Docx, jsPDF, ReportLab | Emisión de escritos legales Word del SII, liquidaciones PDF y certificados laborales. |
| **Pasarela de Pagos** | Mercado Pago Checkout Pro + Webhooks HMAC | Cobros automatizados en empleos, publirreportajes, banners y suscripciones ERP. |
| **Compresión & Media** | HTML5 Canvas Client-Side, WebP Image Compressor | Reducción de 70%-90% de peso de imágenes antes de subir a Storage. |
| **Test Suite** | Pytest (**312 tests aprobados al 100%**) + Next.js Typecheck | Cobertura integral de cálculo tributario, RLS, DTE, WhatsApp, defensa SII y empleos. |

---

## 🚀 Inicio Rápido

Para levantar el entorno completo local:

```powershell
# Iniciar Frontend Next.js y Engine FastAPI
.\start.ps1
```

* **Frontend Web:** `http://localhost:3000`
* **Engine API & Swagger:** `http://localhost:8000/docs`
* **Ejecutar Pruebas Unitarias:** `python -m pytest tests/ -v`
* **Verificar Tipado TypeScript:** `cd app && npx tsc --noEmit`

---

## 📁 Estructura del Repositorio

```text
Contapymepuq/
├── app/                        # 🎨 Frontend Web Next.js 16.3.3
│   ├── src/
│   │   ├── actions/            # Server Actions (Billing, Nómina, Empleos, Ads, Audit)
│   │   ├── app/                # Rutas App Router (Dashboard, Empleos, Noticias, Anunciar)
│   │   ├── components/         # Componentes UI (Carrusel, Publicador, Calculadora, Sidebar)
│   │   └── lib/                # Utilidades transversales, clientes Supabase y schemas
│   └── package.json
├── engine/                     # ⚙️ Motor Backend Python FastAPI
│   ├── api/routers/            # Routers (Purchase Orders, DTE, Payroll, F29, Jobs, News)
│   ├── core/                   # Base de datos, autenticación, lógica tributaria y DTE
│   └── main.py                 # Punto de entrada de la API
├── docs/                       # 📚 Documentación Institucional y Técnica
│   ├── guides/                 # Guías de integración (Facturación Electrónica SII, Desarrollo)
│   └── technical/              # Procedimientos Operativos Estándar (SOPs) de Seguridad
├── supabase/                   # 🗄️ Migraciones SQL y esquemas de base de datos
├── tests/                      # 🧪 Suite de 281 Pruebas Unitarias Automatizadas
│   ├── test_purchase_orders_and_loan_deductions.py # Tests de Órdenes de Compra y Créditos
│   └── ...                     # Tests de Nómina, RCV, DTE, Empleos, Banners y Seguridad
└── start.ps1                   # Script PowerShell de arranque automatizado
```

---

## 📚 Documentación Técnica Adicional

* 🛡️ **[Procedimientos Operativos Estándar de Seguridad (SOPs)](docs/technical/security_and_compliance_sops.md)**: Protocolos criptográficos HMAC, RLS, PFX y SHA-256 Chaining.
* 🧾 **[Guía Oficial de Facturación Electrónica SII](docs/guides/facturacion_electronica_sii.md)**: Estándar DTE 33/39/52, timbrado CAF y comunicación con el SII.
* 📋 **[Blueprint Maestro de Arquitectura](BLUEPRINT_MAESTRO.md)**: Hoja de ruta completa de las 21 fases de desarrollo.
