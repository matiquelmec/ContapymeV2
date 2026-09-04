'use client'

import React, { useState } from 'react'
import { 
  Sparkles, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  Building2, 
  ChevronRight, 
  Loader2,
  Zap,
  Rocket
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export function SubscriptionBadge({ organizationId }: { organizationId?: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [selectedPlan, setSelectedPlan] = useState<'emprendedor' | 'pyme_pro' | 'estudio' | 'corporativo'>('pyme_pro')

  const plans = [
    {
      id: 'emprendedor',
      name: 'Plan Emprendedor',
      price: 9990,
      badge: 'Microempresa',
      desc: 'Hasta 3 trabajadores, DTEs y boletas ilimitadas, cálculo de F29.',
      popular: false,
    },
    {
      id: 'pyme_pro',
      name: 'Plan Pyme Pro',
      price: 24990,
      badge: '⭐ Más Popular',
      desc: 'Hasta 15 trabajadores, LRE automático, contratos + 1 aviso de empleo gratis cada 2 meses.',
      popular: true,
    },
    {
      id: 'estudio',
      name: 'Estudio Contable',
      price: 49990,
      badge: 'Contadores',
      desc: 'Multi-empresa, hasta 100 trabajadores, conciliación y reportes avanzados.',
      popular: false,
    },
    {
      id: 'corporativo',
      name: 'Corporativo',
      price: 89990,
      badge: 'Faena / Gran Pyme',
      desc: 'Trabajadores ilimitados, turnos 7x7/14x14, soporte tributario prioritario.',
      popular: false,
    },
  ]

  const handlePay = async (planId: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout/create-subscription-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: planId,
          billingCycle,
          organizationId,
          returnTo: typeof window !== 'undefined' ? window.location.pathname : '/dashboard',
        }),
      })

      const data = await res.json()
      if (data.success && data.init_point) {
        toast.loading('Redirigiendo a Mercado Pago...')
        window.location.href = data.init_point
      } else {
        toast.error(data.error || 'Error al conectar con Mercado Pago')
        setLoading(false)
      }
    } catch (e: any) {
      toast.error('Error al procesar la solicitud de pago.')
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-950 transition-all hover:scale-105 active:scale-95 shadow-sm group cursor-pointer">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
        <Rocket className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <div className="text-left leading-none hidden sm:block">
          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 block">
            Acceso Lanzamiento
          </span>
          <span className="text-[11px] font-bold text-foreground">
            100% Habilitado
          </span>
        </div>
        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-emerald-700 text-white shadow-sm group-hover:bg-emerald-800 transition-colors shrink-0">
          <span className="hidden sm:inline">Ver Planes ➔</span>
          <span className="sm:hidden">Planes</span>
        </span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-6 sm:p-8 bg-white border border-border">
        <DialogHeader className="text-center space-y-3 pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-widest mx-auto">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Periodo Exclusivo de Lanzamiento Regional
          </div>
          <DialogTitle className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight text-foreground">
            Acceso Completo y Planes Oficiales
          </DialogTitle>
          <p className="text-xs text-muted-foreground font-medium max-w-lg mx-auto leading-relaxed">
            Tu cuenta cuenta actualmente con <strong>acceso completo a todos los módulos</strong>. Conoce nuestros planes para formalizar tu suscripción o apoyar el ecosistema cuando lo desees.
          </p>

          {/* Toggle Mensual / Anual */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Mensual
            </span>
            <button
              type="button"
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${billingCycle === 'annual' ? 'bg-emerald-600' : 'bg-zinc-300'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className={`text-xs font-bold flex items-center gap-1 ${billingCycle === 'annual' ? 'text-emerald-600' : 'text-muted-foreground'}`}>
              Anual <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider">20% OFF</span>
            </span>
          </div>
        </DialogHeader>

        {/* Tarjetas de Planes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
          {plans.map((p) => {
            const finalPrice = billingCycle === 'annual' ? Math.round(p.price * 0.8) : p.price
            const isSelected = selectedPlan === p.id

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlan(p.id as any)}
                className={`relative flex flex-col justify-between p-5 rounded-3xl border-2 transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-primary bg-primary/5 shadow-xl scale-[1.02]' 
                    : 'border-border bg-white hover:border-zinc-300 hover:shadow-md'
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-white text-[9px] font-black uppercase tracking-widest shadow-md">
                    Recomendado
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800">
                      {p.badge}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight text-foreground">
                      {p.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-medium pt-1 leading-snug">
                      {p.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/60 mt-4 space-y-3">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-foreground">
                        ${finalPrice.toLocaleString('es-CL')}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-bold">/mes</span>
                    </div>
                    {billingCycle === 'annual' && (
                      <span className="text-[9px] text-emerald-700 font-bold block">
                        Facturado anualmente (Ahorras 2 meses)
                      </span>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePay(p.id)
                    }}
                    disabled={loading}
                    className={`w-full rounded-2xl h-10 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary hover:bg-primary/90 text-white shadow-md'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-foreground'
                    }`}
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Suscribirse ➔'
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Garantías y Seguridad */}
        <div className="p-4 rounded-2xl bg-zinc-50 border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Pagos seguros procesados en Chile por <strong>Mercado Pago</strong>.</span>
          </div>
          <div className="flex items-center gap-3">
            <span>✨ Cancela o cambia de plan cuando quieras.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
