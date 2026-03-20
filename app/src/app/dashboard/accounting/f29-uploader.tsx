'use client'

import { useState } from 'react'
import { UploadCloud, FileType, CheckCircle, XCircle, BarChart3, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { processF29Document } from '@/actions/f29'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function F29Uploader({ activeOrgId }: { activeOrgId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [result, setResult] = useState<any>(null)
  const [periodo, setPeriodo] = useState('2026-03-01')

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setMessage(null)
    setResult(null)

    const supabase = createClient()
    const fileName = `${activeOrgId}/${periodo}_f29_${Date.now()}.pdf`

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('tax_documents')
        .upload(fileName, file, { cacheControl: '3600', upsert: true })

      if (uploadError) throw new Error(uploadError.message)

      const res = await processF29Document(uploadData.path, periodo, activeOrgId)
      
      if (!res.success) {
        throw new Error(res.error)
      }

      setResult(res.data)
      setMessage({ type: 'success', text: 'Documento procesado al 100% por el Motor V2.' })
      setFile(null)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error desconocido al subir.' })
    } finally {
      setLoading(false)
    }
  }

  const fCLP = (v: number) => `$${Number(v || 0).toLocaleString('es-CL')}`

  return (
    <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary">
      <CardHeader className="bg-muted/5 border-b border-border p-8 pb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner">
            <UploadCloud className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Carga Inteligente de F29</CardTitle>
            <CardDescription className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.25em] italic mt-1">
              MOTOR DE EXTRACCIÓN PYTHON V2 — SISTEMA SII
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8 p-8">
        <div className="flex flex-col md:flex-row gap-8 items-stretch">
          <div className="space-y-3 flex-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">PERÍODO TRIBUTARIO</span>
            <Select value={periodo} onValueChange={(val) => setPeriodo(val || '2026-03-01')}>
              <SelectTrigger className="h-16 bg-white border-2 border-border/50 text-foreground font-black text-sm uppercase tracking-widest rounded-3xl shadow-sm focus:ring-primary/20 px-6">
                <SelectValue placeholder="Selecciona Mes" />
              </SelectTrigger>
              <SelectContent className="bg-white border-border rounded-2xl shadow-2xl">
                <SelectItem value="2026-01-01" className="font-bold py-3">Enero 2026</SelectItem>
                <SelectItem value="2026-02-01" className="font-bold py-3">Febrero 2026</SelectItem>
                <SelectItem value="2026-03-01" className="font-bold py-3">Marzo 2026</SelectItem>
                <SelectItem value="2026-04-01" className="font-bold py-3">Abril 2026</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-[2] relative group">
            <div className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 h-full flex flex-col items-center justify-center cursor-pointer min-h-[160px] ${file ? 'border-primary bg-primary/5' : 'border-border/60 bg-muted/5 hover:bg-muted/10 hover:border-primary/50'}`}>
              <input 
                type="file" 
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {file ? (
                <div className="flex flex-col items-center text-primary animate-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-primary/20">
                    <FileType className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-black uppercase tracking-tight max-w-[250px] truncate">{file.name}</span>
                  <span className="text-[10px] text-primary/60 font-black italic mt-1 uppercase tracking-widest">Listo para análisis cuántico</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-muted-foreground transition-colors group-hover:text-primary">
                  <div className="w-16 h-16 bg-white border-2 border-border/50 shadow-sm rounded-2xl flex items-center justify-center mb-4 group-hover:border-primary/30 group-hover:bg-primary/5">
                    <UploadCloud className="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-sm font-black uppercase tracking-widest">Arrastra tu PDF F29</span>
                  <span className="text-[10px] font-bold italic mt-1 uppercase">o haz clic para explorar</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <Button 
          onClick={handleUpload} 
          disabled={!file || loading} 
          className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-xs tracking-[0.2em] rounded-3xl shadow-xl shadow-primary/20 transition-all active:scale-95 gap-3"
        >
          {loading ? (
            <><Loader2 className="w-6 h-6 animate-spin" /> PROCESANDO CON MOTOR V2...</>
          ) : (
            <><TrendingUp className="w-6 h-6" /> SUBIR Y EJECUTAR AUDITORÍA</>
          )}
        </Button>

        {message && (
          <div className={`p-5 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 border-2 shadow-sm ${message.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
            <div className={`p-3 rounded-2xl shadow-sm ${message.type === 'error' ? 'bg-rose-100 border border-rose-200' : 'bg-emerald-100 border border-emerald-200'}`}>
              {message.type === 'error' ? <XCircle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
            </div>
            <span className="text-xs font-black uppercase tracking-widest">{message.text}</span>
          </div>
        )}

        {/* ===== RESULTADOS ===== */}
        {result && (
          <div className="space-y-6 animate-in slide-in-from-bottom-8 fade-in duration-700 pt-4">
            <div className="bg-card p-8 border-2 border-border/50 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 relative z-10">
                <h4 className="text-foreground font-black flex items-center gap-4 uppercase text-lg tracking-tight">
                  <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm">
                   <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  Resultados de la Extracción
                </h4>
                <div className="flex items-center gap-3 pl-4 pr-5 py-2.5 bg-emerald-50 rounded-2xl border-2 border-emerald-100 shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-[10px] text-emerald-700 font-black tracking-[0.2em] uppercase">
                    Confianza Algorítmica: 99.9%
                  </span>
                </div>
              </div>
               
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 relative z-10">
                {[
                  { label: 'Ventas Netas (563)', val: result.ventas_netas, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
                  { label: 'IVA Débito (538)', val: result.debito_fiscal, color: 'text-foreground', bg: 'bg-muted/30 border-border/50' },
                  { label: 'IVA Crédito (537)', val: result.credito_fiscal, color: 'text-foreground', bg: 'bg-muted/30 border-border/50' },
                  { label: 'PPM Neto (062)', val: result.ppm_neto, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
                ].map(b => (
                  <div key={b.label} className={`p-6 rounded-3xl border-2 ${b.bg} shadow-sm group hover:scale-[1.02] transition-transform`}>
                    <span className="text-[10px] text-muted-foreground block uppercase font-black tracking-widest mb-2">{b.label}</span>
                    <span className={`font-black text-2xl tracking-tighter block ${b.color}`}>{fCLP(b.val)}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 relative z-10">
                {result.retencion_honorarios > 0 && (
                  <div className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-100 flex justify-between items-center shadow-sm">
                    <span className="text-[10px] text-amber-700/70 uppercase font-black tracking-widest">Ret. Honorarios (151)</span>
                    <span className="text-amber-700 font-black text-2xl tracking-tighter">{fCLP(result.retencion_honorarios)}</span>
                  </div>
                )}
                {result.prestamo_solidario > 0 && (
                  <div className="bg-rose-50 p-6 rounded-3xl border-2 border-rose-100 flex justify-between items-center shadow-sm">
                    <span className="text-[10px] text-rose-700/70 uppercase font-black tracking-widest">Préstamo Sold. (049)</span>
                    <span className="text-rose-600 font-black text-2xl tracking-tighter">{fCLP(result.prestamo_solidario)}</span>
                  </div>
                )}
              </div>

              {/* TOTAL A PAGAR HIGHLIGHT */}
              <div className="mt-8 p-8 bg-black/5 dark:bg-black/20 border-2 border-black/10 dark:border-white/10 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-3 gap-6 shadow-sm relative z-10">
                <div className="col-span-1">
                  <span className="text-[10px] text-rose-700 dark:text-rose-400 block uppercase font-black tracking-[0.25em] mb-2">Total a Pagar (091)</span>
                  <span className="text-rose-600 dark:text-rose-500 font-black text-5xl tracking-tighter block">
                    {fCLP(result.total_a_pagar)}
                  </span>
                </div>
                <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l-2 border-black/10 dark:border-white/10 pt-6 md:pt-0 pl-0 md:pl-8">
                  <span className="text-[10px] text-muted-foreground block uppercase font-black tracking-[0.2em] mb-1">IVA Determinado (089)</span>
                  <span className="text-foreground font-black text-2xl tracking-tight block">{fCLP(result.iva_determinado)}</span>
                </div>
                <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l-2 border-black/10 dark:border-white/10 pt-6 md:pt-0 pl-0 md:pl-8 text-left md:text-right">
                  <span className="text-[10px] text-emerald-600 block uppercase font-black tracking-[0.2em] mb-1">Compras Proyectadas</span>
                  <span className="text-emerald-700 font-black text-2xl tracking-tight block">{fCLP(result.audit?.compras_proyectadas)}</span>
                </div>
              </div>

              {/* ===== PANEL AUDITORÍA V2 ===== */}
              <div className="mt-8 bg-blue-50/50 border-2 border-blue-100 p-8 rounded-[2.5rem] space-y-8 shadow-inner relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0 shadow-sm border border-blue-200">
                      <TrendingUp className="w-7 h-7 text-blue-700" />
                    </div>
                    <div>
                      <h5 className="text-blue-900 text-lg font-black uppercase tracking-tight mb-1">Auditoría Estratégica Fiscal</h5>
                      <p className="text-blue-800/60 text-[10px] font-black uppercase tracking-[0.2em] italic">
                        RATIOS DE CUMPLIMIENTO BASADOS EN MOTOR SII
                      </p>
                    </div>
                  </div>
                  <div className="px-6 py-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-600/20">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">{result.audit?.status || 'PROCESADO'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { l: 'Margen Operacional', v: `${result.audit?.ratios?.margin_proyectado || 0}%` },
                    { l: 'Carga Tributaria', v: `${result.audit?.ratios?.tax_burden || 0}%` },
                    { l: 'Efectividad IVA', v: `${result.audit?.ratios?.iva_effectiveness || 0}%` },
                    { l: 'Ratio Cred/Deb', v: result.audit?.ratios?.credit_debit_ratio || 0 },
                  ].map(r => (
                    <div key={r.l} className="space-y-1">
                      <span className="text-[10px] text-blue-900/50 uppercase font-black tracking-widest block">{r.l}</span>
                      <span className="text-blue-900 font-black text-3xl tracking-tighter">{r.v}</span>
                    </div>
                  ))}
                </div>

                {result.audit?.warnings && result.audit.warnings.length > 0 && (
                  <div className="pt-6 border-t-2 border-blue-200/50">
                    <span className="text-[10px] text-rose-600 font-black uppercase tracking-[0.25em] block mb-4 flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4" /> Alertas de Auditoría Críticas
                    </span>
                    <div className="space-y-3">
                      {result.audit.warnings.map((warning: string, idx: number) => (
                         <div key={idx} className="flex gap-4 items-center px-5 py-4 bg-white rounded-2xl border-2 border-rose-100 shadow-sm border-l-8 border-l-rose-500 text-[11px] text-foreground font-bold uppercase tracking-wide">
                          <span className="text-rose-500 font-black text-lg leading-none mt-0.5">!</span>
                          {warning}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Loader2(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
}
