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
  const [theme, setTheme] = useState<ThemeMode>('white') // Blanco por defecto según solicitud
  const [isGenerating, setIsGenerating] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const shareUrl = `https://contapymepuq.cl/empleos/${job.slug}`

  // QR Code URL en alta definición con colores según el tema
  const qrBgColor = theme === 'white' ? 'FFFFFF' : '0F172A'
  const qrColor = theme === 'white' ? '004080' : '38BDF8'
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareUrl)}&bgcolor=${qrBgColor}&color=${qrColor}&margin=0`

  // 1. JSON Estructurado Profesional de Anuncio para IA / Modelos Gráficos
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
        instruccion_modelo: "Incrustar código QR oficial en la esquina inferior derecha con borde nítido para escaneo directo desde historias o impresos."
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
        className="rounded-2xl text-xs font-black uppercase tracking-wider border-zinc-200 hover:border-primary/40 hover:bg-primary/5 gap-2 h-11 px-5"
      >
        <Share2 className="h-4 w-4 text-primary" />
        <span>Generar Anuncio Social</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-[92vw] sm:max-w-2xl rounded-[2rem] bg-white p-6 sm:p-7 space-y-5 border border-zinc-200 shadow-2xl max-h-[90vh] overflow-y-auto box-border">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest">
              <Sparkles className="h-4 w-4" />
              <span>Kit de Publicidad & Anuncios de Empleo</span>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tight italic">
              Generador de Anuncios Profesionales
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Personaliza el fondo (Blanco o Nocturno) y genera imágenes publicitarias de alto impacto para redes.
            </DialogDescription>
          </DialogHeader>

          {/* Selectores de Configuración: Fondo (Blanco / Nocturno) y Formato (1:1 / 9:16) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 rounded-2xl bg-zinc-100 border border-zinc-200">
            {/* Selector de Tema */}
            <div className="flex items-center justify-between p-1.5 rounded-xl bg-white/70">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-2">
                Fondo:
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTheme('white')}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                    theme === 'white'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Sun className="h-3 w-3" /> Blanco
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-slate-900 text-white shadow'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Moon className="h-3 w-3" /> Noche
                </button>
              </div>
            </div>

            {/* Selector de Formato */}
            <div className="flex items-center justify-between p-1.5 rounded-xl bg-white/70">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-2">
                Formato:
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAspectRatio('square')}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
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
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
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
            className={`p-6 sm:p-8 rounded-[2rem] shadow-2xl space-y-4 relative overflow-hidden flex flex-col justify-between box-border transition-all duration-300 ${
              theme === 'white'
                ? 'bg-white text-slate-950 border-4 border-slate-200/90'
                : 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white border border-slate-800'
            } ${aspectRatio === 'story' ? 'min-h-[560px]' : 'min-h-[440px]'}`}
          >
            {/* Destellos de iluminación de fondo */}
            {theme === 'white' ? (
              <>
                <div className="absolute top-0 right-0 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              </>
            ) : (
              <>
                <div className="absolute top-0 right-0 w-44 h-44 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-44 h-44 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
              </>
            )}

            {/* CINTILLO PUBLICITARIO SUPERIOR DE ALTO IMPACTO */}
            <div className={`-mx-6 sm:-mx-8 -mt-6 sm:-mt-8 px-6 py-2.5 flex items-center justify-between text-[10px] sm:text-xs font-black uppercase tracking-widest ${
              theme === 'white'
                ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 border-b border-slate-700'
            }`}>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                <span>¡OFERTA LABORAL DESTACADA EN MAGALLANES!</span>
              </span>
              <span className="font-mono text-white/90">📍 {job.location}</span>
            </div>

            {/* Header del Anuncio con Logotipo */}
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/90 pb-3 pt-1 relative z-10">
              <div className="flex items-center gap-2.5">
                <Image src="/logo-contapyme.png" alt="ContaPyme" width={130} height={35} className={`h-auto w-28 sm:w-32 ${theme === 'dark' ? 'brightness-125' : ''}`} />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  ContaEmpleos
                </span>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg ${
                theme === 'white' ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-slate-800 text-slate-300'
              }`}>
                {job.sector}
              </span>
            </div>

            {/* Cuerpo Central del Anuncio (Título Ultra Llamativo) */}
            <div className="space-y-3 relative z-10 my-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1">
                  <Building2 className="h-4 w-4" /> {job.company_name}
                </span>
                {job.is_verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    <BadgeCheck className="h-3 w-3" /> Verificada
                  </span>
                )}
              </div>

              {/* TÍTULO ULTRA LLAMATIVO */}
              <h3 className={`text-2xl sm:text-4xl font-black italic uppercase tracking-tight leading-none break-words ${
                theme === 'white'
                  ? 'text-slate-950 drop-shadow-sm'
                  : 'text-white'
              }`}>
                {job.title}
              </h3>

              {/* Cápsula de Sueldo y Turno */}
              <div className="flex flex-wrap gap-2 pt-1">
                {job.salary_raw && (
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-white bg-emerald-600 px-4 py-1.5 rounded-xl shadow-md shadow-emerald-600/25">
                    <DollarSign className="h-4 w-4" />
                    <span>{job.salary_raw}</span>
                  </div>
                )}
                {job.work_shift && (
                  <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider ${
                    theme === 'white'
                      ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                      : 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/40'
                  }`}>
                    <Clock className="h-3.5 w-3.5" />
                    <span>{job.work_shift}</span>
                  </div>
                )}
              </div>

              {/* Requisitos clave con Viñetas */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="pt-2 space-y-1.5">
                  <span className={`text-[10px] font-black uppercase tracking-wider block ${
                    theme === 'white' ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    Requisitos principales del puesto:
                  </span>
                  <div className="space-y-1">
                    {job.requirements.slice(0, aspectRatio === 'story' ? 3 : 2).map((req, idx) => (
                      <div key={idx} className={`flex items-center gap-2 text-xs font-bold ${
                        theme === 'white' ? 'text-slate-700' : 'text-slate-300'
                      }`}>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="truncate">{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bloque de Postulación Inmediata y Código QR */}
            <div className={`p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-4 relative z-10 ${
              theme === 'white'
                ? 'bg-slate-50 border-2 border-slate-200'
                : 'bg-slate-800/80 border border-slate-700/80'
            }`}>
              <div className="space-y-1 min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  Canal de Postulación Directa
                </span>
                <p className={`text-xs truncate font-mono font-bold ${
                  theme === 'white' ? 'text-slate-900' : 'text-slate-200'
                }`}>
                  {job.contact_email ? `✉️ ${job.contact_email}` : (job.contact_whatsapp ? `📲 WhatsApp: ${job.contact_whatsapp}` : '🌐 contapymepuq.cl/empleos')}
                </p>
                <p className={`text-[9px] ${theme === 'white' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Escanea el código QR o ingresa al enlace oficial sin intermediarios.
                </p>
              </div>
              <img
                src={qrCodeUrl}
                alt="QR Postulación"
                className={`h-16 w-16 rounded-xl p-1 shrink-0 shadow-md ${
                  theme === 'white' ? 'bg-white border border-slate-200' : 'bg-white'
                }`}
                crossOrigin="anonymous"
              />
            </div>

            {/* Footer del Anuncio */}
            <div className={`pt-3 border-t flex items-center justify-between text-[9px] font-bold uppercase relative z-10 ${
              theme === 'white' ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
            }`}>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Art. 2° Código del Trabajo
              </span>
              <span className="font-mono">contapymepuq.cl/empleos</span>
            </div>
          </div>

          {/* ===== BOTONES DE ACCIÓN DIRECTA ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <Button
              onClick={handleShareInstagram}
              disabled={isGenerating}
              className="w-full rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 text-white font-black text-xs uppercase tracking-widest gap-2 h-12 shadow-lg shadow-rose-600/20 active:scale-95 cursor-pointer"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Instagram className="h-4 w-4" />
              )}
              <span>Publicar en Instagram</span>
            </Button>

            <Button
              onClick={handleDownloadImage}
              disabled={isGenerating}
              variant="outline"
              className="w-full rounded-2xl font-black text-xs uppercase tracking-widest gap-2 h-12 border-zinc-300 hover:bg-zinc-100 active:scale-95 cursor-pointer"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Descargar Imagen HD</span>
            </Button>
          </div>

          {/* ===== PESTAÑAS DE COPIADO: JSON Y TEXTOS ===== */}
          <Tabs defaultValue="json" className="w-full space-y-3 pt-2">
            <TabsList className="grid grid-cols-4 bg-zinc-100 p-1 rounded-2xl">
              <TabsTrigger value="json" className="rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider gap-1 data-[state=active]:bg-white data-[state=active]:shadow">
                <Code2 className="h-3 w-3 text-primary" /> JSON Anuncio
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider gap-1 data-[state=active]:bg-white data-[state=active]:shadow">
                <Send className="h-3 w-3 text-emerald-600" /> WhatsApp
              </TabsTrigger>
              <TabsTrigger value="instagram" className="rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider gap-1 data-[state=active]:bg-white data-[state=active]:shadow">
                <Instagram className="h-3 w-3 text-rose-600" /> Instagram
              </TabsTrigger>
              <TabsTrigger value="linkedin" className="rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider gap-1 data-[state=active]:bg-white data-[state=active]:shadow">
                <Linkedin className="h-3 w-3 text-sky-600" /> LinkedIn
              </TabsTrigger>
            </TabsList>

            {/* Tab JSON Estructurado para Modelos de IA */}
            <TabsContent value="json" className="space-y-2.5">
              <div className="p-3.5 rounded-2xl bg-zinc-900 text-zinc-200 border border-zinc-800 text-[11px] font-mono whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto">
                {JSON.stringify(jobAdPromptSpec, null, 2)}
              </div>
              <Button
                onClick={() => handleCopy(JSON.stringify(jobAdPromptSpec, null, 2), 'json')}
                className="w-full rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-widest gap-2 h-10"
              >
                {copiedType === 'json' ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" /> ¡JSON del Anuncio Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copiar JSON para Nano Banana / IA
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Tab WhatsApp */}
            <TabsContent value="whatsapp" className="space-y-2.5">
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs font-mono whitespace-pre-line text-zinc-700 leading-relaxed max-h-36 overflow-y-auto">
                {whatsappCopy}
              </div>
              <Button
                onClick={() => handleCopy(whatsappCopy, 'whatsapp')}
                className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest gap-2 h-10"
              >
                {copiedType === 'whatsapp' ? (
                  <>
                    <Check className="h-4 w-4" /> ¡Texto de WhatsApp Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copiar para Grupos de WhatsApp
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Tab Instagram */}
            <TabsContent value="instagram" className="space-y-2.5">
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs font-mono whitespace-pre-line text-zinc-700 leading-relaxed max-h-36 overflow-y-auto">
                {instagramCopy}
              </div>
              <Button
                onClick={() => handleCopy(instagramCopy, 'instagram')}
                className="w-full rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-xs uppercase tracking-widest gap-2 h-10"
              >
                {copiedType === 'instagram' ? (
                  <>
                    <Check className="h-4 w-4" /> ¡Texto de Instagram Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copiar para Historias / Feed
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Tab LinkedIn */}
            <TabsContent value="linkedin" className="space-y-2.5">
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs font-mono whitespace-pre-line text-zinc-700 leading-relaxed max-h-36 overflow-y-auto">
                {linkedinCopy}
              </div>
              <Button
                onClick={() => handleCopy(linkedinCopy, 'linkedin')}
                className="w-full rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-black text-xs uppercase tracking-widest gap-2 h-10"
              >
                {copiedType === 'linkedin' ? (
                  <>
                    <Check className="h-4 w-4" /> ¡Texto de LinkedIn Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copiar Publicación de LinkedIn
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
