'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import html2canvas from 'html2canvas-pro'
import { 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  Building2, 
  DollarSign, 
  Clock, 
  BadgeCheck, 
  ShieldCheck, 
  Send, 
  Instagram, 
  Linkedin, 
  Download, 
  Code2, 
  Loader2,
  CheckCircle2,
  Sun,
  Moon
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { JobPosting } from '@/actions/jobs'

interface JobSocialCardGeneratorProps {
  job: JobPosting
}

type AspectRatio = 'square' | 'story'
type ThemeMode = 'white' | 'dark'

export function JobSocialCardGenerator({ job }: JobSocialCardGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedType, setCopiedType] = useState<string | null>(null)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('square')
  const [theme, setTheme] = useState<ThemeMode>('white')
  const [isGenerating, setIsGenerating] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const shareUrl = `https://contapymepuq.cl/empleos/${job.slug}`

  // QR Code URL
  const qrBgColor = theme === 'white' ? 'FFFFFF' : '0F172A'
  const qrColor = theme === 'white' ? '004080' : '38BDF8'
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareUrl)}&bgcolor=${qrBgColor}&color=${qrColor}&margin=0`

  // 1. JSON Estructurado Profesional de Anuncio
  const jobAdPromptSpec = {
    tarea: "generacion_oferta_empleo_publicitaria",
    herramienta: "ContaBanner AI Pro / Nano Banana Pro",
    parametros_tecnicos: {
      dimensiones: aspectRatio === 'story' ? "1080x1920" : "1080x1080",
      relacion_aspecto: aspectRatio === 'story' ? "9:16" : "1:1",
      formato_salida: "PNG",
      estilo_fondo: theme === 'white' ? "Fondo Blanco Puro Corporativo (#FFFFFF)" : "Fondo Nocturno Patagónico (#0F172A)",
      calidad: "2x Retina High DPI"
    },
    marca_principal: {
      nombre: "ContaPymePUQ / ContaEmpleos Magallanes",
      region: "Magallanes y de la Antártica Chilena",
      paleta_de_colores_hex: {
        fondo_principal: theme === 'white' ? "#FFFFFF" : "#0F172A",
        azul_corporativo: "#004080",
        azul_electrico: "#2563EB",
        verde_esmeralda_sueldo: "#059669",
        rojo_acento_urgente: "#E10600",
        texto_principal: theme === 'white' ? "#0F172A" : "#FFFFFF"
      }
    },
    elementos_graficos: {
      logo_contapymepuq: {
        url_recurso: "https://contapymepuq.cl/logo-contapyme.png",
        instruccion_modelo: "Colocar el logotipo oficial ContaPymePUQ en la esquina superior izquierda, perfectamente nítido y proporcionado."
      },
      badge_contaempleos: {
        texto: "ContaEmpleos Magallanes",
        ubicacion: "Esquina superior derecha alineada horizontalmente, con pastilla de alta visibilidad indicando '📍 Punta Arenas / Magallanes'."
      },
      codigo_qr_dinamico: {
        url_qr: qrCodeUrl,
        instruccion_modelo: "Incrustar código QR oficial en la esquina inferior derecha con borde nítido para escaneo directo."
      },
      sello_legal: {
        texto: "Aviso Auditado Art. 2° Código del Trabajo",
        ubicacion: "Pie del banner en tipografía verde #059669."
      }
    },
    contenido_texto: {
      cintillo_superior: "🔥 ¡SE BUSCA / OFERTA LABORAL EN MAGALLANES!",
      empresa_contratante: job.company_name,
      titulo_cargo: job.title,
      sueldo_destacado: job.salary_raw || "Remuneración acorde al mercado",
      jornada_turno: job.work_shift || "Jornada Completa",
      requisitos_principales: (job.requirements && job.requirements.length > 0)
        ? job.requirements.slice(0, 3)
        : ["Experiencia comprobable en el área", "Residencia en la Región de Magallanes", "Disponibilidad inmediata"],
      contacto: {
        whatsapp: job.contact_whatsapp ? `📲 WhatsApp: ${job.contact_whatsapp}` : null,
        email: job.contact_email ? `✉️ Enviar CV a: ${job.contact_email}` : null,
        enlace_oficial: shareUrl
      }
    },
    estilo_y_composicion: {
      estilo_visual: theme === 'white' 
        ? "Diseño publicitario sobre fondo blanco brillante (#FFFFFF). Título del cargo en tipografía extra bold de gran tamaño en azul marino profundo (#0F172A) con máximo impacto visual. Bloque de remuneración en Verde Esmeralda (#059669). Viñetas de requisitos legibles con checkmarks."
        : "Diseño publicitario nocturno sobre fondo azul noche (#0F172A) con destellos luminosos en cyan y azul eléctrico.",
      layout: "Composición equilibrada tipo anuncio publicitario de prensa / redes. Logotipos en la cabecera, llamado a la acción destacado, título impactante, badges de sueldo y bloque de contacto directo con código QR."
    },
    prompt_ejecucion_ia: `Genera un anuncio publicitario de empleo llamativo en tamaño ${aspectRatio === 'story' ? '1080x1920' : '1080x1080'} sobre ${theme === 'white' ? 'fondo blanco puro (#FFFFFF)' : 'fondo azul marino (#0F172A)'}. Integra el logo de ContaPymePUQ en la esquina superior izquierda. Renderiza el título del cargo '${job.title}' con tipografía extra bold gigante de alto impacto, la empresa '${job.company_name}', el sueldo '${job.salary_raw || 'Acorde al mercado'}' en cápsula verde esmeralda destacada, 3 viñetas de requisitos y código QR de postulación directa.`
  }

  // 2. Templates de texto para Redes
  const whatsappCopy = `💼 *NUEVA OFERTA LABORAL EN MAGALLANES*
📍 *Ubicación:* ${job.location}
🏢 *Empresa:* ${job.company_name} ${job.is_verified ? '✅' : ''}
📌 *Cargo:* ${job.title}
💰 *Sueldo:* ${job.salary_raw || 'A convenir'}
⏱️ *Jornada / Turno:* ${job.work_shift || 'Completa'}

${job.requirements && job.requirements.length > 0 ? `📋 *Requisitos:*\n${job.requirements.slice(0, 3).map(r => `• ${r}`).join('\n')}\n` : ''}
📲 *Revisa el detalle y postula directo aquí:*
🔗 ${shareUrl}

🛡️ _Bolsa de Empleos ContaEmpleos PUQ | Art. 2° Código del Trabajo._`

  const instagramCopy = `🏔️ ¡Nueva vacante disponible en ${job.location}! 🚀

📌 Cargo: ${job.title}
🏢 Empresa: ${job.company_name}
💰 Sueldo: ${job.salary_raw || 'A convenir'}
⏱️ Turno: ${job.work_shift || 'Jornada completa'}

👉 Entra a contapymepuq.cl/empleos/${job.slug} para postular directo por WhatsApp.

#EmpleosMagallanes #PuntaArenas #PuertoNatales #Porvenir #TorresDelPaine #TrabajoMagallanes #ContaEmpleosPUQ #PymesMagallanes`

  const linkedinCopy = `📢 Oportunidad Laboral en la Región de Magallanes y de la Antártica Chilena:

${job.company_name} se encuentra en búsqueda de ${job.title} para sus operaciones en ${job.location}.

🔹 Modalidad / Turno: ${job.work_shift || 'Jornada Completa'}
🔹 Remuneración aproximada: ${job.salary_raw || 'Acorde al mercado'}
🔹 Postulación transparente y directa sin intermediarios.

Revisa los requisitos completos y postula en el ecosistema laboral regional:
🔗 ${shareUrl}

#EmpleoMagallanes #ContapymePUQ #PuntaArenas #PuertoNatales #ZonaAustral #TrabajoChile`

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedType(type)
      setTimeout(() => setCopiedType(null), 3000)
    } catch (err) {
      console.error('Error al copiar:', err)
    }
  }

  // Generar Blob con html2canvas
  const generateImageBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: theme === 'white' ? '#FFFFFF' : '#0F172A',
        logging: false,
      })
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95)
      })
    } catch (error) {
      console.error('Error al renderizar canvas:', error)
      return null
    }
  }

  // Descargar imagen HD
  const handleDownloadImage = async () => {
    setIsGenerating(true)
    try {
      const blob = await generateImageBlob()
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `anuncio-contaempleos-${job.slug}-${theme}-${aspectRatio === 'story' ? 'historia-9x16' : 'post-1x1'}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setIsGenerating(false)
    }
  }

  // Publicar en Instagram / Web Share API
  const handleShareInstagram = async () => {
    setIsGenerating(true)
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(instagramCopy)
      }

      const blob = await generateImageBlob()
      if (!blob) return

      const fileName = `anuncio-${job.slug}-${theme}-${aspectRatio === 'story' ? 'historia' : 'post'}.png`
      const file = new File([blob], fileName, { type: 'image/png' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${job.title} - ${job.company_name}`,
          text: instagramCopy,
          url: shareUrl,
        })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        window.open('https://www.instagram.com/', '_blank')
      }
    } catch (error) {
      console.log('Cancelado o no soportado:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="rounded-2xl text-xs font-black uppercase tracking-wider border-zinc-200 hover:border-primary/40 hover:bg-primary/5 gap-2 h-11 px-4 sm:px-5"
      >
        <Share2 className="h-4 w-4 text-primary shrink-0" />
        <span className="truncate">Generar Anuncio Social</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-2xl rounded-3xl bg-white p-3.5 sm:p-6 space-y-3.5 sm:space-y-4 border border-zinc-200 shadow-2xl max-h-[92vh] overflow-x-hidden overflow-y-auto box-border min-w-0">
          {/* Header con margen derecho para no chocar con botón Cerrar */}
          <DialogHeader className="space-y-1 text-left pr-8 min-w-0">
            <div className="flex items-center gap-1.5 text-primary text-[11px] sm:text-xs font-black uppercase tracking-wider min-w-0">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Kit de Publicidad & Anuncios de Empleo</span>
            </div>
            <DialogTitle className="text-base sm:text-xl font-black uppercase tracking-tight italic text-foreground leading-snug break-words">
              Generador de Anuncios Profesionales
            </DialogTitle>
            <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground leading-normal">
              Personaliza el fondo y genera imágenes publicitarias para redes sociales.
            </DialogDescription>
          </DialogHeader>

          {/* Selectores de Configuración: Formato en 2 Columnas Compactas (100% anti-overflow) */}
          <div className="grid grid-cols-2 gap-2 p-1.5 sm:p-2 rounded-2xl bg-zinc-100 border border-zinc-200 w-full min-w-0 box-border">
            {/* Selector de Tema */}
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground px-1">
                Fondo:
              </span>
              <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-xl shadow-xs min-w-0">
                <button
                  type="button"
                  onClick={() => setTheme('white')}
                  className={`py-1 px-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 min-w-0 cursor-pointer ${
                    theme === 'white'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Sun className="h-3 w-3 shrink-0" />
                  <span className="truncate">Blanco</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`py-1 px-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 min-w-0 cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Moon className="h-3 w-3 shrink-0" />
                  <span className="truncate">Noche</span>
                </button>
              </div>
            </div>

            {/* Selector de Formato */}
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground px-1">
                Formato:
              </span>
              <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-xl shadow-xs min-w-0">
                <button
                  type="button"
                  onClick={() => setAspectRatio('square')}
                  className={`py-1 px-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all text-center min-w-0 truncate cursor-pointer ${
                    aspectRatio === 'square'
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Post (1:1)
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('story')}
                  className={`py-1 px-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all text-center min-w-0 truncate cursor-pointer ${
                    aspectRatio === 'story'
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Historia (9:16)
                </button>
              </div>
            </div>
          </div>

          {/* ===== ANUNCIO PUBLICITARIO VISUAL BRANDED (Renderizable vía Canvas) ===== */}
          <div
            ref={cardRef}
            className={`p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-lg space-y-3 relative overflow-hidden flex flex-col justify-between box-border transition-all duration-300 w-full min-w-0 max-w-full ${
              theme === 'white'
                ? 'bg-white text-slate-950 border-2 sm:border-3 border-slate-200'
                : 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white border border-slate-800'
            } ${aspectRatio === 'story' ? 'min-h-[460px] sm:min-h-[540px]' : 'min-h-[350px] sm:min-h-[400px]'}`}
          >
            {/* Destellos de iluminación de fondo */}
            {theme === 'white' ? (
              <>
                <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              </>
            ) : (
              <>
                <div className="absolute top-0 right-0 w-36 h-36 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
              </>
            )}

            {/* CINTILLO PUBLICITARIO SUPERIOR (Responsivo sin márgenes negativos) */}
            <div className={`p-1.5 sm:p-2 rounded-xl flex items-center justify-between gap-1 text-[8px] sm:text-[10px] font-black uppercase tracking-wider relative z-10 w-full min-w-0 box-border ${
              theme === 'white'
                ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-xs'
                : 'bg-slate-800 text-slate-200 border border-slate-700'
            }`}>
              <div className="flex items-center gap-1 min-w-0 flex-1 truncate">
                <Sparkles className="h-3 w-3 text-amber-300 shrink-0" />
                <span className="truncate">¡OFERTA LABORAL MAGALLANES!</span>
              </div>
              <span className="font-mono text-white/90 shrink-0 text-[8px] sm:text-[9px]">📍 {job.location}</span>
            </div>

            {/* Header del Anuncio con Logotipo */}
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/90 pb-2 pt-0.5 relative z-10 gap-2 w-full min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <Image src="/logo-contapyme.png" alt="ContaPyme" width={100} height={28} className={`h-auto w-20 sm:w-24 shrink-0 ${theme === 'dark' ? 'brightness-125' : ''}`} />
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                  ContaEmpleos
                </span>
              </div>
              <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 truncate max-w-[110px] sm:max-w-[160px] ${
                theme === 'white' ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-slate-800 text-slate-300'
              }`}>
                {job.sector}
              </span>
            </div>

            {/* Cuerpo Central del Anuncio (Título Ultra Llamativo) */}
            <div className="space-y-2 relative z-10 my-auto w-full min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className="text-[11px] sm:text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1 truncate max-w-full">
                  <Building2 className="h-3 w-3 shrink-0" /> <span className="truncate">{job.company_name}</span>
                </span>
                {job.is_verified && (
                  <span className="inline-flex items-center gap-0.5 text-[8px] sm:text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded shrink-0">
                    <BadgeCheck className="h-2.5 w-2.5" /> Verificada
                  </span>
                )}
              </div>

              {/* TÍTULO ULTRA LLAMATIVO RESPONSIVO */}
              <h3 className={`text-lg sm:text-2xl font-black italic uppercase tracking-tight leading-snug break-words hyphens-auto w-full min-w-0 ${
                theme === 'white'
                  ? 'text-slate-950'
                  : 'text-white'
              }`}>
                {job.title}
              </h3>

              {/* Cápsula de Sueldo y Turno */}
              <div className="flex flex-wrap gap-1.5 pt-0.5 w-full min-w-0">
                {job.salary_raw && (
                  <div className="flex items-center gap-1 text-[11px] sm:text-xs font-black text-white bg-emerald-600 px-3 py-1 rounded-xl shadow-xs shrink-0">
                    <DollarSign className="h-3 w-3 shrink-0" />
                    <span>{job.salary_raw}</span>
                  </div>
                )}
                {job.work_shift && (
                  <div className={`flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-1 rounded-xl uppercase tracking-wider shrink-0 ${
                    theme === 'white'
                      ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                      : 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/40'
                  }`}>
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>{job.work_shift}</span>
                  </div>
                )}
              </div>

              {/* Requisitos principales */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="pt-1 space-y-1 w-full min-w-0">
                  <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider block ${
                    theme === 'white' ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    Requisitos principales:
                  </span>
                  <div className="space-y-1 w-full min-w-0">
                    {job.requirements.slice(0, aspectRatio === 'story' ? 3 : 2).map((req, idx) => (
                      <div key={idx} className={`flex items-start gap-1.5 text-[10px] sm:text-xs font-bold leading-snug w-full min-w-0 ${
                        theme === 'white' ? 'text-slate-700' : 'text-slate-300'
                      }`}>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="break-words line-clamp-2 min-w-0 flex-1">{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bloque de Postulación Inmediata y Código QR */}
            <div className={`p-2.5 sm:p-3 rounded-xl flex items-center justify-between gap-2 relative z-10 w-full min-w-0 box-border ${
              theme === 'white'
                ? 'bg-slate-50 border border-slate-200'
                : 'bg-slate-800/80 border border-slate-700/80'
            }`}>
              <div className="space-y-0.5 min-w-0 flex-1">
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  Postulación Directa
                </span>
                <p className={`text-[10px] sm:text-xs truncate font-mono font-bold ${
                  theme === 'white' ? 'text-slate-900' : 'text-slate-200'
                }`}>
                  {job.contact_email ? `✉️ ${job.contact_email}` : (job.contact_whatsapp ? `📲 WhatsApp: ${job.contact_whatsapp}` : '🌐 contapymepuq.cl/empleos')}
                </p>
                <p className={`text-[8px] ${theme === 'white' ? 'text-slate-500' : 'text-slate-400'} truncate`}>
                  Escanea el código QR o entra al enlace oficial.
                </p>
              </div>
              <img
                src={qrCodeUrl}
                alt="QR Postulación"
                className={`h-12 w-12 sm:h-14 sm:w-14 rounded-lg p-0.5 shrink-0 shadow-xs ${
                  theme === 'white' ? 'bg-white border border-slate-200' : 'bg-white'
                }`}
                crossOrigin="anonymous"
              />
            </div>

            {/* Footer del Anuncio */}
            <div className={`pt-2 border-t flex items-center justify-between gap-1 text-[8px] sm:text-[9px] font-bold uppercase relative z-10 w-full min-w-0 ${
              theme === 'white' ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
            }`}>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShieldCheck className="h-3 w-3 shrink-0" /> Art. 2° Código del Trabajo
              </span>
              <span className="font-mono truncate">contapymepuq.cl/empleos</span>
            </div>
          </div>

          {/* ===== BOTONES DE ACCIÓN DIRECTA ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5 w-full min-w-0 box-border">
            <Button
              onClick={handleShareInstagram}
              disabled={isGenerating}
              className="w-full rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 text-white font-black text-xs uppercase tracking-wider gap-2 h-11 shadow-xs active:scale-95 cursor-pointer"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              ) : (
                <Instagram className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">Publicar en Instagram</span>
            </Button>

            <Button
              onClick={handleDownloadImage}
              disabled={isGenerating}
              variant="outline"
              className="w-full rounded-2xl font-black text-xs uppercase tracking-wider gap-2 h-11 border-zinc-300 hover:bg-zinc-100 active:scale-95 cursor-pointer"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              ) : (
                <Download className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">Descargar Imagen HD</span>
            </Button>
          </div>

          {/* ===== PESTAÑAS DE COPIADO: GRID 2x2 EN MÓVIL Y 1x4 EN DESKTOP ===== */}
          <Tabs defaultValue="json" className="w-full space-y-2 pt-1 min-w-0 box-border">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-zinc-100 p-1 rounded-2xl w-full min-w-0 box-border">
              <TabsTrigger value="json" className="rounded-xl text-[10px] font-black uppercase tracking-wider gap-1 data-[state=active]:bg-white data-[state=active]:shadow-xs py-1.5 truncate">
                <Code2 className="h-3 w-3 text-primary shrink-0" /> <span className="truncate">JSON Anuncio</span>
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="rounded-xl text-[10px] font-black uppercase tracking-wider gap-1 data-[state=active]:bg-white data-[state=active]:shadow-xs py-1.5 truncate">
                <Send className="h-3 w-3 text-emerald-600 shrink-0" /> <span className="truncate">WhatsApp</span>
              </TabsTrigger>
              <TabsTrigger value="instagram" className="rounded-xl text-[10px] font-black uppercase tracking-wider gap-1 data-[state=active]:bg-white data-[state=active]:shadow-xs py-1.5 truncate">
                <Instagram className="h-3 w-3 text-rose-600 shrink-0" /> <span className="truncate">Instagram</span>
              </TabsTrigger>
              <TabsTrigger value="linkedin" className="rounded-xl text-[10px] font-black uppercase tracking-wider gap-1 data-[state=active]:bg-white data-[state=active]:shadow-xs py-1.5 truncate">
                <Linkedin className="h-3 w-3 text-sky-600 shrink-0" /> <span className="truncate">LinkedIn</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab JSON Estructurado */}
            <TabsContent value="json" className="space-y-2 min-w-0">
              <div className="p-2.5 rounded-xl bg-zinc-900 text-zinc-200 border border-zinc-800 text-[10px] font-mono whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto w-full min-w-0 box-border">
                {JSON.stringify(jobAdPromptSpec, null, 2)}
              </div>
              <Button
                onClick={() => handleCopy(JSON.stringify(jobAdPromptSpec, null, 2), 'json')}
                className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-wider gap-2 h-9"
              >
                {copiedType === 'json' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> ¡JSON Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 shrink-0" /> Copiar JSON para Nano Banana
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Tab WhatsApp */}
            <TabsContent value="whatsapp" className="space-y-2 min-w-0">
              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono whitespace-pre-line text-zinc-700 leading-relaxed max-h-28 overflow-y-auto w-full min-w-0 box-border">
                {whatsappCopy}
              </div>
              <Button
                onClick={() => handleCopy(whatsappCopy, 'whatsapp')}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider gap-2 h-9"
              >
                {copiedType === 'whatsapp' ? (
                  <>
                    <Check className="h-3.5 w-3.5 shrink-0" /> ¡Texto Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 shrink-0" /> Copiar para WhatsApp
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Tab Instagram */}
            <TabsContent value="instagram" className="space-y-2 min-w-0">
              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono whitespace-pre-line text-zinc-700 leading-relaxed max-h-28 overflow-y-auto w-full min-w-0 box-border">
                {instagramCopy}
              </div>
              <Button
                onClick={() => handleCopy(instagramCopy, 'instagram')}
                className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-xs uppercase tracking-wider gap-2 h-9"
              >
                {copiedType === 'instagram' ? (
                  <>
                    <Check className="h-3.5 w-3.5 shrink-0" /> ¡Texto Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 shrink-0" /> Copiar para Instagram
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Tab LinkedIn */}
            <TabsContent value="linkedin" className="space-y-2 min-w-0">
              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono whitespace-pre-line text-zinc-700 leading-relaxed max-h-28 overflow-y-auto w-full min-w-0 box-border">
                {linkedinCopy}
              </div>
              <Button
                onClick={() => handleCopy(linkedinCopy, 'linkedin')}
                className="w-full rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-black text-xs uppercase tracking-wider gap-2 h-9"
              >
                {copiedType === 'linkedin' ? (
                  <>
                    <Check className="h-3.5 w-3.5 shrink-0" /> ¡Texto Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 shrink-0" /> Copiar para LinkedIn
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
