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
  Users2, 
  ShieldCheck,
  RefreshCcw,
  Plus,
  Trash2,
  Info,
  CheckCircle2,
  AlertTriangle,
  Gavel,
  DollarSign,
  Cpu,
  Lock
} from "lucide-react";
import { savePayrollSettings } from "@/actions/payroll-settings";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════════════════════════
// Parámetros Nacionales (solo lectura, sincronizados con national_params.py)
// Estos valores son definidos por ley y el motor los aplica AUTÓNOMAMENTE.
// Se muestran aquí solo para referencia del usuario.
// ═══════════════════════════════════════════════════════════════════════════════
const NATIONAL_PARAMS = {
  tope_afp_uf: 90.0,
  tope_salud_uf: 90.0,
  tope_afc_uf: 135.2,
  sis_pct: 1.62,
  sueldo_minimo: 539000,
  afp_cotizacion_pct: 10.0,
  salud_legal_pct: 7.0,
  afc_indef_trab: 0.6,
  afc_indef_emp: 2.4,
  afc_fijo_emp: 3.0,
  asig_tramo_a: 21243,
  asig_tramo_b: 14516,
  asig_tramo_c: 4590,
};

export default function SettingsClient({ organizationId, initialSettings }: { organizationId: string, initialSettings: any }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialSettings || {
    organization_id: organizationId,
    afp_configs: [],
    health_configs: [],
    mutual_code: 'ACHS',
    tasa_mutual: 0.93,
    caja_compensacion_code: '',
    dias_vacaciones_anuales: 15,
    es_zona_extrema: false,
    zona_extrema: '',
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
        mutual_code: 'ACHS',
        tasa_mutual: 0.93,
        caja_compensacion_code: '',
        dias_vacaciones_anuales: 15,
        es_zona_extrema: false,
        zona_extrema: '',
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
                Los parámetros legales nacionales (topes, SIS, sueldo mínimo) se aplican automáticamente 
                por el motor de cálculo. Esta página configura solo lo exclusivo de su empresa.
            </p>
        </div>
        <Button 
            onClick={handleSave} 
            disabled={loading} 
            className="h-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase text-xs tracking-[0.2em] px-10 shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-all gap-3"
        >
            {loading ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            GUARDAR CONFIGURACIÓN
        </Button>
      </div>

      <Tabs defaultValue="afp" className="w-full">
        <TabsList className="bg-muted/10 p-2 h-auto rounded-[2rem] border border-border/50 grid grid-cols-2 md:grid-cols-4 gap-2 mb-10 overflow-hidden shadow-inner">
          <TabsTrigger value="afp" className="py-4 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary gap-2 transition-all">
            <Building2 className="h-4 w-4 opacity-40" /> AFP
          </TabsTrigger>
          <TabsTrigger value="salud" className="py-4 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary gap-2 transition-all">
            <Stethoscope className="h-4 w-4 opacity-40" /> SALUD
          </TabsTrigger>
          <TabsTrigger value="empresa" className="py-4 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary gap-2 transition-all">
            <ShieldCheck className="h-4 w-4 opacity-40" /> ENTIDAD
          </TabsTrigger>
          <TabsTrigger value="autonomo" className="py-4 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary gap-2 transition-all">
            <Cpu className="h-4 w-4 opacity-40" /> AUTÓNOMO
          </TabsTrigger>
        </TabsList>

        {/* ===== AFP ===== */}
        <TabsContent value="afp" className="animate-in fade-in slide-in-from-top-4 duration-500 outline-none">
          <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/10">
            <CardHeader className="bg-muted/5 border-b border-border p-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Administradoras de Fondos (AFP)</CardTitle>
                <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                    LISTADO DE AFPs HABILITADAS — COT. OBLIGATORIA: 10% + COMISIÓN | SIS: {NATIONAL_PARAMS.sis_pct}% (AUTÓNOMO)
                </CardDescription>
              </div>
              <Button onClick={addAfp} variant="outline" className="h-12 px-6 rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-black uppercase text-[10px] tracking-widest gap-2">
                <Plus className="h-4 w-4" /> AÑADIR AFP
              </Button>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              {form.afp_configs.map((afp: any, idx: number) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-6 p-8 bg-muted/5 border-2 border-border/50 rounded-[2rem] items-end group transition-all hover:bg-white hover:border-primary/20 shadow-sm relative overflow-hidden">
                  <div className="md:col-span-2 space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">NOMBRE DE INSTITUCIÓN</Label>
                    <Input id="field_ej_afp_capital" name="field_ej_afp_capital" 
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
                    <Input id="field_afp_commission_pct" name="field_afp_commission_pct" 
                      type="number" 
                      step="0.01" 
                      value={afp.commission_pct} 
                      className="h-12 bg-white border-border rounded-xl font-black text-xs focus:ring-primary/20 shadow-sm"
                      onChange={(e) => {
                        const next = [...form.afp_configs];
                        next[idx].commission_pct = parseFloat(e.target.value);
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
                  <p className="font-black uppercase text-sm tracking-[0.2em] opacity-40 italic">Sin administradoras configuradas.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== SALUD ===== */}
        <TabsContent value="salud" className="animate-in fade-in slide-in-from-top-4 duration-500 outline-none">
          <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-blue-500/10 transition-all">
            <CardHeader className="bg-muted/5 border-b border-border p-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Instituciones de Salud</CardTitle>
                <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                    FONASA E ISAPRES HABILITADAS — COTIZACIÓN LEGAL: {NATIONAL_PARAMS.salud_legal_pct}% (AUTÓNOMO)
                </CardDescription>
              </div>
              <Button onClick={addHealth} variant="outline" className="h-12 px-6 rounded-xl border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-black uppercase text-[10px] tracking-widest gap-2">
                <Plus className="h-4 w-4" /> AÑADIR INSTITUCIÓN
              </Button>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              {form.health_configs.map((h: any, idx: number) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 bg-muted/5 border-2 border-border/50 rounded-[2rem] items-end group transition-all hover:border-blue-200 hover:bg-white shadow-sm">
                  <div className="md:col-span-2 space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">NOMBRE DE ENTIDAD SALUD</Label>
                    <Input id="field_ej_consalud" name="field_ej_consalud" 
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

        {/* ===== EMPRESA ===== */}
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
                  <select id="field_form_mutual_code" name="field_form_mutual_code" 
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
                  <Input id="field_ej_los_andes_araucana" name="field_ej_los_andes_araucana" 
                    placeholder="Ej: LOS ANDES, ARAUCANA" 
                    value={form.caja_compensacion_code} 
                    className="h-14 bg-white border-border rounded-2xl font-black uppercase text-xs focus:ring-primary/20 shadow-sm px-6"
                    onChange={(e) => setForm({...form, caja_compensacion_code: e.target.value})}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">TASA MUTUAL (%)</Label>
                  <Input id="field_form_tasa_mutual_0_93" name="field_form_tasa_mutual_0_93"
                    type="number"
                    step="0.001"
                    min="0"
                    max="100"
                    value={form.tasa_mutual ?? 0.93}
                    className="h-14 bg-white border-border rounded-2xl font-black text-xs focus:ring-primary/20 shadow-sm px-6"
                    onChange={(e) => setForm({...form, tasa_mutual: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">DIAS VACACIONES ANUALES</Label>
                    <Input id="field_form_dias_vacaciones_anuales_15" name="field_form_dias_vacaciones_anuales_15"
                      type="number"
                      step="0.01"
                      min="1"
                      max="30"
                      value={form.dias_vacaciones_anuales ?? 15}
                      className="h-14 bg-white border-border rounded-2xl font-black text-xs focus:ring-primary/20 shadow-sm px-6"
                      onChange={(e) => setForm({...form, dias_vacaciones_anuales: parseFloat(e.target.value) || 15})}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">ZONA EXTREMA EMPRESA</Label>
                    <select id="field_form_zona_extrema" name="field_form_zona_extrema"
                      className="flex h-14 w-full rounded-2xl border border-border bg-white px-6 py-2 text-xs font-black uppercase tracking-tight shadow-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      value={form.zona_extrema || ''}
                      onChange={(e) => setForm({...form, zona_extrema: e.target.value, es_zona_extrema: e.target.value !== ''})}
                    >
                      <option value="">SIN ZONA ESPECIAL</option>
                      {["ARICA", "TARAPACA", "AYSEN", "MAGALLANES", "CHILOE", "PALENA"].map((zona) => (
                        <option key={zona} value={zona}>{zona}</option>
                      ))}
                    </select>
                  </div>
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
                  <Input id="field_form_rep_legal_nombre" name="field_form_rep_legal_nombre" 
                    value={form.rep_legal_nombre} 
                    className="h-14 bg-white border-border rounded-2xl font-black uppercase text-xs focus:ring-blue-200 shadow-sm px-6"
                    onChange={(e) => setForm({...form, rep_legal_nombre: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">RUT CORPORATIVO</Label>
                    <Input id="field_12_345_678_9" name="field_12_345_678_9" 
                      placeholder="12.345.678-9" 
                      value={form.rep_legal_rut} 
                      className="h-14 bg-white border-border rounded-2xl font-black text-xs focus:ring-blue-200 shadow-sm px-6"
                      onChange={(e) => setForm({...form, rep_legal_rut: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">CARGO INSTITUCIONAL</Label>
                    <Input id="field_form_rep_legal_cargo" name="field_form_rep_legal_cargo" 
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

        {/* ===== PARÁMETROS AUTÓNOMOS (Solo Lectura) ===== */}
        <TabsContent value="autonomo" className="animate-in fade-in slide-in-from-top-4 duration-500 outline-none">
          <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-emerald-500/10">
            <CardHeader className="bg-muted/5 border-b border-border p-10">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                  <Cpu className="w-6 h-6 text-emerald-600" /> 
                  Motor Autónomo — Parámetros Nacionales
                </CardTitle>
                <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                    ESTOS VALORES SON APLICADOS AUTOMÁTICAMENTE POR EL MOTOR DE CÁLCULO. NO REQUIEREN INTERVENCIÓN.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Topes Imponibles */}
                <div className="space-y-6 p-8 bg-emerald-50/50 rounded-3xl border-2 border-emerald-100">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800 flex items-center gap-2">
                    <Lock className="h-3 w-3" /> Topes Imponibles (UF)
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">AFP / Salud</span>
                      <span className="text-sm font-black text-emerald-700">{NATIONAL_PARAMS.tope_afp_uf} UF</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Seg. Cesantía</span>
                      <span className="text-sm font-black text-emerald-700">{NATIONAL_PARAMS.tope_afc_uf} UF</span>
                    </div>
                  </div>
                </div>

                {/* Tasas Legales */}
                <div className="space-y-6 p-8 bg-blue-50/50 rounded-3xl border-2 border-blue-100">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-800 flex items-center gap-2">
                    <Lock className="h-3 w-3" /> Tasas Legales (%)
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">AFP Obligatorio</span>
                      <span className="text-sm font-black text-blue-700">{NATIONAL_PARAMS.afp_cotizacion_pct}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Salud Legal</span>
                      <span className="text-sm font-black text-blue-700">{NATIONAL_PARAMS.salud_legal_pct}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">SIS (Empresa)</span>
                      <span className="text-sm font-black text-blue-700">{NATIONAL_PARAMS.sis_pct}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">AFC Trabajador (Indef.)</span>
                      <span className="text-sm font-black text-blue-700">{NATIONAL_PARAMS.afc_indef_trab}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">AFC Empresa (Indef.)</span>
                      <span className="text-sm font-black text-blue-700">{NATIONAL_PARAMS.afc_indef_emp}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">AFC Empresa (Fijo)</span>
                      <span className="text-sm font-black text-blue-700">{NATIONAL_PARAMS.afc_fijo_emp}%</span>
                    </div>
                  </div>
                </div>

                {/* Asignaciones y Mínimos */}
                <div className="space-y-6 p-8 bg-amber-50/50 rounded-3xl border-2 border-amber-100">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-800 flex items-center gap-2">
                    <Lock className="h-3 w-3" /> Mínimos y Asignaciones
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Sueldo Mínimo</span>
                      <span className="text-sm font-black text-amber-700">${NATIONAL_PARAMS.sueldo_minimo.toLocaleString("es-CL")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Asig. Tramo A</span>
                      <span className="text-sm font-black text-amber-700">${NATIONAL_PARAMS.asig_tramo_a.toLocaleString("es-CL")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Asig. Tramo B</span>
                      <span className="text-sm font-black text-amber-700">${NATIONAL_PARAMS.asig_tramo_b.toLocaleString("es-CL")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Asig. Tramo C</span>
                      <span className="text-sm font-black text-amber-700">${NATIONAL_PARAMS.asig_tramo_c.toLocaleString("es-CL")}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-6 bg-muted/10 rounded-2xl border border-border/50 flex items-start gap-4">
                <Cpu className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Motor de Cálculo Autónomo</p>
                  <p className="text-[10px] text-muted-foreground italic">
                    Estos valores están codificados en <code className="bg-muted/30 px-1.5 py-0.5 rounded text-[9px] font-mono">national_params.py</code> y 
                    se aplican automáticamente a cada liquidación. Para actualizar (ej: cambio de sueldo mínimo), 
                    contacte al administrador del sistema. La UF y UTM se obtienen dinámicamente de los indicadores económicos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
