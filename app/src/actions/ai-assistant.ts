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
    "Programador": {
      objetivo: "Desarrollar, optimizar y mantener aplicaciones de software e infraestructura digital de la empresa.",
      funciones: [
        "Diseño y codificación de software en arquitecturas web modernas y bases de datos PostgreSQL.",
        "Desarrollo e integración de APIs RESTful, microservicios y sistemas de pago electrónico.",
        "Ejecución de pruebas unitarias, control de versiones mediante Git y documentación técnica.",
        "Custodia y estricta confidencialidad del código fuente y secretos de la empresa (Ley 17.336)."
      ],
      normativas: ["Ley Nº 17.336 de Propiedad Intelectual", "Código del Trabajo de Chile"]
    },
    "Desarrollador": {
      objetivo: "Liderar la arquitectura e implementación de soluciones digitales y plataformas SaaS.",
      funciones: [
        "Construcción de interfaces de usuario interactivas y backend de alto rendimiento.",
        "Optimización de consultas SQL, seguridad web y monitoreo de servidores.",
        "Colaboración en metodologías ágiles (Scrum/Kanban) y entregas de sprint.",
        "Resguardo confidencial de la información, repositorios de código y datos de clientes (Ley 19.628)."
      ],
      normativas: ["Ley Nº 19.628 de Protección de Datos", "Ley Nº 17.336 de Propiedad Intelectual"]
    },
    "Contador": {
      objetivo: "Liderar la gestión contable, tributaria y financiera de la organización bajo estándares internacionales.",
      funciones: [
        "Preparación y análisis de estados financieros de 8 columnas bajo normativa IFRS.",
        "Supervisión del cumplimiento tributario nacional (F29, F22, DJ1887 y Registros RCV).",
        "Gestión de conciliaciones bancarias y auditoría de cuentas por pagar/cobrar.",
        "Custodia de los libros contables e información reservada de los clientes de la Pyme."
      ],
      normativas: ["Normas IFRS", "Ley de Modernización Tributaria (SII)", "Código del Trabajo"]
    },
    "Vendedor": {
      objetivo: "Atender al público, gestionar ventas y garantizar la excelencia en el servicio al cliente.",
      funciones: [
        "Atención presencial y remota a clientes, asesoría comercial y cierre de ventas.",
        "Emisión de boletas y facturas electrónicas en punto de venta (POS).",
        "Control, reposición y ordenamiento de productos en sala de ventas.",
        "Arqueo diario de caja y custodia de los fondos recaudados durante el turno."
      ],
      normativas: ["Reglamento Interno de la Empresa", "Código del Trabajo de Chile"]
    },
    "Asistente de Bodega": {
      objetivo: "Gestionar la recepción, almacenamiento, preparación de pedidos e inventarios de mercadería.",
      funciones: [
        "Recepción de productos contra guía de despacho y orden de compra.",
        "Almacenamiento, rotación de stock (FEFO/FIFO) y toma de inventarios periódicos.",
        "Preparación de pedidos (picking/packing) y entrega a transportistas.",
        "Uso obligatorio de Elementos de Protección Personal (EPP) y orden en instalaciones."
      ],
      normativas: ["Ley de Accidentes del Trabajo Nº 16.744", "Reglamento de Higiene y Seguridad"]
    },
    "Administrador": {
      objetivo: "Supervisar las operaciones diarias, el personal a cargo y la continuidad del negocio.",
      funciones: [
        "Coordinación del equipo de trabajo, control de asistencia y distribución de turnos.",
        "Apertura y cierre del local comercial o dependencias operativas.",
        "Gestión de proveedores, compras de insumos e informes a la gerencia.",
        "Cumplimiento del Protocolo de Prevención de Acoso y Violencia en el Trabajo (Ley Karin 21.643)."
      ],
      normativas: ["Ley Karin Nº 21.643", "Ley Nº 21.561 de 40 Horas", "Código del Trabajo"]
    }
  };

  const key = Object.keys(roles).find(k => jobTitle.toLowerCase().includes(k.toLowerCase())) || "";
  const data = roles[key] || {
    objetivo: `Ejecutar las funciones principales inherentes al cargo de ${jobTitle} para garantizar la eficiencia organizacional.`,
    funciones: [
      `Ejecución con la debida diligencia de las tareas operativas y técnicas vinculadas a su cargo de ${jobTitle}.`,
      "Coordinación con la jefatura directa para el cumplimiento de metas e informes periódicos.",
      "Optimización de recursos corporativos y mantenimiento del orden en el puesto de trabajo.",
      "Cumplimiento estricto del Reglamento Interno de Orden, Higiene y Seguridad de la empresa."
    ],
    normativas: ["Legislación Laboral Chilena", "Ley Karin Nº 21.643", "Reglamento Interno de Seguridad"]
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
