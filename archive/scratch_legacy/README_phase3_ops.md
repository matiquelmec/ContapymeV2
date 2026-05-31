# Phase 3 Ops Playbook

Este playbook define la operacion recurrente para los controles de Fase 3.

## 1) Validacion Semanal (obligatoria)

Comando:

```bash
python tools/db/run_phase3_validation.py
```

Esperado:
- `UNBALANCED_ENTRIES=0`
- `OVER_APPLIED_DOCS=0`
- `OVER_APPLIED_PAYMENTS=0`

Si cualquier valor es mayor a `0`, abrir incidente y pasar a la seccion 2.

## 2) Remediacion Controlada (manual)

Primero simular:

```bash
python tools/db/remediate_unbalanced_entries.py
```

Aplicar solo con aprobacion:

```bash
python tools/db/remediate_unbalanced_entries.py --apply
```

Volver a validar:

```bash
python tools/db/run_phase3_validation.py
```

## 3) Politica Operativa

- Nunca ejecutar `--apply` sin `dry-run` previo.
- Si el asiento pertenece a periodo `closed` o `locked`, no forzar cambios.
- Toda remediacion debe quedar registrada en bitacora de auditoria interna.

## 4) Checklist de Cierre de Incidente

1. Guardar salida de `dry-run`.
2. Guardar salida de `--apply`.
3. Guardar salida de validacion final (`0/0/0`).
4. Registrar fecha, responsable y alcance (cantidad de asientos).
