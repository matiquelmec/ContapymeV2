import os
import psycopg2
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def apply_migration():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("[Error] DATABASE_URL no esta definido en el archivo .env.")
        return

    migration_file = "supabase/migrations/20260525220000_sincronizacion_conciliacion.sql"
    if not os.path.exists(migration_file):
        print(f"[Error] No se encontro el archivo de migracion en: {migration_file}")
        return

    print("[Info] Leyendo archivo de migracion SQL...")
    with open(migration_file, "r", encoding="utf-8") as f:
        sql_content = f.read()

    print(f"[Info] Conectando a la base de datos de Supabase en la nube...")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        print("[Info] Aplicando sentencias SQL de sincronizacion en Supabase...")
        cur.execute(sql_content)
        conn.commit()
        print("[Success] Migracion aplicada exitosamente en la base de datos.")

        # Notificar a PostgREST para recargar el caché del esquema
        print("[Info] Solicitando recarga de cache a PostgREST (PostgREST Schema Reload)...")
        cur.execute("NOTIFY pgrst, 'reload schema';")
        conn.commit()
        print("[Success] Recarga de esquema completada con exito.")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"[Error] Fallo al aplicar la migracion: {e}")

if __name__ == "__main__":
    apply_migration()
