# Plan de Unificacion DB (Estructura Repo)

Fecha base: 2026-05-30

## Objetivo

Eliminar duplicacion de carpetas/archivos DB y dejar una estructura unica, trazable y alineada con produccion.

## Estructura Objetivo

- `supabase/migrations/` -> unica fuente de cambios de schema.
- `supabase/snapshots/` -> snapshots historicos.
- `tools/db/` -> scripts operativos vigentes (auditar, validar, remediar).
- `docs/db/` -> runbooks y convenciones.
- `docs/audit/` -> reportes de auditoria.
- `archive/db_legacy/` -> artefactos legacy no operativos.

## Backlog de Ejecucion

1. Gobernanza y reglas
- Crear `docs/db/conventions.md` con reglas obligatorias.
- Definir politica: no se aceptan nuevas migraciones fuera de `supabase/migrations/`.

2. Clasificacion de archivos DB actuales
- Marcar cada SQL/script como:
  - `active`,
  - `legacy`,
  - `audit-artifact`.

3. Consolidacion de scripts activos
- Mover scripts vigentes desde `scratch/` a `tools/db/`:
  - `audit_db_connection_and_integrity.py`
  - `run_phase3_validation.py`
  - `remediate_unbalanced_entries.py`
- Mantener wrappers/aliases temporales en `scratch/` por compatibilidad corta.

4. Limpieza de duplicados
- Mover `db/migrations/*` y `db/remediations/*` a `archive/db_legacy/`.
- Mantener `db/audits/*` en `docs/audit/artifacts/` o en `db/audits/` (decidir uno).

5. Actualizacion documental
- Actualizar `README` principal con:
  - flujo de migraciones,
  - flujo de validacion postdeploy,
  - flujo de remediacion.

6. Verificacion final
- Ejecutar auditoria DB conectividad/integridad.
- Ejecutar smoke tests DB.
- Registrar salida en `docs/audit/`.

## Checklist de Aceptacion

- [ ] Solo `supabase/migrations/` contiene migraciones activas.
- [ ] Scripts DB activos unificados en `tools/db/`.
- [ ] Documentacion DB centralizada en `docs/db/`.
- [ ] Carpetas legacy archivadas y etiquetadas.
- [ ] Validaciones DB en verde.
