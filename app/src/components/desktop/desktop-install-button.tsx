'use client'

import React, { useState, useEffect } from 'react'
import { MonitorDown, CheckCircle2, ShieldCheck, Download } from 'lucide-react'
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

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Detectar si ya está en modo standalone / app instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success('¡ContaPymePUQ instalado con éxito en tu escritorio!');
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      setOpenModal(false);
    } else {
      setOpenModal(true);
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleInstallClick}
        className="rounded-xl border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 hover:text-emerald-950 font-black text-[10px] uppercase tracking-wider h-8 px-3 gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95"
        title="Instalar ContaPymePUQ en tu PC o Mac para acceso rápido y modo offline"
      >
        <MonitorDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span className="hidden sm:inline">Instalar en PC</span>
      </Button>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="rounded-3xl max-w-md p-6">
          <DialogHeader className="space-y-2">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 w-fit mx-auto">
              <MonitorDown className="w-8 h-8" />
            </div>
            <DialogTitle className="text-center font-black uppercase text-base tracking-tight text-foreground">
              Instalar ContaPymePUQ en tu PC
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground leading-relaxed">
              Disfruta de una experiencia de escritorio ultrarrápida con inicio instantáneo y resiliencia offline ante cortes de red.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-2.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Acceso directo en barra de tareas y escritorio sin navegador</span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/40">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Operatividad local en faenas y zonas extremas de Magallanes</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setOpenModal(false)} className="rounded-xl text-xs font-bold uppercase">
              Cerrar
            </Button>
            <Button
              onClick={() => {
                toast.info('Para instalar: haz clic en el ícono de instalar en la barra de direcciones de tu navegador (Chrome / Edge).');
                setOpenModal(false);
              }}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider"
            >
              Instalar Aplicación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
