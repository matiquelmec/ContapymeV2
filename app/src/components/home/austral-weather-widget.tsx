"use client";

import { useEffect, useState } from "react";
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudSnow, 
  Wind, 
  Compass, 
  MapPin 
} from "lucide-react";
import { 
  AUSTRAL_COMMUNES, 
  parseWeatherCode, 
  type CommuneConfig, 
  type WeatherInfo 
} from "@/lib/weather/austral-weather";

export { AUSTRAL_COMMUNES, parseWeatherCode, type CommuneConfig, type WeatherInfo };

export function AustralWeatherWidget() {
  const [selectedCommune, setSelectedCommune] = useState<CommuneConfig>(AUSTRAL_COMMUNES[0]);
  const [weather, setWeather] = useState<WeatherInfo>({
    temp: 8.5,
    humidity: 90,
    windSpeed: 38,
    code: 3,
    description: "Parcialmente Nublado",
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;
    setWeather(prev => ({ ...prev, loading: true }));

    async function fetchCommuneWeather() {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${selectedCommune.lat}&longitude=${selectedCommune.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Error en API meteorológica");
        const data = await res.json();
        
        if (isMounted && data.current) {
          const current = data.current;
          setWeather({
            temp: current.temperature_2m,
            humidity: current.relative_humidity_2m,
            windSpeed: Math.round(current.wind_speed_10m),
            code: current.weather_code,
            description: parseWeatherCode(current.weather_code),
            loading: false,
          });
        }
      } catch (err) {
        if (isMounted) {
          setWeather(prev => ({ ...prev, loading: false }));
        }
      }
    }

    fetchCommuneWeather();

    return () => {
      isMounted = false;
    };
  }, [selectedCommune]);

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="h-9 w-9 text-amber-500 animate-pulse" />;
    if (code >= 1 && code <= 3) return <Cloud className="h-9 w-9 text-sky-400" />;
    if (code >= 51 && code <= 65) return <CloudRain className="h-9 w-9 text-blue-400 animate-bounce" />;
    if (code >= 71 && code <= 77) return <CloudSnow className="h-9 w-9 text-indigo-300 animate-spin" style={{ animationDuration: "12s" }} />;
    return <Wind className="h-9 w-9 text-sky-400 animate-pulse" />;
  };

  return (
    <div className="group relative p-6 sm:p-7 rounded-[2.2rem] bg-white/60 dark:bg-zinc-900/60 border border-border/60 backdrop-blur-xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.06)] hover:border-primary/30 transition-all duration-500 flex flex-col justify-between overflow-hidden">
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.22em] text-primary">
            <Compass className="h-3.5 w-3.5 text-sky-500 animate-spin" style={{ animationDuration: "10s" }} />
            <span>Clima Austral</span>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-2 py-0.5 text-[8px] font-bold text-emerald-600 tracking-wider">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span>EN VIVO</span>
          </div>
        </div>

        <div className="flex items-center gap-1 mt-3.5 p-1 bg-zinc-100/80 dark:bg-zinc-800/60 rounded-xl border border-border/40">
          {AUSTRAL_COMMUNES.map((commune) => {
            const isSelected = selectedCommune.id === commune.id;
            return (
              <button
                key={commune.id}
                onClick={() => setSelectedCommune(commune)}
                className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                  isSelected
                    ? "bg-white dark:bg-zinc-900 text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {commune.shortName}
              </button>
            );
          })}
        </div>

        <div className="flex items-end justify-between mt-5">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
              <MapPin className="h-3 w-3 text-primary shrink-0" />
              <span>{selectedCommune.name}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl sm:text-5xl font-black italic tracking-tighter text-foreground">
                {weather.loading ? "--" : weather.temp.toFixed(1)}
              </span>
              <span className="text-xl font-black text-sky-500">°C</span>
            </div>
            <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground italic">
              {weather.description}
            </p>
          </div>

          <div className="p-2">
            {getWeatherIcon(weather.code)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border/50 pt-4 mt-5">
        <div className="flex items-center gap-2">
          <Wind className="h-4 w-4 text-sky-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">Viento</span>
            <span className="text-xs font-black text-foreground italic tabular-nums">
              {weather.loading ? "..." : `${weather.windSpeed} km/h`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-indigo-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">Humedad</span>
            <span className="text-xs font-black text-foreground italic tabular-nums">
              {weather.loading ? "..." : `${weather.humidity}%`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
