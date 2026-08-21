import logging

logger = logging.getLogger("contapyme.brand_scrapper")

async def fetch_brand_logo_url(brand_name: str) -> str | None:
    """
    Busca el logotipo oficial de una marca basándose en un mapa de dominios conocido
    o realizando una estimación del dominio para usar con la API de Clearbit.
    """
    if not brand_name:
        return None

    # Mapeo de dominios de marcas frecuentes en Magallanes / Chile
    domain_map = {
        "h&m": "hm.com",
        "h y m": "hm.com",
        "hm": "hm.com",
        "cerveza austral": "cervezaaustral.cl",
        "cerveceria austral": "cervezaaustral.cl",
        "zona franca": "mizonasur.cl",
        "zona franca punta arenas": "mizonasur.cl",
        "sii": "sii.cl",
        "servicio de impuestos internos": "sii.cl",
        "pensa austral": "laprensaaustral.cl",
        "la prensa austral": "laprensaaustral.cl",
        "el pinguino": "elpinguino.com",
        "ovejero noticias": "ovejeronoticias.cl",
        "unimarc": "unimarc.cl",
        "lider": "lider.cl",
        "latam": "latam.com",
        "banco estado": "bancoestado.cl",
        "bco estado": "bancoestado.cl",
        "banco de chile": "bancochile.cl",
        "bci": "bci.cl",
        "santander": "santander.cl"
    }
    
    clean_name = brand_name.lower().strip()
    
    # 1. Intentar obtener el dominio exacto del mapa
    domain = domain_map.get(clean_name)
    
    # 2. Si no está en el mapa, hacer una deducción limpia del dominio
    if not domain:
        # Remover espacios y caracteres especiales
        safe_name = clean_name.replace(" ", "").replace("&", "n").replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
        # Por defecto asumimos .cl para marcas locales chilenas si no es una conocida internacional
    # Usar Google Favicon API de alta resolución (128px) - 100% uptime y sin límites de consulta
    logo_url = f"https://www.google.com/s2/favicons?domain={domain}&sz=128"
    logger.info(f"[Brand Scrapper] Resolviendo marca '{brand_name}' -> Dominio: {domain} -> Logo URL: {logo_url}")
    return logo_url
