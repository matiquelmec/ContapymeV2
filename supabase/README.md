# 🗄️ Gobernanza y Catálogo de Base de Datos (Supabase)

Este directorio contiene las migraciones oficiales del esquema **Contapymepuq**. La base de datos está diseñada sobre PostgreSQL en Supabase, implementando un modelo Multi-Tenant estricto y un registro forense de auditoría.

---

## 📏 Estándares Técnicos

*   **Identificadores**: Se utiliza exclusivamente `gen_random_uuid()` para mayor compatibilidad nativa y prevención de colisiones.
*   **Row Level Security (RLS)**: Todas las tablas transaccionales y de negocio DEBEN tener habilitado Row Level Security y estar aisladas a nivel de `organization_id` mediante políticas basadas en la función de seguridad `public.check_user_in_org(org_id)`.
*   **Integridad Criptográfica**: Los documentos DTE (`dte_issued`) están encadenados mediante SHA-256 para garantizar la inmutabilidad de los registros financieros.
*   **Gobernanza Relacional**: Integridad garantizada mediante llaves foráneas en cascada controlada y triggers automáticos de sincronización contable.

---

## 🗺️ Catálogo de Tablas del Sistema (32 Tablas)

A continuación se detalla el esquema físico de base de datos ordenado por módulos de negocio:

### 1. Control de Acceso, Tenant y Seguridad
*   **`organizations`**: Registro maestro de empresas u organizaciones administradas en la plataforma.
*   **`profiles`**: Datos de perfiles de usuario vinculados al sistema de autenticación de Supabase (email, nombre, rol).
*   **`organization_invitations`**: Gestión de invitaciones de acceso para nuevos miembros con roles y tokens temporales.
*   **`audit_logs`**: Registro inmutable de trazabilidad GRC (Gobierno, Riesgo y Cumplimiento) de cada acción crítica realizada en el sistema.

### 2. Módulo de Contabilidad y Centralización
*   **`chart_of_accounts`**: El Plan de Cuentas oficial estructurado de cada organización.
*   **`journal_entries`**: Cabeceras de asientos de diario contable (fecha, glosa, tipo de asiento).
*   **`journal_entry_lines`**: Apuntes o líneas individuales de asientos contables (debe, haber, cuenta, y flag de conciliación `is_reconciled`).
*   **`account_mapping_rules`**: Reglas dinámicas de asignación de cuentas según el contexto operacional (ej. compras, ventas, remuneraciones).
*   **`centralized_account_config`**: Configuración de centralización contable automática a nivel de organización.
*   **`f29_box_details`**: Mapeo de cuentas auxiliares y operaciones a las celdas del Formulario F29 del SII.
*   **`f29_computations`**: Historial de cálculos y borradores de declaraciones de impuestos mensuales (F29).

### 3. Registro de Compras y Ventas (RCV)
*   **`purchase_records`**: Registro detallado de documentos de compras tributarios recibidos.
*   **`sales_records`**: Registro de documentos de ventas tributarios emitidos (sincronizados dinámicamente con DTE).
*   **`rcv_imports`**: Tabla de bitácora y logs históricos de importaciones de RCV (mantenida con fines de auditoría histórica).

### 4. Módulo de Conciliación Bancaria (v9.0)
*   **`bank_statement_lines`**: Registro individual de movimientos de cartola bancaria importados por el usuario (flag de conciliación `is_reconciled`).
*   **`bank_reconciliations`**: Tabla de cruce transaccional N-a-M que asocia líneas de diario con movimientos de cartola. Posee triggers automáticos para actualizar el estado `is_reconciled`.

### 5. Facturación Electrónica (DTE)
*   **`dte_companies`**: Perfiles de emisor electrónico autorizados por el SII (dirección, RUT, certificado).
*   **`dte_issued`**: Registro maestro de documentos tributarios electrónicos emitidos (facturas, boletas, notas de crédito) protegidos por encadenamiento criptográfico SHA-256.
*   **`dte_items`**: Detalle de artículos o servicios facturados por cada DTE.
*   **`dte_caf_folios`**: Control de folios (archivos CAF XML) autorizados, con sus rangos, claves y contador de uso.

### 6. Remuneraciones y RRHH (Chilean Payroll)
*   **`employees`**: Fichas maestras de trabajadores de la organización (datos personales, previsión, AFP).
*   **`employment_contracts`**: Contratos de trabajo individuales (tipo de jornada, sueldo base, vigencia).
*   **`payroll_details`**: Detalle mensual de parámetros de liquidación de sueldos para cada colaborador.
*   **`payroll_settlements`**: Liquidaciones de sueldo finales emitidas y certificadas por mes.
*   **`employee_documents`**: Almacenamiento de archivos PDF asociados a trabajadores (liquidaciones firmadas, contratos).
*   **`employee_terminations`**: Registro de finiquitos y términos de relación laboral.
*   **`termination_causes`**: Causas legales de despido o renuncia basadas en los artículos del Código del Trabajo de Chile.
*   **`contract_modifications`**: Historial de anexos y modificaciones contractuales aplicados en el tiempo.
*   **`national_payroll_params`**: Parámetros previsionales nacionales de Chile actualizados (Topes imponibles, porcentajes de AFPs, tramos de Asignación Familiar).

### 7. Activos Fijos y Otros Módulos
*   **`fixed_assets`**: Catálogo de bienes de uso de la empresa con cálculos automatizados de depreciación lineal y corrección monetaria.
*   **`economic_indicators`**: Tabla global de indicadores de mercado en tiempo real (UF, UTM, Dólar, Euro, IPSA, Cobre, Petróleo WTI) compartida de forma pública.
*   **`regional_news`**: Módulo de noticias regionales descentralizadas de la región de Magallanes.
*   **`contact_messages`**: Registro de mensajes de contacto recibidos en el sitio público.

---

## 🔄 Triggers e Integridad Transaccional Crítica

1.  **`trg_sync_reconciliation_status`** (`on bank_reconciliations`):
    Actualiza de forma atómica y bidireccional el flag `is_reconciled` (tanto en `bank_statement_lines` como en `journal_entry_lines`) al insertar o eliminar una conciliación bancaria.
2.  **`trg_dte_audit`** (`on dte_issued`):
    Genera una entrada automática en `audit_logs` para auditar la emisión y firma de cada documento tributario.
3.  **`trg_sync_contracts`** (`on employment_contracts`):
    Mantiene la sincronización de estados y variables contractuales en cascada con el motor de cálculo de liquidaciones.
