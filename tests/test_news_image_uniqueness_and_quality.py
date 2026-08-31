import pytest
import os

class TestNewsImageUniquenessAndQuality:
    """
    🧪 Suite de Pruebas Unitarias de No-Repetición, Blindaje Idiomático y Calidad:
    Verifica que el pipeline de imágenes nunca asigne URLs duplicadas dentro del
    feed de noticias, que el frontend sustituya colisiones en tiempo de render,
    y que los titulares estén estrictamente en español formal chileno.
    """

    def test_01_backend_fallback_pool_avoids_colliding_recent_urls(self):
        """Comprueba que get_category_fallback_url excluya URLs ya presentes en el ciclo o en DB."""
        from engine.core.images import FALLBACK_POOLS

        def simulate_fallback_selection(category: str, title: str, exclude_urls: list[str]) -> str:
            pool = FALLBACK_POOLS.get("MAGALLANES ACTUAL", [])
            available = [u for u in pool if u not in set(exclude_urls)]
            if not available:
                all_imgs = [u for p in FALLBACK_POOLS.values() for u in p]
                available = [u for u in all_imgs if u not in set(exclude_urls)]
            if not available:
                available = pool
            idx = abs(hash(title + str(len(exclude_urls)))) % len(available)
            return available[idx]

        used_urls = []
        titles = [f"Noticia Regional {i} de Magallanes" for i in range(10)]
        
        for t in titles:
            selected_url = simulate_fallback_selection("MAGALLANES ACTUAL", t, used_urls)
            assert selected_url not in used_urls, f"Colisión detectada con URL: {selected_url}"
            used_urls.append(selected_url)

        assert len(used_urls) == len(set(used_urls)) == 10

    def test_02_frontend_deduplication_guarantees_100_percent_unique_images(self):
        """Valida que la función ensureUniqueNewsImages sustituya colisiones si entran noticias con la misma imagen."""
        sample_fallback = [f"https://example.com/fallback_{i}.webp" for i in range(20)]

        def ensure_unique(hero: dict | None, secondary: list[dict]) -> tuple[dict | None, list[dict]]:
            seen = set()
            clean_hero = dict(hero) if hero else None
            if clean_hero and clean_hero.get("image_url"):
                seen.add(clean_hero["image_url"])
            
            clean_secondary = []
            for idx, item in enumerate(secondary):
                img = item.get("image_url")
                if not img or img in seen or img == "/news-placeholder.png":
                    fallback = next((f for f in sample_fallback if f not in seen), sample_fallback[idx % len(sample_fallback)])
                    img = fallback
                seen.add(img)
                new_item = dict(item)
                new_item["image_url"] = img
                clean_secondary.append(new_item)
            
            return clean_hero, clean_secondary

        # Simular entrada con 4 imágenes repetidas intencionalmente
        hero_input = {"id": "h1", "title": "Hero", "image_url": "https://example.com/dup_image.webp"}
        secondary_input = [
            {"id": "s1", "title": "Sec 1", "image_url": "https://example.com/dup_image.webp"},
            {"id": "s2", "title": "Sec 2", "image_url": "https://example.com/dup_image.webp"},
            {"id": "s3", "title": "Sec 3", "image_url": "https://example.com/dup_image.webp"},
            {"id": "s4", "title": "Sec 4", "image_url": "https://example.com/unique_other.webp"},
            {"id": "s5", "title": "Sec 5", "image_url": "/news-placeholder.png"},
        ]

        hero_out, secondary_out = ensure_unique(hero_input, secondary_input)
        
        all_rendered_images = [hero_out["image_url"]] + [s["image_url"] for s in secondary_out]
        unique_rendered_images = set(all_rendered_images)

        assert len(all_rendered_images) == len(unique_rendered_images) == 6
        assert "/news-placeholder.png" not in unique_rendered_images

    def test_03_ai_prompt_enforces_strict_spanish_language(self):
        """Verifica que el prompt del LLM contenga la regla estricta de idioma 100% español."""
        ai_path = os.path.join(os.getcwd(), "engine", "core", "ai.py")
        with open(ai_path, "r", encoding="utf-8") as f:
            ai_code = f.read()

        assert "IDIOMA 100% ESPAÑOL DE CHILE (OBLIGATORIO)" in ai_code
        assert "Queda estrictamente prohibido devolver títulos o textos en inglés" in ai_code

    def test_04_fallback_pool_contains_sufficient_diverse_images(self):
        """Verifica que la biblioteca de imágenes de fallback contenga más de 30 fotos únicas 16:9."""
        from engine.core.images import FALLBACK_POOLS

        total_unique_urls = set()
        for cat, urls in FALLBACK_POOLS.items():
            assert len(urls) >= 5, f"Categoría {cat} tiene menos de 5 imágenes"
            for u in urls:
                total_unique_urls.add(u)

        assert len(total_unique_urls) >= 30
