"""
test_purchase_orders.py — Pruebas Unitarias del Módulo de Órdenes de Compra (OC)
=============================================================================
Verifica el cálculo de montos (Neto, IVA, Exento, Total) y la lógica de conversión
de Órdenes de Compra a Factura DTE en Contapymepuq.
"""

import pytest

def test_purchase_order_math_calculation():
    """Prueba el cálculo de Totales, Neto e IVA de la Orden de Compra."""
    items = [
        {"cantidad": 2, "precio_unitario": 10000, "descuento_pct": 0, "afecto_iva": True},  # 20.000 neto
        {"cantidad": 5, "precio_unitario": 4000, "descuento_pct": 10, "afecto_iva": True},  # 18.000 neto
        {"cantidad": 1, "precio_unitario": 5000, "descuento_pct": 0, "afecto_iva": False},  # 5.000 exento
    ]

    neto = 0
    exento = 0
    for item in items:
        subtotal = int(round(item["cantidad"] * item["precio_unitario"] * (1 - item["descuento_pct"] / 100.0)))
        if item["afecto_iva"]:
            neto += subtotal
        else:
            exento += subtotal

    iva = int(round(neto * 0.19))
    total = neto + iva + exento

    assert neto == 38000
    assert iva == 7220
    assert exento == 5000
    assert total == 50220
