import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { 
  createCleanSummary, 
  isNicheRelevant, 
  RegionalNewsInsertSchema,
  extractDateFromUrl,
  extractDateFromHtmlMeta,
  hasAnachronisticContent,
  resolveAndValidateArticleFreshness,
  isStoredArticleTimely
} from "../../lib/news/news-quality.ts";

describe("News Sync Quality & Hardened Crawler Suite", () => {
  describe("1. createCleanSummary (Truncado Limpio sin palabras mutiladas)", () => {
    test("mantiene textos breves sin recortar y asegura punto final", () => {
      const input = "El Gobierno Regional de Magallanes aprobó los fondos para el puerto";
      const result = createCleanSummary(input, 260);
      assert.equal(result, "El Gobierno Regional de Magallanes aprobó los fondos para el puerto.");
    });

    test("corta en el límite de la última palabra completa sin mutilar sílabas", () => {
      const longInput = "Hasta el momento la administración regional ha gastado $48 mil millones de un marco presupuestario de $100 mil millones. A nivel país, es el séptimo Gore con mejor ejecución presupuestaria, lejos de Maule y Los Lagos, que anotan porcentajes de gasto cercanos al 60%. A pesar de que los trámites administrativos se han agilizado notablemente.";
      const result = createCleanSummary(longInput, 200);

      // No debe terminar con palabras rotas como 'Apesar de q.' o sílabas cortadas
      assert.ok(!result.endsWith(" q..."));
      assert.ok(!result.endsWith(" q."));
      assert.ok(result.endsWith("..."));
      assert.ok(result.length <= 203); // 200 + '...'

      // Comprobar que la última palabra antes de '...' sea una palabra completa del texto
      const words = result.replace(/\.\.\.$/, "").trim().split(/\s+/);
      const lastWord = words[words.length - 1];
      assert.ok(longInput.includes(lastWord), `La última palabra '${lastWord}' debe existir completa en el original`);
    });

    test("limpia entidades HTML y etiquetas antes de truncar", () => {
      const htmlInput = "<div>&iexcl;Gran avance! &amp; desarrollo <strong>econ&oacute;mico</strong> en Punta Arenas.</div>";
      const result = createCleanSummary(htmlInput, 100);
      assert.ok(!result.includes("&amp;"));
      assert.ok(!result.includes("<div>"));
      assert.ok(result.includes("desarrollo"));
    });
  });

  describe("2. isNicheRelevant (Filtro Temático Estricto de Nicho)", () => {
    test("rechaza taxativamente noticias de deportes y torneos", () => {
      assert.equal(isNicheRelevant("Básquetbol laboral busca semifinalistas", "Los cuartos de final del torneo de básquetbol todo competidor"), false);
      assert.equal(isNicheRelevant("Finaliza la etapa clasificatoria del maxi", "En el gimnasio del Liceo Luis Alberto Barrera se disputarán los cuatro últimos encuentros"), false);
      assert.equal(isNicheRelevant("230 jugadores en la última fecha de Liga de Pádel", "Gran concurrencia en el torneo fin de semana"), false);
      assert.equal(isNicheRelevant("Punta Arenas con Palestino en el Fútbol", "A todo o nada en el campeonato regional"), false);
    });

    test("rechaza crónica roja cotidiana y sucesos domésticos irrelevantes", () => {
      assert.equal(isNicheRelevant("Tiktoker preso: tenía radio policial para llegar primero", "Se confirmó la prisión preventiva para persona detrás de cuenta"), false);
      assert.equal(isNicheRelevant("Rotura de matriz anegó viviendas de calle Mejicana", "Una rotura de matriz de agua potable movilizó a contratista"), false);
      assert.equal(isNicheRelevant("Revocaron libertad a chofer sorprendido manejando con prohibición perpetua", "Formalizan a hombre por quebrantamiento de condena"), false);
    });

    test("aprueba noticias institucionales, económicas, laborales y de desarrollo de Magallanes", () => {
      assert.equal(isNicheRelevant("Presupuesto regional: más de $52 mil millones aún no son gastados", "Hasta el momento la administración del Gore Magallanes ha ejecutado"), true);
      assert.equal(isNicheRelevant("Nueva circular del SII norma retenciones tributarias en Punta Arenas", "La Dirección Regional del SII instruye a empresas contribuyentes"), true);
      assert.equal(isNicheRelevant("Enap y proyectos de Hidrógeno Verde aceleran inversión en Magallanes", "La estatal firmó convenios de desarrollo energético"), true);
      assert.equal(isNicheRelevant("Dirección del Trabajo refuerza fiscalizaciones de Ley 40 Horas en la Patagonia", "Inspectores laborales fiscalizarán cumplimiento de jornada legal"), true);
    });
  });

  describe("3. RegionalNewsInsertSchema (Validación Zod Runtime)", () => {
    test("rechaza noticias con contenido extremadamente corto (< 350 caracteres)", () => {
      const candidate = {
        title: "Noticia breve de prueba económica",
        slug: "noticia-breve-de-prueba",
        category: "ECONOMÍA",
        content: "Contenido muy corto de apenas 50 caracteres.",
        summary: "Resumen suficiente con más de cuarenta caracteres reglamentarios.",
        image_url: "https://example.com/imagen.jpg",
        source_url: "https://example.com/noticia",
        source_name: "Diario Oficial",
        normalized_title: "noticia breve de prueba economica",
        published_at: "2026-10-24T12:00:00Z",
        is_featured: false
      };

      const result = RegionalNewsInsertSchema.safeParse(candidate);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some(i => i.path.includes("content")));
      }
    });

    test("acepta noticias sustantivas que cumplen todos los criterios de calidad", () => {
      const candidate = {
        title: "Presupuesto regional 2026: Magallanes alcanza histórico nivel de ejecución",
        slug: "presupuesto-regional-2026-magallanes",
        category: "ECONOMÍA",
        content: "El Gobierno Regional de Magallanes y de la Antártica Chilena presentó este viernes el balance trimestral de inversión pública, destacando que los recursos asignados a obras de infraestructura vial, conectividad marítima y fortalecimiento de PYMEs locales han alcanzado un ritmo sostenido de gasto fiscal que supera el promedio nacional del sector público.",
        summary: "El Gobierno Regional de Magallanes presentó el balance trimestral de inversión pública con foco en conectividad y apoyo a PYMEs.",
        image_url: "https://example.com/imagen.jpg",
        source_url: "https://example.com/noticia-completa",
        source_name: "Diario Punta Arenas",
        normalized_title: "presupuesto regional 2026 magallanes alcanza historico nivel de ejecucion",
        published_at: "2026-10-24T12:00:00Z",
        is_featured: false
      };

      const result = RegionalNewsInsertSchema.safeParse(candidate);
      assert.equal(result.success, true);
    });

    test("rechaza en Zod Runtime noticias donde source_url tiene fecha antigua de abril aunque published_at sea de octubre (Caso Pauta Operación Renta)", () => {
      const masqueradedCandidate = {
        title: "Más de un millón de contribuyentes presentaron su declaración",
        slug: "mas-de-un-millon-de-contribuyentes-presentaron-su-declaracion",
        category: "SII / LEGAL",
        content: "Este viernes 9 de abril concluye el primer plazo de la Operación Renta 2026 para que más de un millón de contribuyentes reciban su devolución anticipada de impuestos el próximo 29 de abril mediante depósito bancario directo en sus cuentas registradas ante la Tesorería General de la República y el Servicio de Impuestos Internos.",
        summary: "Más de un millón de contribuyentes presentaron su declaración en la Operación Renta para recibir devolución anticipada.",
        image_url: "https://example.com/imagen.jpg",
        source_url: "https://www.pauta.cl/economia/2026/04/09/operacion-renta-26-de-los-contribuyentes-recibiran-la-devolucion-anticipada.html",
        source_name: "Diario Punta Arenas",
        normalized_title: "mas de un millon de contribuyentes presentaron su declaracion",
        published_at: "2026-10-24T21:50:24.423671+00:00",
        is_featured: true
      };

      const result = RegionalNewsInsertSchema.safeParse(masqueradedCandidate);
      assert.equal(result.success, false, "Zod debe bloquear artículos cuya URL o contenido sea de abril cuando published_at es octubre");
    });
  });

  describe("4. Escudo Temporal Multicapa (Anti-Anacronismo & Oldest Date Wins)", () => {
    test("extractDateFromUrl detecta fechas exactas (/YYYY/MM/DD/) y mensuales (/YYYY/MM/)", () => {
      const d1 = extractDateFromUrl("https://www.pauta.cl/economia/2026/04/09/operacion-renta.html");
      assert.ok(d1);
      assert.equal(d1.precision, "day");
      assert.equal(d1.date.toISOString().slice(0, 10), "2026-04-09");

      const d2 = extractDateFromUrl("https://www.ovejeronoticias.cl/2026/06/seis-proyectos-municipales/");
      assert.ok(d2);
      assert.equal(d2.precision, "month");
      assert.equal(d2.date.toISOString().slice(0, 7), "2026-06");
    });

    test("extractDateFromHtmlMeta extrae article:published_time y JSON-LD datePublished", () => {
      const sampleHtml = `
        <html>
          <head>
            <meta property="article:published_time" content="2026-04-09T14:30:00Z" />
          </head>
          <body><p>Contenido</p></body>
        </html>
      `;
      const metaDate = extractDateFromHtmlMeta(sampleHtml);
      assert.ok(metaDate);
      assert.equal(metaDate.toISOString().slice(0, 10), "2026-04-09");
    });

    test("resolveAndValidateArticleFreshness aplica Oldest Date Wins cuando Google News miente con pubDate de hoy", () => {
      const octNow = new Date("2026-10-25T15:00:00Z");
      const check = resolveAndValidateArticleFreshness({
        title: "Más de un millón de contribuyentes presentaron su declaración",
        content: "Detalle de la Operación Renta en curso.",
        pubDate: "Sat, 24 Oct 2026 21:50:24 GMT", // Google News re-indexó hoy
        sourceUrl: "https://www.pauta.cl/economia/2026/04/09/operacion-renta-26.html", // Pero URL es de abril
        now: octNow
      });
      assert.equal(check.valid, false);
      assert.ok(check.effectiveDate);
      assert.equal(check.effectiveDate.toISOString().slice(0, 10), "2026-04-09");
    });

    test("resolveAndValidateArticleFreshness rechaza noticias sin fecha verificable (cero fallback a Date.now)", () => {
      const check = resolveAndValidateArticleFreshness({
        title: "Noticia sin fecha en RSS ni URL ni HTML",
        content: "Texto de noticia regional en Punta Arenas.",
        pubDate: null,
        sourceUrl: "https://www.elpinguino.com/cronica/noticia-sin-fecha/",
        htmlMetaDate: null
      });
      assert.equal(check.valid, false);
      assert.equal(check.effectiveDate, null);
    });

    test("hasAnachronisticContent e isStoredArticleTimely bloquean Operación Renta y Fiestas Patrias en octubre", () => {
      const octDate = new Date("2026-10-24T12:00:00Z");
      const rentaCheck = hasAnachronisticContent(
        "Más de un millón de contribuyentes presentaron su declaración",
        "La devolución anticipada se pagará el 29 de abril.",
        octDate
      );
      assert.equal(rentaCheck.anachronistic, true);

      const garzonesCheck = hasAnachronisticContent(
        "Municipalidad premia a ganadores de Corrida de Garzones 2026",
        "El tradicional evento de Fiestas Patrias reunió a trabajadores gastronómicos.",
        octDate
      );
      assert.equal(garzonesCheck.anachronistic, true);

      assert.equal(
        isStoredArticleTimely({
          title: "Más de un millón de contribuyentes presentaron su declaración",
          summary: "Operación Renta devolución anticipada",
          source_url: "https://www.pauta.cl/economia/2026/04/09/operacion-renta.html",
          published_at: "2026-10-24T21:50:24Z"
        }),
        false
      );
    });
  });
});
