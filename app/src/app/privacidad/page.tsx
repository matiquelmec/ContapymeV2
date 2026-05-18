'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Shield, ChevronLeft, MapPin, Lock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PrivacyPage() {
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
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full animate-pulse" />
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full" />
             <Shield className="h-12 w-12 text-primary mx-auto mb-6 relative z-10" />
             <h1 className="text-4xl font-black text-foreground italic tracking-tighter uppercase mb-4 relative z-10">Política de Privacidad</h1>
             <p className="text-primary text-[10px] font-black uppercase tracking-[0.25em] relative z-10">Contapymepuq — Región de Magallanes</p>
          </div>
          <CardContent className="p-12 lg:p-20 space-y-12">
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-xl border border-primary/20"><Lock className="h-4 w-4" /></div>
                <h2 className="text-xl font-black italic uppercase tracking-tight text-foreground">1. Protección de Datos Financieros y Criptográficos</h2>
              </div>
              <p className="text-muted-foreground font-medium italic leading-relaxed text-sm">
                En Contapymepuq, la seguridad contable y tributaria de nuestros clientes en Punta Arenas es nuestra prioridad absoluta. Toda la data procesada (Facturación SII, F29, Libros Diarios y Activos Fijos) es alojada en infraestructura de base de datos segura administrada bajo estrictas políticas de Row Level Security (RLS) y encriptación en reposo. Adicionalmente, el sellado de los balances y estados financieros certificados se realiza mediante firmas hash criptográficas SHA-256 únicas e inmutables.
              </p>
            </section>
            
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20"><Shield className="h-4 w-4" /></div>
                <h2 className="text-xl font-black italic uppercase tracking-tight text-foreground">2. Confidencialidad en Remuneraciones y Zona Extrema</h2>
              </div>
              <p className="text-muted-foreground font-medium italic leading-relaxed text-sm">
                La información de personal cargada para la emisión de liquidaciones masivas de sueldo y el Libro de Remuneraciones Electrónico (LRE) se procesa bajo confidencialidad estricta. Resguardamos los parámetros de exenciones específicas aplicables a zonas extremas (Zona Franca, Ley Navarino, Ley 889 y exenciones previsionales) asegurando que no se compartan ni utilicen datos de trabajadores para fines ajenos al estricto cumplimiento laboral ante la Dirección del Trabajo (DT).
              </p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500/10 text-sky-600 rounded-xl border border-sky-500/20"><MapPin className="h-4 w-4" /></div>
                <h2 className="text-xl font-black italic uppercase tracking-tight text-foreground">3. Transparencia y Diario Regional Descentralizado</h2>
              </div>
              <p className="text-muted-foreground font-medium italic leading-relaxed text-sm">
                Nuestra plataforma de noticias y hemeroteca regional descentralizada para Punta Arenas recopila información de fuentes públicas e integraciones del mercado para entregar resúmenes informativos y económicos de Magallanes. No rastreamos datos personales de navegación de nuestros lectores con fines publicitarios invasivos, manteniendo una experiencia libre de cookies de terceros y alineada con la honestidad informativa.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black italic uppercase tracking-tight text-foreground">4. Cumplimiento de la Ley 19.628 (Chile)</h2>
              <p className="text-muted-foreground font-medium italic leading-relaxed text-sm">
                Operamos bajo estricto apego a la Ley N° 19.628 de Protección de la Vida Privada de la legislación chilena. Garantizamos plenamente a todos nuestros usuarios los derechos de acceso, rectificación, cancelación y oposición (derechos ARCO) sobre los datos de sus empresas y registros contables almacenados en nuestra plataforma.
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
