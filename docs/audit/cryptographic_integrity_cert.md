# 🔐 Certificación de Integridad Criptográfica (SHA-256 Chain)
**Proyecto:** CONTAPYMEPUQ — Ecosistema Contable Magallánico  
**Fecha:** 25 de Mayo, 2026  
**Estado:** COMPROMETIDO POR DISEÑO MULTI-EMPRESA (CRÍTICO)  

---

## 1. Análisis de la Cadena de Integridad (SHA-256 Ledger)
El sistema implementa una arquitectura de encadenamiento criptográfico similar a una Blockchain (Ledger) para evitar la manipulación de Documentos Tributarios Electrónicos (DTEs) en la tabla `dte_issued`.

El hash de cada registro se calcula como:
`Hash(DTE_n) = SHA256(Payload(DTE_n) + Hash(DTE_n-1))`

---

## 2. Hallazgo Crítico: Mismatch de Scope Multi-Empresa

Durante la auditoría del código de la API en Python y los disparadores de base de datos en PostgreSQL, se ha detectado una discrepancia crítica en el filtrado por pertenencia de datos:

### A. Lógica en la Base de Datos (PostgreSQL Trigger)
El disparador de base de datos `compute_dte_integrity` calcula la cadena de hashes agrupando los documentos por **empresa** (`company_id`):
```sql
SELECT integrity_hash INTO prev_hash 
FROM public.dte_issued 
WHERE company_id = NEW.company_id AND tipo_dte = NEW.tipo_dte
ORDER BY folio DESC LIMIT 1;
```

### B. Lógica en el Motor Python (`engine/core/dte/dte_logic.py`)
Las funciones de lectura y validación en Python agrupan y buscan los documentos utilizando la **organización** (`organization_id`) en lugar de la empresa:
```python
# _get_previous_hash:
last_dte = self.supabase.table("dte_issued")\
    .select("integrity_hash")\
    .eq("organization_id", self.organization_id)\
    .eq("tipo_dte", tipo_dte)\
    ...
```
```python
# verify_chain_integrity:
all_dtes = self.supabase.table("dte_issued")\
    .select("*")\
    .eq("organization_id", self.organization_id)\
    .eq("tipo_dte", tipo_dte)\
    ...
```

### C. Impacto Operativo
Si un cliente tiene **más de una empresa** configurada bajo la misma organización:
1.  **Corrupción del Hash en Borradores:** Python le pasará al builder un `previous_hash` calculado de forma global para la organización. Al guardarlo en la DB, el trigger SQL lo recalculará basándose estrictamente en la empresa (`company_id`), lo que generará una discrepancia entre lo que Python creyó firmar en el XML y lo que la DB guardó físicamente.
2.  **Falsos Positivos de Manipulación:** Al ejecutar la función `verify_chain_integrity` en Python, el sistema mezclará los DTEs de todas las empresas de la organización, detectando de forma inmediata una "Ruptura de Cadena" y arrojando un estado de **COMPROMISED**, bloqueando el dashboard de manera errónea.

---

## 3. Plan de Remediación Inmediato

Es obligatorio unificar el scope de filtrado en el motor de Python para que coincida con el trigger de PostgreSQL, filtrando por `company_id` en lugar de `organization_id`:

```python
# 1. En _get_previous_hash (engine/core/dte/dte_logic.py):
# Cambiar:
# .eq("organization_id", self.organization_id)
# Por:
.eq("company_id", self.company_data["id"])

# 2. En verify_chain_integrity (engine/core/dte/dte_logic.py):
# Cambiar:
# .eq("organization_id", self.organization_id)
# Por:
.eq("company_id", self.company_data["id"])
```
