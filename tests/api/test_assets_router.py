import os
import sys
import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

# Agregar carpeta engine al PATH
sys.path.append(os.path.join(os.getcwd(), 'engine'))

from main import app
from core.auth import verify_token
from api.routers.assets import get_asset_accounting_config, DepreciateRequest

MOCK_USER = {"sub": "mock-user-123", "user_id": "mock-user-123"}

def override_verify_token():
    return MOCK_USER

@pytest.fixture(autouse=True)
def setup_teardown():
    app.dependency_overrides[verify_token] = override_verify_token
    yield
    app.dependency_overrides.clear()

def test_get_asset_accounting_config_fallback():
    mock_db = MagicMock()
    mock_db.table.side_effect = Exception("DB error fallback")
    
    config = get_asset_accounting_config(mock_db, "mock-org-id")
    assert "asset_depreciation_expense_code" in config
    assert config["asset_depreciation_expense_code"] == "5.1.03.001"
    assert "asset_accumulated_depreciation_code" in config

def test_get_asset_accounting_config_custom():
    mock_db = MagicMock()
    mock_res = MagicMock()
    mock_res.data = [
        {
            "entry_key": "depreciation_expense",
            "chart_of_accounts": {"codigo": "5.1.01.999", "nombre": "Gasto Depreciación Especial"}
        }
    ]
    mock_db.table().select().eq().eq().eq().execute.return_value = mock_res
    
    config = get_asset_accounting_config(mock_db, "mock-org-id")
    assert config.get("asset_depreciation_expense_code") == "5.1.01.999"
    assert config.get("asset_depreciation_expense_name") == "Gasto Depreciación Especial"

def test_depreciate_request_schema():
    req = DepreciateRequest(org_id="test-org-123", periodo="2026-08-01")
    assert req.org_id == "test-org-123"
    assert req.periodo == "2026-08-01"
