import os
import sys

sys.path.append(os.path.join(os.getcwd(), 'engine'))

try:
    from core.database import get_supabase
    db = get_supabase()
    
    print("📋 REPORTE DE AUDITORÍA - SUPABASE v2")
    
    # 1. Verificar Tablas Críticas
    critical_tables = [
        'regional_news', 'organizations', 'employees', 'liquidations', 
        'chart_of_accounts', 'journal_entries', 'f29_forms',
        'centralized_account_config', 'termination_causes', 'employment_contracts'
    ]
    
    for t in critical_tables:
        try:
            db.table(t).select('count', count='exact').limit(0).execute()
            print(f"✅ {t.ljust(30)} | OK")
        except Exception:
            print(f"❌ {t.ljust(30)} | MISSING")

    # 2. Verificar Columnas Específicas de Calidad (News v2)
    news_cols = ['summary', 'slug', 'visual_prompt', 'source_url']
    print("\n🔍 NOTICIAS V2 - Columnas:")
    for col in news_cols:
        try:
            db.table('regional_news').select(col).limit(1).execute()
            print(f"✅ Columna: {col.ljust(20)} | OK")
        except Exception:
            print(f"❌ Columna: {col.ljust(20)} | MISSING")
            
except Exception as e:
    print(f"Error fatal: {e}")
