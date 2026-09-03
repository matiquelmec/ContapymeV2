# 🛡️ PROCEDIMIENTOS OPERATIVOS ESTÁNDAR (SOP) DE SEGURIDAD Y COMPLIANCE
**ContaPymePUQ — Plataforma Cloud Financiera, Contable y Previsional v20.1**

---

## 1. PROPÓSITO Y MARCO DE SEGURIDAD

Este documento formaliza los Procedimientos Operativos Estándar (SOP) aplicados a la arquitectura de ContaPymePUQ para garantizar la confidencialidad, integridad criptográfica, trazabilidad y cumplimiento estricto con el marco normativo chileno (Servicio de Impuestos Internos, Dirección del Trabajo, Ley Karin N° 21.643, Ley 40 Horas N° 21.561 y Cajas de Compensación CCAF Ley 18.833).

---

## 📋 ÍNDICE DE PROCEDIMIENTOS ESTÁNDAR

* **SOP-SEC-01:** Verificación Criptográfica de Webhooks (HMAC SHA-256)
* **SOP-SEC-02:** Aislamiento Multi-Tenant y Auditoría de Row Level Security (RLS)
* **SOP-SEC-03:** Almacenamiento Cifrado y Uso de Certificados Digitales DTE (.pfx / .p12)
* **SOP-SEC-04:** Sellado Temporal y Cadena de Integridad SHA-256 (Ledger Inmutable)
* **SOP-SEC-05:** Compliance Laboral, Ley Karin y Auditoría Salarial
* **SOP-SEC-06:** Regulación de Deducciones por Créditos Sociales CCAF (Tope 15%)

---

## 🔐 SOP-SEC-01: Verificación Criptográfica de Webhooks (HMAC SHA-256)

### Objetivo
Prevenir ataques de suplantación (*man-in-the-middle* o *replay attacks*) en las notificaciones entrantes de pasarelas de pago (Mercado Pago).

### Procedimiento de Validación
1. **Extracción de Cabecera:** Al recibir una notificación en `/api/v1/billing/webhook`, se extrae el header `x-signature`.
2. **Desglose de Componentes:** Se analiza el timestamp `ts` y el hash recibido `v1`.
3. **Reconstrucción de Cadena Canónica:** Se concatena el ID del evento, el timestamp y la llave secreta institucional (`MERCADOPAGO_WEBHOOK_SECRET`).
4. **Cálculo HMAC SHA-256:** Se genera el digest HMAC en binario y se convierte a hexadecimal.
5. **Comparación en Tiempo Constante:** Se valida utilizando `hmac.compare_digest(calculated_hash, received_hash)` para inmunidad frente a ataques de temporización (*timing attacks*).
6. **Rechazo Inmediato:** Cualquier payload con timestamp mayor a 5 minutos o firma discordante es abortado con `HTTP 401 Unauthorized`.

---

## 🏢 SOP-SEC-02: Aislamiento Multi-Tenant y Auditoría de RLS

### Objetivo
Asegurar que ninguna organización tenga visibilidad ni acceso de escritura sobre los datos contables, nóminas o DTEs de otra empresa cliente.

### Procedimiento
1. **Directiva RLS Obligatoria:** Toda tabla en el esquema `public` de Supabase debe tener activado `ALTER TABLE <tabla> ENABLE ROW LEVEL SECURITY;`.
2. **Políticas Basadas en Roles (`private.is_org_member`):**
   ```sql
   CREATE POLICY "org_isolation_policy" ON public.purchase_orders
     FOR ALL
     USING (private.is_org_member(organization_id, auth.uid()))
     WITH CHECK (private.has_org_role(organization_id, auth.uid(), ARRAY['owner', 'admin', 'accountant']));
   ```
3. **Restricción de Claves de Servicio:** La llave `SUPABASE_SERVICE_ROLE_KEY` solo debe emplearse en workers asíncronos y cron jobs del motor backend, jamás expuesta en bundles de frontend.
4. **Auditoría de Inyección:** La suite de pruebas ejecuta `test_multi_tenant_isolation.py` simulando intentos de cross-tenant query con validación de retorno vacío o denegación.

---

## 📜 SOP-SEC-03: Almacenamiento Cifrado y Uso de Certificados DTE (.pfx / .p12)

### Objetivo
Garantizar la protección de la clave privada del representante legal utilizada para timbrar Facturas Electrónicas (DTE 33), Boletas (DTE 39) y Guías (DTE 52) ante el SII.

### Procedimiento
1. **Cifrado en Reposo:** Los archivos binarios PFX no se almacenan en texto plano. Se procesan a través de la API `/api/v1/dte/upload-pfx`, transformándose a almacenamiento encriptado o memoria volátil protegida.
2. **Password Hashing:** La contraseña del certificado se cifra en la base de datos utilizando claves simétricas maestras del entorno (`DTE_ENCRYPTION_KEY`).
3. **Firma XML Enveloped:** La firma se realiza mediante la librería criptográfica `xmlsec` aplicando el algoritmo `RSA-SHA1` exigido por la normativa técnica del SII.
4. **Verificación de CAF:** Cada folio emitido debe coincidir matemáticamente con el rango autorizado en el archivo CAF XML (`<RNG><D>X</D><H>Y</H></RNG>`).

---

## 🔗 SOP-SEC-04: Sellado Temporal y Cadena de Integridad SHA-256

### Objetivo
Prevenir la alteración retroactiva de asientos contables en el Libro Diario y asegurar la inmutabilidad exigida por el Código de Comercio.

### Procedimiento
1. **Hash Canónico:** Cada asiento mayor o comprobante cerrado genera un hash representativo:
   $$	ext{Hash}_n = 	ext{SHA256}(	ext{ID} \parallel 	ext{Fecha} \parallel 	ext{Glosa} \parallel \sum 	ext{Debe} \parallel \sum 	ext{Haber} \parallel 	ext{Hash}_{n-1})$$
2. **Encadenamiento Criptográfico:** El asiento $n$ almacena el `prev_hash` del asiento $n-1$, formando una cadena a prueba de manipulaciones (*tamper-proof ledger*).
3. **Verificación de Ruptura:** El endpoint de auditoría recorre la cadena. Si cualquier registro es modificado manualmente en base de datos, el hash diverge inmediatamente y activa una alerta de seguridad de auditoría.

---

## ⚖️ SOP-SEC-05: Compliance Laboral, Ley Karin y Auditoría Salarial

### Objetivo
Garantizar que el sistema cumpla con la fiscalización de la Dirección del Trabajo (DT) y normativas de equidad laboral.

### Procedimiento
1. **Ley Karin (Ley N° 21.643):**
   * Canal de denuncias interno con resguardo de identidad y registro inmutable de denuncias por acoso laboral o sexual.
   * Plazo legal estricto de derivación a la Inspección del Trabajo dentro de 3 días hábiles.
2. **Ley 40 Horas (Ley N° 21.561):**
   * Control automático del tope semanal de jornada laboral ordinaria (reducción gradual 44h ➔ 42h ➔ 40h).
   * Verificación de compensación de horas extraordinarias con recargo legal mínimo del 50%.
3. **Auditoría de Brecha Salarial (Art. 2° Código del Trabajo):**
   * Algoritmo de comprobación en `/api/v1/payroll/audit` que evalúa disparidades salariales entre géneros para un mismo cargo o función dentro de la organización.

---

## 💳 SOP-SEC-06: Regulación de Créditos Sociales CCAF (Tope 15%)

### Objetivo
Cumplir con el Artículo 22 de la Ley N° 18.833 sobre retenciones y descuentos previsionales por concepto de crédito social de Cajas de Compensación (Caja Los Andes, Caja La Araucana, etc.).

### Procedimiento
1. **Límite de Descuento Legal:** El monto descontado por créditos sociales no puede superar el **15% de la remuneración líquida** del colaborador, a menos que exista mandato expreso del trabajador bajo condiciones autorizadas.
2. **Control de Amortización:** La tabla `payroll_loan_deductions` mantiene el conteo estricto `cuota_actual` vs. `num_cuotas`. Al cumplirse la última cuota, el sistema marca el descuento como `inactivo` impidiendo cobros indebidos.
3. **Declaración en Previred:** Los montos retenidos se consolidan en los campos correspondientes del archivo de remuneraciones Previred para su pago directo a la Caja de Compensación.
