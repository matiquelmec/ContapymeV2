import os
import sys


sys.path.append(os.path.join(os.getcwd(), "engine"))

from api.routers.rcv import _build_rcv_summary, _normalize_period


def test_rcv_balance_uses_signed_purchase_base():
    summary = _build_rcv_summary(
        purchases=[
            {"monto_total": 1190, "monto_calculado": 1000, "rut_emisor": "11111111-1"},
            {"monto_total": 595, "monto_calculado": -500, "rut_emisor": "11111111-1"},
        ],
        sales=[
            {"monto_total": 2380, "monto_calculado": 2000, "rut_receptor": "22222222-2"},
        ],
    )

    assert summary["monto_compras"] == 1785
    assert summary["monto_ventas"] == 2380
    assert summary["base_neta_compras"] == 500
    assert summary["base_neta_ventas"] == 2000
    assert summary["balance"] == 1500
    assert summary["balance_neto"] == 1500


def test_rcv_balance_handles_negative_purchase_base():
    summary = _build_rcv_summary(
        purchases=[
            {"monto_total": 1190, "monto_calculado": -1000, "rut_emisor": "11111111-1"},
        ],
        sales=[
            {"monto_total": 595, "monto_calculado": 500, "rut_receptor": "22222222-2"},
        ],
    )

    assert summary["base_neta_compras"] == -1000
    assert summary["balance"] == 1500


def test_normalize_period_accepts_common_formats():
    assert _normalize_period("202606") == "2026-06-01"
    assert _normalize_period("2026-06") == "2026-06-01"
    assert _normalize_period("2026-06-01") == "2026-06-01"
    assert _normalize_period(None) is None
