'use client'

import { useState } from 'react'
import Image from 'next/image'
import { 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  Building2, 
  MapPin, 
  DollarSign, 
  Clock, 
  BadgeCheck, 
  ShieldCheck,
  Send,
  Instagram,
  Linkedin
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

export function JobSocialCardGenerator({ job }: JobSocialCardGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedType, setCopiedType] = useState<string | null>(null)

  const shareUrl = `https://contapymepuq.cl/empleos/${job.slug}`

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
            <DialogTitle className="text-2xl font-black uppercase tracking-tight italic">
              Difusión en Redes de Magallanes
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Genera tarjetas visuales y textos pre-redactados para WhatsApp, Instagram y LinkedIn.
            </DialogDescription>
          </DialogHeader>

          {/* ===== PREVISUALIZACIÓN VISUAL DE LA TARJETA BRANDED ===== */}
          <div className="p-6 rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white shadow-2xl border border-slate-800 space-y-5 relative overflow-hidden">
            {/* Destello sutil de marca */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header del Card */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 relative z-10">
              <div className="flex items-center gap-2">
                <Image src="/logo-contapyme.png" alt="ContaPyme" width={110} height={30} className="h-auto w-24 brightness-125" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  ContaEmpleos
                </span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-slate-800 rounded-lg text-slate-300">
                {job.location}
              </span>
            </div>

            {/* Contenido Central */}
            <div className="space-y-2 relative z-10">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" /> {job.company_name}
                {job.is_verified && <BadgeCheck className="h-4 w-4 text-emerald-400" />}
              </span>
              <h3 className="text-lg sm:text-xl font-black italic uppercase tracking-tight text-white leading-snug">
                {job.title}
              </h3>
            </div>

            {/* Badges de Sueldo y Turno */}
            <div className="flex flex-wrap gap-2 relative z-10">
              {job.salary_raw && (
                <div className="flex items-center gap-1 text-[11px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-xl">
                  <DollarSign className="h-3 w-3" />
                  <span>{job.salary_raw}</span>
                </div>
              )}
              {job.work_shift && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 px-2.5 py-1 rounded-xl uppercase tracking-wider">
                  <Clock className="h-3 w-3" />
                  <span>{job.work_shift}</span>
                </div>
              )}
            </div>

            {/* Footer del Card */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase relative z-10">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Art. 2° Código del Trabajo
              </span>
              <span className="font-mono text-slate-500">contapymepuq.cl/empleos</span>
            </div>
          </div>

          {/* ===== PESTAÑAS DE TEXTO LISTO PARA COPIAR ===== */}
          <Tabs defaultValue="whatsapp" className="w-full space-y-4">
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
            <TabsContent value="whatsapp" className="space-y-3">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs font-mono whitespace-pre-line text-zinc-700 leading-relaxed max-h-48 overflow-y-auto">
                {whatsappCopy}
              </div>
              <Button
                onClick={() => handleCopy(whatsappCopy, 'whatsapp')}
                className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest gap-2 h-11"
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
            <TabsContent value="instagram" className="space-y-3">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs font-mono whitespace-pre-line text-zinc-700 leading-relaxed max-h-48 overflow-y-auto">
                {instagramCopy}
              </div>
              <Button
                onClick={() => handleCopy(instagramCopy, 'instagram')}
                className="w-full rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-xs uppercase tracking-widest gap-2 h-11"
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
            <TabsContent value="linkedin" className="space-y-3">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs font-mono whitespace-pre-line text-zinc-700 leading-relaxed max-h-48 overflow-y-auto">
                {linkedinCopy}
              </div>
              <Button
                onClick={() => handleCopy(linkedinCopy, 'linkedin')}
                className="w-full rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-black text-xs uppercase tracking-widest gap-2 h-11"
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
