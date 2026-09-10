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
          className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-max bg-white/90 dark:bg-zinc-900/90 text-foreground backdrop-blur-2xl p-1.5 sm:p-2 rounded-full border border-border/80 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)] items-center gap-1"
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
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors whitespace-nowrap"
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
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors whitespace-nowrap"
                  >
                    <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{cat.label}</span>
                  </a>
                );
              }

              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Botón Volver Arriba */}
          <div className="pl-1 border-l border-border/60">
            <button
              onClick={scrollToTop}
              title="Subir a la cabecera"
              className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
