# Plan profesional de auditoria DTE/SII - 2026-05-29

## Caso auditado

Documentos reportados como `Enviado` en Contapymepuq, pero no encontrados en SII:

| Folio/ID | Tipo DTE | Documento | Receptor | Fecha | Monto | Estado tributario local | Estado pago |
| --- | --- | --- | --- | --- | ---: | --- | --- |
| 53 | 33 | Factura Electronica | 18.209.442-0 | 2026-05-29 | 1.190 | Enviado | Pendiente |
| 19 | 39 | Boleta Electronica | 18.209.442-0 | 2026-05-29 | 1.190 | Enviado | Pagada |
| 18 | 39 | Boleta Electronica | 18.209.442-0 | 2026-05-29 | 1.190 | Enviado | Pagada |

## Criterio tecnico

Segun `Facturacion Electronica Chile_ Guia y Codigo.md`, el flujo SII no termina al generar o firmar el XML:

1. El DTE individual debe ser timbrado con CAF y firmado.
2. El contenedor `EnvioDTE` o `EnvioBOLETA` debe firmarse.
3. El envio debe transmitirse por multipart/form-data.
4. El SII debe devolver un `Track ID`.
5. El sistema debe consultar el procesamiento asincrono posterior.

Por lo tanto, `status = sent` solo es defendible si existe `track_id` y evidencia tecnica de recepcion. La validez tributaria final requiere estado posterior SII aceptado o rechazado.

## Hallazgo preliminar

El sistema separa bien el estado de pago (`payment_status`) del estado tributario (`status`), pero la trazabilidad del envio era insuficiente para una auditoria profesional:

- No quedaba hora de envio SII.
- No quedaba ambiente usado (`certification` o `production`).
- No quedaba respuesta cruda del SII.
- No quedaba payload estructurado de respuesta.
- No quedaba XML del sobre de envio.
- El worker consultaba Track ID por SOAP incluso para boletas, aunque las boletas se envian por API REST dedicada.
- El worker no seleccionaba `tipo_dte`, necesario para distinguir factura vs boleta.

## Pruebas de auditoria obligatorias

Para cada folio 53, 19 y 18:

1. Confirmar registro en `dte_issued`.
2. Validar `status`, `track_id`, `sii_status`, `sii_message`, `sii_environment`, `sii_sent_at`, `sii_checked_at`.
3. Confirmar existencia de `xml_content` firmado.
4. Confirmar existencia de `envio_xml_content` firmado.
5. Revisar `sii_response_payload` y `sii_raw_response`.
6. Si `track_id` es nulo, clasificar como firmado localmente o error de envio, no como enviado.
7. Si `track_id` existe, consultar estado SII:
   - DTE 33: `QueryEstUp.jws`.
   - DTE 39: API REST `boleta.electronica.envio/{rut}-{dv}-{trackid}`.
8. Comparar respuesta SII contra estado local.
9. Revisar `error_log` si hubo falla de firma, token, multipart, encoding, rechazo o timeout.
10. Verificar que `payment_status = paid` no haya inducido visualmente un estado tributario exitoso.

## Criterio de clasificacion

| Evidencia | Clasificacion |
| --- | --- |
| Sin XML firmado | Error de firma/generacion |
| XML firmado, sin Track ID | Firmado localmente, pendiente/error SII |
| Track ID con respuesta inicial | Enviado tecnicamente, pendiente de procesamiento |
| Consulta SII aceptada | Aceptado por SII |
| Consulta SII rechazada | Rechazado por SII |
| Track ID no reconocido por SII | Inconsistencia critica: revisar ambiente, RUT emisor, endpoint y reenvio |
| Estado SII `RFR` | Rechazado por firma; revisar TED, firma XMLDSig, certificado, canonicalizacion y sobre |

## Remediacion aplicada en codigo

1. Se agrega trazabilidad SII en `dte_issued`:
   - `sii_environment`
   - `sii_submission_status`
   - `sii_sent_at`
   - `sii_checked_at`
   - `sii_response_payload`
   - `sii_raw_response`
   - `envio_xml_content`
   - `error_log`
2. Se agrega restriccion: `status = sent` exige `track_id IS NOT NULL`.
3. Se persiste respuesta cruda y payload del SII al enviar factura o boleta.
4. Se corrige consulta de Track ID de boletas por API REST dedicada.
5. Se evita marcar como aceptado solo por tener procesamiento intermedio.

## Resultado de consulta SII inicial

Consulta realizada el 2026-05-29 contra produccion:

| Folio | Tipo DTE | Track ID | Estado SII | Glosa |
| --- | --- | --- | --- | --- |
| 53 | 33 | 12083202740 | RFR | Rechazado por Error en Firma |
| 19 | 39 | 22232334386 | RFR | Sin glosa detallada en respuesta REST |
| 18 | 39 | 22232261613 | RFR | Sin glosa detallada en respuesta REST |

Conclusion: los documentos si llegaron a la puerta de SII y recibieron Track ID, pero fueron rechazados por firma. El eslabon suelto no era el transporte inicial, sino la falta de polling y cierre del estado tributario final.

## Proximo paso operacional

Ejecutar la migracion y luego auditar los folios 53, 19 y 18 en la base real. Si alguno tiene `status = sent` pero no aparece en SII, revisar primero:

1. Si `sii_environment` fue `certification` en vez de `production`.
2. Si el `track_id` pertenece al RUT emisor correcto.
3. Si el documento fue boleta y se estaba consultando con el servicio equivocado.
4. Si el XML enviado al SII difiere del XML firmado guardado localmente.
