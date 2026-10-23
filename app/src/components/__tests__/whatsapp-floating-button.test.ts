import test from "node:test";
import assert from "node:assert/strict";
import { 
  OFFICIAL_WHATSAPP_PHONE, 
  OFFICIAL_WHATSAPP_DISPLAY, 
  WHATSAPP_QUICK_ACTIONS, 
  buildWhatsAppUrl 
} from "../../lib/whatsapp-config.ts";

test("WhatsApp Floating Button Suite", async (t) => {
  await t.test("1. Verifica que el teléfono oficial sea inmutable y termine en 44444565", () => {
    assert.equal(OFFICIAL_WHATSAPP_PHONE, "+56944444565");
    assert.equal(OFFICIAL_WHATSAPP_DISPLAY, "+56 9 4444 4565");
  });

  await t.test("2. buildWhatsAppUrl genera la URL correcta con número limpio y texto predeterminado", () => {
    const url = buildWhatsAppUrl();
    assert.match(url, /^https:\/\/wa\.me\/56944444565\?text=/);
    assert.ok(url.includes("Contapymepuq"));
  });

  await t.test("3. buildWhatsAppUrl codifica correctamente mensajes personalizados de acciones rápidas", () => {
    for (const action of WHATSAPP_QUICK_ACTIONS) {
      const url = buildWhatsAppUrl(action.message);
      assert.ok(url.startsWith("https://wa.me/56944444565?text="));
      assert.ok(url.includes(encodeURIComponent(action.message)));
    }
  });

  await t.test("4. Existen exactamente 3 acciones rápidas vinculadas a los pilares de Contapymepuq", () => {
    assert.equal(WHATSAPP_QUICK_ACTIONS.length, 3);
    const ids = WHATSAPP_QUICK_ACTIONS.map(a => a.id);
    assert.deepEqual(ids, ["constitucion", "empleo-prensa", "contabilidad-nomina"]);
  });
});
