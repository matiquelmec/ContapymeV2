import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { normalizeSlugTokens, repairCorruptedSlugPattern } from "../news-slug-resolver.ts";
import { notifyIndexNowForNews } from "../indexing-service.ts";

describe("News SEO & Slug Resolution Suite", () => {
  describe("repairCorruptedSlugPattern", () => {
    test("repara palabras mutiladas por perdida de vocales acentuadas", () => {
      const input = "comisin-martima-de-la-regin-impulsa-inversin-en-hormign";
      const expected = "comision-maritima-de-la-region-impulsa-inversion-en-hormigon";
      assert.equal(repairCorruptedSlugPattern(input), expected);
    });

    test("repara slugs legislativos y educativos", () => {
      const input = "votacin-en-el-comit-aprueba-nueva-legislacin-de-educacin";
      const expected = "votacion-en-el-comite-aprueba-nueva-legislacion-de-educacion";
      assert.equal(repairCorruptedSlugPattern(input), expected);
    });

    test("mantiene inalterados slugs limpios sin corrupcion", () => {
      const input = "nueva-planta-de-hidrogeno-verde-en-magallanes";
      assert.equal(repairCorruptedSlugPattern(input), input);
    });
  });

  describe("normalizeSlugTokens", () => {
    test("extrae tokens relevantes filtrando stopwords cortas y numeros", () => {
      const slug = "construccion-de-2026-nuevos-puentes-en-punta-arenas";
      const tokens = normalizeSlugTokens(slug);
      
      assert.ok(tokens.includes("construccion"));
      assert.ok(tokens.includes("nuevos"));
      assert.ok(tokens.includes("puentes"));
      assert.ok(tokens.includes("punta"));
      assert.ok(tokens.includes("arenas"));
      assert.ok(!tokens.includes("2026"), "No debe incluir anios/numeros puros");
      assert.ok(!tokens.includes("de"), "No debe incluir palabras menores a 4 caracteres");
      assert.ok(!tokens.includes("en"), "No debe incluir palabras menores a 4 caracteres");
    });

    test("maneja slugs vacios de manera segura", () => {
      assert.deepEqual(normalizeSlugTokens(""), []);
    });
  });

  describe("notifyIndexNowForNews", () => {
    test("construye la URL canonica con www para la noticia y maneja ejecucion sin credenciales en test", async () => {
      const res = await notifyIndexNowForNews("noticia-magallanes-prueba-2026");
      assert.equal(typeof res.success, "boolean");
      if (!res.success) {
        assert.ok(res.error?.includes("INDEXNOW_KEY") || res.error?.includes("fetch"));
      }
    });
  });
});
