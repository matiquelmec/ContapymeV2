'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Shield, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PrivacyPage() {
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
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full" />
             <Shield className="h-12 w-12 text-primary mx-auto mb-6" />
             <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-4">Política de Privacidad</h1>
             <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Contapymepuq — Región de Magallanes</p>
          </div>
          <CardContent className="p-12 lg:p-20 space-y-10">
            <section className="space-y-4">
              <h2 className="text-xl font-black italic uppercase tracking-tight text-foreground">1. Protección de Datos Financieros</h2>
              <p className="text-muted-foreground font-medium italic leading-relaxed">
                En Contapymepuq, la seguridad de la información contable y tributaria de nuestros clientes en Punta Arenas es nuestra prioridad absoluta. 
                Toda la data procesada (F29, Facturación, Nómina) es encriptada bajo estándares bancarios.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-black italic uppercase tracking-tight text-foreground">2. Uso de la Información</h2>
              <p className="text-muted-foreground font-medium italic leading-relaxed">
                Los datos recolectados se utilizan exclusivamente para el procesamiento automático por nuestro motor de inteligencia artificial regional, 
                permitiendo la generación de reportes tributarios sin intervención humana no autorizada.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black italic uppercase tracking-tight text-foreground">3. Ley 19.628 (Chile)</h2>
              <p className="text-muted-foreground font-medium italic leading-relaxed">
                Operamos bajo estricto cumplimiento de la ley chilena de protección de la vida privada, garantizando derechos de acceso, rectificación y cancelación.
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
