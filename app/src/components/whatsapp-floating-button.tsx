"use client";

import React from "react";
import { WhatsAppIcon } from "@/components/social-icons";

export function WhatsAppFloatingButton() {
  const whatsappUrl = "https://wa.me/56944444565?text=" + encodeURIComponent("¡Hola! Quisiera más información sobre los servicios contables y formalización de empresas en Contapymepuq.");

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 left-6 z-50 group flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 sm:px-5 sm:py-3 rounded-full shadow-[0_10px_30px_rgba(16,185,129,0.35)] border border-emerald-400/30 transition-all duration-300 hover:scale-105 active:scale-95"
    >
      <WhatsAppIcon className="w-6 h-6 fill-current animate-pulse" />
      <span className="hidden sm:inline-block text-[11px] font-black uppercase tracking-widest">
        WhatsApp
      </span>
    </a>
  );
}
