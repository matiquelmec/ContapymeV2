'use client'

import { useState, useRef, useEffect, useId } from 'react'
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
  Moon,
  Link as LinkIcon,
  Flame,
  Upload,
  Palette,
  RefreshCw
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
import { toast } from 'sonner'
import { extractBrandPaletteFromImage, type BrandPalette } from '@/lib/branding/color-extractor'
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
  const [linkCopied, setLinkCopied] = useState(false)

  // Logo de la empresa (o el asignado a la oferta)
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(job.company_logo_url || null)
  
  // Paleta de colores extraída automáticamente de la empresa
  const [brandPalette, setBrandPalette] = useState<BrandPalette>({
    primaryHex: '#004080',
    accentHex: '#10B981',
    backgroundHex: '#FFFFFF',
    textHex: '#0F172A',
    surfaceHex: '#F8FAFC',
    isDark: false,
  })
  const [isExtractingColors, setIsExtractingColors] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileInputId = useId()
  const shareUrl = `https://contapymepuq.cl/empleos/${job.slug}`

  // Extraer paleta cuando cambie el logo o al abrir el modal
  useEffect(() => {
    async function updatePalette() {
      const sourceImage = customLogoUrl || '/logo-contapyme.png'
      setIsExtractingColors(true)
      try {
        const palette = await extractBrandPaletteFromImage(sourceImage)
        setBrandPalette(palette)
      } finally {
        setIsExtractingColors(false)
      }
    }
    if (isOpen) {
      updatePalette()
    }
  }, [customLogoUrl, isOpen])

  // Manejar carga de archivo de logo personalizado
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido (PNG, SVG, JPG).')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      if (result) {
        setCustomLogoUrl(result)
        toast.success(`Logotipo de ${job.company_name} cargado con éxito.`, {
          description: 'Se extrajo automáticamente la paleta de colores corporativos.'
        })
      }
    }
    reader.readAsDataURL(file)
  }

  // QR Code URL con resolución optimizada
  const qrBgColor = theme === 'white' ? 'FFFFFF' : '0F172A'
  const qrColor = theme === 'white' ? brandPalette.primaryHex.replace('#', '') : '38BDF8'
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}&bgcolor=${qrBgColor}&color=${qrColor}&margin=0`

  // Copiar enlace directo de postulación al portapapeles
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setLinkCopied(true)
      toast.success('¡Enlace copiado al portapapeles!', {
        description: 'Pégalo en el Sticker de Enlace 🔗 de tu Historia de Instagram o en WhatsApp.'
      })
      setTimeout(() => setLinkCopied(false), 3500)
    } catch (err) {
      console.error('Error al copiar enlace:', err)
    }
  }

  // 1. JSON Estructurado de Grado de Estudio para Nano Banana 2 (Gemini 3.1 Flash Image)
  const nanoBanana2AdSpec = {
    $schema: "http://json-schema.org/draft-07/schema#",
    model: "gemini-3.1-flash-image-preview",
    user_intent: `Generación de banner publicitario de empleo para ${job.company_name} en la Región de Magallanes con control determinista de marca.`,
    meta: {
      aspect_ratio: aspectRatio === 'story' ? "9:16" : "1:1",
      dimensions: aspectRatio === 'story' ? "1080x1920" : "1080x1080",
      quality: "ultra_photorealistic",
      thinking_level: "high",
      guidance_scale: 8.5,
      steps: 50,
      format: "PNG",
      color_profile: "Display P3 / Rec.709 High Contrast"
    },
    brand_identity: {
      nombre_empresa: job.company_name,
      region: "Magallanes y de la Antártica Chilena, Chile",
      sello_ecosistema: "ContaEmpleos Magallanes / ContaPymePUQ",
      paleta_de_colores_hex: {
        color_primario_corporativo: brandPalette.primaryHex,
        color_acento_sueldo: brandPalette.accentHex,
        color_fondo: theme === 'white' ? "#FFFFFF" : "#0F172A",
        color_texto_principal: theme === 'white' ? "#0F172A" : "#FFFFFF",
        color_acento_urgencia: "#E10600"
      },
      activos_graficos: {
        logo_empresa: {
          url_recurso: customLogoUrl || "https://contapymepuq.cl/logo-contapyme.png",
          instruccion: "Colocar en la cabecera superior izquierda manteniendo relación de aspecto y nitidez sobre fondo de alto contraste."
        },
        badge_contaempleos: {
          texto: "ContaEmpleos Magallanes",
          posicion: "Cabecera superior derecha en pastilla institucional."
        },
        codigo_qr_postulacion: {
          url_qr: qrCodeUrl,
          posicion: "Esquina inferior derecha con margen de 4px para escaneo directo con cámara móvil."
        }
      }
    },
    contenido_texto: {
      cintillo_superior: aspectRatio === 'story' ? "🔥 ¡NUEVA VACANTE EN MAGALLANES!" : "🔥 ¡OFERTA LABORAL DESTACADA!",
      empresa_contratante: job.company_name,
      titulo_cargo: job.title,
      sueldo_destacado: job.salary_raw || "Remuneración acorde al mercado",
      jornada_turno: job.work_shift || "Jornada Completa",
      requisitos_principales: (job.requirements && job.requirements.length > 0)
        ? job.requirements.slice(0, aspectRatio === 'story' ? 4 : 2)
        : ["Experiencia comprobable en el área", "Residencia en la Región de Magallanes", "Disponibilidad inmediata"],
      contacto_directo: {
        whatsapp: job.contact_whatsapp ? `📲 WhatsApp: ${job.contact_whatsapp}` : null,
        email: job.contact_email ? `✉️ ${job.contact_email}` : null,
        enlace_web: shareUrl
      }
    },
    text_rendering: {
      exact_title: job.title,
      font_style: "Plus Jakarta Sans, Weight 900 Italic, uppercase, sans-serif, high contrast",
      exact_salary: job.salary_raw || "Sueldo Competitivo",
      salary_badge_style: `Background ${brandPalette.accentHex}, text white bold rounded pill`,
      placement: "Estructura vertical equilibrada con jerarquía visual: cintillo, cabecera con logos, cargo en tipografía extra bold, sueldo destacado, viñetas de requisitos y pie de postulación con QR."
    },
    technical: {
      camera: {
        type: "Hasselblad X2D 100C",
        lens: "24mm prime lens f/8"
      },
      lighting: {
        setup: "Three-point softbox studio lighting, clean rim light on branding elements, soft drop shadows"
      }
    },
    prompt_ejecucion_ia: `Genera un anuncio publicitario de empleo de alta fidelidad en formato ${aspectRatio === 'story' ? 'Historia Vertical 9:16 (1080x1920)' : 'Post Cuadrado 1:1 (1080x1080)'} sobre ${theme === 'white' ? 'fondo blanco puro (#FFFFFF)' : 'fondo azul marino (#0F172A)'}. Integra el logo corporativo de ${job.company_name} en la cabecera. Utiliza el color primario de la marca (${brandPalette.primaryHex}) y el acento (${brandPalette.accentHex}). Renderiza el título '${job.title}' con tipografía extra bold de gran escala, la cápsula de sueldo destacada, viñetas de requisitos clave y código QR de postulación directa con certificación Art. 2° Código del Trabajo.`
  }

  // 2. Templates de texto para Redes
  const whatsappCopy = `💼 *NUEVA OFERTA LABORAL EN MAGALLANES*
📍 *Ubicación:* ${job.location}
🏢 *Empresa:* ${job.company_name} ${job.is_verified ? '✅' : ''}
📌 *Cargo:* ${job.title}
💰 *Sueldo:* ${job.salary_raw || 'A convenir'}
⏱️ *Jornada / Turno:* ${job.work_shift || 'Completa'}

${job.requirements && job.requirements.length > 0 ? `📋 *Requisitos:*\n${job.requirements.slice(0, 4).map(r => `• ${r}`).join('\n')}\n` : ''}
📲 *Revisa el detalle y postula directo aquí:*
🔗 ${shareUrl}

🛡️ _Bolsa de Empleos ContaEmpleos PUQ | Art. 2° Código del Trabajo._`

  const instagramCopy = `🏔️ ¡Nueva vacante disponible en ${job.location}! 🚀

📌 Cargo: ${job.title}
🏢 Empresa: ${job.company_name}
💰 Sueldo: ${job.salary_raw || 'A convenir'}
⏱️ Turno: ${job.work_shift || 'Jornada completa'}

🔗 Postula directo tocando el Sticker de Enlace en nuestra historia o ingresando a:
👉 ${shareUrl}

#EmpleosMagallanes #PuntaArenas #PuertoNatales #Porvenir #TorresDelPaine #TrabajoMagallanes #ContaEmpleosPUQ #${job.company_name.replace(/\s+/g, '')}`

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
      toast.success('¡Texto copiado al portapapeles!')
      setTimeout(() => setCopiedType(null), 3000)
    } catch (err) {
      console.error('Error al copiar:', err)
    }
  }

  // Generar Blob con html2canvas asegurando proporción exacta
  const generateImageBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: theme === 'white' ? '#FFFFFF' : '#0F172A',
        logging: false,
      })
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 0.98)
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
      await handleCopyLink()

      const blob = await generateImageBlob()
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `anuncio-${job.company_name.toLowerCase().replace(/\s+/g, '-')}-${job.slug}-${theme}-${aspectRatio === 'story' ? 'historia-9x16' : 'post-1x1'}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setIsGenerating(false)
    }
  }

  // Publicar en Instagram / Web Share API con copia automática del enlace
  const handleShareInstagram = async () => {
    setIsGenerating(true)
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl)
        setLinkCopied(true)
        toast.success('¡Enlace del empleo copiado!', {
          description: 'Pega este enlace en el Sticker de Enlace 🔗 de tu Historia de Instagram.'
        })
      }

      const blob = await generateImageBlob()
      if (!blob) return

      const fileName = `anuncio-${job.company_name.toLowerCase().replace(/\s+/g, '-')}-${job.slug}-${theme}-${aspectRatio === 'story' ? 'historia-9x16' : 'post-1x1'}.png`
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
        <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-2xl rounded-3xl bg-white p-3.5 sm:p-6 space-y-3 sm:space-y-4 border border-zinc-200 shadow-2xl max-h-[92vh] overflow-x-hidden overflow-y-auto box-border min-w-0">
          {/* Header */}
          <DialogHeader className="space-y-1 text-left pr-8 min-w-0">
            <div className="flex items-center gap-1.5 text-primary text-[11px] sm:text-xs font-black uppercase tracking-wider min-w-0">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Kit de Publicidad & Branding con IA</span>
            </div>
            <DialogTitle className="text-base sm:text-xl font-black uppercase tracking-tight italic text-foreground leading-snug break-words">
              Generador Publicitario: {job.company_name}
            </DialogTitle>
            <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground leading-normal">
              Extracción automática de paleta corporativa y renderizado publicitario de alta resolución.
            </DialogDescription>
          </DialogHeader>

          {/* BARRA DE MARCA DE LA EMPRESA & SUBIDA DE LOGO */}
          <div className="p-2.5 rounded-2xl bg-zinc-100/90 border border-zinc-200 flex flex-wrap items-center justify-between gap-2.5 box-border min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs">
                {customLogoUrl ? (
                  <img src={customLogoUrl} alt={job.company_name} className="h-full w-full object-contain" />
                ) : (
                  <Building2 className="h-4 w-4 text-zinc-600" />
                )}
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-foreground truncate max-w-[130px] sm:max-w-[200px]">
                    {job.company_name}
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      className="h-3 w-3 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: brandPalette.primaryHex }}
                      title={`Color Primario: ${brandPalette.primaryHex}`}
                    />
                    <span
                      className="h-3 w-3 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: brandPalette.accentHex }}
                      title={`Color Acento: ${brandPalette.accentHex}`}
                    />
                  </div>
                </div>
                <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1">
                  <Palette className="h-2.5 w-2.5 text-primary" />
                  {isExtractingColors ? 'Extrayendo paleta...' : `Paleta: ${brandPalette.primaryHex} / ${brandPalette.accentHex}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
                id={fileInputId}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl h-8 px-2.5 text-[10px] font-black uppercase tracking-wider bg-white hover:bg-zinc-50 border-zinc-300 gap-1.5 shadow-2xs cursor-pointer"
              >
                <Upload className="h-3 w-3" />
                <span>{customLogoUrl ? 'Cambiar Logo' : 'Subir Logo'}</span>
              </Button>
              {customLogoUrl && (
                <button
                  type="button"
                  onClick={() => setCustomLogoUrl(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors cursor-pointer"
                  title="Restablecer logo por defecto"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Selectores de Configuración: Fondo y Formato */}
          <div className="grid grid-cols-2 gap-2 p-1.5 sm:p-2 rounded-2xl bg-zinc-100 border border-zinc-200 w-full min-w-0 box-border">
            {/* Selector de Tema */}
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground px-1">
                Fondo:
              </span>
              <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-xl shadow-2xs min-w-0">
                <button
                  type="button"
                  onClick={() => setTheme('white')}
                  className={`py-1 px-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 min-w-0 cursor-pointer ${
                    theme === 'white'
                      ? 'bg-blue-600 text-white shadow-2xs'
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
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Moon className="h-3 w-3 shrink-0" />
                  <span className="truncate">Noche</span>
                </button>
              </div>
            </div>

            {/* Selector de Formato (Post 1:1 vs Historia 9:16) */}
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground px-1">
                Formato:
              </span>
              <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-xl shadow-2xs min-w-0">
                <button
                  type="button"
                  onClick={() => setAspectRatio('square')}
                  className={`py-1 px-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all text-center min-w-0 truncate cursor-pointer ${
                    aspectRatio === 'square'
                      ? 'bg-blue-600 text-white shadow-2xs'
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
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Historia (9:16)
                </button>
              </div>
            </div>
          </div>

          {/* BANNER NOTIFICACIÓN: COPIAR ENLACE PARA HISTORIA */}
          <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-2.5 w-full min-w-0 box-border">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-800 shrink-0">
                <LinkIcon className="h-3.5 w-3.5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block truncate">
                  Enlace para Sticker o Compartir
                </span>
                <p className="text-[9px] sm:text-[10px] text-amber-800/90 truncate font-mono">
                  {shareUrl}
                </p>
              </div>
            </div>
            <Button
              onClick={handleCopyLink}
              size="sm"
              variant="outline"
              className="rounded-xl h-8 px-2.5 text-[10px] font-black uppercase tracking-wider bg-white hover:bg-amber-100/60 border-amber-300 shrink-0 gap-1 shadow-2xs cursor-pointer"
            >
              {linkCopied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copiar Link
                </>
              )}
            </Button>
          </div>

          {/* ===== ANUNCIO PUBLICITARIO VISUAL CON IDENTIDAD DE LA EMPRESA ===== */}
          <div className="w-full flex justify-center py-1">
            <div
              ref={cardRef}
              className={`rounded-2xl sm:rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-between box-border transition-all duration-300 w-full min-w-0 ${
                aspectRatio === 'story'
                  ? 'aspect-[9/16] max-w-[340px] sm:max-w-[360px] p-3.5 sm:p-5 space-y-2 sm:space-y-3'
                  : 'aspect-square max-w-[330px] sm:max-w-[370px] p-3 sm:p-4 space-y-1.5 sm:space-y-2'
              } ${
                theme === 'white'
                  ? 'bg-white text-slate-950 border-2 sm:border-4 border-slate-200'
                  : 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white border border-slate-800'
              }`}
            >
              {/* Destellos de iluminación de fondo adaptados al color corporativo */}
              {theme === 'white' ? (
                <>
                  <div
                    className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-10"
                    style={{ backgroundColor: brandPalette.primaryHex }}
                  />
                  <div
                    className="absolute bottom-0 left-0 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-10"
                    style={{ backgroundColor: brandPalette.accentHex }}
                  />
                </>
              ) : (
                <>
                  <div
                    className="absolute top-0 right-0 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-25"
                    style={{ backgroundColor: brandPalette.primaryHex }}
                  />
                  <div
                    className="absolute bottom-0 left-0 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-20"
                    style={{ backgroundColor: brandPalette.accentHex }}
                  />
                </>
              )}

              {/* 1. CINTILLO PUBLICITARIO SUPERIOR CON COLOR PRIMARIO */}
              <div
                className="p-1.5 rounded-lg sm:rounded-xl flex items-center justify-between gap-1 text-[8px] sm:text-[9px] font-black uppercase tracking-wider relative z-10 w-full min-w-0 box-border text-white shadow-2xs"
                style={{
                  background: `linear-gradient(90deg, ${brandPalette.primaryHex} 0%, ${brandPalette.primaryHex}DD 100%)`
                }}
              >
                <div className="flex items-center gap-1 min-w-0 flex-1 truncate">
                  <Flame className="h-3 w-3 text-amber-300 shrink-0" />
                  <span className="truncate">
                    {aspectRatio === 'story' ? '¡NUEVA VACANTE EN MAGALLANES!' : '¡OFERTA EN MAGALLANES!'}
                  </span>
                </div>
                <span className="font-mono text-white/90 shrink-0 text-[8px] sm:text-[9px]">
                  📍 {job.location}
                </span>
              </div>

              {/* 2. HEADER CON LOGOTIPO DE LA EMPRESA + CONTAEMPLEOS */}
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/90 pb-1.5 pt-0.5 relative z-10 gap-2 w-full min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  {customLogoUrl ? (
                    <img
                      src={customLogoUrl}
                      alt={job.company_name}
                      className="h-6 sm:h-7 w-auto max-w-[90px] sm:max-w-[120px] object-contain shrink-0"
                    />
                  ) : (
                    <Image
                      src="/logo-contapyme.png"
                      alt="ContaPyme"
                      width={100}
                      height={28}
                      className={`h-auto w-18 sm:w-24 shrink-0 ${theme === 'dark' ? 'brightness-125' : ''}`}
                    />
                  )}
                  <span
                    className="text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full border shrink-0"
                    style={{
                      color: brandPalette.accentHex,
                      backgroundColor: `${brandPalette.accentHex}1A`,
                      borderColor: `${brandPalette.accentHex}4D`
                    }}
                  >
                    ContaEmpleos
                  </span>
                </div>
                <span className={`text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider px-2 py-0.2 rounded-md shrink-0 truncate max-w-[110px] sm:max-w-[150px] ${
                  theme === 'white' ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-slate-800 text-slate-300'
                }`}>
                  {job.sector}
                </span>
              </div>

              {/* 3. CUERPO HERO (TÍTULO Y EMPRESA) */}
              <div className={`space-y-1 relative z-10 w-full min-w-0 ${aspectRatio === 'story' ? 'my-auto py-0.5' : 'my-auto'}`}>
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span
                    className="text-[10px] sm:text-xs font-black uppercase tracking-wide flex items-center gap-1 truncate max-w-full"
                    style={{ color: brandPalette.primaryHex }}
                  >
                    <Building2 className="h-3 w-3 shrink-0" /> <span className="truncate">{job.company_name}</span>
                  </span>
                  {job.is_verified && (
                    <span
                      className="inline-flex items-center gap-0.5 text-[7.5px] sm:text-[8.5px] font-black px-1.5 py-0.2 rounded shrink-0"
                      style={{
                        color: brandPalette.accentHex,
                        backgroundColor: `${brandPalette.accentHex}1A`
                      }}
                    >
                      <BadgeCheck className="h-2.5 w-2.5" /> Verificada
                    </span>
                  )}
                </div>

                {/* TÍTULO ULTRA LLAMATIVO */}
                <h3 className={`font-black italic uppercase tracking-tight leading-snug break-words hyphens-auto w-full min-w-0 ${
                  aspectRatio === 'story' 
                    ? 'text-base sm:text-xl text-slate-950 dark:text-white' 
                    : 'text-[13px] sm:text-base text-slate-950 dark:text-white line-clamp-2'
                }`}>
                  {job.title}
                </h3>

                {/* Cápsula de Sueldo y Turno */}
                <div className="flex flex-wrap gap-1 pt-0.5 w-full min-w-0">
                  {job.salary_raw && (
                    <div
                      className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black text-white px-2.5 py-0.5 rounded-lg shadow-2xs shrink-0"
                      style={{ backgroundColor: brandPalette.accentHex }}
                    >
                      <DollarSign className="h-2.5 w-2.5 shrink-0" />
                      <span>{job.salary_raw}</span>
                    </div>
                  )}
                  {job.work_shift && (
                    <div className={`flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider shrink-0 ${
                      theme === 'white'
                        ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                        : 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/40'
                    }`}>
                      <Clock className="h-2.5 w-2.5 shrink-0" />
                      <span>{job.work_shift}</span>
                    </div>
                  )}
                </div>

                {/* Requisitos principales */}
                {job.requirements && job.requirements.length > 0 && (
                  <div className={`space-y-0.5 w-full min-w-0 ${aspectRatio === 'story' ? 'pt-1 block' : 'pt-0.5 block'}`}>
                    <span className={`text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider block ${
                      theme === 'white' ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      Requisitos clave:
                    </span>
                    <div className="space-y-0.5 w-full min-w-0">
                      {job.requirements.slice(0, aspectRatio === 'story' ? 4 : 2).map((req, idx) => (
                        <div key={idx} className={`flex items-start gap-1 text-[9.5px] sm:text-[10.5px] font-bold leading-snug w-full min-w-0 ${
                          theme === 'white' ? 'text-slate-700' : 'text-slate-300'
                        }`}>
                          <CheckCircle2
                            className="h-3 w-3 shrink-0 mt-0.5"
                            style={{ color: brandPalette.accentHex }}
                          />
                          <span className="break-words line-clamp-1 min-w-0 flex-1">{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. BLOQUE DE POSTULACIÓN Y CÓDIGO QR */}
              <div className={`p-2 sm:p-2.5 rounded-xl flex items-center justify-between gap-2 relative z-10 w-full min-w-0 box-border ${
                theme === 'white'
                  ? 'bg-slate-50 border border-slate-200'
                  : 'bg-slate-800/80 border border-slate-700/80'
              }`}>
                <div className="space-y-0.2 min-w-0 flex-1">
                  <span
                    className="text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider block"
                    style={{ color: brandPalette.accentHex }}
                  >
                    Postulación Rápida
                  </span>
                  <p className={`text-[9.5px] sm:text-[11px] truncate font-mono font-bold ${
                    theme === 'white' ? 'text-slate-900' : 'text-slate-200'
                  }`}>
                    {job.contact_email ? `✉️ ${job.contact_email}` : (job.contact_whatsapp ? `📲 WhatsApp: ${job.contact_whatsapp}` : '🌐 contapymepuq.cl')}
                  </p>
                  <p className={`text-[7.5px] ${theme === 'white' ? 'text-slate-500' : 'text-slate-400'} truncate`}>
                    Escanea el QR o usa el enlace directo.
                  </p>
                </div>
                <img
                  src={qrCodeUrl}
                  alt="QR Postulación"
                  className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg p-0.5 shrink-0 shadow-2xs ${
                    theme === 'white' ? 'bg-white border border-slate-200' : 'bg-white'
                  }`}
                  crossOrigin="anonymous"
                />
              </div>

              {/* 5. CALLOUT EXCLUSIVO PARA HISTORIAS DE INSTAGRAM */}
              {aspectRatio === 'story' && (
                <div className="p-1.5 rounded-lg bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-amber-500/10 border border-rose-400/30 flex items-center justify-center gap-1.5 text-center relative z-10">
                  <LinkIcon className="h-3 w-3 text-rose-600 shrink-0" />
                  <span className="text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300 truncate">
                    👆 TOCA EL STICKER DE ENLACE ARRIBA
                  </span>
                </div>
              )}

              {/* 6. FOOTER DEL ANUNCIO */}
              <div className={`pt-1.5 border-t flex items-center justify-between gap-1 text-[7.5px] sm:text-[8.5px] font-bold uppercase relative z-10 w-full min-w-0 ${
                theme === 'white' ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
              }`}>
                <span
                  className="flex items-center gap-1 shrink-0"
                  style={{ color: brandPalette.accentHex }}
                >
                  <ShieldCheck className="h-2.5 w-2.5 shrink-0" /> Art. 2° Código del Trabajo
                </span>
                <span className="font-mono truncate">contapymepuq.cl/empleos</span>
              </div>
            </div>
          </div>

          {/* ===== BOTONES DE ACCIÓN DIRECTA ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5 w-full min-w-0 box-border">
            <Button
              onClick={handleShareInstagram}
              disabled={isGenerating}
              className="w-full rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 text-white font-black text-xs uppercase tracking-wider gap-2 h-11 shadow-2xs active:scale-95 cursor-pointer"
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
              <TabsTrigger value="json" className="rounded-xl text-[10px] font-black uppercase tracking-wider gap-1 data-[state=active]:bg-white data-[state=active]:shadow-2xs py-1.5 truncate">
                <Code2 className="h-3 w-3 text-primary shrink-0" /> <span className="truncate">JSON Nano Banana</span>
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="rounded-xl text-[10px] font-black uppercase tracking-wider gap-1 data-[state=active]:bg-white data-[state=active]:shadow-2xs py-1.5 truncate">
                <Send className="h-3 w-3 text-emerald-600 shrink-0" /> <span className="truncate">WhatsApp</span>
              </TabsTrigger>
              <TabsTrigger value="instagram" className="rounded-xl text-[10px] font-black uppercase tracking-wider gap-1 data-[state=active]:bg-white data-[state=active]:shadow-2xs py-1.5 truncate">
                <Instagram className="h-3 w-3 text-rose-600 shrink-0" /> <span className="truncate">Instagram</span>
              </TabsTrigger>
              <TabsTrigger value="linkedin" className="rounded-xl text-[10px] font-black uppercase tracking-wider gap-1 data-[state=active]:bg-white data-[state=active]:shadow-2xs py-1.5 truncate">
                <Linkedin className="h-3 w-3 text-sky-600 shrink-0" /> <span className="truncate">LinkedIn</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab JSON Estructurado para Nano Banana 2 */}
            <TabsContent value="json" className="space-y-2 min-w-0">
              <div className="p-2.5 rounded-xl bg-zinc-900 text-zinc-200 border border-zinc-800 text-[10px] font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto w-full min-w-0 box-border">
                {JSON.stringify(nanoBanana2AdSpec, null, 2)}
              </div>
              <Button
                onClick={() => handleCopy(JSON.stringify(nanoBanana2AdSpec, null, 2), 'json')}
                className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-wider gap-2 h-9 cursor-pointer"
              >
                {copiedType === 'json' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> ¡JSON de Nano Banana 2 Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 shrink-0" /> Copiar JSON para Gemini 3.1 Flash Image / Nano Banana
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
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider gap-2 h-9 cursor-pointer"
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
                className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-xs uppercase tracking-wider gap-2 h-9 cursor-pointer"
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
                className="w-full rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-black text-xs uppercase tracking-wider gap-2 h-9 cursor-pointer"
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
