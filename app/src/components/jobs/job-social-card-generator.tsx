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
  const [theme, setTheme] = useState<ThemeMode>('white') // Blanco por defecto
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

  // 2. Templates de texto para WhatsApp / Instagram / LinkedIn
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

  // Generar Blob de la imagen con html2canvas en 2x Retina
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

  // Publicar en Instagram
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
        <DialogContent className="w-full max-w-[94vw] sm:max-w-xl md:max-w-2xl rounded-3xl sm:rounded-[2rem] bg-white p-4 sm:p-7 space-y-4 sm:space-y-5 border border-zinc-200 shadow-2xl max-h-[90vh] overflow-y-auto box-border">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>Kit de Publicidad & Anuncios de Empleo</span>
            </div>
            <DialogTitle className="text-lg sm:text-2xl font-black uppercase tracking-tight italic text-foreground leading-tight">
              Generador de Anuncios Profesionales
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Personaliza el fondo (Blanco o Nocturno) y genera imágenes publicitarias de alto impacto para redes.
            </DialogDescription>
          </DialogHeader>

          {/* Selectores de Configuración: Fondo (Blanco / Nocturno) y Formato (1:1 / 9:16) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 rounded-2xl bg-zinc-100 border border-zinc-200 box-border">
            {/* Selector de Tema */}
            <div className="flex items-center justify-between p-1.5 rounded-xl bg-white shadow-xs min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1 shrink-0">
                Fondo:
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTheme('white')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                    theme === 'white'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Sun className="h-3 w-3 shrink-0" /> Blanco
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-slate-900 text-white shadow'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Moon className="h-3 w-3 shrink-0" /> Noche
                </button>
              </div>
            </div>

            {/* Selector de Formato */}
            <div className="flex items-center justify-between p-1.5 rounded-xl bg-white shadow-xs min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1 shrink-0">
                Formato:
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAspectRatio('square')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    aspectRatio === 'square'
                      ? 'bg-zinc-900 text-white shadow'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Post (1:1)
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('story')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    aspectRatio === 'story'
                      ? 'bg-zinc-900 text-white shadow'
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
            className={`p-4 sm:p-7 rounded-2xl sm:rounded-[2rem] shadow-xl space-y-3.5 sm:space-y-4 relative overflow-hidden flex flex-col justify-between box-border transition-all duration-300 w-full max-w-full ${
              theme === 'white'
                ? 'bg-white text-slate-950 border-2 sm:border-4 border-slate-200'
                : 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white border border-slate-800'
            } ${aspectRatio === 'story' ? 'min-h-[500px] sm:min-h-[560px]' : 'min-h-[380px] sm:min-h-[440px]'}`}
          >
            {/* Destellos de iluminación de fondo */}
            {theme === 'white' ? (
              <>
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              </>
            ) : (
              <>
                <div className="absolute top-0 right-0 w-44 h-44 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-44 h-44 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
              </>
            )}

            {/* CINTILLO PUBLICITARIO SUPERIOR CONTENIDO (Sin márgenes negativos para evitar desbordes) */}
            <div className={`p-2 sm:p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider relative z-10 ${
              theme === 'white'
                ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-xs'
                : 'bg-slate-800 text-slate-200 border border-slate-700'
            }`}>
              <span className="flex items-center gap-1 truncate">
                <Sparkles className="h-3 w-3 text-amber-300 shrink-0 animate-pulse" />
                <span className="truncate">¡OFERTA LABORAL EN MAGALLANES!</span>
              </span>
              <span className="font-mono text-white/90 shrink-0">📍 {job.location}</span>
            </div>

            {/* Header del Anuncio con Logotipo */}
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/90 pb-2.5 pt-0.5 relative z-10 gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <Image src="/logo-contapyme.png" alt="ContaPyme" width={110} height={30} className={`h-auto w-24 sm:w-28 shrink-0 ${theme === 'dark' ? 'brightness-125' : ''}`} />
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                  ContaEmpleos
                </span>
              </div>
              <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md shrink-0 ${
                theme === 'white' ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-slate-800 text-slate-300'
              }`}>
                {job.sector}
              </span>
            </div>

            {/* Cuerpo Central del Anuncio (Título Ultra Llamativo) */}
            <div className="space-y-2.5 relative z-10 my-auto min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1 truncate">
                  <Building2 className="h-3.5 w-3.5 shrink-0" /> {job.company_name}
                </span>
                {job.is_verified && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
                    <BadgeCheck className="h-3 w-3" /> Verificada
                  </span>
                )}
              </div>

              {/* TÍTULO ULTRA LLAMATIVO */}
              <h3 className={`text-xl sm:text-3xl lg:text-4xl font-black italic uppercase tracking-tight leading-tight break-words hyphens-auto ${
                theme === 'white'
                  ? 'text-slate-950 drop-shadow-xs'
                  : 'text-white'
              }`}>
                {job.title}
              </h3>

              {/* Cápsula de Sueldo y Turno */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {job.salary_raw && (
                  <div className="flex items-center gap-1 text-xs sm:text-sm font-black text-white bg-emerald-600 px-3.5 py-1 rounded-xl shadow-xs">
                    <DollarSign className="h-3.5 w-3.5 shrink-0" />
                    <span>{job.salary_raw}</span>
                  </div>
                )}
                {job.work_shift && (
                  <div className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl uppercase tracking-wider ${
                    theme === 'white'
                      ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                      : 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/40'
                  }`}>
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>{job.work_shift}</span>
                  </div>
                )}
              </div>

              {/* Requisitos clave con Viñetas */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="pt-1.5 space-y-1">
                  <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider block ${
                    theme === 'white' ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    Requisitos principales:
                  </span>
                  <div className="space-y-1">
                    {job.requirements.slice(0, aspectRatio === 'story' ? 3 : 2).map((req, idx) => (
                      <div key={idx} className={`flex items-start gap-1.5 text-[11px] sm:text-xs font-bold leading-snug ${
                        theme === 'white' ? 'text-slate-700' : 'text-slate-300'
                      }`}>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="break-words line-clamp-2">{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bloque de Postulación Inmediata y Código QR */}
            <div className={`p-3 sm:p-3.5 rounded-2xl flex items-center justify-between gap-3 relative z-10 box-border min-w-0 ${
              theme === 'white'
                ? 'bg-slate-50 border border-slate-200'
                : 'bg-slate-800/80 border border-slate-700/80'
            }`}>
              <div className="space-y-0.5 min-w-0 flex-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  Canal de Postulación Directa
                </span>
                <p className={`text-[11px] sm:text-xs truncate font-mono font-bold ${
                  theme === 'white' ? 'text-slate-900' : 'text-slate-200'
                }`}>
                  {job.contact_email ? `✉️ ${job.contact_email}` : (job.contact_whatsapp ? `📲 WhatsApp: ${job.contact_whatsapp}` : '🌐 contapymepuq.cl/empleos')}
                </p>
                <p className={`text-[8px] sm:text-[9px] ${theme === 'white' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Escanea el código QR o ingresa al enlace oficial.
                </p>
              </div>
              <img
                src={qrCodeUrl}
                alt="QR Postulación"
                className={`h-14 w-14 sm:h-16 sm:w-16 rounded-lg p-0.5 shrink-0 shadow-xs ${
                  theme === 'white' ? 'bg-white border border-slate-200' : 'bg-white'
                }`}
                crossOrigin="anonymous"
              />
            </div>

            {/* Footer del Anuncio */}
            <div className={`pt-2.5 border-t flex flex-wrap items-center justify-between gap-1 text-[8px] sm:text-[9px] font-bold uppercase relative z-10 ${
              theme === 'white' ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
            }`}>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShieldCheck className="h-3 w-3 shrink-0" /> Art. 2° Código del Trabajo
              </span>
              <span className="font-mono truncate">contapymepuq.cl/empleos</span>
            </div>
          </div>

          {/* ===== BOTONES DE ACCIÓN DIRECTA ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 box-border">
            <Button
              onClick={handleShareInstagram}
              disabled={isGenerating}
              className="w-full rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 text-white font-black text-xs uppercase tracking-widest gap-2 h-12 shadow-md active:scale-95 cursor-pointer"
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
              className="w-full rounded-2xl font-black text-xs uppercase tracking-widest gap-2 h-12 border-zinc-300 hover:bg-zinc-100 active:scale-95 cursor-pointer"
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
          <Tabs defaultValue="json" className="w-full space-y-3 pt-1 box-border">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-zinc-100 p-1 rounded-2xl box-border">
              <TabsTrigger value="json" className="rounded-xl text-[10px] font-black uppercase tracking-wider gap-1 data-[state=active]:bg-white data-[state=active]:shadow-xs py-2">
                <Code2 className="h-3 w-3 text-primary shrink-0" /> JSON Anuncio
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="rounded-xl text-[10px] font-black uppercase tracking-wider gap-1 data-[state=active]:bg-white data-[state=active]:shadow-xs py-2">
                <Send className="h-3 w-3 text-emerald-600 shrink-0" /> WhatsApp
              </TabsTrigger>
              <TabsTrigger value="instagram" className="rounded-xl text-[10px] font-black uppercase tracking-wider gap-1 data-[state=active]:bg-white data-[state=active]:shadow-xs py-2">
                <Instagram className="h-3 w-3 text-rose-600 shrink-0" /> Instagram
              </TabsTrigger>
              <TabsTrigger value="linkedin" className="rounded-xl text-[10px] font-black uppercase tracking-wider gap-1 data-[state=active]:bg-white data-[state=active]:shadow-xs py-2">
                <Linkedin className="h-3 w-3 text-sky-600 shrink-0" /> LinkedIn
              </TabsTrigger>
            </TabsList>

            {/* Tab JSON Estructurado */}
            <TabsContent value="json" className="space-y-2">
              <div className="p-3 rounded-2xl bg-zinc-900 text-zinc-200 border border-zinc-800 text-[10px] sm:text-[11px] font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto box-border">
                {JSON.stringify(jobAdPromptSpec, null, 2)}
              </div>
              <Button
                onClick={() => handleCopy(JSON.stringify(jobAdPromptSpec, null, 2), 'json')}
                className="w-full rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-widest gap-2 h-10"
              >
                {copiedType === 'json' ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" /> ¡JSON Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 shrink-0" /> Copiar JSON para Nano Banana / IA
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Tab WhatsApp */}
            <TabsContent value="whatsapp" className="space-y-2">
              <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs font-mono whitespace-pre-line text-zinc-700 leading-relaxed max-h-32 overflow-y-auto box-border">
                {whatsappCopy}
              </div>
              <Button
                onClick={() => handleCopy(whatsappCopy, 'whatsapp')}
                className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest gap-2 h-10"
              >
                {copiedType === 'whatsapp' ? (
                  <>
                    <Check className="h-4 w-4 shrink-0" /> ¡Texto Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 shrink-0" /> Copiar para WhatsApp
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Tab Instagram */}
            <TabsContent value="instagram" className="space-y-2">
              <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs font-mono whitespace-pre-line text-zinc-700 leading-relaxed max-h-32 overflow-y-auto box-border">
                {instagramCopy}
              </div>
              <Button
                onClick={() => handleCopy(instagramCopy, 'instagram')}
                className="w-full rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-xs uppercase tracking-widest gap-2 h-10"
              >
                {copiedType === 'instagram' ? (
                  <>
                    <Check className="h-4 w-4 shrink-0" /> ¡Texto Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 shrink-0" /> Copiar para Instagram
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Tab LinkedIn */}
            <TabsContent value="linkedin" className="space-y-2">
              <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs font-mono whitespace-pre-line text-zinc-700 leading-relaxed max-h-32 overflow-y-auto box-border">
                {linkedinCopy}
              </div>
              <Button
                onClick={() => handleCopy(linkedinCopy, 'linkedin')}
                className="w-full rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-black text-xs uppercase tracking-widest gap-2 h-10"
              >
                {copiedType === 'linkedin' ? (
                  <>
                    <Check className="h-4 w-4 shrink-0" /> ¡Texto Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 shrink-0" /> Copiar para LinkedIn
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
