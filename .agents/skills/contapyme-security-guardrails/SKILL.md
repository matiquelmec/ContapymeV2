---
name: contapyme-security-guardrails
description: Directrices de seguridad multi-tenant (anti-IDOR), validación Zod runtime al 100% y política Zero-Binary en Supabase para Contapymepuq.
---

# Contapyme Security Guardrails — Seguridad y Persistencia Multi-Tenant

Este skill establece los contratos de seguridad para la gestión de datos en **Contapymepuq** (PostgreSQL Supabase + FastAPI + Server Actions).

---

## 🔒 1. Doble Cerrojo Anti-IDOR en Server Actions
Contapymepuq administra múltiples razones sociales (37+ empresas activas en Magallanes). Ninguna acción del servidor debe confiar en un `organization_id` recibido desde el cliente sin verificar membresía:

1. **Obtener el usuario autenticado** mediante `supabase.auth.getUser()`.
2. **Comprobar membresía activa en `organization_members`**:
   - `SELECT role, is_active FROM organization_members WHERE organization_id = :orgId AND user_id = :userId`.
3. **Rechazar con HTTP 401 / 403** si no es miembro activo o no posee el rol mínimo requerido.
4. **Respetar RLS en Base de Datos**: Las políticas de PostgreSQL actúan como el cerrojo de fondo en caso de invocaciones directas.

---

## 🛡️ 2. Validación de Entradas al 100% con Zod
- Prohibido recibir argumentos directos sin validación en Server Actions o Route Handlers.
- Utilizar `schema.safeParse(input)`.
- Si `!parsed.success`, retornar respuesta tipada de error estructurado sin filtrar trazas internas sensibles.

---

## 💾 3. Política Zero-Binary Persistence
- **Cero Base64/Blobs en PostgreSQL**: Queda estrictamente prohibido persistir cadenas Base64 o buffers pesados dentro de columnas de tablas (ej. `regional_news`, `ad_banners`, `sii_defense_documents`).
- **Almacenamiento en Supabase Storage**:
  - Imágenes ➔ Compresión previa a WebP en cliente (`image-compressor.ts`) y carga a buckets públicos/protegidos.
  - Documentos Legales/DTEs ➔ Almacenamiento en buckets privados con generación de URLs firmadas temporales.
  - La base de datos almacena exclusivamente el `storage_path`, metadatos JSON y sumas criptográficas SHA-256.
