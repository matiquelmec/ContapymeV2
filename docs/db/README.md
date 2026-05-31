# 🗄️ Runbook de Base de Datos y Mantenimiento

Este documento detalla las convenciones, flujos y herramientas operativas para la gestión de la base de datos (Supabase / PostgreSQL) en **Contapymepuq**.

---

## 🗺️ 1. Estructura de Directorios

El repositorio organiza los recursos de base de datos de la siguiente manera:

*   **[`supabase/migrations/`](file:///c:/Users/Matías Riquelme/Desktop/Proyectos documentados/Contapymepuq/supabase/migrations)**: **Única fuente de verdad** del esquema de base de datos. Cualquier cambio estructural (tablas, funciones, RLS, triggers) debe crearse como una migración oficial de Supabase aquí.
*   **[`supabase/snapshots/`](file:///c:/Users/Matías Riquelme/Desktop/Proyectos documentados/Contapymepuq/supabase/snapshots)**: **Fuente de verdad consultiva**. Contiene el diseño completo consolidado de la base de datos para lectura humana y documentación rápida.
*   **[`tools/db/`](file:///c:/Users/Matías Riquelme/Desktop/Proyectos documentados/Contapymepuq/tools/db)**: Scripts operativos y herramientas de diagnóstico consolidadas y verificadas.
*   **[`archive/db_legacy/`](file:///c:/Users/Matías Riquelme/Desktop/Proyectos documentados/Contapymepuq/archive/db_legacy)**: Respaldos e histórico de scripts SQL y migraciones obsoletas.
*   **[`archive/scratch_legacy/`](file:///c:/Users/Matías Riquelme/Desktop/Proyectos documentados/Contapymepuq/archive/scratch_legacy)**: Historial de scripts de prueba temporales (`/scratch`).

---

## 🚀 2. Flujo de Trabajo para Cambios de Esquema

1.  **Crear Migración:** Generar un nuevo archivo SQL en `supabase/migrations/` usando la nomenclatura de fecha/tiempo: `YYYYMMDDHHMMSS_descripcion.sql`.
2.  **Aplicar en Local / Staging:** Ejecutar a través de Supabase CLI o la herramienta de despliegue configurada.
3.  **Ejecutar Checks de Post-Migración:**
    ```bash
    python tools/db/post_migration_check.py
    ```
4.  **Actualizar Snapshot:** Tras validar y aplicar los cambios, exportar el esquema completo al archivo correspondiente en `supabase/snapshots/` para mantener la documentación de referencia al día.

---

## 🛡️ 3. Scripts de Diagnóstico y Mantenimiento

Todos los scripts operativos se encuentran consolidados en `tools/db/` y deben ejecutarse usando el entorno virtual (`.venv`):

### A. Validación de Integridad Financiera
Verifica que no existan asientos descuadrados, documentos sobre-aplicados o discrepancias de transacciones:
```bash
engine/.venv/Scripts/python.exe tools/db/run_phase3_validation.py
```

### B. Auditoría de Conexión y RLS
Inspecciona las tablas críticas para verificar que la seguridad multi-tenant (RLS) esté activa y que las consultas utilicen los índices correctos:
```bash
engine/.venv/Scripts/python.exe tools/db/audit_db_connection_and_integrity.py
```

### C. Test de Penetración Contable (Simulación de Manipulación)
Simula una modificación de registros a nivel de base de datos para certificar que el motor de encadenamiento criptográfico (SHA-256) detecte la alteración y bloquee la organización:
```bash
engine/.venv/Scripts/python.exe tools/db/test_ledger_tampering.py
```

### D. Test de Aislamiento de Clientes
Simula peticiones cruzadas entre inquilinos para validar que el muro multi-tenant (RLS) impida que un cliente acceda a los registros de otro:
```bash
engine/.venv/Scripts/python.exe tools/db/test_multi_tenant_isolation.py
```

---
*Precisión contable institucional líder en la Región de Magallanes.*
