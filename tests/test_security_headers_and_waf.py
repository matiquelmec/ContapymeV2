import os
import json
import unittest

class TestSecurityHeadersAndWAF(unittest.TestCase):
    """
    Suite de Verificación de Ciberseguridad, Cabeceras HTTP y WAF Hardening
    para Contapymepuq v12.3.
    """

    def test_vercel_json_security_headers(self):
        """1. Validar que vercel.json contenga todas las cabeceras de seguridad perimetral"""
        vercel_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app', 'vercel.json')
        self.assertTrue(os.path.exists(vercel_path), "vercel.json debe existir en app/")
        
        with open(vercel_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        headers_map = {h["key"]: h["value"] for h in data["headers"][0]["headers"]}
        self.assertEqual(headers_map.get("X-Frame-Options"), "DENY")
        self.assertEqual(headers_map.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(headers_map.get("X-XSS-Protection"), "1; mode=block")
        self.assertIn("max-age=63072000", headers_map.get("Strict-Transport-Security", ""))
        self.assertIn("preload", headers_map.get("Strict-Transport-Security", ""))
        self.assertEqual(headers_map.get("Referrer-Policy"), "strict-origin-when-cross-origin")

    def test_next_config_security_headers(self):
        """2. Validar que next.config.ts contenga las cabeceras de endurecimiento HSTS y Permissions-Policy"""
        config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app', 'next.config.ts')
        self.assertTrue(os.path.exists(config_path), "next.config.ts debe existir en app/")
        
        with open(config_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        self.assertIn("Strict-Transport-Security", content)
        self.assertIn("max-age=63072000", content)
        self.assertIn("Permissions-Policy", content)
        self.assertIn("X-DNS-Prefetch-Control", content)
        self.assertIn("X-XSS-Protection", content)

    def test_proxy_file_exists_and_blocks_scanners(self):
        """3. Validar que proxy.ts (Next.js 16) intercepte escáneres de vulnerabilidades, auth y modo mantenimiento"""
        proxy_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app', 'src', 'proxy.ts')
        self.assertTrue(os.path.exists(proxy_path), "proxy.ts debe existir en app/src/")
        
        with open(proxy_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        self.assertIn("BLOCKED_USER_AGENTS", content)
        self.assertIn("sqlmap", content)
        self.assertIn("nikto", content)
        self.assertIn("MAINTENANCE_MODE", content)
        self.assertIn("checkRateLimit", content)
        self.assertIn("createServerClient", content)

    def test_rate_limit_helper_exists(self):
        """4. Validar existencia y funciones del rate limiter en lib/rate-limit.ts"""
        rl_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app', 'src', 'lib', 'rate-limit.ts')
        self.assertTrue(os.path.exists(rl_path), "rate-limit.ts debe existir en app/src/lib/")
        
        with open(rl_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        self.assertIn("getClientIp", content)
        self.assertIn("cf-connecting-ip", content)
        self.assertIn("x-forwarded-for", content)
        self.assertIn("checkRateLimit", content)
        self.assertIn("rateLimitResponse", content)

if __name__ == '__main__':
    unittest.main()
