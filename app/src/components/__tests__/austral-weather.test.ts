import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { 
  AUSTRAL_COMMUNES, 
  parseWeatherCode 
} from "../../lib/weather/austral-weather.ts";

describe("Austral Weather Multi-Commune Suite", () => {
  test("1. Las comunas australes tienen coordenadas válidas en Magallanes", () => {
    assert.equal(AUSTRAL_COMMUNES.length, 3);

    const puq = AUSTRAL_COMMUNES.find(c => c.id === "puq");
    assert.ok(puq, "Punta Arenas debe existir");
    assert.equal(puq.lat, -53.15);
    assert.equal(puq.lon, -70.91);

    const pnt = AUSTRAL_COMMUNES.find(c => c.id === "pnt");
    assert.ok(pnt, "Puerto Natales debe existir");
    assert.equal(pnt.lat, -51.72);

    const por = AUSTRAL_COMMUNES.find(c => c.id === "por");
    assert.ok(por, "Porvenir debe existir");
    assert.equal(por.lat, -53.29);
  });

  test("2. parseWeatherCode clasifica correctamente códigos meteorológicos de Open-Meteo", () => {
    assert.equal(parseWeatherCode(0), "Cielo Despejado");
    assert.equal(parseWeatherCode(2), "Parcialmente Nublado");
    assert.equal(parseWeatherCode(45), "Niebla Helada");
    assert.equal(parseWeatherCode(61), "Lluvia Austral");
    assert.equal(parseWeatherCode(71), "Nevadas en la Región");
    assert.equal(parseWeatherCode(95), "Tormenta Austral");
    assert.equal(parseWeatherCode(999), "Nublado"); // Fallback
  });
});
