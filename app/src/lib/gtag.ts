// Helper para Google Ads y Google Analytics (gtag.js)

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

// Registrar una visita a una página
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag && GA_TRACKING_ID) {
    (window as any).gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Registrar un evento específico (ej. clics, conversiones, envíos de formulario)
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category?: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Eventos de conversión predefinidos para Google Ads
export const trackCalculatorSimulation = (calculatorType: string = 'tributaria') => {
  event({
    action: 'simulate_calculator',
    category: 'Engagement',
    label: calculatorType,
  });
};

export const trackUserRegistration = () => {
  event({
    action: 'sign_up',
    category: 'Conversion',
    label: 'new_account',
  });
};

export const trackContactFormSubmit = () => {
  event({
    action: 'submit_contact',
    category: 'Conversion',
    label: 'contact_form',
  });
};
