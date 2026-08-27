'use client'

import { useState } from 'react'
import { Mail, Check, Copy, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface JobEmailButtonProps {
  email: string
  jobTitle: string
  companyName: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'compact' | 'full'
}

export function JobEmailButton({
  email,
  jobTitle,
  companyName,
  size = 'sm',
  variant = 'compact',
}: JobEmailButtonProps) {
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const cleanEmail = email.trim()
  const subject = `Postulación: ${jobTitle} - ${companyName} (ContaEmpleos PUQ)`
  const body = `Estimado equipo de selección de ${companyName},\n\nJunto con saludar, les escribo para postular a la vacante de ${jobTitle} publicada en ContaEmpleos Magallanes.\n\nAdjunto mi Currículum Vitae para su revisión.\n\nSaludos cordiales,`

  // Links directos
  const mailtoUrl = `mailto:${cleanEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(cleanEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(cleanEmail)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(cleanEmail)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      }
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err)
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(true)
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(cleanEmail).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  return (
    <>
      {variant === 'compact' ? (
        <button
          type="button"
          onClick={handleButtonClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-[10px] font-black uppercase tracking-wider hover:bg-zinc-800 shadow-sm transition-all active:scale-95 cursor-pointer"
          title={`Enviar CV a ${cleanEmail} (Click para opciones y copiar)`}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">¡Copiado!</span>
            </>
          ) : (
            <>
              <Mail className="h-3 w-3" />
              <span>Email</span>
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleButtonClick}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-zinc-900 text-white font-black text-xs uppercase tracking-widest hover:bg-zinc-800 shadow-lg shadow-zinc-900/10 transition-all active:scale-95 cursor-pointer"
        >
          <Mail className="h-4 w-4" />
          <span>Enviar Currículum (Email)</span>
        </button>
      )}

      {/* Modal interactivo con contención y dimensiones perfectas */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-[92vw] sm:max-w-md rounded-[2rem] bg-white p-6 sm:p-7 border border-zinc-200 shadow-2xl space-y-5 overflow-hidden box-border">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest">
              <Mail className="h-3.5 w-3.5" />
              <span>Canal de Postulación por Correo</span>
            </div>
            <DialogTitle className="text-lg sm:text-xl font-black uppercase tracking-tight italic text-foreground leading-tight">
              Enviar Currículum a {companyName}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Dirección oficial de selección para el cargo <strong>{jobTitle}</strong>.
            </DialogDescription>
          </DialogHeader>

          {/* Caja con email y botón de copia */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between gap-3 w-full box-border min-w-0">
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-bold text-muted-foreground uppercase block tracking-wider">
                Correo Electrónico
              </span>
              <span className="text-xs sm:text-sm font-black font-mono text-foreground truncate block select-all">
                {cleanEmail}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="rounded-xl text-[11px] font-black uppercase tracking-wider shrink-0 gap-1.5 h-8 px-3"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span className="text-emerald-600">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copiar</span>
                </>
              )}
            </Button>
          </div>

          {/* Opciones directas de apertura contenidas */}
          <div className="space-y-2 pt-1 w-full box-border">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 block">
              Elige cómo redactar tu correo
            </span>

            {/* Abrir en Gmail Web */}
            <a
              href={gmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-rose-50/80 hover:bg-rose-100 text-rose-950 border border-rose-200/70 font-bold text-xs transition-all box-border"
            >
              <span className="flex items-center gap-2 truncate">
                <span className="h-2 w-2 rounded-full bg-rose-600 shrink-0" />
                <span className="truncate">Abrir en Gmail Web</span>
              </span>
              <ExternalLink className="h-3.5 w-3.5 text-rose-700 shrink-0 ml-2" />
            </a>

            {/* Abrir en Outlook Web */}
            <a
              href={outlookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-sky-50/80 hover:bg-sky-100 text-sky-950 border border-sky-200/70 font-bold text-xs transition-all box-border"
            >
              <span className="flex items-center gap-2 truncate">
                <span className="h-2 w-2 rounded-full bg-sky-600 shrink-0" />
                <span className="truncate">Abrir en Outlook / Hotmail</span>
              </span>
              <ExternalLink className="h-3.5 w-3.5 text-sky-700 shrink-0 ml-2" />
            </a>

            {/* Abrir en App de Correo del Sistema (mailto) */}
            <a
              href={mailtoUrl}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900 border border-zinc-200 font-bold text-xs transition-all box-border"
            >
              <span className="flex items-center gap-2 truncate">
                <span className="h-2 w-2 rounded-full bg-zinc-700 shrink-0" />
                <span className="truncate">Abrir aplicación de correo local</span>
              </span>
              <Mail className="h-3.5 w-3.5 text-zinc-700 shrink-0 ml-2" />
            </a>
          </div>

          <div className="border-t border-zinc-100 pt-2 text-center">
            <p className="text-[10px] text-muted-foreground/70 italic">
              * La dirección de correo ya ha sido copiada a tu portapapeles.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
