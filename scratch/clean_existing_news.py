import os
import sys
import re

sys.path.append(os.path.join(os.getcwd(), 'engine'))

try:
    from core.database import get_supabase
    db = get_supabase()
    
    print("Iniciando reparacion robusta de HTML en la base de datos de noticias...")
    
    res = db.table('regional_news').select('id, title, summary, content').execute()
    
    def robust_clean_html(text: str) -> str:
        if not text:
            return ""
        # Regex robusto que elimina etiquetas HTML cerradas o abiertas/truncadas sin cerrar
        cleaned = re.sub(r'<[^>]*>?', ' ', text)
        # Limpiar entidades comunes
        cleaned = cleaned.replace("&#8211;", "-").replace("&nbsp;", " ")
        # Colapsar espacios multiples
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        return cleaned

    updated_count = 0
    for item in res.data:
        news_id = item['id']
        title = item['title']
        summary = item['summary'] or ""
        content = item['content'] or ""
        
        # Detectar si hay signos de HTML (cerrados o truncados) o links
        has_html_summary = "<" in summary or "href=" in summary
        has_html_content = "<" in content or "href=" in content
        
        if has_html_summary or has_html_content:
            new_summary = robust_clean_html(summary) if has_html_summary else summary
            new_content = robust_clean_html(content) if has_html_content else content
            
            # Si el summary quedo vacio o es extremadamente corto tras la limpieza,
            # lo respaldamos con el content limpio o el titulo de la noticia.
            if len(new_summary) < 15:
                # Intentamos usar el content limpio
                clean_content_fallback = robust_clean_html(content)
                if len(clean_content_fallback) > 15:
                    new_summary = clean_content_fallback
                else:
                    new_summary = title
            
            # Asegurar que el summary no contenga links truncados remanentes
            if "news.google.com" in new_summary or "href=" in new_summary:
                new_summary = title
                
            # Limitar el summary a 280 caracteres para que no exceda limites
            new_summary = new_summary[:280].strip()
            
            safe_title = title.encode('ascii', 'ignore').decode('ascii')
            print(f"Reparando: '{safe_title[:50]}...'")
            
            db.table('regional_news').update({
                "summary": new_summary,
                "content": new_content
            }).eq('id', news_id).execute()
            updated_count += 1
            
    print(f"Reparacion finalizada. Se limpiaron y corrigieron {updated_count} noticias con HTML truncado/corrupto.")
    
except Exception as e:
    print(f"Error durante la reparacion: {e}")
