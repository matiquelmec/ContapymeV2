"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Save, 
  Building2, 
  Stethoscope, 
  ArrowUpCircle, 
  Users2, 
  ShieldCheck,
  RefreshCcw,
  Plus,
  Trash2,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
  Gavel,
  History,
  TrendingUp,
  DollarSign,
  Users
} from "lucide-react";
import { savePayrollSettings } from "@/actions/payroll-settings";
import { toast } from "sonner";

export default function SettingsClient({ organizationId, initialSettings }: { organizationId: string, initialSettings: any }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialSettings || {
    organization_id: organizationId,
    afp_configs: [],
    health_configs: [],
    uf_tope_afp: 87.8,
    uf_tope_salud: 83.3,
    sueldo_minimo: 529000,
    limite_asignacion_familiar: 1000000,
    asignacion_tramo_a: 13596,
    asignacion_tramo_b: 8397,
    asignacion_tramo_c: 2798,
    afc_indefinido_trabajador_pct: 0.6,
    afc_indefinido_empresa_pct: 2.4,
    afc_fijo_empresa_pct: 3.0,
    mutual_code: 'ACHS',
    caja_compensacion_code: '',
    rep_legal_nombre: '',
    rep_legal_rut: '',
    rep_legal_cargo: 'GERENTE GENERAL'
  });

  useEffect(() => {
    if (initialSettings) {
      setForm(initialSettings);
    } else {
      setForm({
        organization_id: organizationId,
        afp_configs: [],
        health_configs: [],
        uf_tope_afp: 87.8,
        uf_tope_salud: 83.3,
        sueldo_minimo: 529000,
        limite_asignacion_familiar: 1000000,
        asignacion_tramo_a: 13596,
        asignacion_tramo_b: 8397,
        asignacion_tramo_c: 2798,
        afc_indefinido_trabajador_pct: 0.6,
        afc_indefinido_empresa_pct: 2.4,
        afc_fijo_empresa_pct: 3.0,
        mutual_code: 'ACHS',
        caja_compensacion_code: '',
        rep_legal_nombre: '',
        rep_legal_rut: '',
        rep_legal_cargo: 'GERENTE GENERAL'
      });
    }
  }, [initialSettings, organizationId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await savePayrollSettings(form);
      if (res.success) {
        toast.success("Configuración institucional sincronizada.", {
            description: "Los parámetros han sido actualizados en el motor de cálculo.",
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        });
      } else {
        toast.error("Error al guardar: " + res.error);
      }
    } catch (error) {
      toast.error("Fallo de conexión con el motor normativo.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDefaults2025 = () => {
    toast.info("Inyectando parámetros legales Previred 2025...", {
        icon: <Zap className="w-5 h-5 text-blue-500" />
    });
    setForm({
      ...form,
      uf_tope_afp: 87.8,
      uf_tope_salud: 131.4,
      sueldo_minimo: 529000,
      limite_asignacion_familiar: 1335433,
      asignacion_tramo_a: 21243,
      asignacion_tramo_b: 14516,
      asignacion_tramo_c: 4590,
      afc_indefinido_trabajador_pct: 0.6,
      afc_indefinido_empresa_pct: 2.4,
      afc_fijo_empresa_pct: 3.0,
      afp_configs: [
        { name: "CAPITAL", code: "CAPITAL", commission_pct: 1.44, sis_pct: 1.49, active: true },
        { name: "CUPRUM", code: "CUPRUM", commission_pct: 1.44, sis_pct: 1.49, active: true },
        { name: "HABITAT", code: "HABITAT", commission_pct: 1.27, sis_pct: 1.49, active: true },
        { name: "PLANVITAL", code: "PLANVITAL", commission_pct: 1.16, sis_pct: 1.49, active: true },
        { name: "PROVIDA", code: "PROVIDA", commission_pct: 1.45, sis_pct: 1.49, active: true },
        { name: "MODELO", code: "MODELO", commission_pct: 0.58, sis_pct: 1.49, active: true },
        { name: "UNO", code: "UNO", commission_pct: 0.69, sis_pct: 1.49, active: true }
      ],
      health_configs: [
        { name: "FONASA", code: "FONASA", plan_pct: 7.0, active: true },
        { name: "CONSALUD", code: "CONSALUD", plan_pct: 7.0, active: true },
        { name: "COLMENA", code: "COLMENA", plan_pct: 7.0, active: true },
        { name: "CRUZ BLANCA", code: "CRUZ_BLANCA", plan_pct: 7.0, active: true },
        { name: "BANMEDICA", code: "BANMEDICA", plan_pct: 7.0, active: true },
        { name: "VIDA TRES", code: "VIDA_TRES", plan_pct: 7.0, active: true },
        { name: "NUEVA MASVIDA", code: "NUEVA_MASVIDA", plan_pct: 7.0, active: true }
      ]
    });
    toast.success("Parámetros 2025 inyectados. ¡Sincronice para persistir!");
  };

  const addAfp = () => {
    const newAfp = { name: "", code: "", commission_pct: 0, sis_pct: 1.49, active: true };
    setForm({ ...form, afp_configs: [...form.afp_configs, newAfp] });
  };

  const removeAfp = (index: number) => {
    const newList = [...form.afp_configs];
    newList.splice(index, 1);
    setForm({ ...form, afp_configs: newList });
  };

  const addHealth = () => {
    const newHealth = { name: "", code: "", plan_pct: 7.0, active: true };
    setForm({ ...form, health_configs: [...form.health_configs, newHealth] });
  };

  const removeHealth = (index: number) => {
    const newList = [...form.health_configs];
    newList.splice(index, 1);
    setForm({ ...form, health_configs: newList });
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {/* ===== PANEL DE ACCIONES ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="p-6 bg-blue-50/50 border-2 border-blue-100 rounded-[2rem] flex items-center gap-4 shadow-xl shadow-blue-500/5 max-w-2xl">
            <Info className="h-6 w-6 text-blue-600 shrink-0" />
            <p className="text-[11px] font-black uppercase tracking-tight text-blue-900 italic opacity-70">
                Asegure que los parámetros coincidan con los publicados por Previred para el mes de proceso. 
                Los cambios afectan retroactivamente a las liquidaciones no cerradas.
            </p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
            <Button 
                onClick={handleLoadDefaults2025} 
                variant="outline" 
                className="flex-1 md:flex-none h-14 rounded-2xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-black uppercase text-[10px] tracking-widest gap-3 shadow-lg shadow-emerald-500/5 transition-all"
            >
                <Zap className="h-4 w-4" /> AUTO-CONFIG 2025
            </Button>
            <Button 
                onClick={handleSave} 
                disabled={loading} 
                className="flex-1 md:flex-none h-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase text-xs tracking-[0.2em] px-10 shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-all gap-3"
            >
                {loading ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                SINCRONIZAR CAMBIOS
            </Button>
        </div>
      </div>

      <Tabs defaultValue="afp" className="w-full">
        <TabsList className="bg-muted/10 p-2 h-auto rounded-[2rem] border border-border/50 grid grid-cols-2 md:grid-cols-5 gap-2 mb-10 overflow-hidden shadow-inner">
          <TabsTrigger value="afp" className="py-4 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary gap-2 transition-all">
            <Building2 className="h-4 w-4 opacity-40" /> AFP
          </TabsTrigger>
          <TabsTrigger value="salud" className="py-4 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary gap-2 transition-all">
            <Stethoscope className="h-4 w-4 opacity-40" /> SALUD
          </TabsTrigger>
          <TabsTrigger value="topes" className="py-4 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary gap-2 transition-all">
            <ArrowUpCircle className="h-4 w-4 opacity-40" /> TOPES
          </TabsTrigger>
          <TabsTrigger value="asignaciones" className="py-4 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary gap-2 transition-all">
            <Users2 className="h-4 w-4 opacity-40" /> ASIG.
          </TabsTrigger>
          <TabsTrigger value="empresa" className="py-4 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary gap-2 transition-all">
            <ShieldCheck className="h-4 w-4 opacity-40" /> ENTIDAD
          </TabsTrigger>
        </TabsList>

        {/* ===== CONTENIDO TABS ===== */}
        
        <TabsContent value="afp" className="animate-in fade-in slide-in-from-top-4 duration-500 outline-none">
          <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/10">
            <CardHeader className="bg-muted/5 border-b border-border p-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Administradoras de Fondos (AFP)</CardTitle>
                <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                    CONFIGURACIÓN DE COMISIONES Y TASAS SIS VIGENTES
                </CardDescription>
              </div>
              <Button onClick={addAfp} variant="outline" className="h-12 px-6 rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-black uppercase text-[10px] tracking-widest gap-2">
                <Plus className="h-4 w-4" /> AÑADIR ADMINISTRADORA
              </Button>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              {form.afp_configs.map((afp: any, idx: number) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-6 p-8 bg-muted/5 border-2 border-border/50 rounded-[2rem] items-end group transition-all hover:bg-white hover:border-primary/20 shadow-sm relative overflow-hidden">
                  <div className="md:col-span-2 space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">NOMBRE DE INSTITUCIÓN</Label>
                    <Input 
                      placeholder="Ej: AFP Capital" 
                      value={afp.name} 
                      className="h-12 bg-white border-border rounded-xl font-black uppercase text-[11px] tracking-tight focus:ring-primary/20 shadow-sm"
                      onChange={(e) => {
                        const next = [...form.afp_configs];
                        next[idx].name = e.target.value;
                        setForm({...form, afp_configs: next});
                      }}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">COMISIÓN (%)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={afp.commission_pct} 
                      className="h-12 bg-white border-border rounded-xl font-black text-xs' focus:ring-primary/20 shadow-sm"
                      onChange={(e) => {
                        const next = [...form.afp_configs];
                        next[idx].commission_pct = parseFloat(e.target.value);
                        setForm({...form, afp_configs: next});
                      }}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">SIS (%)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={afp.sis_pct} 
                      className="h-12 bg-white border-border rounded-xl font-black text-xs focus:ring-primary/20 shadow-sm text-primary"
                      onChange={(e) => {
                        const next = [...form.afp_configs];
                        next[idx].sis_pct = parseFloat(e.target.value);
                        setForm({...form, afp_configs: next});
                      }}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button 
                        onClick={() => removeAfp(idx)} 
                        variant="ghost" 
                        size="icon" 
                        className="w-12 h-12 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-all"
                    >
                        <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
              {form.afp_configs.length === 0 && (
                <div className="text-center py-24 text-muted-foreground border-2 border-dashed border-border/50 rounded-[2.5rem] bg-muted/5 mx-10">
                  <div className="bg-muted/20 p-6 rounded-full inline-block mb-4">
                    <AlertTriangle className="w-12 h-12 text-muted-foreground/20" />
                  </div>
                  <p className="font-black uppercase text-sm tracking-[0.2em] opacity-40 italic italic">Sin administradoras configuradas.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salud" className="animate-in fade-in slide-in-from-top-4 duration-500 outline-none">
          <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-blue-500/10 transition-all">
            <CardHeader className="bg-muted/5 border-b border-border p-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Instituciones de Salud</CardTitle>
                <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                    CONGIGURACIÓN DE FONASA E ISAPRES REGULADAS
                </CardDescription>
              </div>
              <Button onClick={addHealth} variant="outline" className="h-12 px-6 rounded-xl border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-black uppercase text-[10px] tracking-widest gap-2">
                <Plus className="h-4 w-4" /> AÑADIR INSTITUCIÓN
              </Button>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              {form.health_configs.map((h: any, idx: number) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-6 p-8 bg-muted/5 border-2 border-border/50 rounded-[2rem] items-end group transition-all hover:border-blue-200 hover:bg-white shadow-sm">
                  <div className="md:col-span-2 space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">NOMBRE DE ENTIDAD SALUD</Label>
                    <Input 
                      placeholder="Ej: Consalud" 
                      value={h.name} 
                      className="h-12 bg-white border-border rounded-xl font-black uppercase text-[11px] tracking-tight focus:ring-blue-200 shadow-sm"
                      onChange={(e) => {
                         const next = [...form.health_configs];
                         next[idx].name = e.target.value;
                         setForm({...form, health_configs: next});
                      }}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">TASA LEGAL/PACTADA (%)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={h.plan_pct} 
                      className="h-12 bg-white border-border rounded-xl font-black text-xs focus:ring-blue-200 shadow-sm text-blue-700"
                      onChange={(e) => {
                        const next = [...form.health_configs];
                        next[idx].plan_pct = parseFloat(e.target.value);
                        setForm({...form, health_configs: next});
                      }}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => removeHealth(idx)} variant="ghost" size="icon" className="w-12 h-12 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-all">
                        <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topes" className="animate-in fade-in slide-in-from-top-4 duration-500 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-purple-500/10">
              <CardHeader className="bg-muted/5 border-b border-border p-10">
                <CardTitle className="text-xl font-black text-foreground uppercase tracking-tight">Topes Imponibles (UF)</CardTitle>
                <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                    BASES MÁXIMAS PARA COTIZACIONES PREVISIONALES
                </CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">TOPE AFP / SALUD (UF)</Label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    value={form.uf_tope_afp} 
                    className="h-14 bg-white border-border rounded-2xl font-black text-sm focus:ring-purple-200 shadow-sm px-6"
                    onChange={(e) => setForm({...form, uf_tope_afp: parseFloat(e.target.value)})}
                  />
                  <p className="text-[10px] text-muted-foreground italic ml-1">Actualizado anualmente por la Superintendencia.</p>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">TOPE SEGURO CESANTÍA (UF)</Label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    value={form.uf_tope_salud} 
                    className="h-14 bg-white border-border rounded-2xl font-black text-sm focus:ring-purple-200 shadow-sm px-6"
                    onChange={(e) => setForm({...form, uf_tope_salud: parseFloat(e.target.value)})}
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-emerald-500/10">
              <CardHeader className="bg-muted/5 border-b border-border p-10">
                <CardTitle className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-emerald-600" /> Rentas Mínimas
                </CardTitle>
                <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                    SUELDOS MÍNIMOS Y LÍMITES FISCALES VIGENTES
                </CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">SUELDO MÍNIMO MENSUAL (CLP)</Label>
                  <Input 
                    type="number" 
                    value={form.sueldo_minimo} 
                    className="h-14 bg-white border-border rounded-2xl font-black text-sm focus:ring-emerald-200 shadow-sm px-6 text-emerald-700"
                    onChange={(e) => setForm({...form, sueldo_minimo: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">LÍMITE ASIG. FAMILIAR (CLP)</Label>
                  <Input 
                    type="number" 
                    value={form.limite_asignacion_familiar} 
                    className="h-14 bg-white border-border rounded-2xl font-black text-sm focus:ring-emerald-200 shadow-sm px-6"
                    onChange={(e) => setForm({...form, limite_asignacion_familiar: parseInt(e.target.value)})}
                  />
                  <p className="text-[10px] text-muted-foreground italic ml-1">Tope mensual para el derecho a tramos de asignación.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="asignaciones" className="animate-in fade-in slide-in-from-top-4 duration-500 outline-none">
          <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-amber-500/10">
            <CardHeader className="bg-muted/5 border-b border-border p-10">
              <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Tramos de Asignación Familiar</CardTitle>
              <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                  MONTOS A PAGAR POR CARGA SEGÚN ESCALA SALARIAL FISCAL
              </CardDescription>
            </CardHeader>
            <CardContent className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="space-y-4 p-8 bg-amber-50/50 rounded-3xl border-2 border-amber-100 shadow-inner">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-amber-900">TRAMO A</Label>
                    <span className="text-[10px] font-bold text-amber-600 bg-white px-3 py-1 rounded-full border border-amber-100 italic">Rentas bajas</span>
                  </div>
                  <Input 
                    type="number" 
                    value={form.asignacion_tramo_a} 
                    className="h-14 bg-white border-amber-200 rounded-2xl font-black text-xl text-center focus:ring-amber-200 shadow-sm"
                    onChange={(e) => setForm({...form, asignacion_tramo_a: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-4 p-8 bg-slate-50 rounded-3xl border-2 border-border shadow-inner">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900">TRAMO B</Label>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-border italic">Rentas medias</span>
                  </div>
                  <Input 
                    type="number" 
                    value={form.asignacion_tramo_b} 
                    className="h-14 bg-white border-border rounded-2xl font-black text-xl text-center focus:ring-primary/20 shadow-sm"
                    onChange={(e) => setForm({...form, asignacion_tramo_b: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-4 p-8 bg-rose-50/50 rounded-3xl border-2 border-rose-100 shadow-inner">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-rose-900">TRAMO C</Label>
                    <span className="text-[10px] font-bold text-rose-600 bg-white px-3 py-1 rounded-full border border-rose-100 italic">Rentas altas</span>
                  </div>
                  <Input 
                    type="number" 
                    value={form.asignacion_tramo_c} 
                    className="h-14 bg-white border-rose-200 rounded-2xl font-black text-xl text-center focus:ring-rose-200 shadow-sm"
                    onChange={(e) => setForm({...form, asignacion_tramo_c: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="empresa" className="animate-in fade-in slide-in-from-top-4 duration-500 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/10 transition-all">
              <CardHeader className="bg-muted/5 border-b border-border p-10">
                <CardTitle className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary" /> Seguros y Cajas
                </CardTitle>
                <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                    ADSCRIPCIÓN A ENTIDADES PREVISIONALES COMPLEMENTARIAS
                </CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">MUTUALIDAD DE SEGURIDAD</Label>
                  <select 
                    className="flex h-14 w-full rounded-2xl border border-border bg-white px-6 py-2 text-xs font-black uppercase tracking-tight shadow-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.5rem center', backgroundSize: '1rem' }}
                    value={form.mutual_code}
                    onChange={(e) => setForm({...form, mutual_code: e.target.value})}
                  >
                    <option value="ACHS">ACHS (Asoc. Chilena de Seguridad)</option>
                    <option value="IST">IST (Inst. de Seguridad del Trabajo)</option>
                    <option value="MUTUAL">MUTUAL DE SEGURIDAD (CChC)</option>
                    <option value="ISL">ISL (Instituto de Seguridad Laboral)</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">CAJA DE COMPENSACIÓN (C.C.A.F)</Label>
                  <Input 
                    placeholder="Ej: LOS ANDES, ARAUCANA" 
                    value={form.caja_compensacion_code} 
                    className="h-14 bg-white border-border rounded-2xl font-black uppercase text-xs focus:ring-primary/20 shadow-sm px-6"
                    onChange={(e) => setForm({...form, caja_compensacion_code: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-blue-500/10 transition-all">
              <CardHeader className="bg-muted/5 border-b border-border p-10">
                <CardTitle className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                    <Gavel className="w-5 h-5 text-blue-600" /> Representante Legal
                </CardTitle>
                <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                    AUTORIDAD PARA FIRMA DE CONTRATOS Y DOCUMENTOS LEGALES
                </CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">NOMBRE COMPLETO (IDENTIDAD)</Label>
                  <Input 
                    value={form.rep_legal_nombre} 
                    className="h-14 bg-white border-border rounded-2xl font-black uppercase text-xs focus:ring-blue-200 shadow-sm px-6"
                    onChange={(e) => setForm({...form, rep_legal_nombre: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">RUT CORPORATIVO</Label>
                    <Input 
                      placeholder="12.345.678-9" 
                      value={form.rep_legal_rut} 
                      className="h-14 bg-white border-border rounded-2xl font-black text-xs focus:ring-blue-200 shadow-sm px-6"
                      onChange={(e) => setForm({...form, rep_legal_rut: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">CARGO INSTITUCIONAL</Label>
                    <Input 
                      value={form.rep_legal_cargo} 
                      className="h-14 bg-white border-border rounded-2xl font-black uppercase text-[10px] tracking-tight focus:ring-blue-200 shadow-sm px-6 italic"
                      onChange={(e) => setForm({...form, rep_legal_cargo: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
