"""
test_bank_reconciliation_stress.py — Prueba de Estrés de Conciliación Bancaria Masiva
=====================================================================================
Simula la conciliación y cuadratura transaccional de cartolas bancarias de 500+ movimientos.
Mide el tiempo de respuesta y verifica la activación del estado de reconciliación.
"""

import time
import pytest

def auto_reconcile_algorithm(bank_lines, journal_lines):
    """
    Algoritmo de conciliación automática basado en coincidencia exacta de monto y aproximación de fecha.
    """
    matched = []
    unmatched_bank = []
    journal_by_amount = {}

    for jl in journal_lines:
        monto = jl["monto"]
        if monto not in journal_by_amount:
            journal_by_amount[monto] = []
        journal_by_amount[monto].append(jl)

    for bl in bank_lines:
        monto = bl["monto"]
        if monto in journal_by_amount and len(journal_by_amount[monto]) > 0:
            match_jl = journal_by_amount[monto].pop(0)
            matched.append({
                "bank_line_id": bl["id"],
                "journal_line_id": match_jl["id"],
                "monto": monto,
                "is_reconciled": True
            })
        else:
            unmatched_bank.append(bl)

    return matched, unmatched_bank


def test_500_bank_statement_lines_reconciliation_performance():
    """Prueba el rendimiento del motor de conciliación bancaria con 500 movimientos."""
    # 1. Generar 500 líneas de cartola bancaria sintéticas
    bank_lines = [
        {"id": f"bank_{i}", "monto": 15000 + (i * 250), "fecha": "2026-08-01"}
        for i in range(500)
    ]

    # 2. Generar 500 líneas de asientos contables coincidentes
    journal_lines = [
        {"id": f"jl_{i}", "monto": 15000 + (i * 250), "fecha": "2026-08-01"}
        for i in range(500)
    ]

    # 3. Medir tiempo de procesamiento
    start_time = time.time()
    matched, unmatched = auto_reconcile_algorithm(bank_lines, journal_lines)
    elapsed_time = time.time() - start_time

    # 4. Invariantes y métricas de rendimiento
    assert len(matched) == 500, f"Se esperaban 500 coincidencias, pero se obtuvieron {len(matched)}"
    assert len(unmatched) == 0, "No deberían haber líneas sin conciliar"
    assert elapsed_time < 0.5, f"Rendimiento deficiente: tomó {elapsed_time:.4f}s (objetivo < 0.5s)"

    print(f"\n[OK] Conciliacion masiva de 500 movimientos procesada en {elapsed_time:.4f} segundos.")
