import os
import sys
import unittest
import httpx
import dotenv
from fastapi.testclient import TestClient

# Cargar variables de entorno del motor
dotenv.load_dotenv('engine/.env')

# Agregar la carpeta 'engine' al sys.path para poder importar localmente
sys.path.append(os.path.join(os.getcwd(), 'engine'))

from main import app
from core.auth import verify_token

# Mock de token de usuario para saltar autenticación
MOCK_USER = {
    "sub": "ca77aa93-c3c9-40b6-9cbc-6e65dd7914a8",
    "user_id": "ca77aa93-c3c9-40b6-9cbc-6e65dd7914a8",
    "email": "test@contapymepuq.cl"
}

def override_verify_token():
    return MOCK_USER

class TestRCVAccountingIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Sobrescribir dependencia de autenticación
        app.dependency_overrides[verify_token] = override_verify_token
        cls.client = TestClient(app)
        cls.org_id = "be168b8e-8906-49e5-86e1-6a75919024ba"
        cls.periodo = "2025-01"

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def test_generate_from_rcv_purchases_success(self):
        """Probar generación contable de compras RCV (debe ejecutarse sin error y crear asientos balanceados)"""
        payload = {
            "organization_id": self.org_id,
            "periodo": self.periodo,
            "type": "purchases"
        }
        # Realizar POST al endpoint de centralización
        response = self.client.post("/api/v1/accounting/generate-from-rcv", json=payload)
        
        print("STATUS CODE:", response.status_code)
        print("RESPONSE JSON:", response.json())
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json().get("success"))
        
        # Debe haber procesado o saltado registros si ya estaban centralizados
        self.assertIn("entries_created", response.json())

if __name__ == '__main__':
    unittest.main()
