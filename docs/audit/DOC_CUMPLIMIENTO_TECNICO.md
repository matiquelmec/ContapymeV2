# DOSSIER DE CUMPLIMIENTO TÉCNICO Y NORMATIVO: CONTAPYMEPUQ v1.0
**Referencia:** Estándar de Integridad para Documentos Tributarios Electrónicos (DTE) y Contabilidad Digital
**Fecha:** 16 de mayo de 2026
**Clasificación:** Confidencial / Uso Institucional

---

## INTRODUCCIÓN
El presente documento certifica la conformidad técnica de la plataforma **Contapymepuq** con los estándares de integridad y seguridad requeridos para la gestión contable y tributaria en la región de Magallanes. El sistema implementa un modelo de **Blockchain Contable Propietario**, garantizando que cada transacción sea inmutable y auditable.

---

## 1. ARQUITECTURA DE INTEGRIDAD CRIPTOGRÁFICA

### 1.1 Encadenamiento SHA-256 (DTE Integrity Chain)
A diferencia de los sistemas contables convencionales, Contapymepuq trata los documentos emitidos como una cadena de bloques de confianza.
- **Vínculo de Integridad:** Cada factura, boleta o nota de crédito (DTE) incorpora un `integrity_hash`. Este hash se calcula utilizando el contenido del documento actual más el `integrity_hash` del documento inmediatamente anterior.
- **Inmutabilidad por Diseño:** Cualquier intento de modificar un documento ya emitido (incluso directamente en la base de datos) rompería la cadena de hashes, invalidando todos los registros posteriores y alertando de forma inmediata a los sistemas de auditoría.
- **Bloque GÉNESIS:** El historial de cada organización comienza con una semilla criptográfica única (`GENESIS_BLOCK_CONTAPYMEPUQ`), lo que previene la inyección de documentos retroactivos.

### 1.2 Algoritmo de Consistencia
`Hash(DTE_n) = SHA256(Payload(DTE_n) + Hash(DTE_n-1))`

Los campos protegidos por el hash incluyen:
- RUT Emisor y Receptor.
- Folio y Tipo de Documento.
- Fecha de Emisión.
- Monto Total.
- Hash del Documento Anterior.

---

## 2. SEGURIDAD Y GOBERNANZA DE DATOS

### 2.1 Aislamiento Multi-Tenant (Supabase RLS)
La plataforma garantiza el aislamiento total de los datos mediante políticas de **Row Level Security (RLS)** a nivel de motor PostgreSQL.
- **Aislamiento Físico de Consultas:** Un usuario de la "Empresa A" no tiene capacidad técnica para consultar, ni siquiera por error de programación, datos de la "Empresa B".
- **Auditoría de Acceso (Audit Logs):** Cada acción crítica (creación de DTE, cierre de mes, modificación de parámetros de remuneración) queda registrada de forma indeleble en la tabla `audit_logs`, incluyendo IP, usuario y timestamp.

### 2.2 Motor de Auditoría B2B (Mantenimiento)
El sistema incluye un worker dedicado (`indicators_scheduler`) que realiza tareas de mantenimiento y auditoría automática:
- **Limpieza de Logs:** Rotación controlada de logs de auditoría cada 6 meses para optimizar el rendimiento sin perder trazabilidad histórica crítica.
- **Sincronización con RCV:** Validación cruzada diaria entre los DTEs emitidos y el Registro de Compras y Ventas (RCV) para detectar discrepancias impositivas de forma proactiva.

---

## 3. CUMPLIMIENTO SII (SERVICIO DE IMPUESTOS INTERNOS)

### 3.1 Gestión de Folios (CAF)
Contapymepuq gestiona el ciclo de vida de los archivos CAF (Código de Autorización de Folios) con un enfoque preventivo:
- **Control de Agotamiento:** El sistema alerta y bloquea la emisión antes de exceder los rangos autorizados por el SII.
- **Ambientes Seguros:** Separación estricta entre folios de Certificación y Producción.

---

## CONCLUSIÓN
La arquitectura de **Contapymepuq** ha sido diseñada para superar los estándares básicos de un ERP, posicionándose como una herramienta de cumplimiento normativo y seguridad jurídica para las empresas de Magallanes. El sistema se encuentra **Audit-Ready** para procesos de certificación y fiscalización tributaria.

---
*Firma el Equipo de Ingeniería y Auditoría de Contapymepuq.*
