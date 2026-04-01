'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Scale, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 py-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-10 text-[10px] font-black uppercase tracking-widest gap-2">
            <ChevronLeft className="h-4 w-4" /> Volver al Inicio
          </Button>
        </Link>
        
        <Card className="rounded-[3rem] border-border shadow-2xl overflow-hidden bg-white">
          <div className="bg-zinc-950 p-12 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full" />
             <Scale className="h-12 w-12 text-primary mx-auto mb-6" />
             <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-4">Términos y Condiciones</h1>
             <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Contapymepuq — Región de Magallanes</p>
          </div>
          <CardContent className="p-12 lg:p-20 space-y-10">
            <section className="space-y-4">
              <h2 className="text-xl font-black italic uppercase tracking-tight text-foreground">1. Servicios del Sistema Contapymepuq</h2>
              <p className="text-muted-foreground font-medium italic leading-relaxed">
                El acceso y uso de este portal, incluyendo la plataforma de dashboard y motor financiero en Punta Arenas, 
                está sujeto a los presentes términos. Contapymepuq es una herramienta de apoyo contable, no reemplaza la 
                auditoría final de un profesional certificado ante el SII.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-black italic uppercase tracking-tight text-foreground">2. Exactitud de los Indicadores</h2>
              <p className="text-muted-foreground font-medium italic leading-relaxed">
                Los indicadores económicos (UF, UTM, Dólar, IPSA) son obtenidos de fuentes públicas y financieras. 
                Aunque nuestro motor Python los procesa en tiempo real, Contapymepuq no se responsabiliza por retrasos 
                externos en la actualización de las fuentes oficiales chilenas.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black italic uppercase tracking-tight text-foreground">3. Responsabilidad Tributaria</h2>
              <p className="text-muted-foreground font-medium italic leading-relaxed">
                El usuario es responsable de la veracidad de los PDF y datos subidos (F29, RCV). El sistema procesa la 
                información tal como es recibida, aplicando reglas contables estandarizadas de la regulación chilena.
              </p>
            </section>

            <div className="pt-10 border-t border-border flex justify-between items-center text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">
               <span>Actualizado: 01 de Abril 2026</span>
               <span>Contapymepuq - Estándar Patagonia</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
