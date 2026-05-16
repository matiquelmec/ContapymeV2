"""
shared_utils.py — Utilidades Transversales del Motor
===================================================
Este módulo centraliza funciones de formateo y validación para evitar 
duplicidad en los routers de la API.
"""

import re
from typing import Any, Tuple
from datetime import datetime
try:
    from num2words import num2words
except ImportError:
    num2words = None

def clean_rut_simple(r: Any) -> str:
    """Limpia un RUT devolviendo solo números y DV (sin puntos ni guión)."""
    if not r: return ""
    return re.sub(r"[^0-9kK]", "", str(r)).upper()

def split_rut(r: Any) -> Tuple[str, str]:
    """Limpia un RUT y devuelve una tupla (cuerpo, dv)."""
    clean = clean_rut_simple(r)
    if len(clean) > 1:
        return clean[:-1], clean[-1]
    return clean, ""

def clean_rut(r: Any) -> str:
    """Limpia y formatea un RUT (ej: 12.345.678-9)."""
    if not r: return ""
    r = str(r).replace(".", "").replace("-", "").replace(" ", "").upper()
    if len(r) > 1:
        body = r[:-1]
        dv = r[-1]
        try:
            formatted_body = "{:,}".format(int(body)).replace(",", ".")
            return f"{formatted_body}-{dv}"
        except: return r
    return r

def format_clp(amount: float) -> str:
    """Formatea un número como moneda chilena ($1.234)."""
    try:
        return f"${int(amount or 0):,.0f}".replace(",", ".")
    except (ValueError, TypeError):
        return "$0"

def to_words(amount: float) -> str:
    """Convierte un monto a palabras en español."""
    if not amount: return "CERO PESOS"
    if num2words:
        try:
            return f"{num2words(int(amount), lang='es').upper()} PESOS"
        except:
            pass
    return f"{int(amount)} PESOS"

def format_date_cl(date_val: Any) -> str:
    """Convierte fecha a formato 'D de Mes de YYYY'."""
    if not date_val: return "NO ESPECIFICADA"
    try:
        if isinstance(date_val, str):
            d = datetime.strptime(date_val[:10], "%Y-%m-%d")
        else:
            d = date_val
        meses_cl = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
        return f"{d.day} de {meses_cl[d.month-1]} de {d.year}"
    except:
        return str(date_val)

def validate_rut(rut: Any) -> bool:
    """Revisa si un rut chileno es válido según su dígito verificador."""
    cleaned = clean_rut_simple(rut)
    if len(cleaned) < 2:
        return False

    cuerpo = cleaned[:-1]
    dv = cleaned[-1]

    try:
        if not cuerpo.isdigit():
            return False
            
        cuerpo_num = int(cuerpo)
        suma = 0
        multiplo = 2

        while cuerpo_num > 0:
            suma += (cuerpo_num % 10) * multiplo
            cuerpo_num = cuerpo_num // 10
            multiplo = 2 if multiplo == 7 else multiplo + 1

        resto = 11 - (suma % 11)
        dv_esperado = str(resto)

        if resto == 11:
            dv_esperado = "0"
        elif resto == 10:
            dv_esperado = "K"

        return dv == dv_esperado
    except:
        return False

# Alias para estandarización profesional
format_rut = clean_rut
format_currency = format_clp
format_date_es = format_date_cl
