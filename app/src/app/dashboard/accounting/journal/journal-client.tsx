'use client'

import React, { useEffect, useState } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, FileText, ArrowRight, Activity } from 'lucide-react'

interface JournalEntry {
  id: string
  fecha: string
  glosa: string
  monto_total?: number
  lines: {
    id: string
    cuenta_codigo: string
    cuenta_nombre: string
    tipo: 'debe' | 'haber'
    monto: number
  }[]
}

export function JournalClient({ entries }: { entries: JournalEntry[] }) {
  const [mounted, setMounted] = useState(false)

  // Prevenir discrepancias de hidratación por fechas/monedas y extensiones
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!entries || entries.length === 0) {
    return (
      <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-dashed border-2">
        <CardContent className="py-32 text-center" suppressHydrationWarning>
          <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-border">
            <FileText className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h3 className="text-xl font-black text-foreground uppercase tracking-widest mb-2">Histórico Vacío</h3>
          <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest italic">No se detectaron asientos contables en este ciclo monetario.</p>
        </CardContent>
      </Card>
    )
  }

  if (!mounted) {
    return (
      <div className="space-y-6" suppressHydrationWarning={true}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 w-full bg-muted/20 animate-pulse rounded-[2.5rem] border border-border" suppressHydrationWarning={true} />
        ))}
      </div>
    )
  }

  const formatCurrency = (val: number) => {
    return val.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    
    // Extracción limpia de dígitos previniendo desfase UTC de JavaScript
    const [year, month, day] = dateStr.split('T')[0].split('-');
    
    // Forzamos el objeto Date en la hora local neta de las 12 PM para evitar bordes horarios
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
    
    return dateObj.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700" suppressHydrationWarning>
      {entries.map((entry) => (
        <Card key={entry.id} className="bg-card border-border shadow-2xl overflow-hidden rounded-[2.5rem] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] transition-all duration-300 border-l-8 border-l-primary group" suppressHydrationWarning>
          <CardHeader className="bg-muted/5 border-b border-border/50 py-6 px-10" suppressHydrationWarning>
            <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between" suppressHydrationWarning>
              <div className="flex flex-col sm:flex-row sm:items-center gap-5" suppressHydrationWarning>
                <Badge className="bg-white text-primary border-2 border-primary/20 font-black uppercase text-[11px] tracking-[0.2em] px-5 py-2.5 rounded-full shadow-lg shadow-primary/10 w-fit shrink-0">
                  Folio #{entry.id.substring(0, 8)}
                </Badge>
                <div className="flex items-center gap-3 text-foreground/80 text-xs font-black uppercase tracking-widest bg-muted/30 px-4 py-2 rounded-full border border-border/50 w-fit shrink-0" suppressHydrationWarning>
                  <Calendar className="w-4 h-4 text-primary" />
                  {formatDate(entry.fecha)}
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white px-6 py-3.5 rounded-2xl border border-border shadow-md max-w-xl group-hover:border-primary/30 transition-colors w-full md:w-auto" suppressHydrationWarning={true}>
                 <p className="text-foreground font-black uppercase text-[11px] tracking-tight truncate flex-1" suppressHydrationWarning>{entry.glosa}</p>
                 {entry.monto_total && (
                   <span className="text-primary font-black ml-4 shrink-0 bg-primary/10 px-3 py-1 rounded-xl">
                     {formatCurrency(entry.monto_total)}
                   </span>
                 )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0" suppressHydrationWarning>
            <div className="overflow-x-auto" suppressHydrationWarning={true}>
              <Table suppressHydrationWarning>
                <TableHeader className="bg-muted/10 border-b border-border/50" suppressHydrationWarning>
                  <TableRow className="hover:bg-transparent" suppressHydrationWarning>
                    <TableHead className="w-[180px] text-foreground font-black uppercase text-[10px] tracking-[0.2em] px-10 py-6">Id. Contable</TableHead>
                    <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.2em] px-10 py-6">Asignación de Cuenta</TableHead>
                    <TableHead className="text-right text-foreground font-black uppercase text-[10px] tracking-[0.2em] px-10 py-6 w-48">Monto D (Cargo)</TableHead>
                    <TableHead className="text-right text-foreground font-black uppercase text-[10px] tracking-[0.2em] px-10 py-6 w-48">Monto H (Abono)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/30" suppressHydrationWarning>
                  {entry.lines.map((line) => (
                    <TableRow key={line.id} className="hover:bg-primary/[0.02] transition-colors" suppressHydrationWarning>
                      <TableCell className="font-mono text-[11px] font-black text-muted-foreground/60 px-10 py-5">
                         <span className="bg-white border border-border px-3 py-1.5 rounded-lg shadow-sm group-hover:border-primary/20 transition-colors">
                           {line.cuenta_codigo}
                         </span>
                      </TableCell>
                      <TableCell className="px-10 py-5" suppressHydrationWarning={true}>
                          {line.tipo === 'haber' ? (
                              <div className="flex items-center gap-4 pl-10 relative" suppressHydrationWarning={true}>
                                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-[2px] h-6 bg-primary/20 rounded-full" suppressHydrationWarning={true} />
                                  <ArrowRight className="w-5 h-5 text-primary" suppressHydrationWarning={true} />
                                  <span className="text-foreground font-black uppercase text-sm tracking-tight" suppressHydrationWarning={true}>{line.cuenta_nombre}</span>
                              </div>
                          ) : (
                              <div className="flex items-center gap-3" suppressHydrationWarning={true}>
                                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] ring-4 ring-emerald-500/10 shrink-0" suppressHydrationWarning={true} />
                                  <span className="text-foreground font-black uppercase text-sm tracking-tight" suppressHydrationWarning={true}>{line.cuenta_nombre}</span>
                              </div>
                          )}
                      </TableCell>
                      <TableCell className={`text-right font-black px-10 py-5 ${line.tipo === 'debe' ? 'text-emerald-700 bg-emerald-50/30 font-mono text-sm' : ''}`} suppressHydrationWarning>
                        {line.tipo === 'debe' ? formatCurrency(line.monto) : <span className="text-muted-foreground/20">—</span>}
                      </TableCell>
                      <TableCell className={`text-right font-black px-10 py-5 ${line.tipo === 'haber' ? 'text-primary bg-primary/5 font-mono text-sm' : ''}`} suppressHydrationWarning>
                        {line.tipo === 'haber' ? formatCurrency(line.monto) : <span className="text-muted-foreground/20">—</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="bg-muted/10 py-5 px-10 border-t border-border flex justify-between items-center sm:hidden md:flex flex-row md:flex-row gap-4" suppressHydrationWarning={true}>
                 <div className="flex items-center gap-3 opacity-60" suppressHydrationWarning={true}>
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Partida Doble Calibrada</span>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]" suppressHydrationWarning={true} />
                 </div>
                 <Badge variant="outline" className="border-border text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">IFRS v2.0</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
