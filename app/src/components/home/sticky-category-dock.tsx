"use client";

import { useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useReducedMotion } from "framer-motion";
import { 
  Compass, 
  TrendingUp, 
  Briefcase, 
  Calculator, 
  Sparkles, 
  Layers,
  ArrowUp
} from "lucide-react";

interface StickyCategoryDockProps {
  activeCategory?: string;
  onSelectCategory?: (cat: string) => void;
}

export function StickyCategoryDock({ activeCategory = "TODAS", onSelectCategory }: StickyCategoryDockProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { scrollY } = useScroll();
  const shouldReduceMotion = useReducedMotion();

  useMotionValueEvent(scrollY, "change", (latest) => {
    // Aparece cuando el usuario ha descendido más de 350px
    if (latest > 350) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: shouldReduceMotion ? "auto" : "smooth" });
  };

  const categories = [
    { id: "TODAS", label: "Portada", icon: Sparkles },
    { id: "ECONOMÍA", label: "Economía & H2V", icon: TrendingUp },
    { id: "SII", label: "SII & Legal", icon: Layers },
    { id: "EMPLEOS", label: "Empleos PUQ", icon: Briefcase, href: "#empleos" },
    { id: "CALCULADORA", label: "Sueldos", icon: Calculator, href: "/calculadora" },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.95 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          aria-label="Navegación contextual rápida"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[94vw] sm:max-w-max bg-zinc-950/90 text-white backdrop-blur-2xl p-1.5 sm:p-2 rounded-full border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center gap-1"
        >
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 px-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeCategory === cat.id;

              if (cat.href && cat.href.startsWith("#")) {
                return (
                  <a
                    key={cat.id}
                    href={cat.href}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider text-white/80 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                  >
                    <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                    <span>{cat.label}</span>
                  </a>
                );
              }

              if (cat.href && !cat.href.startsWith("#")) {
                return (
                  <a
                    key={cat.id}
                    href={cat.href}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider text-white/80 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                  >
                    <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400" />
                    <span>{cat.label}</span>
                  </a>
                );
              }

              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    isSelected
                      ? "bg-primary text-white shadow-md shadow-primary/30"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Botón Volver Arriba */}
          <div className="pl-1 border-l border-white/15">
            <button
              onClick={scrollToTop}
              title="Subir a la cabecera"
              className="p-1.5 sm:p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
