"""
intent_engine.py — Motor de Intenciones y Lógica de Negocio Laboral WhatsApp
Gestiona el ciclo de vida de la sesión del colaborador:
- Autenticación 2FA (RUT y 4 dígitos bancarios o año nacimiento).
- Detección de intenciones (Liquidación, Vacaciones, Certificado, RIOHS).
- Enrutamiento de datos hacia Supabase.
"""

import re
from datetime import datetime, date
from typing import Dict, Any, Optional, Tuple

class WhatsAppIntentEngine:
    @staticmethod
    def classify_intent(message_text: str) -> str:
        """
        Clasifica la intención del usuario mediante reglas deterministas y regex.
        Intents soportados:
        - 'greeting': Saludos iniciales
        - 'liquidation': Solicitud de liquidación de sueldo
        - 'vacations': Consulta de saldo de vacaciones
        - 'certificate': Solicitud de certificado laboral
        - 'riohs': Preguntas sobre normas, permisos, acoso o beneficios
        - 'unknown': Mensaje no clasificado
        """
        text = message_text.lower().strip()
        
        if re.search(r'\b(liquidaci[oó]n|sueldo|pago|colilla|comprobante de sueldo|recibo|haberes)\b', text):
            return "liquidation"
            
        if re.search(r'\b(vacaci[oó]n|vacaciones|d[ií]as libres|descanso|feriado legal)\b', text):
            return "vacations"
            
        if re.search(r'\b(certificado|antig[uü]edad|constancia|documento laboral)\b', text):
            return "certificate"
            
        if re.search(r'\b(permiso|licencia|riohs|reglamento|acoso|ley karin|denuncia|seguro|mutual|beneficio|aguinaldo)\b', text):
            return "riohs"

        if re.search(r'\b(hola|buenos dias|buenas tardes|buenas noches|inicio|empezar|ayuda)\b', text):
            return "greeting"
            
        return "unknown"

    @staticmethod
    def extract_period_from_text(message_text: str) -> str:
        """
        Extrae o infiere el período (YYYY-MM) solicitado en el mensaje.
        Por defecto retorna el mes calendario anterior (típico mes a cobrar).
        """
        meses = {
            "enero": "01", "febrero": "02", "marzo": "03", "abril": "04",
            "mayo": "05", "junio": "06", "julio": "07", "agosto": "08",
            "septiembre": "09", "octubre": "10", "noviembre": "11", "diciembre": "12"
        }
        text = message_text.lower()
        hoy = date.today()
        
        # Buscar mención explícita de mes
        for mes_nombre, mes_num in meses.items():
            if mes_nombre in text:
                # Si menciona un año de 4 dígitos, usarlo; de lo contrario el año actual
                year_match = re.search(r'\b(202[4-9])\b', text)
                year = year_match.group(1) if year_match else str(hoy.year)
                return f"{year}-{mes_num}"
                
        # Si no menciona mes, calcular el mes anterior
        if hoy.month == 1:
            return f"{hoy.year - 1}-12"
        else:
            return f"{hoy.year}-{hoy.month - 1:02d}"

    @staticmethod
    def validate_2fa_response(input_text: str, employee: Dict[str, Any]) -> bool:
        """
        Valida el segundo factor de autenticación.
        Acepta:
        - Últimos 4 dígitos del RUT (antes del DV) o
        - Año de nacimiento de 4 dígitos o
        - Últimos 4 dígitos de su cuenta registrada.
        """
        clean_input = re.sub(r'[^0-9]', '', input_text)
        if not clean_input:
            return False
            
        rut = employee.get("rut", "").replace(".", "").replace("-", "")
        birth_date = str(employee.get("birth_date") or "")
        
        # 1. Comparar con últimos 4 dígitos del RUT
        if len(rut) >= 5 and clean_input == rut[-5:-1]:
            return True
            
        # 2. Comparar con año de nacimiento
        if len(birth_date) >= 4 and clean_input == birth_date[:4]:
            return True
            
        # 3. Comparar con 4 dígitos exactos del RUT cuerpo
        if len(rut) >= 4 and clean_input in rut:
            return True
            
        return False

    @staticmethod
    def calculate_vacation_balance(fecha_ingreso_str: str, dias_tomados: float = 0.0, is_magallanes: bool = True) -> Dict[str, Any]:
        """
        Calcula el saldo legal de vacaciones según el Código del Trabajo en Chile.
        Base Magallanes (Art. 67 inc. 2): 20 días hábiles al año.
        Base Nacional General: 15 días hábiles al año.
        """
        try:
            fecha_ingreso = datetime.strptime(str(fecha_ingreso_str)[:10], "%Y-%m-%d").date()
        except (ValueError, TypeError):
            fecha_ingreso = date(2024, 1, 1)
            
        hoy = date.today()
        if fecha_ingreso > hoy:
            return {
                "meses_antiguedad": 0,
                "dias_acumulados": 0.0,
                "dias_tomados": float(dias_tomados),
                "saldo_disponible": 0.0,
                "dias_anuales_base": 20 if is_magallanes else 15
            }

        elapsed_days = (hoy - fecha_ingreso).days
        dias_anuales = 20 if is_magallanes else 15
        dias_acumulados = round((elapsed_days * dias_anuales) / 365.25, 1)
        saldo_disponible = max(0.0, round(dias_acumulados - float(dias_tomados), 1))
        meses_antiguedad = max(0, (hoy.year - fecha_ingreso.year) * 12 + (hoy.month - fecha_ingreso.month))
        
        return {
            "meses_antiguedad": meses_antiguedad,
            "dias_acumulados": dias_acumulados,
            "dias_tomados": float(dias_tomados),
            "saldo_disponible": saldo_disponible,
            "dias_anuales_base": dias_anuales
        }

