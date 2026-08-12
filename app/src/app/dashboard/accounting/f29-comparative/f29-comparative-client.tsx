"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar
} from "recharts";
import { 
  TrendingUp, TrendingDown, AlertCircle, ArrowUpRight, Calculator,
  Layers, Sparkles, Percent, Activity, ShieldCheck, Trash2, Calendar,
  CheckSquare, Square, History, Search, RefreshCw, Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function F29ComparativeClient({ 
  organizationId, 
  initialData 
}: { 
  organizationId: string, 
  initialData: any 
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [history, setHistory] = useState(initialData.history || []);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialData.history?.map((h: any) => h.id) || []));
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Confirmar eliminación institucional: ¿Está seguro de eliminar este registro histórico? Esta operación no se puede revertir.")) return;
    
    try {
      setIsDeleting(id);
      const res = await fetch(`http://localhost:8000/api/v1/f29/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory(history.filter((h: any) => h.id !== id));
        const newSelected = new Set(selectedIds);
        newSelected.delete(id);
        setSelectedIds(newSelected);
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  const togglePeriod = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const filteredHistory = history.filter((h: any) => selectedIds.has(h.id));

  const chartData = filteredHistory.map((h: any) => ({
    periodo: new Date(h.periodo).toLocaleDateString('es-CL', { month: 'short', year: '2-digit' }).toUpperCase(),
    "IVA a Pagar": h.total_a_pagar,
    "IVA Débito": h.debito_fiscal,
    "IVA Crédito": h.credito_fiscal,
    "Margen": h.ratios?.margin_proyectado || 0,
    "Carga": h.ratios?.tax_burden || 0,
    "Efectividad": h.ratios?.iva_effectiveness || 0
  }));

  if (!isMounted) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-card rounded-[2.5rem] border-2 border-border/50 shadow-sm" />
          ))}
        </div>
        <div className="h-[500px] bg-card rounded-[2.5rem] border-2 border-border/50 shadow-sm" />
      </div>
    );
  }

  const lastEntry = filteredHistory.length > 0 ? filteredHistory[filteredHistory.length - 1] : null;

  const totalPeriods = filteredHistory.length;
  const avgIVA = totalPeriods > 0 ? filteredHistory.reduce((acc: number, curr: any) => acc + curr.total_a_pagar, 0) / totalPeriods : 0;
  const lastMargin = lastEntry?.ratios?.margin_proyectado || 0;
  
  const trend = filteredHistory.length > 1
    ? (filteredHistory[filteredHistory.length - 1].total_a_pagar > filteredHistory[filteredHistory.length - 2].total_a_pagar ? 'up' : 'down')
    : 'stable';

  const fCLP = (v: number) => `$${Number(v || 0).toLocaleString('es-CL')}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-700" suppressHydrationWarning={true}>
      
      {/* 1. KPIs Premium */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden group hover:scale-[1.02] transition-all border-l-8 border-l-primary">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] flex items-center gap-2">
               <Calculator className="h-4 w-4 text-primary" /> Promedio Tributario
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className="text-3xl font-black tracking-tighter text-foreground truncate">{fCLP(avgIVA)}</div>
            <div className="flex items-center gap-2 mt-2 border-t border-border pt-2">
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-primary/5 border-primary/20 text-primary shadow-sm">{totalPeriods} CICLOS DATA</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden group hover:scale-[1.02] transition-all border-l-8 border-l-indigo-600">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] flex items-center gap-2">
               <Activity className="h-4 w-4 text-indigo-600" /> Rendimiento Margen
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className="text-3xl font-black tracking-tighter text-foreground">{lastMargin}%</div>
            <div className="flex items-center gap-2 mt-2 border-t border-border pt-2">
                 <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm">OPTIMIZACIÓN ACTIVA</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden group hover:scale-[1.02] transition-all border-l-8 border-l-emerald-600">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] flex items-center gap-2">
               <TrendingUp className="h-4 w-4 text-emerald-600" /> Vector de Pagos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className={`flex items-center gap-3 ${
              trend === 'up' ? 'text-rose-600' : 
              trend === 'down' ? 'text-emerald-700' : 
              'text-primary'
            }`}>
              {trend === 'up' ? <TrendingUp className="h-8 w-8" /> : 
               trend === 'down' ? <TrendingDown className="h-8 w-8" /> : 
               <Activity className="h-8 w-8" />}
              <div className="flex flex-col flex-1">
                <span className="font-black tracking-tighter uppercase text-lg leading-none">
                    {trend === 'up' ? 'ALZA' : trend === 'down' ? 'BAJA' : 'ESTABLE'}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">TENDENCIA</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary border-primary shadow-2xl shadow-primary/20 rounded-3xl overflow-hidden relative border-t-8 border-t-white/30">
          <CardHeader className="p-6 pb-2 z-10 relative">
            <CardTitle className="text-[10px] font-black text-primary-foreground uppercase tracking-[0.25em] flex items-center gap-2 opacity-90">
               <Sparkles className="h-4 w-4" /> Inteligencia V2
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2 z-10 relative">
            <p className="text-[11px] text-primary-foreground leading-relaxed font-bold italic opacity-90">
              {totalPeriods > 1 
                ? "Algoritmos en ejecución. Analizando variaciones inter-mensuales para detectar anomalías."
                : "Captura requerida. Suba más periodos para habilitar la potencia analítica."}
            </p>
          </CardContent>
          <div className="absolute -bottom-8 -right-8 opacity-20 pointer-events-none">
            <Zap className="h-40 w-40 text-white" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. Gráfico Principal */}
        <Card className="lg:col-span-2 bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary">
          <CardHeader className="bg-muted/5 border-b border-border p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-xl font-black uppercase tracking-tight text-foreground">Comportamiento Flujo IVA</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground italic">
                  CORRELACIÓN HISTÓRICA DÉBITO FISCAL VS CRÉDITO FISCAL
                </CardDescription>
              </div>
              <div className="flex gap-4 p-2.5 bg-white rounded-2xl border border-border/50 shadow-sm">
                 <div className="flex items-center gap-2 px-2"><div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-inner"></div><span className="text-[9px] text-foreground font-black uppercase tracking-widest">DÉBITO</span></div>
                 <div className="flex items-center gap-2 px-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-inner"></div><span className="text-[9px] text-foreground font-black uppercase tracking-widest">CRÉDITO</span></div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pb-4">
            <div className="h-[380px] w-full relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDeb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCre" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="periodo" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 900 }} />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontWeight: 900 }}
                    tickFormatter={(val) => {
                      if (val >= 1000000) return `$${(val/1000000).toFixed(1)}M`;
                      if (val >= 1000) return `$${(val/1000).toFixed(0)}k`;
                      return `$${val}`;
                    }} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px' }}
                    itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '4px' }}
                    labelStyle={{ fontSize: '10px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}
                  />
                  <Area type="monotone" dataKey="IVA Débito" stroke="#f43f5e" strokeWidth={5} fillOpacity={1} fill="url(#colorDeb)" dot={{ r: 5, fill: "#f43f5e", strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="IVA Crédito" stroke="#10b981" strokeWidth={5} fillOpacity={1} fill="url(#colorCre)" dot={{ r: 5, fill: "#10b981", strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 3. Sidebar Auditoría */}
        <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-emerald-500/10">
          <CardHeader className="bg-muted/5 border-b border-border p-8 pb-6">
            <CardTitle className="flex items-center gap-3 text-foreground font-black uppercase text-sm tracking-widest">
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>
                Solidez Fiscal IFRS
            </CardTitle>
            <CardDescription className="text-[10px] font-black text-muted-foreground uppercase mt-2 tracking-[0.2em] italic">MÉTRICAS DE CIERRE V2</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-5">
            {lastEntry ? (
              <div className="space-y-4">
                <div className="p-5 rounded-3xl bg-white border-2 border-border/50 flex justify-between items-center group hover:border-primary/50 transition-all shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">Carga Tributaria</span>
                    <span className="text-3xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors">{lastEntry.ratios?.tax_burden || 0}%</span>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-2xl group-hover:bg-primary/5 transition-colors">
                    <ArrowUpRight className="h-6 w-6 text-muted-foreground/30 group-hover:text-primary transition-all" />
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white border-2 border-border/50 flex justify-between items-center group hover:border-blue-500/50 transition-all shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">Efectividad IVA</span>
                    <span className="text-3xl font-black tracking-tighter text-foreground group-hover:text-blue-600 transition-colors">{lastEntry.ratios?.iva_effectiveness || 0}%</span>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-2xl group-hover:bg-blue-50 transition-colors">
                    <Percent className="h-6 w-6 text-muted-foreground/30 group-hover:text-blue-500 transition-all" />
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white border-2 border-border/50 flex justify-between items-center group hover:border-emerald-500/50 transition-all shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">Crédito / Débito</span>
                    <span className="text-3xl font-black tracking-tighter text-foreground group-hover:text-emerald-600 transition-colors">{lastEntry.ratios?.credit_debit_ratio || 0}</span>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-2xl group-hover:bg-emerald-50 transition-colors">
                    <Activity className="h-6 w-6 text-muted-foreground/30 group-hover:text-emerald-500 transition-all" />
                  </div>
                </div>

                <div className="mt-8 p-6 rounded-3xl bg-primary/5 border border-primary/10 shadow-inner relative overflow-hidden">
                  <div className="flex items-center gap-3 text-primary mb-3 relative z-10">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Observación Institucional</span>
                  </div>
                  <p className="text-[11px] text-foreground/70 font-bold leading-relaxed italic relative z-10">
                    Ratios ponderados mediante algoritmos de coherencia fiscal. Se recomienda mantener la carga tributaria bajo el 15% para optimizar liquidez operacional.
                  </p>
                </div>
              </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/5 border-2 border-dashed rounded-[2.5rem] border-border/50">
                   <div className="w-16 h-16 bg-muted/30 rounded-2xl flex items-center justify-center mb-5">
                    <Layers className="h-8 w-8 text-muted-foreground/40" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 italic">Sin acumulados activos</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>

       {/* 4. Minigráficos */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-indigo-500/10">
            <CardHeader className="bg-muted/5 border-b border-border p-8">
              <CardTitle className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                  <div className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg shadow-sm">
                    <ArrowUpRight className="h-4 w-4 text-indigo-600" />
                  </div>
                  Margen Proyectado
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-[250px] w-full relative">
                 <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={chartData} margin={{ left: -20, right: 10, top: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="periodo" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} tick={{ fontWeight: 900 }} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} unit="%" tick={{ fontWeight: 900 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '12px' }} itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }} labelStyle={{ fontSize: '10px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }} cursor={{fill: '#f8fafc'}} />
                      <Bar dataKey="Margen" fill="#4f46e5" radius={[8, 8, 0, 0]} barSize={24} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-rose-500/10">
            <CardHeader className="bg-muted/5 border-b border-border p-8">
              <CardTitle className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                  <div className="p-1.5 bg-rose-50 border border-rose-100 rounded-lg shadow-sm">
                   <ShieldCheck className="h-4 w-4 text-rose-600" />
                  </div>
                  Carga Tributaria
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-[250px] w-full relative">
                 <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="periodo" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} tick={{ fontWeight: 900 }} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} unit="%" tick={{ fontWeight: 900 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '12px' }} itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }} labelStyle={{ fontSize: '10px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }} />
                      <Area type="monotone" dataKey="Carga" stroke="#f43f5e" fill="#ffe4e6" fillOpacity={0.5} strokeWidth={4} dot={{ r: 4, fill: "#f43f5e", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
       </div>

       {/* 5. Tabla Maestra */}
       <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/5">
         <CardHeader className="bg-muted/5 border-b border-border p-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
               <div className="space-y-3">
                 <CardTitle className="text-2xl font-black tracking-tighter text-foreground uppercase flex items-center gap-4">
                   <div className="p-3 bg-white rounded-2xl border border-border shadow-sm">
                        <History className="h-6 w-6 text-primary" />
                   </div>
                   Ecosistema de Formularios
                 </CardTitle>
                 <CardDescription className="text-[10px] uppercase font-black tracking-[0.25em] text-muted-foreground italic ml-1">
                   CONTROL DE INTEGRIDAD Y REGISTROS PROCESADOS V2
                 </CardDescription>
               </div>
               <div className="flex items-center gap-4 bg-white p-2.5 rounded-[2rem] border-2 border-border/50 shadow-sm">
                  <div className="flex flex-col pl-6 pr-8 border-r-2 border-border/50">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1 leading-none">DATASET ACTIVO</span>
                    <span className="text-xl font-black text-foreground">
                      {selectedIds.size} <span className="text-[10px] font-bold text-muted-foreground tracking-normal italic">de {history.length}</span>
                    </span>
                  </div>
                  {selectedIds.size < history.length && (
                    <Button 
                      onClick={() => setSelectedIds(new Set(history.map((h: any) => h.id)))}
                      className="px-8 h-12 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-all"
                    >
                      RESTAURAR VISTA
                    </Button>
                  )}
               </div>
            </div>
         </CardHeader>
         <CardContent className="p-0">
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-border bg-muted/10 text-[10px] font-black text-foreground uppercase tracking-[0.25em]">
                   <th className="py-6 px-10 w-24 text-center">Incluir</th>
                   <th className="py-6 px-10">Periodo Fiscal de Cierre</th>
                   <th className="py-6 px-10">Compromiso Tributario</th>
                   <th className="py-6 px-10 w-48 text-center">Procedencia Tech</th>
                   <th className="py-6 px-10 text-right w-32">Operaciones</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-border/50">
                 {[...history].reverse().map((item: any) => (
                   <tr key={item.id} className="group hover:bg-primary/[0.02] transition-colors">
                     <td className="py-6 px-10">
                        <div className="flex justify-center">
                            <button 
                              onClick={() => togglePeriod(item.id)}
                              className={`transition-all transform hover:scale-[1.1] active:scale-90 ${selectedIds.has(item.id) ? 'text-primary' : 'text-muted-foreground/30'}`}
                            >
                              {selectedIds.has(item.id) ? <CheckSquare className="h-6 w-6" /> : <Square className="h-6 w-6" />}
                            </button>
                        </div>
                     </td>
                     <td className="py-6 px-10">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-2xl bg-muted/40 text-primary border border-border group-hover:bg-white shadow-sm transition-colors">
                             <Calendar className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 leading-none">Año Fiscal {new Date(item.periodo).getFullYear()}</span>
                              <span className="text-sm font-black text-foreground uppercase tracking-tight">
                                {new Date(item.periodo).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                              </span>
                          </div>
                        </div>
                     </td>
                     <td className="py-6 px-10">
                        <div className="inline-flex items-center gap-3 bg-muted/30 px-5 py-2.5 rounded-2xl border border-border group-hover:bg-white shadow-sm transition-colors">
                            <Calculator className="h-4 w-4 text-primary opacity-50" />
                            <span className="text-sm font-black text-foreground tracking-tighter">
                             {fCLP(item.total_a_pagar)}
                            </span>
                        </div>
                     </td>
                     <td className="py-6 px-10">
                        <div className="flex justify-center">
                            <Badge className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-[1rem] border shadow-sm ${
                              item.extraction_method === 'ocr_vision' 
                                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {item.extraction_method === 'ocr_vision' ? "Engine v4 AI" : "Data Nativa SII"}
                            </Badge>
                        </div>
                     </td>
                     <td className="py-6 px-10 text-right">
                        <button 
                          onClick={() => handleDelete(item.id)}
                          disabled={isDeleting === item.id}
                          className="p-3 text-muted-foreground/40 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-2xl border border-transparent hover:border-rose-100 shadow-none hover:shadow-xl hover:shadow-rose-100/30"
                        >
                          {isDeleting === item.id ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                        </button>
                     </td>
                   </tr>
                 ))}
                 
                 {history.length === 0 && (
                     <tr>
                        <td colSpan={5} className="py-32 text-center">
                            <div className="flex flex-col items-center gap-5 opacity-40">
                                <Search className="h-12 w-12" />
                                <span className="font-black uppercase tracking-[0.3em] text-[10px]">Sin registros históricos de auditoría</span>
                            </div>
                        </td>
                     </tr>
                 )}
               </tbody>
             </table>
           </div>
         </CardContent>
       </Card>
    </div>
  );
}
