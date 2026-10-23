"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useReducedMotion } from "framer-motion";
import { 
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
  const router = useRouter();

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
    { id: "TODAS", label: "Portada", icon: Sparkles, type: "category" as const },
    { id: "ECONOMÍA", label: "Economía & H2V", icon: TrendingUp, type: "category" as const },
    { id: "SII", label: "SII & Legal", icon: Layers, type: "category" as const },
    { id: "EMPLEOS", label: "Empleos PUQ", icon: Briefcase, type: "anchor" as const, targetId: "empleos", href: "/empleos" },
    { id: "CALCULADORA", label: "Sueldos", icon: Calculator, type: "anchor" as const, targetId: "calculadora", href: "/calculadora" },
  ];

  const handleAction = (item: typeof categories[number]) => {
    if (item.id === "TODAS") {
      onSelectCategory?.("TODAS");
      window.scrollTo({ top: 0, behavior: shouldReduceMotion ? "auto" : "smooth" });
      return;
    }

    if (item.type === "category") {
      onSelectCategory?.(item.id);
      const target = document.getElementById("flujo-noticias");
      if (target) {
        target.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth", block: "start" });
      }
      return;
    }

    if (item.type === "anchor") {
      const el = document.getElementById(item.targetId);
      if (el) {
        el.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth", block: "start" });
        return;
      }
      if (item.href) {
        router.push(item.href);
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.95 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          aria-label="Navegación contextual rápida"
          className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-45 max-w-[96vw] sm:max-w-max bg-white/95 dark:bg-zinc-900/95 text-foreground backdrop-blur-2xl p-1 sm:p-2 rounded-full border border-border/80 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.22)] flex items-center gap-1 select-none"
        >
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 px-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => handleAction(cat)}
                  aria-label={`Ir a ${cat.label}`}
                  className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-[1.02]"
                      : cat.id === "CALCULADORA"
                      ? "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Icon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 ${
                    isSelected 
                      ? "text-primary-foreground" 
                      : cat.id === "CALCULADORA"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : ""
                  }`} />
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
              aria-label="Volver arriba de la página"
              className="p-2 sm:p-2.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
