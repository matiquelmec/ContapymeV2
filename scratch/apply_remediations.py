import os
import psycopg2
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def apply_migration():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("❌ Error: DATABASE_URL no está definido en el archivo .env.")
        return

    migration_file = "supabase/migrations/20260525211500_auditoria_contable_remediaciones.sql"
    if not os.path.exists(migration_file):
        print(f"❌ Error: No se encontró el archivo de migración en: {migration_file}")
        return

    print("📖 Leyendo archivo de migración SQL...")
    with open(migration_file, "r", encoding="utf-8") as f:
        sql_content = f.read()

    print(f"🔌 Conectando a la base de datos de Supabase en la nube...")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        print("⚡ Aplicando sentencias SQL de remediación en Supabase...")
        cur.execute(sql_content)
        conn.commit()
        print("✅ Migración aplicada exitosamente en la base de datos.")

        # Notificar a PostgREST para recargar el caché del esquema
        print("🔄 Solicitando recarga de caché a PostgREST (PostgREST Schema Reload)...")
        cur.execute("NOTIFY pgrst, 'reload schema';")
        conn.commit()
        print("🚀 Recarga de esquema completada con éxito.")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Fallo al aplicar la migración: {e}")

if __name__ == "__main__":
    apply_migration()
