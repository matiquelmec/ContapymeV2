"""
test_jobs_scraper.py — Suite de Pruebas Unitarias para el Colector de Empleos
=============================================================================
Valida el funcionamiento del colector desacoplado engine/scrapers/jobs_scraper.py:
- Parsing HTML resiliente
- Filtrado geográfico estricto de la Región de Magallanes
- Extracción de canales de postulación y normalización
- Degradación elegante ante fallos de red
"""

import os
import sys
import unittest
from unittest.mock import patch, AsyncMock

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'engine'))

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

from scrapers.jobs_scraper import (
    parse_chiletrabajos_html,
    fetch_chiletrabajos_magallanes,
    fetch_all_magallanes_jobs,
    ScrapedJob
)

SAMPLE_CHILETRABAJOS_HTML = """
<div class="job-list">
    <div class="job-item">
        <h2><a href="/trabajo/contador-auditor-junior-3901329" class="title">Contador Auditor Junior</a></h2>
        <div class="meta">Recasur, Punta Arenas</div>
        <p>Recasur busca incorporar Contador Auditor Junior en Punta Arenas para análisis de cuentas y conciliaciones.</p>
    </div>
    <div class="job-item">
        <h2><a href="/trabajo/auxiliar-higiene-3901141" class="title">Auxiliar de Higiene Industrial</a></h2>
        <div class="meta">Procesadora Barranco Amarillo, Punta Arenas</div>
        <p>Planta de procesos busca personal de higiene. Contacto directo: rrhh@barrancoamarillo.cl o +56 9 6120 0354.</p>
    </div>
    <div class="job-item">
        <h2><a href="/trabajo/operario-bodega-santiago-3901539" class="title">Operario de Bodega (San Bernardo)</a></h2>
        <div class="meta">Logística Central, Santiago</div>
        <p>Buscamos operario para comuna de San Bernardo, Región Metropolitana.</p>
    </div>
    <div class="job-item">
        <h2><a href="/trabajo/guia-turismo-natales-3901999" class="title">Guía de Turismo W</a></h2>
        <div class="meta">Patagonia Trekking, Puerto Natales</div>
        <p>Guía para Parque Nacional Torres del Paine en Puerto Natales.</p>
    </div>
</div>
"""

@unittest.skipIf(BeautifulSoup is None, "beautifulsoup4 no está instalado en este entorno")
class TestJobsScraper(unittest.TestCase):

    def test_01_parse_chiletrabajos_extracts_magallanes_jobs_only(self):
        """1. Debe extraer ofertas válidas de Magallanes y descartar otras regiones (ej: San Bernardo/Santiago)"""
        jobs = parse_chiletrabajos_html(SAMPLE_CHILETRABAJOS_HTML)
        
        # Deben haber 3 ofertas de Magallanes (Recasur, Barranco Amarillo, Puerto Natales)
        # y 1 excluida de Santiago
        self.assertEqual(len(jobs), 3)
        
        titles = [j["title"] for j in jobs]
        self.assertIn("Contador Auditor Junior", titles)
        self.assertIn("Auxiliar de Higiene Industrial", titles)
        self.assertIn("Guía de Turismo W", titles)
        self.assertNotIn("Operario de Bodega (San Bernardo)", titles)

    def test_02_parse_chiletrabajos_formats_source_url(self):
        """2. Debe construir URLs absolutas correctas"""
        jobs = parse_chiletrabajos_html(SAMPLE_CHILETRABAJOS_HTML)
        recasur = next(j for j in jobs if j["company_name"] == "Recasur")
        self.assertEqual(recasur["source_url"], "https://www.chiletrabajos.cl/trabajo/contador-auditor-junior-3901329")

    def test_03_parse_chiletrabajos_extracts_embedded_contacts(self):
        """3. Debe extraer email y whatsapp embebidos en el texto de la oferta"""
        jobs = parse_chiletrabajos_html(SAMPLE_CHILETRABAJOS_HTML)
        barranco = next(j for j in jobs if "Barranco Amarillo" in j["company_name"])
        self.assertEqual(barranco["contact_email"], "rrhh@barrancoamarillo.cl")
        self.assertTrue(len(barranco["contact_whatsapp"]) >= 8)

    def test_04_parse_empty_html_returns_empty_list(self):
        """4. Debe retornar lista vacía si el HTML es nulo o vacío sin levantar excepciones"""
        self.assertEqual(parse_chiletrabajos_html(""), [])
        self.assertEqual(parse_chiletrabajos_html(None), [])

    @patch("scrapers.jobs_scraper.httpx.AsyncClient.get")
    def test_05_fetch_handles_network_failure_gracefully(self, mock_get):
        """5. Debe manejar fallos de red sin romper la ejecución"""
        import asyncio
        mock_get.side_effect = Exception("Simulated connection timeout")
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            results = loop.run_until_complete(fetch_all_magallanes_jobs())
            self.assertEqual(results, [])
        finally:
            loop.close()


if __name__ == "__main__":
    unittest.main()
