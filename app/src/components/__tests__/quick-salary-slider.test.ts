import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { calculateQuickNetSalary } from "../../lib/salary/quick-salary.ts";

describe("Quick Salary Simulator Calculations", () => {
  test("1. Sueldo de $1.000.000 (tramo exento de impuesto único)", () => {
    const res = calculateQuickNetSalary(1000000);
    assert.equal(res.gross, 1000000);
    assert.equal(res.afp, 114400); // 11.44%
    assert.equal(res.health, 70000); // 7%
    assert.equal(res.afc, 6000); // 0.6%
    assert.equal(res.tax, 0); // Exento (renta líquida imponible < 13.5 UTM)
    assert.equal(res.net, 809600); // 1000000 - 190400
    assert.ok(res.effectiveRetentionRate > 18 && res.effectiveRetentionRate < 20);
  });

  test("2. Sueldo de $2.500.000 (aplica impuesto único de 2da categoría)", () => {
    const res = calculateQuickNetSalary(2500000);
    assert.equal(res.gross, 2500000);
    assert.ok(res.tax > 0, "Debe calcular impuesto único para renta sobre 13.5 UTM");
    assert.ok(res.net < 2500000 - (res.afp + res.health + res.afc));
    assert.ok(res.effectiveRetentionRate > 20);
  });

  test("3. Sueldo 0 o negativo retorna valores protegidos en 0", () => {
    const res = calculateQuickNetSalary(-500000);
    assert.equal(res.gross, 0);
    assert.equal(res.net, 0);
    assert.equal(res.effectiveRetentionRate, 0);
  });
});
