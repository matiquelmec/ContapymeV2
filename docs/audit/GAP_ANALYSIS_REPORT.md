# Reporte de Auditoría: Alineación del Proyecto y Base de Datos (Gap Analysis)

**Fecha:** 30 de Mayo, 2026  
**Ecosistema:** Contapymepuq v9.0  
**Estado de la Auditoría:** Ejecutada con éxito 🛡️

---

## 1. Alineación de Estructura Física y Documentación

Se ha contrastado de forma exhaustiva la especificación del [`BLUEPRINT_MAESTRO.md`](file:///c:/Users/Matías Riquelme/Desktop/Proyectos documentados/Contapymepuq/BLUEPRINT_MAESTRO.md) con el árbol físico de archivos del proyecto.

### Módulos Auditados:
*   **Módulo Base (Autenticación e Integridad):** Mapeado correctamente en [`engine/core/auth.py`](file:///c:/Users/Matías Riquelme/Desktop/Proyectos documentados/Contapymepuq/engine/core/auth.py) y en el encadenamiento de hash DTE de [`engine/core/dte/dte_logic.py`](file:///c:/Users/Matías Riquelme/Desktop/Proyectos documentados/Contapymepuq/engine/core/dte/dte_logic.py).
*   **Módulo RCV e Inteligencia:** Operativo en el backend [`engine/api/routers/rcv.py`](file:///c:/Users/Matías Riquelme/Desktop/Proyectos documentados/Contapymepuq/engine/api/routers/rcv.py) y frontend [`app/src/app/dashboard/reconciliation/`](file:///c:/Users/Matías Riquelme/Desktop/Proyectos documentados/Contapymepuq/app/src/app/dashboard/reconciliation/).
*   **Módulo DTE y Remuneraciones:** Módulos de lógica en [`engine/core/dte/`](file:///c:/Users/Matías Riquelme/Desktop/Proyectos documentados/Contapymepuq/engine/core/dte/) y controladores de FastAPI alineados.
*   **Módulo de Reportes Certificados:** Mapeado en el backend y almacenamiento.
*   **Módulo de Conciliación Bancaria:** Estructuras de triggers Postgres e endpoints unificados en el motor.

**Conclusión de Estructura:** **Excelente.** Tras la limpieza de archivos obsoletos y temporales en la raíz y en el directorio del backend (`engine/`), la estructura del proyecto está limpia, ordenada y no presenta redundancias.

---

## 2. Brechas Detectadas (Base de Datos Supabase vs. Migraciones Locales)

Se realizó una auditoría cruzada conectándose al OpenAPI expuesto por Supabase (PostgREST) y validando la existencia de las 53 tablas y vistas reales expuestas contra los 77 archivos SQL de la carpeta [`supabase/migrations/`](file:///c:/Users/Matías Riquelme/Desktop/Proyectos documentados/Contapymepuq/supabase/migrations/).

Se han detectado las siguientes brechas y discrepancias críticas:

### 🚨 brecha 1: Tabla `organization_invitations` Faltante en Supabase (Crítico)
*   **Descripción:** Esta tabla está definida en la migración local [`20260323000003_organization_invitations.sql`](file:///c:/Users/Matías Riquelme/Desktop/Proyectos documentados/Contapymepuq/supabase/migrations/20260323000003_organization_invitations.sql) y es requerida en Next.js para invitar nuevos miembros de organizaciones (ver [`app/src/actions/members.ts`](file:///c:/Users/Matías Riquelme/Desktop/Proyectos documentados/Contapymepuq/app/src/actions/members.ts#L26)).
*   **Hallazgo:** **La tabla no existe en la base de datos real de Supabase.** Esto causará fallos en producción (Error `PGRST205` / Table not found) al intentar usar la funcionalidad de invitar miembros en la pantalla de Configuración.
*   **Razón:** Durante la migración de seguridad Phase 2 (`20260530010034`), la aplicación de RLS a esta tabla fue ignorada dinámicamente porque `to_regclass('public.organization_invitations')` retornaba `NULL` (la tabla nunca fue creada físicamente).

### ⚠️ Brecha 2: Tabla `dte_sii_raw_archive` Huérfana en Archivo Histórico (Advertencia)
*   **Descripción:** Esta tabla almacena los XML planos que el SII responde al emitir DTEs y está activa en el Supabase real.
*   **Hallazgo:** Su sentencia de creación (`CREATE TABLE`) fue movida fuera de `supabase/migrations/` a la carpeta de archivo histórico [`archive/db_legacy/db_2026_05_30/migrations/2026_05_29_archive_and_add_constraint_sii.sql`](file:///c:/Users/Matías Riquelme/Desktop/Proyectos documentados/Contapymepuq/archive/db_legacy/db_2026_05_30/migrations/2026_05_29_archive_and_add_constraint_sii.sql).
*   **Riesgo:** Si un desarrollador levanta el proyecto desde cero utilizando únicamente la carpeta operativa [`supabase/migrations/`](file:///c:/Users/Matías Riquelme/Desktop/Proyectos documentados/Contapymepuq/supabase/migrations/), la tabla no se creará, lo que romperá el almacenamiento de respuestas del SII.

### ⚠️ Brecha 3: Creación de `certified_reports` no registrada en Migraciones (Advertencia)
*   **Descripción:** La tabla `certified_reports` existe en producción y es usada por el módulo de Reportes Certificados, pero su definición inicial no existe en ningún archivo dentro de [`supabase/migrations/`](file:///c:/Users/Matías Riquelme/Desktop/Proyectos documentados/Contapymepuq/supabase/migrations/).
*   **Hallazgo:** Su sentencia de creación solo se documenta como guía de desarrollo en [`docs/guides/DEVELOPMENT.md`](file:///c:/Users/Matías Riquelme/Desktop/Proyectos documentados/Contapymepuq/docs/guides/DEVELOPMENT.md).

### ℹ️ Brecha 4: Tabla `centralized_account_config` (Informativo - Correcto)
*   **Descripción:** Esta tabla figura en migraciones antiguas y no en Supabase.
*   **Hallazgo:** Se confirma que su ausencia en Supabase es correcta y esperada, ya que la migración [`02_migration_contract.sql`](file:///c:/Users/Matías Riquelme/Desktop/Proyectos documentados/Contapymepuq/supabase/migrations/02_migration_contract.sql) la eliminó intencionalmente (`DROP TABLE CASCADE`) para limpiar estructuras de configuración legacy anchas tras refactorizar a `account_config_entries`.

---

## 3. Próximos Pasos Recomendados

Para corregir estas discrepancias y alinear al 100% la base de datos de producción con el repositorio local de desarrollo se propone:
1. **Crear la tabla `organization_invitations` en Supabase** aplicando su DDL correspondiente para reactivar el funcionamiento de invitaciones en la UI de Next.js.
2. **Mover o consolidar los scripts de creación** de `dte_sii_raw_archive` y `certified_reports` de regreso a la carpeta de migraciones activas de Supabase para asegurar la reproducibilidad del entorno de base de datos desde cero.
