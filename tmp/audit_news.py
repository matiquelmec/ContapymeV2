import os
import sys
from dotenv import load_dotenv

# Añadir el path del motor
sys.path.append(os.path.join(os.getcwd(), 'engine'))

try:
    from core.database import get_supabase
    
    db = get_supabase()
    res = db.table('regional_news').select('*').limit(10).execute()
    
    if not res.data:
        print("No hay noticias en la base de datos.")
        sys.exit(0)
        
    print(f"Auditoría de {len(res.data)} noticias encontradas:")
    print("-" * 50)
    
    for news in res.data:
        id_ = news.get('id')
        title = news.get('title', 'SIN TÍTULO')
        summary = news.get('summary', '')
        content = news.get('content', '')
        has_ai_prompt = bool(news.get('visual_prompt')) # Si tiene prompt visual, pasó por IA (teóricamente)
        
        # Criterios de Calidad:
        content_len = len(content)
        is_mock = news.get('source_url') == "" # Las mock no tienen source_url
        
        # Marcamos las de baja calidad:
        # 1. Sin sumario
        # 2. Sin prompt de imagen
        # 3. Contenido muy corto (< 200 caracteres) que sugiere un simple snippet de RSS
        quality_score = 100
        reasons = []
        if not summary:
            quality_score -= 40
            reasons.append("Sin sumario")
        if not has_ai_prompt and not is_mock:
            quality_score -= 30
            reasons.append("Sin prompt visual (No pasó por IA v2)")
        if content_len < 200:
            quality_score -= 20
            reasons.append("Contenido extremadamente corto (posible snippet raw)")
            
        status = "🟢 ALTA" if quality_score > 80 else "🟡 MEDIA" if quality_score > 40 else "🔴 BAJA"
        
        print(f"[{status}] {title[:60]}...")
        print(f"      - ID: {id_}")
        print(f"      - Calidad: {quality_score}/100")
        if reasons:
            print(f"      - Problemas: {', '.join(reasons)}")
        print("-" * 30)
except Exception as e:
    print(f"Error en auditoría: {e}")
