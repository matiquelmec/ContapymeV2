"use server";

export async function generateJobDescription(jobTitle: string, hours: number, isArt22: boolean) {
  // En un entorno productivo, aquí llamaríamos a OpenAI o Gemini.
  // Para este proyecto, simularemos una respuesta profesional basada en patrones.
  
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simular latencia de IA

  const formatText = (data: any) => {
    let art22Note = "";
    if (isArt22) {
      art22Note = "\n• AUTONOMÍA Y GESTIÓN: Ejecución de funciones con plena autonomía técnica y falta de fiscalización superior inmediata (Art. 22 inc. 2 CT).";
    }

    return `OBJETIVO GENERAL:
${data.objetivo} (${hours} horas semanales).

FUNCIONES ESPECÍFICAS:
${data.funciones.map((f: string) => `• ${f}`).join("\n")}${art22Note}

CUMPLIMIENTO NORMATIVO:
${data.normativas.join(", ")}.`;
  };

  const roles: Record<string, { objetivo: string; funciones: string[]; normativas: string[] }> = {
    "Contador": {
      objetivo: "Liderar la gestión contable y financiera de la organización bajo estándares internacionales.",
      funciones: [
        "Preparación y análisis de estados financieros bajo normativa IFRS.",
        "Supervisión del cumplimiento tributario nacional (F29, F22, DJ).",
        "Gestión de conciliaciones bancarias y auditoría de cuentas por pagar/cobrar."
      ],
      normativas: ["Normas IFRS", "Ley de Modernización Tributaria"]
    },
    // ... más roles omitidos por brevedad pero el motor base es dinámico
  };

  const data = roles[jobTitle] || {
    objetivo: `Ejecutar funciones críticas en el cargo de ${jobTitle} para garantizar la eficiencia organizacional.`,
    funciones: [
      "Coordinación de procesos internos vinculados al área.",
      "Generación de informes técnicos y cumplimiento de metas.",
      "Optimización de recursos y mejora continua de procesos."
    ],
    normativas: ["Legislación Laboral Chilena", "Procedimientos Internos de Calidad"]
  };

  return formatText(data);
}

export async function generateWorkSchedule(hoursPerWeek: number, context: string = "") {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (hoursPerWeek <= 0) return "No se especificó jornada.";

  // Integración del contexto del usuario en la "IA"
  const hasContext = context.trim().length > 0;
  const ctxLower = context.toLowerCase();

  if (hasContext && (ctxLower.includes("fin de semana") || ctxLower.includes("fds"))) {
    const hrsPerDay = (hoursPerWeek / 2).toFixed(1);
    return `Jornada parcial de ${hoursPerWeek} horas semanales distribuida exclusivamente los Sábados y Domingos (${hrsPerDay} hrs cada día). Distribución: Sábado de 09:00 a ${hoursPerWeek <= 18 ? '18:00' : '20:00'} hrs y Domingo en igual horario, con 60 min de colación legal.`;
  }

  if (hasContext && ctxLower.includes("noche")) {
    return `Jornada de ${hoursPerWeek} horas semanales en horario nocturno: Distribución de 22:00 a 06:00 hrs, cumpliendo con los recargos y descansos legales correspondientes.`;
  }

  // Lógica estándar si no hay contexto específico
  if (hoursPerWeek === 40) {
    return "Jornada de 40 horas semanales de lunes a viernes: 08:30 a 17:30 hrs, con 60 min de colación.";
  }

  if (hoursPerWeek === 44) {
    return "Jornada de 44 horas semanales de lunes a viernes: 09:00 a 18:48 hrs, con 60 min de colación.";
  }

  if (hoursPerWeek <= 30) {
    const days = hoursPerWeek <= 20 ? 3 : 5;
    const hrsPerDay = (hoursPerWeek / days).toFixed(1);
    const contextNote = hasContext ? ` [Nota: ${context}]` : "";
    return `Jornada parcial de ${hoursPerWeek} horas semanales distribuida en ${days} días (${hrsPerDay} hrs/día). Sugerencia: Lunes, Miércoles y Viernes de 09:00 a 16:00 hrs, con colación legal.${contextNote}`;
  }

  return `Jornada de ${hoursPerWeek} horas semanales${hasContext ? ` centrada en: ${context}` : ""}, distribuida según acuerdo de partes y necesidades operacionales. El horario específico se fijará al inicio de la relación laboral.`;
}
