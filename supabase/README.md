# 🗄️ Gobernanza de Base de Datos (Supabase)

Este directorio contiene las migraciones oficiales del esquema Contapymepuq.

---

## 📏 Estándares Técnicos
- **UUID**: Se utiliza exclusivamente `gen_random_uuid()` para mayor compatibilidad nativa.
- **RLS**: Todas las tablas DEBEN tener habilitado Row Level Security y estar vinculadas a un `organization_id`.
- **Integridad**: Los documentos DTE (`dte_issued`) están encadenados mediante SHA-256.

## 🕰️ Notas de Legado (Deprecaciones)
- **`rcv_imports`**: Esta tabla se mantiene únicamente con fines de **Auditoría Histórica** (Log). No debe utilizarse para cálculos de totales o reportes financieros dinámicos, ya que el sistema ahora utiliza agregación física de documentos.

## 🛡️ Estructura DTE
1.  **`dte_companies`**: Perfiles de emisor.
2.  **`dte_issued`**: Registro maestro de documentos (Encadenado).
3.  **`dte_items`**: Detalle de líneas de factura.
4.  **`dte_caf_folios`**: Gestión de folios autorizados por el SII.
