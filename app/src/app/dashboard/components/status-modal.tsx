'use client'

import React from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info,
  X,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type StatusType = 'success' | 'error' | 'warning' | 'info'

interface StatusModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: StatusType
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function StatusModal({ 
  open, 
  onOpenChange, 
  type, 
  title, 
  description,
  actionLabel,
  onAction 
}: StatusModalProps) {
  
  const config = {
    success: {
      icon: <CheckCircle2 className="w-12 h-12 text-emerald-500" />,
      bg: "bg-emerald-500/5",
      border: "border-emerald-500/20",
      accent: "bg-emerald-500",
      shadow: "shadow-emerald-500/20"
    },
    error: {
      icon: <AlertCircle className="w-12 h-12 text-rose-500" />,
      bg: "bg-rose-500/5",
      border: "border-rose-500/20",
      accent: "bg-rose-500",
      shadow: "shadow-rose-500/20"
    },
    warning: {
      icon: <AlertTriangle className="w-12 h-12 text-amber-500" />,
      bg: "bg-amber-500/5",
      border: "border-amber-500/20",
      accent: "bg-amber-500",
      shadow: "shadow-amber-500/20"
    },
    info: {
      icon: <Info className="w-12 h-12 text-blue-500" />,
      bg: "bg-blue-500/5",
      border: "border-blue-500/20",
      accent: "bg-blue-500",
      shadow: "shadow-blue-500/20"
    }
  }

  const { icon, bg, border, accent, shadow } = config[type]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[90vw] p-0 overflow-hidden border-none rounded-[2.5rem] bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-300">
        <div className={cn("p-10 flex flex-col items-center text-center space-y-6", bg)}>
          <div className={cn("p-6 rounded-full bg-white shadow-xl border-2", border)}>
            {icon}
          </div>
          
          <div className="space-y-2">
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs font-bold leading-relaxed text-slate-500 px-4">
              {description}
            </DialogDescription>
          </div>
        </div>

        <DialogFooter className="p-8 bg-slate-50/50 flex flex-col sm:flex-row gap-3">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="rounded-2xl font-black uppercase text-[10px] h-12 px-8 text-slate-400 hover:bg-slate-100/50"
          >
            Cerrar
          </Button>
          {actionLabel && (
            <Button 
              onClick={() => {
                if (onAction) onAction()
                onOpenChange(false)
              }}
              className={cn(
                "rounded-2xl font-black uppercase text-[10px] h-12 px-10 shadow-lg transition-all hover:scale-[1.05] active:scale-95 flex items-center gap-2",
                accent,
                "text-white hover:opacity-90",
                shadow
              )}
            >
              {actionLabel}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
