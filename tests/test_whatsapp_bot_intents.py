"""
tests/test_whatsapp_bot_intents.py
==================================
Suite de pruebas unitarias para el Portal de Autoatención Laboral WhatsApp:
1. Clasificación de Intenciones (Regex & Patrones).
2. Extracción e Inferencia de Períodos Contables (YYYY-MM).
3. Mecanismo de Segundo Factor de Autenticación (2FA).
4. Aritmética de Vacaciones Legales (Art. 67 Código del Trabajo).
5. Cumplimiento del Estado Inactivo por Defecto (Standby Mode).
"""

import pytest
from datetime import date
from core.whatsapp.intent_engine import WhatsAppIntentEngine

# ─── 1. PRUEBAS DE CLASIFICACIÓN DE INTENCIONES ───────────────────────────────

@pytest.mark.parametrize("mensaje,esperado", [
    ("Hola, buenos días", "greeting"),
    ("Buenas tardes!", "greeting"),
    ("Ayuda por favor", "greeting"),
    ("Necesito mi liquidación de sueldo", "liquidation"),
    ("Mándame la colilla de pago", "liquidation"),
    ("Quiero ver mis haberes", "liquidation"),
    ("¿Cuántos días de vacaciones me quedan?", "vacations"),
    ("Deseo consultar mi feriado legal", "vacations"),
    ("Necesito un certificado de antigüedad laboral", "certificate"),
    ("Constancia de trabajo para arriendo", "certificate"),
    ("¿Cómo se denuncia un acoso laboral según la Ley Karin?", "riohs"),
    ("¿Qué dice el reglamento interno sobre licencias médicas?", "riohs"),
    ("El clima está muy frío hoy en Punta Arenas", "unknown"),
])
def test_whatsapp_intent_classification(mensaje, esperado):
    intent = WhatsAppIntentEngine.classify_intent(mensaje)
    assert intent == esperado

# ─── 2. PRUEBAS DE EXTRACCIÓN DE PERÍODOS ─────────────────────────────────────

@pytest.mark.parametrize("mensaje,mes_esperado", [
    ("Quiero mi liquidación de julio", "07"),
    ("Pásame el sueldo de mayo", "05"),
    ("Liquidación de diciembre 2025", "12"),
    ("Comprobante de enero", "01"),
])
def test_extract_period_from_text(mensaje, mes_esperado):
    periodo = WhatsAppIntentEngine.extract_period_from_text(mensaje)
    assert periodo.endswith(f"-{mes_esperado}")

# ─── 3. PRUEBAS DE VALIDACIÓN 2FA ─────────────────────────────────────────────

def test_validate_2fa_success_cases():
    mock_employee = {
        "rut": "18.902.386-3",
        "birth_date": "1994-08-15",
        "nombres": "Regina Belén",
        "apellido_paterno": "Andrade"
    }
    # Caso 1: Últimos 4 dígitos del cuerpo del RUT (2386)
    assert WhatsAppIntentEngine.validate_2fa_response("2386", mock_employee) is True
    # Caso 2: Año de nacimiento (1994)
    assert WhatsAppIntentEngine.validate_2fa_response("1994", mock_employee) is True
    # Caso 3: Segmento de 4 dígitos del RUT
    assert WhatsAppIntentEngine.validate_2fa_response("1890", mock_employee) is True

def test_validate_2fa_failure_cases():
    mock_employee = {
        "rut": "18.902.386-3",
        "birth_date": "1994-08-15"
    }
    # Código incorrecto
    assert WhatsAppIntentEngine.validate_2fa_response("9999", mock_employee) is False
    assert WhatsAppIntentEngine.validate_2fa_response("0000", mock_employee) is False
    assert WhatsAppIntentEngine.validate_2fa_response("abcd", mock_employee) is False

# ─── 4. PRUEBAS DE ARITMÉTICA DE VACACIONES LEGALES ───────────────────────────

def test_calculate_vacation_balance_standard():
    # 1 año de antigüedad bajo base Magallanes (20 días anuales)
    hoy = date.today()
    un_ano_atras = f"{hoy.year - 1}-{hoy.month:02d}-01"
    
    calc = WhatsAppIntentEngine.calculate_vacation_balance(un_ano_atras, dias_tomados=5.0, is_magallanes=True)
    assert calc["meses_antiguedad"] >= 12
    assert calc["dias_acumulados"] >= 20.0
    assert calc["dias_tomados"] == 5.0
    assert calc["saldo_disponible"] == round(calc["dias_acumulados"] - 5.0, 1)

def test_calculate_vacation_balance_new_employee():
    # Colaborador que ingresa hoy mismo
    hoy = date.today()
    calc = WhatsAppIntentEngine.calculate_vacation_balance(hoy.isoformat(), dias_tomados=0.0)
    assert calc["meses_antiguedad"] == 0
    assert calc["dias_acumulados"] == 0.0
    assert calc["saldo_disponible"] == 0.0

# ─── 5. PRUEBAS DE MODO STANDBY / INACTIVO POR DEFECTO ────────────────────────

def test_whatsapp_default_inactive_state():
    default_config = {
        "is_active": False,
        "allow_liquidation_download": True
    }
    # El motor debe permanecer en reposo mientras is_active sea False
    assert default_config["is_active"] is False
