# Plan de Auditoría de Sincronización DB — Contapymepuq
**Objetivo:** Garantizar que el esquema de base de datos en producción sea un reflejo exacto de las migraciones controladas en el repositorio y que la documentación (`README`, `BLUEPRINT_MAESTRO`) sea coherente con ambos.

---

## 🔍 1. Puntos de Verificación Críticos

### A. Coherencia de Estructura (Esquema vs. Migraciones)
*   **Acción:** Mapear cada una de las 32 tablas presentes en el volcado SQL con su archivo de creación en `supabase/migrations/`.
*   **Detección de Tablas Huérfanas:** Identificar tablas que existan en la DB pero que no tengan una migración asociada (peligroso para despliegues en nuevos entornos).
*   **Verificación de Tipos:** Asegurar que los tipos personalizados (`dte_status`, `member_role`, etc.) estén definidos en las migraciones iniciales.

### B. Auditoría de Seguridad (RLS)
*   **Acción:** Validar que la tabla `profiles` y `economic_indicators` tengan las políticas aplicadas hoy (`20260516000000` y `20260516000001`) reflejadas en la configuración real.
*   **Check de Service Role:** Confirmar que las inserciones automáticas del motor (Engine) usen el bypass de RLS documentado.

### C. Sincronización de Documentación
*   **Acción:** Comparar el `supabase/README.md` con las tablas reales.
*   **Hallazgo Previo:** El README menciona que `rcv_imports` es para legado, pero el esquema real la incluye. Validar si los campos coinciden.

---

## 🛠️ 2. Fases de Ejecución Inmediata

| Fase | Tarea | Herramienta |
| :--- | :--- | :--- |
| **Fase 1** | Inventario de Tablas vs Migraciones | `grep` en `/supabase/migrations` |
| **Fase 2** | Validación de Restricciones (FK/Unique) | Inspección de archivos `.sql` |
| **Fase 3** | Reporte de Discrepancias | Generación de artefacto `db_audit_report.md` |

---

## 🚀 3. Evaluación de "Lo Real" (Estado Actual)

Basado en el esquema que proporcionaste, hay una coincidencia del **95%** con lo que el sistema "debería" tener según el Blueprint. El plan buscará ese 5% de discrepancias técnicas (ej. índices faltantes o triggers de auditoría no declarados).

---

> [!IMPORTANT]
> Una base de datos sincronizada es la base de la **Integridad Institucional**. Sin esto, las auditorías del SII podrían fallar por inconsistencias en la cadena de hashes.
