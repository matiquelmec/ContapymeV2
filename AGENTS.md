# 🛡️ CONSTITUCIÓN TÉCNICA Y OPERATIVA: CONTAPYMEPUQ (EDICIÓN 2026)
> **Fuente Única de Verdad Operativa (SSoT) para Agentes de IA y Desarrolladores.**  
> Todas las tareas ejecutadas en este repositorio deben adherirse obligatoriamente a este estándar.

---

## 🏛️ 1. LOS 6 PILARES FUNCIONALES DEL ECOSISTEMA
Contapymepuq no es una aplicación aislada, es un ecosistema distribuido que opera en la Región de Magallanes y Antártica Chilena:

1. **📰 Diario Regional Descentralizado (`/noticias`, `/publicar-comunicado`)**:
   - Ingesta y curaduría automatizada de fuentes australes con filtro anti-alucinaciones en Python.
   - Publirreportajes comerciales pagados con cobro automatizado.
   - IndexNow & SEO / Schema.org para Google News.
2. **💼 ContaEmpleos Magallanes (`/empleos`, `/publicar-empleo`)**:
   - Bolsa de trabajo regional con filtro estricto anti-discriminación (Art. 2° Código del Trabajo).
   - Generación de Story Cards para Instagram (1:1 y 9:16) con códigos QR auditados.
   - Integración con Mercado Pago Checkout Pro y Schema.org *Google for Jobs*.
3. **🏢 ERP & Contabilidad Austral con Motor FastAPI (`/dashboard`, `/software`, `/engine`)**:
   - Facturación electrónica DTE (timbrado, firma digital XML y envío al SII).
   - Auditoría RCV (Registro de Compras y Ventas) y propuesta F29.
   - Remuneraciones con Ley 40 Horas, cálculo de vacaciones Magallanes (20 días hábiles / Art. 67) y Libro LRE DT.
4. **📢 Media Kit Publicitario & Mega Banners (`/anunciar`, `/precios`)**:
   - 3 Posiciones comerciales: `header_top`, `calculator`, `news_sidebar`.
   - Control estricto de escasez (máx 5 cupos por slot) y rotación automática de 6s.
   - Dropzone con compresión client-side a WebP (-80% peso) y almacenamiento en Supabase Storage.
5. **🏛️ Formalización & Creación de Empresas (`/crear-empresa`)**:
   - Servicio llave en mano de constitución de sociedades por **$35.000**.
   - Embudo de conversión orgánico hacia los servicios contables del ERP.
6. **🧮 Herramientas Públicas de Captación (Lead Magnets)**:
   - Calculadora de Sueldo Líquido Austral (`/calculadora`) enlazada a indicadores económicos en vivo.
   - Autoatención Laboral vía WhatsApp (`/dashboard/payroll/whatsapp`) con bot NLP.
   - Asistente Legal Tributario SII (Generador formal `.docx` para la Dirección Regional SII Punta Arenas).
   - Verificador de Documentos Públicos con Criptografía SHA-256 (`/verify/check`).
   - Facturín AI (Chatbot interactivo de asistencia rápida).

---

## 🎭 2. ROLES OPERATIVOS CANÓNICOS

### Rol A: Principal Frontend Architect & UI Craftsmanship Designer
- **Activación**: Tareas que impactan la interfaz visual, componentes, landing page, diseño editorial o maquetación.
- **Skills Vinculantes**: `.agents/skills/ui-ux-pro-max`, `frontend-visual-design-system`, `framer-motion-scroll-orchestration`.
- **Estándar**: Paleta OKLCH armónica, tipografía con jerarquía editorial, retícula Base 8, micro-interacciones sutiles, touch targets $\ge 48\text{px}$ en móvil y $\ge 44\text{px}$ en escritorio, y comprobación sensorial en viewport de 390px.

### Rol B: Staff Principal Software Engineer & Lead Product Designer
- **Activación**: Tareas de arquitectura, persistencia, APIs, Server Actions, seguridad o motor FastAPI.
- **Skills Vinculantes**: `.agents/skills/contapyme-security-guardrails`, `supabase`, `supabase-postgres-best-practices`.
- **Estándar**: Ejecución obligatoria del protocolo "Austral Titanium Delivery Flow" en 6 fases.

---

## ⚡ 3. PROTOCOLO DE ENTREGA: "AUSTRAL TITANIUM DELIVERY FLOW"

### FASE 0: PRE-FLIGHT, CONTEXTO & ACTIVACIÓN DE SKILLS
- Verificar que el working tree de Git esté limpio (`git status`).
- Consultar los `SKILL.md` pertinentes en `.agents/skills/` antes de escribir código.
- Revisar `BLUEPRINT_MAESTRO.md` para respetar la arquitectura actual.
- **Regla de Oro**: Jamás modificar números oficiales, datos de contacto (Oficial: `+56 9 4444 4565`) ni precios sin consulta previa.

### FASE 1: ARQUITECTURA MULTI-TENANT & SEGURIDAD ZERO-BINARY
- **Doble Cerrojo Anti-IDOR en Server Actions**:
  - En toda acción que acceda a datos de una empresa, validar mediante `getSafeAuthenticatedOrgUser(organizationId)`.
  - Verifica sesión activa en Supabase Auth y pertenencia en `organization_members`.
- **Validación Runtime Zod 100%**:
  - Toda entrada de formulario o acción de servidor debe validarse con `schema.safeParse()`.
- **Política Zero-Binary en Base de Datos**:
  - Cero buffers o Base64 en columnas de PostgreSQL. Todo archivo binario (imágenes WebP, documentos PDF/DOCX) se almacena en Supabase Storage con URLs firmadas y metadatos JSON semánticos <50KB.

### FASE 2: CRAFTSMANSHIP VISUAL, ERGONOMÍA & ACCESIBILIDAD (WOW FACTOR)
- **Retícula Base 8**: Margins y paddings en 8/16/24/32/48/64px.
- **Ergonomía Táctil**: Touch targets $\ge 48\text{px}$ en móviles y $\ge 44\text{px}$ en escritorio.
- **Mobile-First & Thumb Zone**: Acciones primarias al alcance del pulgar.
- **Contraste WCAG 2.2 AA**: Ratio $\ge 4.5:1$ con tokens OKLCH institucionales.
- **Principio Cero Ficción**: Ningún enlace roto (`#`), ningún texto mutilado o incompleto, ningún botón simulado sin acción real.

### FASE 3: TRIPLE PUERTA DE CALIDAD (LOGICAL + SENSORIAL BROWSER GATE)
- **Lógica**:
  1. `npm run typecheck` en `/app` (0 errores permitidos).
  2. `npm test` en `/app` (100% de suites aprobadas).
  3. `pytest tests/` (100% de suites del motor Python aprobadas).
- **Sensorial en Navegador**:
  - Inspección en viewport móvil (390px, iPhone/Android) y escritorio (1440px / 2560px).
  - Certificar: cero desbordamiento horizontal (`scrollWidth === innerWidth`), jerarquía tipográfica nítida y navegación táctil sin jank.

### FASE 4: GOBERNANZA DOC-AS-CODE EN CASCADA
- Actualizar atómicamente tras cada cambio de impacto:
  1. `BLUEPRINT_MAESTRO.md` (Registrar la fase/hito con fecha y detalles técnicos).
  2. `README.md` (Instrucciones de ejecución y nuevos módulos).
  3. `AGENTS.md` (Nuevas reglas operativas si aplica).

### FASE 5: CICLO GIT & ENTREGA EJECUTIVA
- `git add` selectivo de los archivos modificados.
- Commit semántico bajo Conventional Commits (`feat:`, `fix:`, `style:`, `refactor:`, `docs:`, `test:`).
- `git push origin <rama>`.
- Emitir Reporte Ejecutivo con tabla de impacto, métricas de pruebas, confirmación sensorial y commit hash.
