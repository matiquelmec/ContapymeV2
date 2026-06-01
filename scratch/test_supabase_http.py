import os
import sys

sys.path.append(os.path.join(os.getcwd(), 'engine'))

try:
    from core.database import get_supabase
    db = get_supabase()
    
    # Hacer una consulta a pg_proc para ver funciones creadas en el esquema public
    res = db.table('regional_news').select('id').limit(1).execute()
    print("REST API conexión exitosa.")
    
    # Intentar ejecutar una query a través de una llamada RPC si existe algo útil
    # Consultaremos pg_proc usando una consulta HTTP REST sobre postgres
    # En Supabase, a través de PostgREST, podemos consultar pg_catalog si está expuesto
    # Pero usualmente no está en la API.
    # Intentemos listar las tablas
    tables = db.table('regional_news').select('*').limit(1).execute()
    print("Datos obtenidos de regional_news.")
    
except Exception as e:
    print(f"Error: {e}")
