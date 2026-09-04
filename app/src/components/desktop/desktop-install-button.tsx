'use client'

import React, { useState, useEffect } from 'react'
import { 
  MonitorDown, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Rocket, 
  ExternalLink,
  Laptop,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export function DesktopInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [openModal, setOpenModal] = useState(false)
  const [openSuccessModal, setOpenSuccessModal] = useState(false)

  useEffect(() => {
    // Registrar Service Worker para soporte offline
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('[PWA] Service Worker activo y registrado:', reg.scope);
      }).catch((err) => {
        console.warn('[PWA] Error registrando Service Worker:', err);
      });
    }

    // Capturar evento de instalación nativa PWA / Desktop
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setOpenModal(false);
      setOpenSuccessModal(true);
      toast.success('¡ContaPymePUQ instalado con éxito en tu escritorio!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Detectar si ya está en modo standalone / app instalada
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setOpenSuccessModal(true);
      }
      setDeferredPrompt(null);
      setOpenModal(false);
    } else {
      setOpenModal(true);
    }
  };

  const handleOpenApp = () => {
    setOpenSuccessModal(false);
    toast.success('Iniciando ContaPymePUQ en modo ventana de escritorio...');
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };

  return (
    <>
      {!isInstalled && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleInstallClick}
          className="hidden md:inline-flex rounded-xl border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 hover:text-emerald-950 font-black text-[10px] uppercase tracking-wider h-8 px-3 gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Instalar ContaPymePUQ en tu PC o Mac para acceso rápido y modo offline"
        >
          <MonitorDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Instalar en PC</span>
        </Button>
      )}

      {/* DIÁLOGO 1: PRE-INSTALACIÓN */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="rounded-3xl max-w-md p-6 bg-white border border-border shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 w-fit mx-auto border border-emerald-500/20">
              <Laptop className="w-8 h-8" />
            </div>
            <DialogTitle className="text-center font-black uppercase text-base tracking-tight text-foreground">
              Instalar ContaPymePUQ en tu PC
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground leading-relaxed">
              Disfruta de una experiencia de escritorio ultrarrápida con inicio instantáneo y resiliencia offline ante cortes de red.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-2.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-muted/50 border border-border/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium text-foreground">Acceso directo en barra de tareas y escritorio sin navegador</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-muted/50 border border-border/50">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium text-foreground">Operatividad local en faenas y zonas extremas de Magallanes</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="ghost" onClick={() => setOpenModal(false)} className="rounded-xl text-xs font-bold uppercase">
              Cerrar
            </Button>
            <Button
              onClick={() => {
                if (deferredPrompt) {
                  handleInstallClick();
                } else {
                  toast.info('Para instalar: haz clic en el ícono de instalar en la barra de direcciones de tu navegador (Chrome / Edge).');
                  setOpenModal(false);
                }
              }}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md"
            >
              Instalar Ahora ➔
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO 2: CONFIRMACIÓN Y CELEBRACIÓN DE INSTALACIÓN EXITOSA */}
      <Dialog open={openSuccessModal} onOpenChange={setOpenSuccessModal}>
        <DialogContent className="rounded-[2.5rem] max-w-md p-7 bg-gradient-to-b from-white via-zinc-50 to-emerald-50/30 border-2 border-emerald-500/40 shadow-2xl animate-in zoom-in-95 duration-300">
          <DialogHeader className="space-y-3 text-center">
            <div className="relative mx-auto w-fit">
              <div className="h-16 w-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 animate-bounce">
                <Rocket className="h-8 w-8" />
              </div>
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-xs shadow-md">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            </div>

            <DialogTitle className="font-black uppercase text-lg sm:text-xl tracking-tight text-foreground">
              ¡Instalación Exitosa! 🎉
            </DialogTitle>

            <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              <strong>ContaPymePUQ</strong> se ha instalado satisfactoriamente en tu computador. La aplicación ya está disponible en tu <strong>Escritorio y Barra de Tareas</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2 text-xs text-emerald-950">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Inicio ultrarrápido sin abrir pestañas</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Modo Faena / Offline activado automáticamente</span>
            </div>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => setOpenSuccessModal(false)}
              className="w-full sm:w-1/2 rounded-2xl border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-black text-xs uppercase tracking-wider h-11"
            >
              Cerrar y Continuar
            </Button>
            <Button
              onClick={handleOpenApp}
              className="w-full sm:w-1/2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider h-11 shadow-lg shadow-emerald-600/25 transition-all hover:scale-105"
            >
              <Rocket className="h-4 w-4 mr-1.5" /> Abrir Sistema
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
