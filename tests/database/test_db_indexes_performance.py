import os
import sys
import time
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../engine')))

from core.database import get_supabase

def test_migration_sql_file_exists():
    sql_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../engine/database/migrations/01_performance_indexes.sql'))
    assert os.path.exists(sql_path), f"El archivo de migración {sql_path} no existe."
    
    with open(sql_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    assert "CREATE INDEX IF NOT EXISTS idx_journal_entries_org_fecha" in content
    assert "CREATE INDEX IF NOT EXISTS idx_economic_indicators_code_updated" in content
    assert "CREATE INDEX IF NOT EXISTS idx_purchase_records_org_period" in content
    assert "CREATE INDEX IF NOT EXISTS idx_sales_records_org_period" in content

def test_economic_indicators_query_latency():
    db = get_supabase()
    start_time = time.time()
    
    # Consultar indicadores económicos ordenados por fecha/updated_at
    res = db.table('economic_indicators').select('*').order('updated_at', desc=True).limit(10).execute()
    
    elapsed_ms = (time.time() - start_time) * 1000.0
    print(f"\n⏱️ Latencia de consulta economic_indicators: {elapsed_ms:.2f} ms")
    
    assert res.data is not None
    assert elapsed_ms < 3000.0  # Respuesta de red remota aceptable en < 3s
