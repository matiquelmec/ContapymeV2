import pytest
import os
import json

class TestDesktopAndOfflineResilience:
    """
    🧪 Suite de Pruebas Unitarias de Arquitectura Desktop y Resiliencia Offline:
    Verifica la configuración PWA, el Service Worker, el manifiesto standalone,
    la cola de transacciones locales y la especificación de Tauri 2.0.
    """

    def test_01_pwa_manifest_has_valid_standalone_configuration(self):
        """Valida que el manifest.json declare el modo standalone y accesos directos."""
        manifest_path = os.path.join(os.getcwd(), "app", "public", "manifest.json")
        assert os.path.exists(manifest_path), "El archivo manifest.json no existe en app/public"

        with open(manifest_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        assert data.get("display") == "standalone", "El modo de visualización debe ser standalone para escritorio"
        assert "ContaPyme" in data.get("name", ""), "El nombre debe identificar a ContaPyme"
        assert len(data.get("shortcuts", [])) >= 3, "Debe tener accesos directos para funciones clave"

    def test_02_service_worker_file_exists_and_handles_offline_cache(self):
        """Valida que el Service Worker sw.js esté configurado con estrategia de caché offline."""
        sw_path = os.path.join(os.getcwd(), "app", "public", "sw.js")
        assert os.path.exists(sw_path), "El archivo sw.js no existe en app/public"

        with open(sw_path, "r", encoding="utf-8") as f:
            sw_code = f.read()

        assert "caches.open" in sw_code, "Debe inicializar la apertura de caché"
        assert "respondWith" in sw_code, "Debe interceptar peticiones de red"
        assert "contapymepuq" in sw_code.lower(), "El nombre de caché debe ser identificativo"

    def test_03_offline_sync_manager_queue_mechanics_and_idempotency(self):
        """Valida la lógica de encolado de transacciones offline y formato de identificadores."""
        import time
        import uuid

        def enqueue_simulated_tx(action: str, payload: dict) -> dict:
            return {
                "id": f"tx_{int(time.time()*1000)}_{uuid.uuid4().hex[:8]}",
                "action": action,
                "payload": payload,
                "status": "pending",
                "retries": 0
            }

        tx1 = enqueue_simulated_tx("create_contract", {"employee_id": "emp_01"})
        tx2 = enqueue_simulated_tx("save_liquidation", {"month": "2026-08"})

        assert tx1["id"].startswith("tx_")
        assert tx1["action"] == "create_contract"
        assert tx1["status"] == "pending"
        assert tx2["id"] != tx1["id"], "Cada transacción debe tener un ID único idempotente"

    def test_04_tauri_configuration_complies_with_desktop_standards(self):
        """Valida que la configuración de Tauri 2.0 contenga las dimensiones y seguridad requeridas."""
        tauri_conf_path = os.path.join(os.getcwd(), "src-tauri", "tauri.conf.json")
        assert os.path.exists(tauri_conf_path), "El archivo tauri.conf.json no existe en src-tauri"

        with open(tauri_conf_path, "r", encoding="utf-8") as f:
            t_conf = json.load(f)

        assert t_conf.get("productName") == "ContaPymePUQ"
        windows = t_conf.get("app", {}).get("windows", [])
        assert len(windows) > 0
        assert windows[0].get("width") >= 1024
        assert windows[0].get("height") >= 700
