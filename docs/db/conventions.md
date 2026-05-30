# DB Conventions

Fecha: 2026-05-30

## Fuente de Verdad

1. Todo cambio de schema debe entrar por `supabase/migrations/`.
2. No se aceptan migraciones nuevas en `db/migrations/` ni `scratch/`.

## Estructura

1. `supabase/migrations/`: migraciones activas.
2. `supabase/snapshots/`: snapshots historicos.
3. `tools/db/`: scripts operativos vigentes de auditoria/validacion/remediacion.
4. `docs/db/`: runbooks y convenciones.
5. `docs/audit/`: reportes y evidencia.
6. `scratch/`: zona temporal/experimental (no canonica).

## Operacion

1. Validacion semanal:
`python tools/db/run_phase3_validation.py`
2. Auditoria de conexion/integridad:
`python tools/db/audit_db_connection_and_integrity.py`
3. Remediacion controlada:
`python tools/db/remediate_unbalanced_entries.py` (dry-run)
`python tools/db/remediate_unbalanced_entries.py --apply` (con aprobacion)

## Politica de Compatibilidad

Wrappers en `scratch/` pueden mantenerse temporalmente para evitar ruptura de comandos antiguos.
Cuando el equipo migre completamente, esos wrappers se eliminan en una limpieza posterior.
