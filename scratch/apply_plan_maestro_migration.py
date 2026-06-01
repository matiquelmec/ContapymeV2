import os
import sys

# Agregar carpeta engine al PATH por si acaso
sys.path.append(os.path.join(os.getcwd(), 'engine'))

try:
    import psycopg2
    
    # Obtener DATABASE_URL del entorno o del archivo .env de la raíz
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        # Cargar manualmente de .env si no está en variables del entorno
        from dotenv import load_dotenv
        load_dotenv()
        db_url = os.getenv("DATABASE_URL")
        
    if not db_url:
        print("Error: DATABASE_URL no está configurado.")
        sys.exit(1)
        
    migration_path = "supabase/migrations/20260531220000_plan_maestro_integridad_supa.sql"
    if not os.path.exists(migration_path):
        print(f"Error: No se encontró el archivo de migración en {migration_path}")
        sys.exit(1)
        
    print(f"Conectando a Supabase PostgreSQL...")
    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    cur = conn.cursor()
    
    print(f"Leyendo migración {migration_path}...")
    with open(migration_path, "r", encoding="utf-8") as f:
        sql = f.read()
        
    print("Aplicando migración SQL de forma transaccional...")
    cur.execute(sql)
    conn.commit()
    print("¡Migración del Plan Maestro aplicada exitosamente en Supabase!")
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"Error durante la aplicación de la migración: {e}")
    sys.exit(1)
