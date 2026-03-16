# 🗄️ Supabase Database Management

## 📂 Estructura de Directorios

1.  **`/migrations`**: **(Fuente de Verdad de Ejecución)**
    *   Contiene archivos SQL numerados por fecha (`YYYYMMDD...`).
    *   **REGLA DE ORO:** Nunca modifiques un archivo de migración que ya haya sido ejecutado en producción. Siempre crea uno nuevo para cambios adicionales.
    *   Uso: Se ejecutan secuencialmente para actualizar la DB sin pérdida de datos.

2.  **`/snapshots`**: **(Fuente de Verdad Consultiva)**
    *   Contiene el `master_snapshot_YYYYMMDD.sql`.
    *   Es el diseño completo consolidado para lectura humana y documentación.
    *   Uso: Referencia rápida para entender relaciones y tipos sin leer 50 migraciones.

## 🚀 Flujo de Trabajo Profesional

1.  **Nuevo Requerimiento:** Crear una nueva tabla o columna.
2.  **Crear Migración:** Añadir un archivo en `/migrations` con el cambio (`ALTER TABLE...`).
3.  **Ejecutar en Supabase:** Aplicar el SQL en el editor de producción.
4.  **Actualizar Snapshot:** Al final de la sesión, exportar el esquema completo al archivo en `/snapshots` para mantener la documentación al día.

---
> **Nota:** Este proyecto utiliza triggers de integridad para el módulo RCV. No desactivar sin revisión del Blueprint.
