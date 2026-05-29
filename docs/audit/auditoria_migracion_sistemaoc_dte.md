# Auditoria migracion SistemaOC -> Contapymepuq DTE

## Alcance

Origen auditado: `C:\Users\Matias Riquelme\Desktop\Proyectos documentados\SistemaOC`

Artefactos revisados:

- `SistemaOC.exe` empaquetado con PyInstaller.
- `_internal` con dependencias Python 3.13.
- `database/ordenes.db`.
- `database/produccion.db`.
- `caf/prod` y `caf/cert`.
- Implementacion destino en `engine/core/dte`.

## Que maneja la firma en Contapymepuq

La firma DTE esta concentrada en `engine/core/dte/dte_signer.py`:

- `sign_ted`: firma el bloque `<DD>` del TED con la llave privada `RSASK` del CAF.
- `sign_xml`: firma el nodo `<Documento ID="...">` con el certificado PFX/P12.
- `sign_envio`: firma el nodo `<SetDTE ID="...">` del sobre `EnvioDTE` o `EnvioBOLETA`.
- `sign_seed`: firma la semilla para obtener token SII.

La extraccion de la llave CAF esta en `engine/core/dte/caf_manager.py`. Soporta el formato real de `SistemaOC`: `RSASK` como PEM plano.

## Que trae SistemaOC

`SistemaOC` es una aplicacion PyInstaller con modulos internos detectados:

- `core.dte`
- `core.rcf`
- `core.ws_acd`
- `core.intercambio`
- `database.db_manager`
- `gui.facturacion_view`

El modulo `core.dte` contiene logica equivalente a:

- `CafManager`
- `GeneradorDTE`
- `EnviadorDTE`
- `_firmar_con_caf`
- `_firmar_documento`
- `_firmar_envelope`
- `_build_xmldsig_signature`
- `_format_xml_for_sii`
- `_verificar_firmas`

## Hallazgos criticos

### 1. Estado enviado sin cierre tributario final

En `SistemaOC`, `produccion.db` tiene 16 DTE en estado `Enviado`, todos con `track_id`, pero sin columnas equivalentes a `sii_status`, `sii_message`, respuesta cruda o fecha de consulta final.

En `ordenes.db` existen registros `SOK` o `Enviado` sin `track_id`, por ejemplo:

- DTE 39 folio 2, `Enviado`, `track_id = ''`.
- DTE 33 folios 53-56, `SOK`, `track_id = ''`.
- DTE 56 folio 14, `SOK`, `track_id = ''`.
- DTE 61 folios 41-43, `SOK`, `track_id = ''`.

Riesgo: migrar `estado = Enviado` como aceptado produciria falsos positivos tributarios.

### 2. Credenciales sensibles en SQLite

`mi_empresa` contiene:

- `cert_path`
- `cert_password`
- `rut_representante`
- `clave_sii`
- `apigw_auth`

En los datos auditados, `cert_password` esta presente en claro. No debe migrarse a Supabase como texto plano; debe pasar por Storage seguro y RPC de cifrado.

### 3. CAF de produccion disponibles

`SistemaOC/caf/prod/caf_33_f53-56.xml` contiene:

- RUT emisor `77411206-5`.
- Tipo DTE `33`.
- Rango `53-56`.
- `RSASK` en PEM plano.

Contapymepuq ya soporta este formato en `CAFManager.get_private_key_from_caf`.

### 4. Diferencia de firma detectada en destino

El rechazo SII `RFR` observado en Contapymepuq apunta a firma invalida. Se corrigieron dos riesgos:

- No serializar con `pretty_print=True` despues de calcular `SignatureValue`.
- Insertar en TED el mismo `<DD>` compacto que se firma con `FRMT`.

Estos cambios reducen el riesgo de que la canonicalizacion cambie despues de firmar.

## Reglas de migracion recomendadas

### `dte_emitidos` -> `dte_issued`

Mapeo base:

- `tipo_dte` -> `tipo_dte`
- `folio` -> `folio`
- `fecha` -> `fecha_emision`
- `receptor_rut` -> `receptor_rut`
- `receptor_nombre` -> `receptor_razon_social`
- `receptor_giro` -> `receptor_giro`
- `receptor_direccion` -> `receptor_direccion`
- `receptor_comuna` -> `receptor_comuna`
- `receptor_ciudad` -> `receptor_ciudad`
- `monto_neto`, `monto_iva`, `monto_exento`, `monto_total`
- `track_id` -> `track_id`

Mapeo de estado:

| SistemaOC | Condicion | Contapymepuq |
| --- | --- | --- |
| `Enviado` con `track_id` | requiere consulta SII | `sent` temporal, `sii_submission_status = submitted` |
| `Enviado` sin `track_id` | inconsistente | `signed` o `error`, no `sent` |
| `SOK` sin `track_id` | set de prueba/local | no migrar como documento tributario real |
| `EPR` sin `track_id` | inconsistente | auditar antes de migrar |
| `RPR`, `RFR`, `RCH` | rechazo | `rejected` |
| `Anulado` | revisar tipo y folio | `annulled` o `rejected`, segun SII |
| `Pendiente` | no enviado | `draft` o `signed` segun exista XML |

### CAF

Migrar CAF solo si:

- RUT emisor coincide con `dte_companies.rut`.
- Tipo DTE coincide.
- Rango no se solapa con CAF existente.
- Ambiente queda marcado correctamente: `production` o `certification`.

### Certificado

No migrar `cert_password` en claro. Flujo correcto:

1. Subir PFX a Storage `dte_certificates`.
2. Guardar ruta en `dte_companies.cert_path`.
3. Cifrar password con `encrypt_cert_password`.
4. Guardar solo `cert_password_encrypted`.

## Validacion obligatoria post migracion

Para cada DTE con `track_id` migrado:

1. Consultar SII por tipo:
   - DTE 33/56/61: `QueryEstUp`.
   - DTE 39/41: API REST de boletas.
2. Persistir `sii_status`, `sii_message`, `sii_checked_at`, `sii_response_payload`.
3. Solo marcar `accepted` si SII responde aceptado.
4. Marcar `rejected` si SII responde `RCH`, `RPR`, `RFR` o equivalente.

## Conclusion

La migracion no debe ser una copia directa de SQLite. `SistemaOC` mezcla estados locales, set de prueba, enviados tecnicos y documentos sin Track ID. Contapymepuq debe tratar `track_id` como recepcion tecnica y exigir polling SII para cerrar aceptacion/rechazo.
