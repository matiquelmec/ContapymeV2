"use server";

export async function generateJobDescription(jobTitle: string) {
  // En un entorno productivo, aquí llamaríamos a OpenAI o Gemini.
  // Para este proyecto, simularemos una respuesta profesional basada en patrones.
  
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simular latencia de IA

  const descriptions: Record<string, string> = {
    "Contador": "Responsable de la gestión contable integral, preparación de estados financieros, cumplimiento tributario (F29, F22) y conciliación bancaria. Debe asegurar la integridad de los registros bajo normas IFRS.",
    "Administrativo": "Encargado de la gestión documental, soporte en procesos de nómina, atención de proveedores y mantenimiento de archivos físicos y digitales. Se requiere dominio de herramientas de oficina y proactividad.",
    "Vendedor": "Responsable de la captación y fidelización de clientes, gestión de ventas, reportes de metas mensuales y asesoría técnica sobre los productos de la empresa.",
    "Gerente": "Liderazgo estratégico de la unidad de negocio, toma de decisiones financieras, gestión de equipos multidisciplinarios y reporte directo a la junta directiva."
  };

  const defaultDescription = `El profesional en el cargo de ${jobTitle} será responsable de ejecutar tareas críticas relacionadas con su área de especialización, asegurando la eficiencia operativa y el cumplimiento de los estándares de calidad de la empresa. Sus funciones incluyen la coordinación de procesos, generación de informes técnicos y colaboración con otros departamentos para alcanzar los objetivos institucionales.`;

  return descriptions[jobTitle] || defaultDescription;
}
