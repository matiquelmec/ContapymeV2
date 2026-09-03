'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FileText, ShieldAlert, Scale, Download, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface SIIDefenseDialogProps {
  organizationId: string
  activeOrgName?: string
}

const TEMPLATES = [
  {
    id: 'boletas_vs_facturas',
    title: 'Descargo por Boletas vs Facturas (Consumidor Final)',
    law: 'Art. 53 Ley de IVA & Art. 35 Reglamento',
    desc: 'Justifica ventas a consumidor final sin necesidad de factura y acredita pago íntegro de IVA F29.'
  },
  {
    id: 'citacion_art_63',
    title: 'Respuesta a Citación Art. 63 Código Tributario',
    law: 'Art. 63 D.L. 830 Código Tributario',
    desc: 'Descargo formal dentro de plazo frente a fiscalizaciones de la Unidad Punta Arenas.'
  },
  {
    id: 'rectificatoria_f29',
    title: 'Solicitud de Rectificatoria F29 (Error de Hecho)',
    law: 'Art. 127 Código Tributario',
    desc: 'Petición formal de subsanación de códigos y aclaración sin perjuicio fiscal.'
  },
  {
    id: 'condonacion_multas',
    title: 'Condonación de Intereses y Multas',
    law: 'Circular N° 50 SII & Art. 6° Letra B',
    desc: 'Petición fundada al Director Regional acreditando cumplimiento histórico y buena fe.'
  }
]

export function SIIDefenseDialog({ organizationId, activeOrgName }: SIIDefenseDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedType, setSelectedType] = useState('boletas_vs_facturas')
  const [periodosInput, setPeriodosInput] = useState('2025-01, 2025-02, 2025-03')
  const [numCitacion, setNumCitacion] = useState('')
  const [argumentos, setArgumentos] = useState('')
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const periodosList = periodosInput
        .split(',')
        .map(p => p.trim())
        .filter(Boolean)

      const payload = {
        organization_id: organizationId,
        document_type: selectedType,
        periodos: periodosList,
        numero_citacion: numCitacion || undefined,
        argumentos_adicionales: argumentos || undefined
      }

      // Llamada segura a través del BFF de Next.js (con JWT de Supabase)
      const res = await fetch('/api/sii/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        throw new Error('No se pudo generar el escrito legal.')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Escrito_SII_${selectedType}_${activeOrgName?.replace(/\s+/g, '_') || 'Empresa'}.docx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Escrito legal descargado exitosamente (.docx)')
      setOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Error al compilar documento Word')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        variant="outline"
        className="h-14 rounded-3xl border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-black uppercase text-xs tracking-[0.15em] px-8 shadow-lg gap-2"
      >
        <Scale className="w-5 h-5" />
        Defensa Tributaria SII (.docx)
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-400">
            <Scale className="w-6 h-6" />
            <DialogTitle className="text-xl font-bold">Generador de Escritos de Descargo SII</DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 text-xs">
            Redacta presentaciones formales dirigidas al Director Regional del SII de la XII Región (Punta Arenas).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Selector de Causa */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-2 block">
              1. Seleccione la Causa o Tipo de Observación:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TEMPLATES.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedType === t.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    {t.title}
                    {selectedType === t.id && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">{t.law}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Períodos involucrados */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">
              2. Períodos Fiscalizados (separados por coma):
            </label>
            <Input 
              value={periodosInput}
              onChange={e => setPeriodosInput(e.target.value)}
              placeholder="Ej: 2025-01, 2025-02, 2025-03"
              className="bg-slate-950 border-slate-800 text-xs text-slate-200"
            />
          </div>

          {/* Citación (si aplica) */}
          {selectedType === 'citacion_art_63' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                N° de Citación o Notificación:
              </label>
              <Input 
                value={numCitacion}
                onChange={e => setNumCitacion(e.target.value)}
                placeholder="Ej: Citación N° 1024/2026"
                className="bg-slate-950 border-slate-800 text-xs text-slate-200"
              />
            </div>
          )}

          {/* Argumentos opcionales */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">
              3. Antecedentes Específicos Adicionales (Opcional):
            </label>
            <Textarea 
              value={argumentos}
              onChange={e => setArgumentos(e.target.value)}
              placeholder="Detalle particular sobre la fiscalización, visita de inspectores o medios probatorios..."
              className="bg-slate-950 border-slate-800 text-xs text-slate-200 h-20"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-slate-800 pt-3">
          <Button 
            variant="ghost" 
            onClick={() => setOpen(false)}
            disabled={generating}
            className="text-slate-400"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={generating || !periodosInput.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-2"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {generating ? 'Compilando Word...' : 'Generar y Descargar (.docx)'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
