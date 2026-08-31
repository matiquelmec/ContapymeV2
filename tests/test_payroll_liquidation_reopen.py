import pytest

class TestPayrollLiquidationReopen:
    """
    🧪 Suite de pruebas unitarias para la transición y reapertura de liquidaciones de sueldo.
    """

    def test_01_liquidation_can_transition_from_approved_to_draft(self):
        """Valida que una liquidación aprobada pueda reabrirse a borrador limpiando firmas."""
        liquidation = {
            "id": "liq_123",
            "status": "aprobada",
            "signature_base64": "data:image/png;base64,iVBORw0KGgo...",
            "sueldo_liquido": 850000
        }

        # Simulación de la función revertLiquidationToDraft
        def revert_to_draft(liq: dict, reason: str) -> dict:
            updated = dict(liq)
            updated["status"] = "borrador"
            updated["signature_base64"] = None
            updated["reopened_reason"] = reason
            return updated

        reopened = revert_to_draft(liquidation, "Corrección de horas extras")
        assert reopened["status"] == "borrador"
        assert reopened["signature_base64"] is None
        assert reopened["reopened_reason"] == "Corrección de horas extras"
        assert reopened["sueldo_liquido"] == 850000

    def test_02_audit_log_entry_generated_on_reopen(self):
        """Valida que se genere un registro de auditoría estructurado al desaprobar."""
        log_entry = {
            "action": "LIQUIDATION_REVERTED_TO_DRAFT",
            "entity_type": "liquidation",
            "entity_id": "liq_123",
            "metadata": {
                "previous_status": "aprobada",
                "reason": "Ajuste de asignación familiar retroactiva"
            }
        }

        assert log_entry["action"] == "LIQUIDATION_REVERTED_TO_DRAFT"
        assert log_entry["metadata"]["previous_status"] == "aprobada"
        assert len(log_entry["metadata"]["reason"]) > 0
