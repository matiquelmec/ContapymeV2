'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudSnow, 
  Wind, 
  TrendingUp, 
  Compass, 
  ArrowUpRight, 
  Radio, 
  Activity,
  RefreshCw 
} from 'lucide-react'
import { Indicator } from '@/lib/types/dashboard'
import { createClient } from '@/lib/supabase/client'
import { syncAllDataAction } from '@/actions/indicators'
import { toast } from 'sonner'

interface HeroBentoGridProps {
  indicators: Indicator[]
  news?: any[]
}

interface WeatherData {
  temp: number
  humidity: number
  windSpeed: number
  code: number
  description: string
  loading: boolean
}

export function HeroBentoGrid({ indicators = [], news = [] }: HeroBentoGridProps) {
  const [syncing, setSyncing] = useState(false)

  const handleManualSync = async () => {
    if (syncing) return
    setSyncing(true)
    const toastId = toast.loading('Sincronizando indicadores y diario regional...')
    
    try {
      const res = await syncAllDataAction()
      if (res.success) {
        toast.success('Datos actualizados en tiempo real', { id: toastId })
      } else {
        toast.error('Actualización parcial. Se encontraron algunos errores.', { id: toastId })
      }
    } catch (err: any) {
      toast.error(`Error al sincronizar: ${err.message}`, { id: toastId })
    } finally {
      setSyncing(false)
    }
  }

  // Estado para el clima
  const [weather, setWeather] = useState<WeatherData>({
    temp: 8.7,
    humidity: 92,
    windSpeed: 36,
    code: 3,
    description: 'Parcialmente Nublado',
    loading: true
  })

  // Sincronización en Tiempo Real de los Indicadores del Bento
  const [liveIndicators, setLiveIndicators] = useState<Indicator[]>(indicators)
  const [updatedCodes, setUpdatedCodes] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setLiveIndicators(indicators)
  }, [indicators])

  // Obtener la última noticia destacada o la más reciente
  const latestNews = news.length > 0 ? (news.find(n => n.is_featured) || news[0]) : null

  // Suscribirse a Supabase Realtime para cambios en los indicadores
  useEffect(() => {
    let channel: any
    try {
      const supabase = createClient()
      channel = supabase
        .channel('bento_indicators_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'economic_indicators'
          },
          (payload) => {
            console.log('🔄 [Bento Realtime] Cambio detectado:', payload)
            const newRecord = payload.new as Indicator
            if (newRecord && newRecord.codigo) {
              setLiveIndicators(prev => {
                const updated = [...prev]
                const idx = updated.findIndex(i => i.codigo === newRecord.codigo)
                if (idx !== -1) {
                  updated[idx] = { ...updated[idx], ...newRecord }
                } else {
                  updated.push(newRecord)
                }
                return updated
              })

              // Micro-animación de destello verde en el Bento
              setUpdatedCodes(prev => ({ ...prev, [newRecord.codigo]: true }))
              setTimeout(() => {
                setUpdatedCodes(prev => ({ ...prev, [newRecord.codigo]: false }))
              }, 2000)
            }
          }
        )
      channel.subscribe()
    } catch (e) {
      console.error('❌ Error al suscribir Bento Grid a Supabase Realtime:', e)
    }

    return () => {
      if (channel) {
        try {
          const supabase = createClient()
          supabase.removeChannel(channel)
        } catch (e) {
          console.error(e)
        }
      }
    }
  }, [])

  // Obtener el valor formateado de un indicador
  const getIndicatorVal = (code: string) => {
    const ind = liveIndicators.find(i => i.codigo === code)
    if (!ind) return '---'
    return Number(ind.valor).toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
  }

  // Consultar el clima real en Punta Arenas mediante la API libre Open-Meteo
  useEffect(() => {
    async function fetchWeather() {
      try {
        const response = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=-53.15&longitude=-70.91&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code'
        )
        if (!response.ok) throw new Error('API Error')
        const data = await response.json()
        
        const current = data.current
        const code = current.weather_code
        
        let desc = 'Nublado'
        if (code === 0) desc = 'Cielo Despejado'
        else if (code >= 1 && code <= 3) desc = 'Parcialmente Nublado'
        else if (code >= 45 && code <= 48) desc = 'Niebla Helada'
        else if (code >= 51 && code <= 55) desc = 'Llovizna Austral'
        else if (code >= 61 && code <= 65) desc = 'Lluvia en Punta Arenas'
        else if (code >= 71 && code <= 77) desc = 'Nevadas en la Región'
        else if (code >= 80 && code <= 82) desc = 'Chubascos Intensos'
        else if (code >= 95) desc = 'Tormenta Austral'

        setWeather({
          temp: current.temperature_2m,
          humidity: current.relative_humidity_2m,
          windSpeed: Math.round(current.wind_speed_10m),
          code: code,
          description: desc,
          loading: false
        })
      } catch (err) {
        console.error('⚠️ Error al consultar el clima real de Punta Arenas:', err)
        setWeather(prev => ({ ...prev, loading: false }))
      }
    }

    fetchWeather()
  }, [])

  // Seleccionar icono de clima apropiado
  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="h-10 w-10 text-amber-500 animate-pulse" />
    if (code >= 1 && code <= 3) return <Cloud className="h-10 w-10 text-sky-400" />
    if (code >= 51 && code <= 65) return <CloudRain className="h-10 w-10 text-blue-400 animate-bounce" />
    if (code >= 71 && code <= 77) return <CloudSnow className="h-10 w-10 text-indigo-200 animate-spin" style={{ animationDuration: '10s' }} />
    return <Wind className="h-10 w-10 text-sky-300 animate-pulse" />
  }

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
      
      {/* 💳 WIDGET 1: CLIMA AUSTRAL (Glassmorphism Premium) */}
      <div className="col-span-1 sm:col-span-2 group relative p-8 rounded-[2.5rem] bg-white/40 border border-white/20 backdrop-blur-xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] hover:border-primary/20 hover:shadow-[0_30px_70px_-25px_rgba(0,0,0,0.1)] transition-all duration-500 overflow-hidden flex flex-col justify-between min-h-[220px]">
        {/* Iluminación trasera de acento */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-400/10 rounded-full blur-2xl group-hover:bg-sky-400/20 transition-all duration-500" />
        
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-sky-500 animate-spin" style={{ animationDuration: '8s' }} />
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">Tiempo Austral en Vivo</span>
            </div>
            {weather.loading ? (
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            ) : (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5 text-[8px] font-bold text-emerald-600 tracking-wider">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                TIEMPO REAL
              </div>
            )}
          </div>
          
          <div className="flex items-end justify-between mt-6">
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black italic tracking-tighter text-foreground">
                  {weather.temp.toFixed(1)}
                </span>
                <span className="text-2xl font-black text-sky-500">°C</span>
              </div>
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 italic">
                {weather.description}
              </p>
            </div>
            <div>
              {getWeatherIcon(weather.code)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-zinc-200/50 pt-4 mt-6">
          <div className="flex items-center gap-2.5">
            <Wind className="h-4 w-4 text-sky-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-wider">Viento en PUQ</span>
              <span className="text-xs font-black text-foreground italic">{weather.windSpeed} km/h</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Compass className="h-4 w-4 text-indigo-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-wider">Humedad Austral</span>
              <span className="text-xs font-black text-foreground italic">{weather.humidity}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 💳 WIDGET 2: INDICADORES ECONÓMICOS CLAVE (Con Supabase Realtime) */}
      <div className="group relative p-6 rounded-[2rem] bg-white/40 border border-white/20 backdrop-blur-xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] hover:border-primary/20 transition-all duration-500 flex flex-col justify-between min-h-[190px]">
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all duration-500" />
        
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Indicadores</span>
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="text-primary hover:bg-primary/10 rounded-full p-1.5 transition-all disabled:opacity-50 shrink-0"
              title="Actualizar datos en vivo"
            >
              <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : 'opacity-65 hover:opacity-100'}`} />
            </button>
          </div>
          
          <div className="mt-4 space-y-3.5">
            <div className={`flex items-center justify-between transition-all duration-500 rounded px-1 -mx-1 ${
              updatedCodes['uf'] ? 'bg-emerald-500/10 text-emerald-600 font-bold scale-[1.03]' : ''
            }`}>
              <span className="text-xs font-black text-muted-foreground/80 italic">UF</span>
              <span className={`text-xs font-black tabular-nums transition-colors duration-500 ${
                updatedCodes['uf'] ? 'text-emerald-500' : 'text-foreground'
              }`}>${getIndicatorVal('uf')}</span>
            </div>
            
            <div className={`flex items-center justify-between transition-all duration-500 rounded px-1 -mx-1 ${
              updatedCodes['dolar'] ? 'bg-emerald-500/10 text-emerald-600 font-bold scale-[1.03]' : ''
            }`}>
              <span className="text-xs font-black text-muted-foreground/80 italic">DÓLAR</span>
              <span className={`text-xs font-black tabular-nums transition-colors duration-500 ${
                updatedCodes['dolar'] ? 'text-emerald-500' : 'text-foreground'
              }`}>${getIndicatorVal('dolar')}</span>
            </div>
            
            <div className={`flex items-center justify-between transition-all duration-500 rounded px-1 -mx-1 ${
              updatedCodes['utm'] ? 'bg-emerald-500/10 text-emerald-600 font-bold scale-[1.03]' : ''
            }`}>
              <span className="text-xs font-black text-muted-foreground/80 italic">UTM</span>
              <span className={`text-xs font-black tabular-nums transition-colors duration-500 ${
                updatedCodes['utm'] ? 'text-emerald-500' : 'text-foreground'
              }`}>${getIndicatorVal('utm')}</span>
            </div>
          </div>
        </div>

        <div className="text-[7.5px] font-black text-muted-foreground/40 uppercase tracking-widest text-right mt-4">
          Conexión en Vivo
        </div>
      </div>

      {/* 💳 WIDGET 3: PORTAL DIGITAL EXPRESS (Última Noticia Dinámica con Imagen de Fondo) */}
      <Link 
        href={latestNews ? `/noticias/${latestNews.slug}` : '#diario'}
        className={`group relative p-6 rounded-[2rem] border transition-all duration-500 flex flex-col justify-between min-h-[190px] overflow-hidden cursor-pointer ${
          latestNews && latestNews.image_url 
            ? 'border-zinc-800 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] hover:border-primary/40' 
            : 'bg-white/40 border-white/20 backdrop-blur-xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] hover:border-primary/20'
        }`}
      >
        {latestNews && latestNews.image_url ? (
          <>
            {/* Imagen de fondo premium de la noticia */}
            <div className="absolute inset-0 z-0">
              <Image 
                src={latestNews.image_url} 
                alt={latestNews.title} 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/40" />
            </div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/70">
                  {latestNews.category}
                </span>
                <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[8px] font-black text-emerald-400 uppercase tracking-wider">
                  <Activity className="h-2 w-2" /> Último Minuto
                </div>
                <h4 className="text-xs font-black italic uppercase leading-snug text-white tracking-tight line-clamp-3 group-hover:text-primary transition-colors">
                  {latestNews.title}
                </h4>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-3 mt-4">
              <span className="text-[8px] font-black text-white/50 uppercase tracking-wider">
                {latestNews.source_name || 'Diario Punta Arenas'}
              </span>
              <ArrowUpRight className="h-4 w-4 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </>
        ) : (
          <>
            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all duration-500" />

            <div>
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                  Diario Regional
                </span>
                <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[8px] font-black text-emerald-600 uppercase tracking-wider">
                  <Activity className="h-2 w-2" /> Al Instante
                </div>
                <h4 className="text-xs font-black italic uppercase leading-snug text-foreground tracking-tight line-clamp-3 group-hover:text-primary transition-colors">
                  Información fidedigna, inmutable y verificada criptográficamente en Magallanes.
                </h4>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-200/50 pt-3 mt-4">
              <span className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-wider">
                ContaPyme PUQ
              </span>
              <ArrowUpRight className="h-4 w-4 text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </>
        )}
      </Link>

    </div>
  )
}
