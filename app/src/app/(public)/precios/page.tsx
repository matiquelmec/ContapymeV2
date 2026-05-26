import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function PreciosPage() {
  return (
    <section className="py-24 bg-zinc-50/50 scroll-mt-32">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Planes & Suscripciones</h2>
          <h3 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-foreground">
            Inversión Estratégica <br /><span className="text-muted-foreground/30">para tu Gestión.</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "Personal Patagonia",
              price: "$19.990",
              limit: "1 Empresa",
              features: [
                "Facturación DTE Estándar",
                "Conciliación Bancaria Básica",
                "Soporte Estándar por Ticket",
                "Hemeroteca Regional",
                "Excluye Multiusuario y LRE"
              ],
              label: "Económico"
            },
            {
              name: "Estudio Contable",
              price: "$44.990",
              limit: "Hasta 5 Empresas",
              features: [
                "Todo lo de Personal Patagonia",
                "Gestión Multiusuario y Colaboración",
                "Exportación Oficial LRE",
                "Facturación DTE Avanzada",
                "Soporte Prioritario"
              ],
              popular: true,
              label: "Inteligente"
            },
            {
              name: "Consorcio Fueguino",
              price: "$89.990",
              limit: "Empresas Ilimitadas",
              features: [
                "Todo lo de Estudio Contable",
                "Auditoría Ledger Blockchain (SHA-256)",
                "Soporte Dedicado 24/7",
                "Reportabilidad Consolidada",
                "Acceso API e Integraciones"
              ],
              label: "Potencia"
            },
          ].map((plan, i) => (
            <div key={i} className={`p-10 rounded-[2.5rem] bg-white border ${plan.popular ? 'border-primary shadow-2xl ring-4 ring-primary/5' : 'border-border shadow-xl'} relative overflow-hidden transition-all hover:scale-105`}>
              {plan.popular && <span className="absolute top-6 right-6 bg-primary text-primary-foreground text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-tighter">{plan.label}</span>}
              {!plan.popular && <span className="absolute top-6 right-6 bg-zinc-100 text-zinc-500 text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-tighter">{plan.label}</span>}

              <div className="mb-6 space-y-1">
                <h4 className="text-xl font-black uppercase italic tracking-tight">{plan.name}</h4>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">{plan.limit}</p>
              </div>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-3xl font-black text-foreground">{plan.price}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">/ Mes</span>
              </div>

              <div className="pt-6 border-t border-zinc-100 mb-8 space-y-4">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic">Herramientas Incluidas:</p>
                <ul className="space-y-3">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-xs font-bold text-zinc-600 italic leading-tight">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>

              <Link href="/login">
                <Button className={`w-full rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] ${plan.popular ? 'bg-primary shadow-xl shadow-primary/20' : 'bg-transparent border-2 border-border text-foreground hover:bg-zinc-50'}`}>
                  Iniciar Prueba 7 Días
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
