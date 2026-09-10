export interface QuickSalaryBreakdown {
  gross: number;
  afp: number;
  health: number;
  afc: number;
  tax: number;
  net: number;
  effectiveRetentionRate: number;
}

/** 🧮 Motor de Cálculo Previsional y Tributario Rápido (Chile / Magallanes) */
export function calculateQuickNetSalary(gross: number, utmValue: number = 68000): QuickSalaryBreakdown {
  const safeGross = Math.max(0, gross);
  
  // Tasas legales previsionales estimadas
  const afpRate = 0.1144; // AFP promedio ponderada
  const healthRate = 0.07; // Salud Fonasa / Isapre
  const afcRate = 0.006;  // Seguro Cesantía trabajador

  const afp = Math.round(safeGross * afpRate);
  const health = Math.round(safeGross * healthRate);
  const afc = Math.round(safeGross * afcRate);

  const totalPrevisional = afp + health + afc;
  const taxableIncome = Math.max(0, safeGross - totalPrevisional);

  // Impuesto Único de Segunda Categoría (Tramos mensuales en base a UTM)
  let tax = 0;
  const utm13_5 = 13.5 * utmValue;
  const utm30 = 30 * utmValue;
  const utm50 = 50 * utmValue;

  if (taxableIncome > utm50) {
    tax = Math.round((taxableIncome * 0.08) - (utm30 * 0.04));
  } else if (taxableIncome > utm30) {
    tax = Math.round((taxableIncome * 0.08) - (utm30 * 0.04));
  } else if (taxableIncome > utm13_5) {
    tax = Math.round((taxableIncome - utm13_5) * 0.04);
  }

  const net = Math.max(0, safeGross - totalPrevisional - tax);
  const totalDeductions = safeGross - net;
  const effectiveRetentionRate = safeGross > 0 ? (totalDeductions / safeGross) * 100 : 0;

  return {
    gross: safeGross,
    afp,
    health,
    afc,
    tax,
    net,
    effectiveRetentionRate: Number(effectiveRetentionRate.toFixed(1)),
  };
}
