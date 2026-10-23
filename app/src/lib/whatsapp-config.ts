export const OFFICIAL_WHATSAPP_PHONE = "+56944444565";
export const OFFICIAL_WHATSAPP_DISPLAY = "+56 9 4444 4565";

export interface WhatsAppQuickAction {
  id: string;
  title: string;
  price: string;
  message: string;
}

export const WHATSAPP_QUICK_ACTIONS: WhatsAppQuickAction[] = [
  {
    id: "constitucion",
    title: "Creación de Empresa",
    price: "$35.000",
    message: "¡Hola! Quisiera asesoría para constituir mi empresa por $35.000 en Punta Arenas con Contapymepuq.",
  },
  {
    id: "empleo-prensa",
    title: "ContaEmpleos & Prensa",
    price: "Avisos",
    message: "¡Hola! Me gustaría publicar un aviso en ContaEmpleos Magallanes o una nota de prensa en el Diario Regional.",
  },
  {
    id: "contabilidad-nomina",
    title: "Software ERP & Nómina",
    price: "40 Horas",
    message: "¡Hola! Quisiera información y demostración del ERP Contable y cálculo de remuneraciones Ley 40 Horas.",
  },
];

export function buildWhatsAppUrl(message?: string): string {
  const defaultText = "¡Hola! Quisiera más información sobre los servicios contables y formalización de empresas en Contapymepuq.";
  const text = message?.trim() || defaultText;
  const cleanPhone = OFFICIAL_WHATSAPP_PHONE.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
