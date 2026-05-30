# DB Reconciliation Report (Repo Structure)

Fecha: 2026-05-30

## Alcance

Auditoria de estructura de archivos DB en el repositorio para detectar:
- duplicacion entre `supabase/`, `db/` y `scratch/`,
- drift documental/operativo,
- propuesta de unificacion sin romper operacion.

## Hallazgos

1. Fuente principal de migraciones ya existe y es consistente:
- `supabase/migrations/` contiene el historial activo real (incluyendo Fase 1/2/3).

2. Existe segunda linea de artefactos DB en `db/`:
- `db/migrations/` contiene SQL suelto fuera de la cadena oficial de `supabase/migrations/`.
- `db/remediations/` contiene scripts puntuales de correccion.
- `db/audits/` contiene reportes y SQL de auditoria.

3. Existe tercera linea operativa en `scratch/`:
- scripts de aplicacion, verificacion, remediacion y auditoria DB.
- mezcla de scripts vigentes y scripts historicos ad-hoc.

4. Riesgo principal detectado:
- fragmentacion de "fuente de verdad" (migraciones en `supabase/` y SQL de cambios en `db/`/`scratch/`).
- riesgo de ejecutar SQL correcto en carpeta incorrecta y perder trazabilidad.

## Decisiones de Unificacion (Propuestas)

1. Fuente de verdad de schema:
- mantener **solo** `supabase/migrations/` para cambios estructurales.

2. Carpeta `db/`:
- conservar como historico/auditoria, no como fuente de migraciones activas.
- mover `db/migrations/*` a `archive/db_legacy/migrations/` o convertirlos en migraciones formales en `supabase/migrations/` segun corresponda.

3. Scripts operativos DB:
- consolidar scripts vigentes en `tools/db/` (nuevo namespace estable).
- dejar `scratch/` solo para scripts experimentales temporales.

4. Documentacion:
- crear `docs/db/` como punto unico de operacion:
  - runbook de migraciones,
  - runbook de auditoria semanal,
  - runbook de remediacion controlada,
  - convenciones de carpetas.

## Plan de Ejecucion (Fases)

### Fase A - Gobernanza (sin riesgo)
- publicar convenciones de carpetas y fuente de verdad.
- listar scripts vigentes y obsoletos.
- etiquetar artefactos `legacy`.

### Fase B - Consolidacion de scripts
- crear `tools/db/`.
- mover scripts vigentes desde `scratch/` a `tools/db/`.
- actualizar rutas en docs/tests.

### Fase C - Limpieza de duplicados
- archivar `db/migrations/` y `db/remediations/` en `archive/db_legacy/`.
- mantener `db/audits/` o mover a `docs/audit/artifacts/` segun preferencia.

### Fase D - Verificacion final
- ejecutar:
  - `python scratch/audit_db_connection_and_integrity.py`
  - `python scratch/run_phase3_validation.py`
  - smoke tests DB.
- confirmar integridad 0/0/0 y documentar cierre.

## Criterio de Aceptacion

Se considera unificacion completa cuando:
1. todo cambio de schema pasa por `supabase/migrations/`,
2. no quedan migraciones activas fuera de `supabase/migrations/`,
3. existe runbook unico en `docs/db/`,
4. auditoria DB critica queda en verde.
