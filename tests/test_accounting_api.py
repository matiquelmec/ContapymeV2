import os
import sys
import unittest
from fastapi.testclient import TestClient

# Agregar carpeta engine al PATH
sys.path.append(os.path.join(os.getcwd(), 'engine'))

from main import app
from core.auth import verify_token
from core.database import get_supabase

# Mock variable para inyectar dinámicamente el user_id en cada test
MOCK_USER = {"sub": None, "user_id": None}

def override_verify_token():
    return MOCK_USER

class TestAccountingAPI(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        # Override de la dependencia de autenticación para pruebas
        app.dependency_overrides[verify_token] = override_verify_token
        cls.client = TestClient(app)
        cls.db = get_supabase()
        
        # Buscar un miembro de organización real en Supabase para pasar la validación de RLS/Roles
        res = cls.db.table("organization_members").select("organization_id, user_id").limit(1).execute()
        if res.data:
            cls.org_id = res.data[0]["organization_id"]
            cls.user_id = res.data[0]["user_id"]
            MOCK_USER["sub"] = cls.user_id
            MOCK_USER["user_id"] = cls.user_id
            print(f"Test inyectando org_id={cls.org_id} y user_id={cls.user_id}")
        else:
            cls.org_id = None
            cls.user_id = None

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def test_get_mapping_rules_endpoint(self):
        """Validar que el endpoint de mapping-rules responda exitosamente y devuelva datos sobre Supabase"""
        if not self.org_id or not self.user_id:
            raise unittest.SkipTest("No hay organizaciones/miembros en la base de datos para realizar la prueba.")
            
        # Llamar al endpoint correcto con prefijo /api/v1/accounting
        response = self.client.get(f"/api/v1/accounting/mapping-rules?organization_id={self.org_id}")
            
        print(f"Response status: {response.status_code}")
        print(f"Response data: {response.json()[:3] if isinstance(response.json(), list) else response.json()}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

if __name__ == '__main__':
    unittest.main()
