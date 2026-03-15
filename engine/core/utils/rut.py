import re

def clean_rut(rut: str) -> str:
    """Elimina puntos y guiones de un RUT."""
    if not rut:
        return ""
    rut = re.sub(r"[^\dkK]", "", rut.upper())
    return rut

def validate_rut(rut: str) -> bool:
    """Revisa si un rut chileno es válido según su dígito verificador."""
    cleaned = clean_rut(rut)
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
    except Exception:
        return False

def format_rut(rut: str) -> str:
    """Devuelve un rut en formato XX.XXX.XXX-X"""
    cleaned = clean_rut(rut)
    if len(cleaned) < 2:
        return cleaned

    cuerpo = cleaned[:-1]
    dv = cleaned[-1]

    try:
        cuerpo_num = int(cuerpo)
        return f"{cuerpo_num:,}".replace(",", ".") + f"-{dv}"
    except ValueError:
        return cleaned
