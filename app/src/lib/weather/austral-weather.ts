export interface CommuneConfig {
  id: string;
  name: string;
  shortName: string;
  lat: number;
  lon: number;
}

export const AUSTRAL_COMMUNES: CommuneConfig[] = [
  { id: "puq", name: "Punta Arenas", shortName: "PUQ", lat: -53.15, lon: -70.91 },
  { id: "pnt", name: "Puerto Natales", shortName: "Natales", lat: -51.72, lon: -72.50 },
  { id: "por", name: "Porvenir (TDF)", shortName: "Porvenir", lat: -53.29, lon: -70.37 },
];

export interface WeatherInfo {
  temp: number;
  humidity: number;
  windSpeed: number;
  code: number;
  description: string;
  loading: boolean;
}

export function parseWeatherCode(code: number): string {
  if (code === 0) return "Cielo Despejado";
  if (code >= 1 && code <= 3) return "Parcialmente Nublado";
  if (code >= 45 && code <= 48) return "Niebla Helada";
  if (code >= 51 && code <= 55) return "Llovizna Austral";
  if (code >= 61 && code <= 65) return "Lluvia Austral";
  if (code >= 71 && code <= 77) return "Nevadas en la Región";
  if (code >= 80 && code <= 82) return "Chubascos Fuertes";
  if (code === 95 || code === 96 || code === 99) return "Tormenta Austral";
  return "Nublado";
}
