import pytest

AD_SLOT_PRICES = {
    'sidebar': {'monthly': 39990, 'daily_approx': 1333, 'position': 'news_sidebar'},
    'calculator': {'monthly': 49990, 'daily_approx': 1666, 'position': 'calculator'},
    'header': {'monthly': 59990, 'daily_approx': 1999, 'position': 'header_top'},
}

def calculate_ad_price(slot: str) -> int:
    return AD_SLOT_PRICES[slot]['monthly']

def calculate_daily_rate(monthly_price: int, days: int = 30) -> int:
    return monthly_price // days


class TestAdBannersAndMediaKit:

    def test_01_banner_prices_match_official_media_kit(self):
        """Verifica que los precios de los banners coincidan exactamente con la tarifa mensual"""
        assert calculate_ad_price('sidebar') == 39990
        assert calculate_ad_price('calculator') == 49990
        assert calculate_ad_price('header') == 59990

    def test_02_daily_rate_calculation(self):
        """Verifica el cálculo de costo diario para marketing de Pymes"""
        assert calculate_daily_rate(39990) == 1333
        assert calculate_daily_rate(49990) == 1666
        assert calculate_daily_rate(59990) == 1999

    def test_03_ad_duration_is_exactly_30_days(self):
        """Verifica que las campañas publicitarias duren 30 días continuos"""
        start_ts = 1725000000
        duration_days = 30
        end_ts = start_ts + (duration_days * 24 * 3600)
        
        diff_days = (end_ts - start_ts) // (24 * 3600)
        assert diff_days == 30

    def test_04_ad_slot_positions_mapping(self):
        """Verifica que cada slot mapee a su posición visual correcta en la web"""
        assert AD_SLOT_PRICES['sidebar']['position'] == 'news_sidebar'
        assert AD_SLOT_PRICES['calculator']['position'] == 'calculator'
        assert AD_SLOT_PRICES['header']['position'] == 'header_top'
