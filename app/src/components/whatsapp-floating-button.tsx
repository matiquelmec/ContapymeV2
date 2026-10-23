"use client";

import React, { useState } from "react";
import { WhatsAppIcon } from "@/components/social-icons";
import { Sparkles, Building2, Briefcase, Calculator, X } from "lucide-react";
import {
  OFFICIAL_WHATSAPP_PHONE,
  OFFICIAL_WHATSAPP_DISPLAY,
  WHATSAPP_QUICK_ACTIONS,
  buildWhatsAppUrl,
} from "@/lib/whatsapp-config";

export {
  OFFICIAL_WHATSAPP_PHONE,
  OFFICIAL_WHATSAPP_DISPLAY,
  WHATSAPP_QUICK_ACTIONS,
  buildWhatsAppUrl,
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  constitucion: Building2,
  "empleo-prensa": Briefcase,
  "contabilidad-nomina": Calculator,
};

export function WhatsAppFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-24 sm:bottom-6 left-4 sm:left-6 z-50 flex flex-col items-start gap-3 select-none">
      {/* Menú Contextual Desplegable */}
      {isOpen && (
        <div 
          role="dialog"
          aria-label="Opciones rápidas de contacto por WhatsApp"
          className="w-72 sm:w-80 rounded-3xl bg-slate-950/95 text-slate-100 p-4 border border-emerald-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header del Menú */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
                Oficial • Punta Arenas
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar opciones de WhatsApp"
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 font-medium pt-2.5 pb-3 leading-relaxed">
            ¿En qué podemos colaborar con tu negocio hoy? Selecciona una opción para escribirnos directo:
          </p>

          {/* Opciones Rápidas */}
          <div className="space-y-2">
            {WHATSAPP_QUICK_ACTIONS.map((action) => {
              const ActionIcon = ACTION_ICONS[action.id] || Sparkles;
              return (
                <a
                  key={action.id}
                  href={buildWhatsAppUrl(action.message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-900/80 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-slate-800 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors shrink-0">
                      <ActionIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                        {action.title}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {action.price}
                      </div>
                    </div>
                  </div>
                  <Sparkles className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0 transition-colors" />
                </a>
              );
            })}
          </div>

          {/* Enlace directo general */}
          <div className="pt-3 mt-3 border-t border-slate-800/80">
            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-emerald-400 transition-colors flex items-center justify-center gap-1.5 py-1"
            >
              <span>Otra consulta general ({OFFICIAL_WHATSAPP_DISPLAY})</span> ➔
            </a>
          </div>
        </div>
      )}

      {/* Botón Flotante Principal */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Abrir opciones de WhatsApp oficial Contapymepuq"
          className="group flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white min-h-[48px] min-w-[48px] px-4 py-3 rounded-full shadow-[0_10px_30px_rgba(16,185,129,0.35)] border border-emerald-400/30 transition-all duration-300 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <WhatsAppIcon className="w-5 h-5 fill-current animate-pulse shrink-0" />
          <span className="hidden sm:inline-block text-[11px] font-black uppercase tracking-widest">
            WhatsApp
          </span>
          <span className="inline-flex items-center justify-center bg-emerald-950/60 text-emerald-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-400/30">
            Oficial
          </span>
        </button>

        {!isOpen && (
          <a
            href={buildWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir chat directo de WhatsApp"
            className="hidden md:inline-flex items-center gap-1 px-3 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-300 hover:text-white border border-slate-700/60 shadow-md backdrop-blur-md transition-all hover:scale-102"
          >
            <span>Directo</span>
          </a>
        )}
      </div>
    </div>
  );
}
