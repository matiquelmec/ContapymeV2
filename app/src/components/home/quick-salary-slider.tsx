"use client";

import { useState } from "react";
import Link from "next/link";
import { Calculator, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateQuickNetSalary, type QuickSalaryBreakdown } from "@/lib/salary/quick-salary";

export { calculateQuickNetSalary, type QuickSalaryBreakdown };

export function QuickSalarySlider() {
  const [grossSalary, setGrossSalary] = useState<number>(1200000);
  const breakdown = calculateQuickNetSalary(grossSalary);

  const formatCLP = (val: number) => {
    return `$${val.toLocaleString("es-CL")}`;
  };

  return (
    <div className="group relative p-6 sm:p-7 rounded-[2.2rem] bg-white/60 dark:bg-zinc-900/60 border border-border/60 backdrop-blur-xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.06)] hover:border-primary/30 transition-all duration-500 flex flex-col justify-between overflow-hidden">
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Calculator className="h-4 w-4" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.22em] text-primary">
              Simulador Express de Sueldo
            </span>
          </div>

          <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            Ley Chile 2026
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-zinc-100/70 dark:bg-zinc-800/50 rounded-2xl border border-border/30">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">
              Sueldo Bruto
            </span>
            <span className="text-base sm:text-lg font-black text-foreground tabular-nums">
              {formatCLP(breakdown.gross)}
            </span>
          </div>

          <div className="p-3 bg-emerald-500/10 dark:bg-emerald-950/30 rounded-2xl border border-emerald-500/20">
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider block flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" /> Líquido al Bolsillo
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
              {formatCLP(breakdown.net)}
            </span>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
            <span>$500.000</span>
            <span className="text-primary font-black">Ajusta tu sueldo</span>
            <span>$3.500.000</span>
          </div>

          <input
            type="range"
            min={500000}
            max={3500000}
            step={50000}
            value={grossSalary}
            onChange={(e) => setGrossSalary(Number(e.target.value))}
            className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary"
            aria-label="Ajustar sueldo bruto para simulación"
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
          <span>Descuentos legales (~{breakdown.effectiveRetentionRate}%):</span>
          <span className="font-bold text-foreground tabular-nums">
            {formatCLP(breakdown.gross - breakdown.net)}
          </span>
        </div>
      </div>

      <div className="pt-4">
        <Link href={`/calculadora?sueldo=${grossSalary}`}>
          <Button 
            variant="outline"
            className="w-full text-[10px] font-black uppercase tracking-widest h-10 rounded-xl border-primary/30 text-primary hover:bg-primary/10 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Ver Desglose Completo & DL 889</span>
            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
