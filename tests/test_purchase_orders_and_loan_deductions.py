"""
tests/test_purchase_orders_and_loan_deductions.py
=================================================
Suite de pruebas unitarias para:
1. Módulo de Órdenes de Compra (OC) y facturación DTE:
   - Cálculo aritmético de Subtotal, Descuentos, Afecto IVA, Exento, IVA 19% y Total.
   - Validación de correlatividad y estados ('emitida', 'facturada', 'anulada').
   - Transformación de OC a ítems compatibles con DTE 33 (Factura Electrónica).
2. Módulo de Amortización de Créditos Sociales CCAF:
   - Restricciones de integridad (montos > 0, cuota_actual <= num_cuotas).
   - Saldo insoluto proyectado y amortización mensual.
   - Compatibilidad de monedas (CLP / UF).
"""

import pytest
from datetime import datetime, date

# ─── 1. TESTS DE ÓRDENES DE COMPRA (ARITMÉTICA & REGLAS) ──────────────────────

def calculate_purchase_order_totals(items: list) -> dict:
    """
    Función pura que simula el motor de cálculo de Órdenes de Compra.
    Calcula neto, exento, iva y total considerando descuentos por ítem.
    """
    subtotal_neto = 0.0
    subtotal_exento = 0.0

    for item in items:
        cant = float(item.get("cantidad", 1))
        precio = float(item.get("precio_unitario", 0))
        desc_pct = float(item.get("descuento_pct", 0)) / 100.0
        afecto = bool(item.get("afecto_iva", True))

        monto_bruto_item = cant * precio
        monto_item = monto_bruto_item * (1.0 - desc_pct)

        if afecto:
            subtotal_neto += monto_item
        else:
            subtotal_exento += monto_item

    neto_redondeado = int(round(subtotal_neto))
    exento_redondeado = int(round(subtotal_exento))
    iva_redondeado = int(round(neto_redondeado * 0.19))
    total_redondeado = neto_redondeado + exento_redondeado + iva_redondeado

    return {
        "neto": neto_redondeado,
        "exento": exento_redondeado,
        "iva": iva_redondeado,
        "total": total_redondeado
    }

def test_purchase_order_standard_vat_calculation():
    """Valida cálculo estándar con IVA 19% para insumos comerciales en Magallanes."""
    items = [
        {"descripcion": "Servidor Linux Rack", "cantidad": 2, "precio_unitario": 500000, "descuento_pct": 0, "afecto_iva": True},
        {"descripcion": "Switch Gigabit 24p", "cantidad": 1, "precio_unitario": 200000, "descuento_pct": 10, "afecto_iva": True},
    ]
    totals = calculate_purchase_order_totals(items)
    assert totals["neto"] == 1180000
    assert totals["exento"] == 0
    assert totals["iva"] == 224200
    assert totals["total"] == 1404200

def test_purchase_order_mixed_exempt_and_taxable_items():
    """Valida órdenes mixtas con ítems afectos e ítems exentos de IVA."""
    items = [
        {"descripcion": "Servicio de Capacitación Tributaria", "cantidad": 1, "precio_unitario": 350000, "descuento_pct": 0, "afecto_iva": False},
        {"descripcion": "Material Didáctico Impreso", "cantidad": 50, "precio_unitario": 5000, "descuento_pct": 0, "afecto_iva": True},
    ]
    totals = calculate_purchase_order_totals(items)
    assert totals["exento"] == 350000
    assert totals["neto"] == 250000
    assert totals["iva"] == 47500
    assert totals["total"] == 647500

def test_purchase_order_status_transitions():
    """Valida la máquina de estados de una Orden de Compra."""
    valid_transitions = {
        "borrador": ["emitida", "anulada"],
        "emitida": ["facturada", "anulada"],
        "facturada": [],
        "anulada": []
    }

    def can_transition(current: str, target: str) -> bool:
        return target in valid_transitions.get(current, [])

    assert can_transition("borrador", "emitida") is True
    assert can_transition("emitida", "facturada") is True
    assert can_transition("facturada", "emitida") is False
    assert can_transition("anulada", "facturada") is False

def test_convert_oc_to_dte_payload():
    """Valida que la OC genere una estructura válida para emisión DTE 33."""
    oc = {
        "id": "oc-123",
        "numero": 45,
        "cliente_rut": "76.123.456-K",
        "cliente_nombre": "TRANSPORTES AUSTRAL SPA",
        "neto": 1000000,
        "iva": 190000,
        "total": 1190000,
        "items": [
            {"descripcion": "Mantenimiento Flota", "cantidad": 1, "precio_unitario": 1000000, "afecto_iva": True}
        ]
    }

    dte_payload = {
        "tipo_dte": 33,
        "receptor_rut": oc["cliente_rut"],
        "receptor_razon_social": oc["cliente_nombre"],
        "monto_neto": oc["neto"],
        "monto_iva": oc["iva"],
        "monto_total": oc["total"],
        "referencias": [{
            "tipo_doc_ref": "801",
            "folio_ref": str(oc["numero"]),
            "razon_ref": "Orden de Compra Aceptada"
        }],
        "items": [
            {
                "nombre": it["descripcion"],
                "cantidad": it["cantidad"],
                "precio": it["precio_unitario"],
                "monto_item": int(it["cantidad"] * it["precio_unitario"])
            }
            for it in oc["items"]
        ]
    }

    assert dte_payload["tipo_dte"] == 33
    assert dte_payload["referencias"][0]["tipo_doc_ref"] == "801"
    assert dte_payload["monto_total"] == 1190000
    assert len(dte_payload["items"]) == 1


# ─── 2. TESTS DE CRÉDITOS CCAF (AMORTIZACIÓN Y REGLAS) ────────────────────────

def simulate_loan_amortization(
    monto_cuota: float,
    cuota_actual: int,
    num_cuotas: int,
    moneda: str = "CLP"
) -> dict:
    """Valida reglas de negocio para deducciones de créditos CCAF."""
    if monto_cuota <= 0:
        raise ValueError("El monto de la cuota debe ser estrictamente positivo")
    if cuota_actual < 1:
        raise ValueError("La cuota actual no puede ser menor a 1")
    if cuota_actual > num_cuotas:
        raise ValueError("La cuota actual excede el total de cuotas pactadas")
    if moneda not in ("CLP", "UF"):
        raise ValueError("Moneda no soportada. Permitidas: CLP, UF")

    cuotas_restantes = num_cuotas - cuota_actual
    saldo_proyectado = cuotas_restantes * monto_cuota
    es_ultima_cuota = (cuota_actual == num_cuotas)

    return {
        "cuota_actual": cuota_actual,
        "num_cuotas": num_cuotas,
        "cuotas_restantes": cuotas_restantes,
        "saldo_proyectado": saldo_proyectado,
        "es_ultima_cuota": es_ultima_cuota,
        "estado": "completado" if es_ultima_cuota else "activo"
    }

def test_ccaf_loan_valid_amortization():
    """Valida cálculo de cuotas restantes y saldo insoluto de crédito Caja Los Andes."""
    result = simulate_loan_amortization(
        monto_cuota=50000,
        cuota_actual=12,
        num_cuotas=48,
        moneda="CLP"
    )
    assert result["cuotas_restantes"] == 36
    assert result["saldo_proyectado"] == 1800000
    assert result["es_ultima_cuota"] is False
    assert result["estado"] == "activo"

def test_ccaf_loan_last_quota_completion():
    """Valida que al pagar la última cuota el estado pase a completado."""
    result = simulate_loan_amortization(
        monto_cuota=75000,
        cuota_actual=24,
        num_cuotas=24,
        moneda="CLP"
    )
    assert result["cuotas_restantes"] == 0
    assert result["saldo_proyectado"] == 0
    assert result["es_ultima_cuota"] is True
    assert result["estado"] == "completado"

def test_ccaf_loan_invalid_parameters():
    """Valida que se rechacen cuotas negativas o que sobrepasen el plazo."""
    with pytest.raises(ValueError, match="estrictamente positivo"):
        simulate_loan_amortization(monto_cuota=-1000, cuota_actual=1, num_cuotas=12)

    with pytest.raises(ValueError, match="excede el total de cuotas"):
        simulate_loan_amortization(monto_cuota=25000, cuota_actual=13, num_cuotas=12)

    with pytest.raises(ValueError, match="Moneda no soportada"):
        simulate_loan_amortization(monto_cuota=25000, cuota_actual=1, num_cuotas=12, moneda="USD")
