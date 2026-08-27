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
  QrCode, 
  Loader2,
  CheckCircle2,
  Mail,
  ExternalLink
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

export function JobSocialCardGenerator({ job }: JobSocialCardGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedType, setCopiedType] = useState<string | null>(null)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('square')
  const [isGenerating, setIsGenerating] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const shareUrl = `https://contapymepuq.cl/empleos/${job.slug}`

  // QR Code URL en alta definición con colores de marca
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareUrl)}&bgcolor=0F172A&color=38BDF8&margin=0`

  // 1. JSON Estructurado Profesional de Anuncio para IA / Modelos Gráficos
  const jobAdPromptSpec = {
    tarea: "generacion_oferta_empleo",
    herramienta: "ContaBanner AI Pro / Nano Banana Pro",
    parametros_tecnicos: {
      dimensiones: aspectRatio === 'story' ? "1080x1920" : "1080x1080",
      relacion_aspecto: aspectRatio === 'story' ? "9:16" : "1:1",
      formato_salida: "PNG",
      calidad: "2x Retina High DPI"
    },
    marca_principal: {
      nombre: "ContaPymePUQ / ContaEmpleos Magallanes",
      region: "Magallanes y de la Antártica Chilena",
      paleta_de_colores_hex: {
        azul_patagonia_fondo: "#0F172A",
        azul_electrico_acento: "#2563EB",
        verde_esmeralda_sueldo: "#10B981",
        celeste_glaciar: "#38BDF8",
        indigo_turno: "#6366F1",
        blanco_nieve: "#FFFFFF"
      }
    },
    elementos_graficos: {
      logo_contapymepuq: {
        url_recurso: "https://contapymepuq.cl/logo-contapyme.png",
        instruccion_modelo: "Colocar exactamente el logotipo oficial ContaPymePUQ en la esquina superior izquierda sobre fondo #0F172A con destellos suaves cyan (#38BDF8)."
      },
      badge_contaempleos: {
        texto: "ContaEmpleos Magallanes",
        ubicacion: "Esquina superior derecha alineada horizontalmente, con pastilla en verde esmeralda (#10B981)."
      },
      codigo_qr_dinamico: {
        url_qr: qrCodeUrl,
        instruccion_modelo: "Incrustar código QR oficial en la esquina inferior derecha con borde blanco de 4px para escaneo directo."
      },
      sello_legal: {
        texto: "Aviso Auditado Art. 2° Código del Trabajo",
        ubicacion: "Pie del banner en tipografía verde #10B981."
      }
    },
    contenido_texto: {
      llamado_accion: "¡BUSCAMOS TU TALENTO EN MAGALLANES!",
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
      fotografia_fondo: `Composición corporativa austral con viñeta nocturna (#0F172A) degradada al 85% para garantizar máxima legibilidad en ${job.location}.`,
      estilo_visual: "Diseño publicitario de alto impacto para redes sociales. Jerarquía nítida con títulos en Plus Jakarta Sans Extra Bold, cápsula de sueldo en Verde Esmeralda (#10B981) y badges de turno.",
      layout: "Composición equilibrada. Logotipos en la parte superior, título y requisitos alineados a la izquierda, badges informativos y pie con QR y contacto directo."
    },
    prompt_ejecucion_ia: `Genera un banner publicitario de empleo de alta definición en ${aspectRatio === 'story' ? '1080x1920 (Historia 9:16)' : '1080x1080 (Feed 1:1)'} para ${job.company_name} en ${job.location}. Integra el logo oficial de ContaPymePUQ en la esquina superior izquierda, título del cargo '${job.title}' en tipografía extra bold de alto contraste, bloque de sueldo '${job.salary_raw || 'Acorde al mercado'}' en verde esmeralda (#10B981), viñetas de requisitos y código QR de postulación rápida.`
  }

  // 2. Template para WhatsApp
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

  // 3. Template para Instagram / Historias
  const instagramCopy = `🏔️ ¡Nueva vacante disponible en ${job.location}! 🚀

📌 Cargo: ${job.title}
🏢 Empresa: ${job.company_name}
💰 Sueldo: ${job.salary_raw || 'A convenir'}
⏱️ Turno: ${job.work_shift || 'Jornada completa'}

👉 Entra a contapymepuq.cl/empleos/${job.slug} para postular directo por WhatsApp.

#EmpleosMagallanes #PuntaArenas #PuertoNatales #Porvenir #TorresDelPaine #TrabajoMagallanes #ContaEmpleosPUQ #PymesMagallanes`

  // 4. Template para LinkedIn
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
        backgroundColor: '#0F172A',
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

  // Descargar imagen HD en formato PNG
  const handleDownloadImage = async () => {
    setIsGenerating(true)
    try {
      const blob = await generateImageBlob()
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `anuncio-contaempleos-${job.slug}-${aspectRatio === 'story' ? 'historia-9x16' : 'post-1x1'}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setIsGenerating(false)
    }
  }

  // Publicar directamente en Instagram / Web Share API
  const handleShareInstagram = async () => {
    setIsGenerating(true)
    try {
      // 1. Copiar texto al portapapeles primero
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(instagramCopy)
      }

      // 2. Generar archivo de imagen
      const blob = await generateImageBlob()
      if (!blob) return

      const fileName = `anuncio-${job.slug}-${aspectRatio === 'story' ? 'historia' : 'post'}.png`
      const file = new File([blob], fileName, { type: 'image/png' })

      // 3. Probar si el navegador soporta compartir archivos nativamente (móviles)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${job.title} - ${job.company_name}`,
          text: instagramCopy,
          url: shareUrl,
        })
      } else {
        // Fallback para PC: Descargar imagen y abrir Instagram Web
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
              Anuncio publicitario con branding oficial ContaPymePUQ, paleta de colores y JSON para IA.
            </DialogDescription>
          </DialogHeader>

          {/* Selector de Formato: Post 1:1 vs Historia 9:16 */}
          <div className="flex items-center justify-between p-2 rounded-2xl bg-zinc-100 border border-zinc-200">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-2">
              Formato del Anuncio:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setAspectRatio('square')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  aspectRatio === 'square'
                    ? 'bg-zinc-900 text-white shadow'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Post Feed (1:1)
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('story')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  aspectRatio === 'story'
                    ? 'bg-zinc-900 text-white shadow'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Historia (9:16)
              </button>
            </div>
          </div>

          {/* ===== ANUNCIO PUBLICITARIO VISUAL BRANDED (Renderizable vía Canvas) ===== */}
          <div
            ref={cardRef}
            className={`p-6 sm:p-8 rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white shadow-2xl border border-slate-800 space-y-5 relative overflow-hidden flex flex-col justify-between box-border ${
              aspectRatio === 'story' ? 'min-h-[540px]' : 'min-h-[420px]'
            }`}
          >
            {/* Destellos de iluminación de marca */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-44 h-44 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Header del Anuncio con Logotipos */}
            <div className="flex items-center justify-between border-b border-slate-800/90 pb-4 relative z-10">
              <div className="flex items-center gap-2.5">
                <Image src="/logo-contapyme.png" alt="ContaPyme" width={120} height={32} className="h-auto w-24 sm:w-28 brightness-125" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  ContaEmpleos
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200">
                📍 {job.location}
              </span>
            </div>

            {/* Cuerpo del Anuncio */}
            <div className="space-y-3 relative z-10 my-auto">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                  ¡Buscamos tu talento!
                </span>
                {job.is_verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    <BadgeCheck className="h-3 w-3" /> Verificada
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" /> {job.company_name}
                </span>
                <h3 className="text-xl sm:text-3xl font-black italic uppercase tracking-tight text-white leading-tight break-words">
                  {job.title}
                </h3>
              </div>

              {/* Cápsula de Sueldo y Turno */}
              <div className="flex flex-wrap gap-2 pt-1">
                {job.salary_raw && (
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl shadow-lg shadow-emerald-950/40">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>{job.salary_raw}</span>
                  </div>
                )}
                {job.work_shift && (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-500/40 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{job.work_shift}</span>
                  </div>
                )}
              </div>

              {/* Requisitos clave para formato Anuncio */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="pt-2 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Requisitos principales:
                  </span>
                  <div className="space-y-1">
                    {job.requirements.slice(0, aspectRatio === 'story' ? 3 : 2).map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bloque de Postulación y Código QR */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-4 relative z-10">
              <div className="space-y-1 min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                  Postulación Directa
                </span>
                <p className="text-[11px] text-slate-300 truncate font-mono">
                  {job.contact_email ? `✉️ ${job.contact_email}` : (job.contact_whatsapp ? `📲 WhatsApp: ${job.contact_whatsapp}` : '🌐 contapymepuq.cl/empleos')}
                </p>
                <p className="text-[9px] text-slate-400">
                  Escanea el QR o entra al enlace oficial sin intermediarios.
                </p>
              </div>
              <img
                src={qrCodeUrl}
                alt="QR Postulación"
                className="h-16 w-16 rounded-xl bg-white p-1 shrink-0 shadow-md"
                crossOrigin="anonymous"
              />
            </div>

            {/* Footer del Anuncio */}
            <div className="pt-3 border-t border-slate-800/90 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase relative z-10">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Art. 2° Código del Trabajo
              </span>
              <span className="font-mono text-slate-500">contapymepuq.cl/empleos</span>
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

          {/* ===== PESTAÑAS DE COPIADO: TEXTOS Y JSON ESTRUCTURADO ===== */}
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
