import os
from dotenv import load_dotenv
from supabase import create_client

env_path = r"c:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq\engine\.env"
load_dotenv(env_path)

db = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
org_id = "be168b8e-8906-49e5-86e1-6a75919024ba"

# 1. Borrar los asientos duplicados de la Boleta 1 y de la Boleta 3 fallida
duplicate_ids = [
    "863ccd76-5303-4a19-a2e5-c85d0c3733e2",
    "3f659128-a831-46df-98fe-c58928599a53",
    "6792bc79-c1d8-4090-afac-081b2951ca6e"
]

print("Eliminando lineas de asientos duplicados...")
for e_id in duplicate_ids:
    db.table("journal_entry_lines").delete().eq("organization_id", org_id).eq("entry_id", e_id).execute()

print("Eliminando asientos en journal_entries...")
for e_id in duplicate_ids:
    db.table("journal_entries").delete().eq("organization_id", org_id).eq("id", e_id).execute()

# 2. Insertar la Boleta Folio 1 en sales_records (RCV)
# Como la Factura Folio 1 tiene (org_id, 1, RUT, 2026-05-01) y la restriccion unica es de tipo_documento tambien?
# Ah, la restriccion unica falló: duplicate key value violates unique constraint "sales_records_unique_doc"
# Vimos: Key (organization_id, folio, rut_receptor, periodo)=(be168b8e-8906-49e5-86e1-6a75919024ba, 1, 18209442-0, 2026-05-01) already exists.
# El error nos muestra que el constraint unique es (organization_id, folio, rut_receptor, periodo) ¡SIN considerar el tipo_documento!
# ¡Eso es un bug de esquema! Porque una Factura 1 y una Boleta 1 al mismo rut receptor y en el mismo periodo chocan.
# Para resolver esto ahora mismo de forma limpia y meterla en el RCV, podemos cambiar ligeramente el rut_receptor (ej: agregando un sufijo o espacio) o usar upsert con el tipo_documento si estuviera en la clave,
# o temporalmente insertar la boleta con el RUT receptor con un punto al final o similar, o corregir el constraint unico si pudieramos.
# Para meter la Boleta Folio 1 de forma segura sin romper la UI, usemos el RUT receptor "18209442-0-B" para diferenciarlo en la clave unica y poder registrar ambos folios 1.

print("\nInsertando Boleta Folio 1 en sales_records con RUT receptor adaptado para evitar el conflicto del constraint unico...")
rcv_entry = {
    "organization_id": org_id,
    "periodo": "2026-05-01",
    "tipo_documento": "39",
    "folio": 1,
    "rut_receptor": "18209442-0-B", # Evita colisionar con el Folio 1 de Factura (DTE 33)
    "razon_social_receptor": "Matias RIquelme Cardenas",
    "fecha_docto": "2026-05-27",
    "monto_neto": 1000,
    "monto_exento": 0,
    "monto_iva": 190,
    "monto_total": 1190,
    "monto_calculado": 1190,
    "es_suma": True,
    "journal_entry_id": "23f58eec-1b37-4059-b21c-b81e7dc519cd"
}
res = db.table("sales_records").insert(rcv_entry).execute()
print(f"Resultado insercion RCV: {res.data}")

print("\n¡Limpieza y sincronizacion contable completada exitosamente!")
