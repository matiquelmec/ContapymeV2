"""Contrato de códigos AFP: SII (DJ1887) y Previred usan tablas DISTINTAS.

Este test congela ambos mapas y bloquea el error clásico de cruzar la tabla
del SII (Formulario 1887) con la tabla de Previred. Son códigos oficiales
diferentes para la misma AFP y NUNCA deben unificarse.
"""

import sys

sys.path.append("engine")

from api.routers.dj1887 import CODIGOS_AFP_SII
from api.routers.previred import AFP_CODES


# Valores oficiales esperados — fuente de verdad del contrato.
EXPECTED_SII = {
    "CAPITAL": "08",
    "CUPRUM": "02",
    "HABITAT": "05",
    "MODELO": "33",
    "PLANVITAL": "29",
    "PROVIDA": "07",
    "UNO": "34",
}

EXPECTED_PREVIRED = {
    "CAPITAL": "33",
    "CUPRUM": "3",
    "HABITAT": "5",
    "MODELO": "34",
    "PLANVITAL": "29",
    "PROVIDA": "8",
    "UNO": "35",
}


def test_sii_afp_codes_match_reference():
    for afp, code in EXPECTED_SII.items():
        assert CODIGOS_AFP_SII[afp] == code, f"SII {afp} debe ser {code}"


def test_previred_afp_codes_match_reference():
    for afp, code in EXPECTED_PREVIRED.items():
        assert AFP_CODES[afp] == code, f"Previred {afp} debe ser {code}"


def test_sii_and_previred_tables_are_not_accidentally_merged():
    """Las AFP cuyo código difiere entre SII y Previred deben seguir difiriendo.

    Si alguien copia una tabla sobre la otra, este test lo detecta.
    """
    divergentes = ["CAPITAL", "CUPRUM", "HABITAT", "MODELO", "PROVIDA", "UNO"]
    for afp in divergentes:
        assert CODIGOS_AFP_SII[afp] != AFP_CODES[afp], (
            f"{afp}: SII ({CODIGOS_AFP_SII[afp]}) y Previred ({AFP_CODES[afp]}) "
            f"no pueden ser iguales — son tablas oficiales distintas."
        )
