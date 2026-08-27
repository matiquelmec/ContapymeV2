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
  Smartphone,
  QrCode,
  Layers,
  Loader2
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

  // QR Code URL (usando servicio SVG de alta calidad para renderizado canvas)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareUrl)}&bgcolor=0F172A&color=38BDF8&margin=0`

  // 1. Template para WhatsApp
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

  // 2. Template para Instagram / Historias
  const instagramCopy = `🏔️ ¡Nueva vacante disponible en ${job.location}! 🚀

📌 Cargo: ${job.title}
🏢 Empresa: ${job.company_name}
💰 Sueldo: ${job.salary_raw || 'A convenir'}
⏱️ Turno: ${job.work_shift || 'Jornada completa'}

👉 Entra a contapymepuq.cl/empleos/${job.slug} para postular directo por WhatsApp.

#EmpleosMagallanes #PuntaArenas #PuertoNatales #Porvenir #TorresDelPaine #TrabajoMagallanes #ContaEmpleosPUQ #PymesMagallanes`

  // 3. Template para LinkedIn
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

  // Generar Blob de la imagen con html2canvas en alta definición (2x Retina)
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
      a.download = `contaempleos-${job.slug}-${aspectRatio === 'story' ? 'historia-9x16' : 'post-1x1'}.png`
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

      const fileName = `oferta-${job.slug}-${aspectRatio === 'story' ? 'historia' : 'post'}.png`
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
        <DialogContent className="w-full max-w-[92vw] sm:max-w-xl rounded-[2rem] bg-white p-6 sm:p-7 space-y-5 border border-zinc-200 shadow-2xl max-h-[90vh] overflow-y-auto box-border">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest">
              <Sparkles className="h-4 w-4" />
              <span>Kit de Publicidad & Redes Sociales</span>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tight italic">
              Generador Publicitario Magallanes
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Exporta imágenes en alta definición (1080x1080 o 1080x1920) y compártelas en Instagram y WhatsApp.
            </DialogDescription>
          </DialogHeader>

          {/* Selector de Formato: Post 1:1 vs Historia 9:16 */}
          <div className="flex items-center justify-between p-2 rounded-2xl bg-zinc-100 border border-zinc-200">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-2">
              Formato de Imagen:
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

          {/* ===== PREVISUALIZACIÓN VISUAL DE LA TARJETA BRANDED (Renderizable vía Canvas) ===== */}
          <div
            ref={cardRef}
            className={`p-6 sm:p-7 rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white shadow-2xl border border-slate-800 space-y-5 relative overflow-hidden flex flex-col justify-between box-border ${
              aspectRatio === 'story' ? 'min-h-[480px]' : 'min-h-[360px]'
            }`}
          >
            {/* Destello sutil de marca */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-primary/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header del Card */}
            <div className="flex items-center justify-between border-b border-slate-800/90 pb-3 relative z-10">
              <div className="flex items-center gap-2">
                <Image src="/logo-contapyme.png" alt="ContaPyme" width={110} height={30} className="h-auto w-24 brightness-125" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  ContaEmpleos
                </span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-slate-800 rounded-lg text-slate-300">
                📍 {job.location}
              </span>
            </div>

            {/* Contenido Central */}
            <div className="space-y-2.5 relative z-10 my-auto">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" /> {job.company_name}
                {job.is_verified && <BadgeCheck className="h-4 w-4 text-emerald-400" />}
              </span>
              <h3 className="text-lg sm:text-2xl font-black italic uppercase tracking-tight text-white leading-snug break-words">
                {job.title}
              </h3>

              {/* Badges de Sueldo y Turno */}
              <div className="flex flex-wrap gap-2 pt-1">
                {job.salary_raw && (
                  <div className="flex items-center gap-1 text-[11px] font-black text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-3 py-1 rounded-xl">
                    <DollarSign className="h-3 w-3" />
                    <span>{job.salary_raw}</span>
                  </div>
                )}
                {job.work_shift && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-300 bg-indigo-950/70 border border-indigo-500/30 px-2.5 py-1 rounded-xl uppercase tracking-wider">
                    <Clock className="h-3 w-3" />
                    <span>{job.work_shift}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sección extra para Historias (QR y Requisitos) */}
            {aspectRatio === 'story' && (
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-4 relative z-10">
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                    Escanea y Postula
                  </span>
                  <p className="text-[11px] text-slate-300 line-clamp-2">
                    Contacto directo por WhatsApp o Email sin intermediarios.
                  </p>
                </div>
                <img
                  src={qrCodeUrl}
                  alt="QR Postulación"
                  className="h-16 w-16 rounded-lg bg-white p-1 shrink-0"
                  crossOrigin="anonymous"
                />
              </div>
            )}

            {/* Footer del Card */}
            <div className="pt-3 border-t border-slate-800/90 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase relative z-10">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Art. 2° Código del Trabajo
              </span>
              <span className="font-mono text-slate-500">contapymepuq.cl/empleos</span>
            </div>
          </div>

          {/* ===== BOTONES DE ACCIÓN DIRECTA (PUBLICAR / DESCARGAR) ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <Button
              onClick={handleShareInstagram}
              disabled={isGenerating}
              className="w-full rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 text-white font-black text-xs uppercase tracking-widest gap-2 h-12 shadow-lg shadow-rose-600/20 active:scale-95"
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
              className="w-full rounded-2xl font-black text-xs uppercase tracking-widest gap-2 h-12 border-zinc-300 hover:bg-zinc-100 active:scale-95"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Descargar Imagen HD</span>
            </Button>
          </div>

          {/* ===== PESTAÑAS DE TEXTO LISTO PARA COPIAR ===== */}
          <Tabs defaultValue="whatsapp" className="w-full space-y-3 pt-2">
            <TabsList className="grid grid-cols-3 bg-zinc-100 p-1 rounded-2xl">
              <TabsTrigger value="whatsapp" className="rounded-xl text-[11px] font-black uppercase tracking-wider gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow">
                <Send className="h-3 w-3 text-emerald-600" /> WhatsApp
              </TabsTrigger>
              <TabsTrigger value="instagram" className="rounded-xl text-[11px] font-black uppercase tracking-wider gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow">
                <Instagram className="h-3 w-3 text-rose-600" /> Instagram
              </TabsTrigger>
              <TabsTrigger value="linkedin" className="rounded-xl text-[11px] font-black uppercase tracking-wider gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow">
                <Linkedin className="h-3 w-3 text-sky-600" /> LinkedIn
              </TabsTrigger>
            </TabsList>

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
