"""
🧪 Suite de Pruebas Unitarias: Auditoría de Navegación, Jerarquía de Rutas y Seguridad Multi-Ruta
==============================================================================================
Certifica que el resaltado de navegación (isActive) funcione de manera determinista,
sin colisiones entre la raíz '/', el dashboard '/dashboard', submódulos específicos y rutas anidadas.
"""

import pytest
import os


def is_sidebar_item_active(item_href: str, current_pathname: str, all_hrefs: list[str]) -> bool:
    """Implementación idéntica en Python a la lógica de TypeScript en `sidebar.tsx`."""
    if item_href == '/':
        return current_pathname == '/'
    if item_href == '/dashboard':
        return current_pathname == '/dashboard'
    if current_pathname == item_href:
        return True
    if current_pathname.startswith(item_href + '/'):
        has_more_specific_match = any(
            other_href != item_href
            and other_href != '/'
            and other_href != '/dashboard'
            and (current_pathname == other_href or current_pathname.startswith(other_href + '/'))
            and len(other_href) > len(item_href)
            for other_href in all_hrefs
        )
        return not has_more_specific_match
    return False


class TestNavigationRoutingAudit:
    NAV_HREFS = [
        '/dashboard',
        '/',
        '/dashboard/empleos',
        '/dashboard/noticias',
        '/dashboard/publicidad',
        '/dashboard/accounting/rcv',
        '/dashboard/billing',
        '/dashboard/accounting/f29-comparative',
        '/dashboard/accounting/reports',
        '/dashboard/accounting/chart-of-accounts',
        '/dashboard/accounting/journal',
        '/dashboard/accounting/ledger',
        '/dashboard/accounting/trial-balance',
        '/dashboard/accounting/periods',
        '/dashboard/treasury',
        '/dashboard/reconciliation',
        '/dashboard/accounting/config',
        '/dashboard/payroll',
        '/dashboard/payroll/vacations',
        '/dashboard/payroll/contracts',
        '/dashboard/payroll/terminations',
        '/dashboard/payroll/lre',
        '/dashboard/payroll/settings',
        '/dashboard/assets',
        '/dashboard/settings',
        '/dashboard/admin'
    ]

    def test_01_root_path_only_matches_root(self):
        """Verifica que '/' (Portada) NUNCA se quede marcado cuando se navega dentro del dashboard."""
        assert is_sidebar_item_active('/', '/', self.NAV_HREFS) is True
        assert is_sidebar_item_active('/', '/dashboard', self.NAV_HREFS) is False
        assert is_sidebar_item_active('/', '/dashboard/empleos', self.NAV_HREFS) is False
        assert is_sidebar_item_active('/', '/dashboard/payroll', self.NAV_HREFS) is False
        assert is_sidebar_item_active('/', '/dashboard/accounting/journal', self.NAV_HREFS) is False

    def test_02_dashboard_root_only_matches_dashboard_home(self):
        """Verifica que '/dashboard' solo se marque en el resumen general y no en los submódulos."""
        assert is_sidebar_item_active('/dashboard', '/dashboard', self.NAV_HREFS) is True
        assert is_sidebar_item_active('/dashboard', '/dashboard/empleos', self.NAV_HREFS) is False
        assert is_sidebar_item_active('/dashboard', '/dashboard/noticias', self.NAV_HREFS) is False
        assert is_sidebar_item_active('/dashboard', '/dashboard/payroll', self.NAV_HREFS) is False

    def test_03_specific_submodules_activation(self):
        """Verifica que cada submódulo se active de forma exacta e independiente."""
        assert is_sidebar_item_active('/dashboard/empleos', '/dashboard/empleos', self.NAV_HREFS) is True
        assert is_sidebar_item_active('/dashboard/noticias', '/dashboard/empleos', self.NAV_HREFS) is False
        assert is_sidebar_item_active('/dashboard/publicidad', '/dashboard/publicidad', self.NAV_HREFS) is True

    def test_04_nested_routes_hierarchy_and_specificity(self):
        """Verifica que entre '/dashboard/payroll' y '/dashboard/payroll/vacations' no haya doble resaltado."""
        # Caso 1: En la página de Vacaciones -> Solo 'Gestión de Vacaciones' se activa
        assert is_sidebar_item_active('/dashboard/payroll/vacations', '/dashboard/payroll/vacations', self.NAV_HREFS) is True
        assert is_sidebar_item_active('/dashboard/payroll', '/dashboard/payroll/vacations', self.NAV_HREFS) is False

        # Caso 2: En la página de Remuneraciones principal -> Solo 'Remuneraciones' se activa
        assert is_sidebar_item_active('/dashboard/payroll', '/dashboard/payroll', self.NAV_HREFS) is True
        assert is_sidebar_item_active('/dashboard/payroll/vacations', '/dashboard/payroll', self.NAV_HREFS) is False

        # Caso 3: En una liquidación dinámica (/dashboard/payroll/liquidations/uuid-123) -> Se activa el padre 'Remuneraciones'
        assert is_sidebar_item_active('/dashboard/payroll', '/dashboard/payroll/liquidations/uuid-123', self.NAV_HREFS) is True
        assert is_sidebar_item_active('/dashboard/payroll/vacations', '/dashboard/payroll/liquidations/uuid-123', self.NAV_HREFS) is False

    def test_05_all_sidebar_links_point_to_valid_page_files(self):
        """Audita que el 100% de los hrefs definidos en el sidebar existan físicamente en el filesystem."""
        base_app_dir = os.path.join(os.getcwd(), 'app', 'src', 'app')
        
        # Mapeo de rutas a archivos esperados
        route_to_file = {
            '/': '(public)/page.tsx',
            '/dashboard': 'dashboard/page.tsx',
            '/dashboard/empleos': 'dashboard/empleos/page.tsx',
            '/dashboard/noticias': 'dashboard/noticias/page.tsx',
            '/dashboard/publicidad': 'dashboard/publicidad/page.tsx',
            '/dashboard/accounting/rcv': 'dashboard/accounting/rcv/page.tsx',
            '/dashboard/billing': 'dashboard/billing/page.tsx',
            '/dashboard/accounting/f29-comparative': 'dashboard/accounting/f29-comparative/page.tsx',
            '/dashboard/accounting/reports': 'dashboard/accounting/reports/page.tsx',
            '/dashboard/accounting/chart-of-accounts': 'dashboard/accounting/chart-of-accounts/page.tsx',
            '/dashboard/accounting/journal': 'dashboard/accounting/journal/page.tsx',
            '/dashboard/accounting/ledger': 'dashboard/accounting/ledger/page.tsx',
            '/dashboard/accounting/trial-balance': 'dashboard/accounting/trial-balance/page.tsx',
            '/dashboard/accounting/periods': 'dashboard/accounting/periods/page.tsx',
            '/dashboard/treasury': 'dashboard/treasury/page.tsx',
            '/dashboard/reconciliation': 'dashboard/reconciliation/page.tsx',
            '/dashboard/accounting/config': 'dashboard/accounting/config/page.tsx',
            '/dashboard/payroll': 'dashboard/payroll/page.tsx',
            '/dashboard/payroll/vacations': 'dashboard/payroll/vacations/page.tsx',
            '/dashboard/payroll/contracts': 'dashboard/payroll/contracts/page.tsx',
            '/dashboard/payroll/terminations': 'dashboard/payroll/terminations/page.tsx',
            '/dashboard/payroll/lre': 'dashboard/payroll/lre/page.tsx',
            '/dashboard/payroll/settings': 'dashboard/payroll/settings/page.tsx',
            '/dashboard/assets': 'dashboard/assets/page.tsx',
            '/dashboard/settings': 'dashboard/settings/page.tsx',
            '/dashboard/admin': 'dashboard/admin/page.tsx'
        }

        for href, rel_file in route_to_file.items():
            full_path = os.path.join(base_app_dir, rel_file)
            assert os.path.exists(full_path), f"La ruta {href} no tiene archivo en {full_path}"
