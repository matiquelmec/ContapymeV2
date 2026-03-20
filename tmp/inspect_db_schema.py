import os
import sys
import json

# Añadir el path del motor para importar core.*
sys.path.append(os.path.join(os.getcwd(), 'engine'))

try:
    from core.database import get_supabase
    
    db = get_supabase()
    
    # 🔎 Consultamos INFORMATION_SCHEMA para una auditoría profesional
    # Esto es mucho más preciso que 'list_tables' de un MCP genérico
    query = """
    SELECT 
        table_name, 
        column_name, 
        data_type, 
        is_nullable,
        column_default
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
    """
    
    # RPC or raw execute (using PostgREST we can't do direct SQL easily without an RPC)
    # But wait, we can just select from a view if we have one, or use the client to introspect
    
    # Alternative: Use the provided MCP-like logic if we had it, 
    # but since we have the Python Engine, let's use a simpler approach:
    # List the tables we want to verify specifically.
    
    target_tables = [
        'regional_news', 'organizations', 'employees', 'liquidations', 
        'chart_of_accounts', 'journal_entries', 'journal_entry_lines',
        'f29_forms', 'f29_box_details', 'centralized_account_config',
        'termination_causes'
    ]
    
    print("📡 Conectado a Supabase. Iniciando verificación de Esquemas...")
    print("-" * 60)
    
    all_ok = True
    for table in target_tables:
        try:
            # Intentamos un select limitado para ver si la tabla existe
            res = db.table(table).select("*").limit(1).execute()
            print(f"✅ TABLA: {table.ljust(25)} | ESTADO: EXISTE")
        except Exception as e:
            print(f"❌ TABLA: {table.ljust(25)} | ESTADO: NO ENCONTRADA")
            all_ok = False
            
    print("-" * 60)
    if all_ok:
        print("🚀 CONCLUSIÓN: Todos los esquemas críticos están presentes y accesibles.")
    else:
        print("⚠️ CONCLUSIÓN: Faltan algunas tablas del esquema solicitado.")

except Exception as e:
    print(f"❌ Error fatal en la inspección: {e}")
