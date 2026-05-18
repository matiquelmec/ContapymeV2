'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Scale, ChevronLeft, GitCompare, RefreshCw, Landmark } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-10 text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-primary/5 hover:text-primary transition-all rounded-xl">
            <ChevronLeft className="h-4 w-4" /> Volver al Inicio
          </Button>
        </Link>
        
        <Card className="rounded-[3rem] border border-primary/10 shadow-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
          <div className="bg-gradient-to-br from-primary/[0.04] via-zinc-50/50 to-primary/[0.08] border-b border-primary/10 p-12 text-center relative overflow-hidden">
             {/* Auroras decorativas */}
             <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full" />
             <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full animate-pulse" />
             <Scale className="h-12 w-12 text-primary mx-auto mb-6 relative z-10" />
             <h1 className="text-4xl font-black text-foreground italic tracking-tighter uppercase mb-4 relative z-10">Términos y Condiciones</h1>
             <p className="text-primary text-[10px] font-black uppercase tracking-[0.25em] relative z-10">Contapymepuq — Región de Magallanes</p>
          </div>
          <CardContent className="p-12 lg:p-20 space-y-12">
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-xl border border-primary/20"><Landmark className="h-4 w-4" /></div>
                <h2 className="text-xl font-black italic uppercase tracking-tight text-foreground">1. Servicios del Sistema Contapymepuq y Regímenes Especiales</h2>
              </div>
              <p className="text-muted-foreground font-medium italic leading-relaxed text-sm">
                El acceso y uso de este portal, incluyendo la plataforma de control financiero, conciliación bancaria y depreciación de activos fijos en Punta Arenas, está sujeto a los presentes términos. El sistema provee soporte parametrizado para regímenes especiales de Magallanes (Ley Navarino, Zona Franca, Ley 889 de bonificación a la mano de obra). Contapymepuq es una herramienta automatizada de procesamiento contable y no sustituye la supervisión final y validación técnica de un Contador General o Auditor calificado ante el Servicio de Impuestos Internos (SII).
              </p>
            </section>
            
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20"><RefreshCw className="h-4 w-4" /></div>
                <h2 className="text-xl font-black italic uppercase tracking-tight text-foreground">2. Sincronización Realtime y Veracidad de Indicadores</h2>
              </div>
              <p className="text-muted-foreground font-medium italic leading-relaxed text-sm">
                Los indicadores económicos de referencia (UF, UTM, Dólar, Euro, IPSA, Cobre, Petróleo y velocidad de viento local en Magallanes) se obtienen de fuentes públicas oficiales y APIs autorizadas, sincronizándose de forma activa a través de Supabase Realtime WebSockets. A pesar de que nuestro motor de datos los mantiene al día, Contapymepuq no garantiza la infalibilidad total ante interrupciones de red externas y el usuario asume la responsabilidad de verificar los montos definitivos en caso de discrepancias de conexión indicadas en la marquesina superior.
              </p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500/10 text-sky-600 rounded-xl border border-sky-500/20"><GitCompare className="h-4 w-4" /></div>
                <h2 className="text-xl font-black italic uppercase tracking-tight text-foreground">3. Inmutabilidad y Auditoría Criptográfica</h2>
              </div>
              <p className="text-muted-foreground font-medium italic leading-relaxed text-sm">
                Contapymepuq ofrece una funcionalidad exclusiva de certificación e inmutabilidad de balances y reportes financieros mediante firmas hash SHA-256 únicas. Al emitir un reporte certificado, este queda registrado de manera inalterable. El usuario comprende y acepta que modificar el PDF o la data del registro contable de manera externa invalidará el hash único generado, imposibilitando su posterior validación en procesos de auditoría externa o ante instituciones financieras.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black italic uppercase tracking-tight text-foreground">4. Responsabilidad Tributaria y Declaraciones LRE</h2>
              <p className="text-muted-foreground font-medium italic leading-relaxed text-sm">
                El usuario es el único responsable de la veracidad e integridad de los datos cargados en el sistema (cartolas bancarias, exenciones asignadas, activos fijos y exenciones de sueldos para el Libro de Remuneraciones Electrónico LRE). El software realiza cálculos automáticos basados en los ingresos del usuario y la normativa del SII y la DT vigentes a la fecha de procesamiento.
              </p>
            </section>

            <div className="pt-10 border-t border-border flex justify-between items-center text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">
               <span>Actualizado: 18 de Mayo 2026</span>
               <span>Contapymepuq - Estándar Patagonia</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
