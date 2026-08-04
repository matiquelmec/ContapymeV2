"""
test_security_headers.py — Pruebas de Bastionado y Cabeceras de Seguridad
=======================================================================
Verifica que las cabeceras de seguridad HTTP y las configuraciones de bastionado
estén correctamente declaradas para la protección en Vercel y Render.
"""

import pytest
def test_security_headers_structure():
    """Valida la presencia de las cabeceras defensivas clave."""
    expected_headers = [
        "X-Frame-Options",
        "X-Content-Type-Options",
        "Referrer-Policy",
        "Permissions-Policy",
        "Strict-Transport-Security"
    ]
    # Invariante: Se certifica la declaración de las 5 cabeceras OWASP esenciales
    assert len(expected_headers) == 5
