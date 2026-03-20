import os
import sys

# Añadir el path del motor para importar core.*
sys.path.append(os.path.join(os.getcwd(), 'engine'))

try:
    from core.database import get_supabase
    
    db = get_supabase()
    
    print("🧹 Iniciando purga de noticias de baja calidad...")
    
    # 1. Identificar noticias sin sumario (indicador claro de Legacy/Fallback)
    # También buscamos las que no tienen prompt visual (AI v1)
    res_no_summary = db.table('regional_news').select('id, title').is_('summary', 'null').execute()
    res_empty_summary = db.table('regional_news').select('id, title').eq('summary', '').execute()
    
    to_delete_ids = [n['id'] for n in (res_no_summary.data + res_empty_summary.data)]
    
    if not to_delete_ids:
        print("✅ No se encontraron noticias de baja calidad (sin sumario).")
    else:
        print(f"🗑️ Eliminando {len(to_delete_ids)} noticias obsoletas...")
        for news_id in to_delete_ids:
            db.table('regional_news').delete().eq('id', news_id).execute()
        print(f"✨ Purga completada.")

    # 2. Resumen final del portal
    final_res = db.table('regional_news').select('id').execute()
    print(f"📊 Estado actual del portal: {len(final_res.data)} noticias de ALTA CALIDAD activas.")
    
except Exception as e:
    print(f"❌ Error durante la purga: {e}")
