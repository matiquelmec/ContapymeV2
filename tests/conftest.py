import os
from pathlib import Path
import sys
import pytest


ROOT = Path(__file__).resolve().parents[1]
ENGINE_DIR = ROOT / "engine"

if str(ENGINE_DIR) not in sys.path:
    sys.path.insert(0, str(ENGINE_DIR))


def pytest_collection_modifyitems(config, items):
    """
    Si el entorno está configurado con credenciales mock (ej. en GitHub Actions sin secrets de BD),
    salta de forma limpia las pruebas de integración que dependen de conexión activa a Supabase.
    """
    supabase_url = os.getenv("SUPABASE_URL", "")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    is_mock_env = "mock" in supabase_url.lower() or "mock" in supabase_key.lower() or not supabase_url

    if is_mock_env:
        skip_live_db = pytest.mark.skip(
            reason="Omitida: Requiere conexión activa a Supabase (entorno mock/CI detectado)."
        )
        live_db_patterns = [
            "/tests/database/",
            "/tests/integration/",
            "test_rcv_accounting.py",
            "test_accounting_api.py",
        ]
        for item in items:
            item_path = str(item.fspath).replace("\\", "/")
            if any(pattern in item_path for pattern in live_db_patterns):
                item.add_marker(skip_live_db)
