"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { calculateTerminationAction, getTerminationCausesAction } from "@/actions/terminations";
import { toast } from "sonner";
import { Loader2, Calculator, Info, ShieldAlert, Gavel, CheckCircle2, UserCircle, Calendar as CalendarIcon, Briefcase } from "lucide-react";

interface Employee {
  id: string;
  nombres: string;
  apellido_paterno: string;
  rut: string;
}

interface TerminationCause {
  article_code: string;
  article_name: string;
  requires_notice: boolean;
  requires_severance: boolean;
}

export function TerminationDialog({ 
  open, 
  onOpenChange, 
  employees, 
  organizationId 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  employees: Employee[]; 
  organizationId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [causes, setCauses] = useState<TerminationCause[]>([]);
  const [loadingCauses, setLoadingCauses] = useState(false);
  
  const [formData, setFormData] = useState({
    employee_id: "" as string,
    fecha_termino: new Date().toISOString().split("T")[0],
    causal_despido: "161-1",
    aviso_previo: true,
    dias_vacaciones_tomados: 0,
    pending_overtime_amount: 0,
    other_bonuses: 0,
    asignacion_colacion: 0,
    asignacion_movilizacion: 0,
    viaticos: 0,
    prestamo_ccaf: 0,
    anticipo_sueldo: 0,
    banco_transferencia: "",
    tipo_cuenta: "vista",
    cuenta_transferencia: ""
  });

  useEffect(() => {
    if (open) {
      loadCauses();
    }
  }, [open]);

  const loadCauses = async () => {
    setLoadingCauses(true);
    try {
      const result = await getTerminationCausesAction();
      if (result.success) {
        setCauses(result.data as TerminationCause[]);
      } else {
        setCauses([
          { article_code: "161-1", article_name: "Art. 161 N°1 — Necesidades de la empresa", requires_notice: true, requires_severance: true },
          { article_code: "159-1", article_name: "Art. 159 N°1 — Mutuo acuerdo de partes", requires_notice: false, requires_severance: false },
          { article_code: "159-2", article_name: "Art. 159 N°2 — Renuncia voluntaria", requires_notice: false, requires_severance: false },
          { article_code: "159-4", article_name: "Art. 159 N°4 — Vencimiento del plazo", requires_notice: false, requires_severance: false },
          { article_code: "159-5", article_name: "Art. 159 N°5 — Conclusión de obra", requires_notice: false, requires_severance: false }
        ]);
      }
    } catch {
      // Ignorar errores de carga de causas
    } finally {
      setLoadingCauses(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee_id) {
      toast.error("Debe identificar al trabajador a desvincularse.");
      return;
    }

    setLoading(true);
    try {
      const result = await calculateTerminationAction({
        ...formData,
        organization_id: organizationId
      });

      if (result.success) {
        toast.success("Finiquito calculado y registrado en el sistema.", {
          description: "El expediente legal ha sido generado correctamente.",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        });
        onOpenChange(false);
      } else {
        toast.error(result.error || "El motor de cálculo reportó un error normativo.");
      }
    } catch (error) {
      toast.error("Fallo de comunicación con el motor legal.");
    } finally {
      setLoading(false);
    }
  };

  const selectedCause = causes.find(c => c.article_code === formData.causal_despido);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px] bg-card border-border shadow-[0_0_60px_-15px_rgba(0,0,0,0.3)] rounded-[3rem] p-0 ring-1 ring-black/5 animate-in slide-in-from-bottom-4 duration-500">
        {/* STRIPE SUPERIOR */}
        <div className="h-4 w-full bg-gradient-to-r from-rose-600 via-rose-300 to-transparent rounded-t-[3rem]" />
        
        <form onSubmit={handleSubmit} className="relative">
          <DialogHeader className="p-10 pb-8 border-b border-border/40 bg-muted/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5">
                <Calculator className="w-32 h-32 text-rose-600 rotate-6" />
            </div>
            <div className="flex items-center gap-6 relative z-10">
              <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 shadow-inner group transition-all duration-500 hover:scale-110">
                <Calculator className="h-8 w-8 text-rose-600 drop-shadow-sm group-hover:rotate-12 transition-transform" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-3xl font-black text-foreground uppercase tracking-tighter leading-none">
                  Motor de Finiquito
                </DialogTitle>
                <DialogDescription className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] italic opacity-70">
                  CÁLCULO NORMATIVO — INFORME DE DESVINCULACIÓN
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-10 space-y-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
            <div className="space-y-6">
              {/* EMPLEADO SELECTOR PREMIUM */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2 ml-1">
                    <UserCircle className="w-3.5 h-3.5 text-rose-500/40" /> Colaborador Asignado
                </Label>
                <Select id="termination_dialog_select_1" name="termination_dialog_select_1" 
                  onValueChange={(v) => setFormData({...formData, employee_id: v || ''})}
                  value={formData.employee_id}
                >
                  <SelectTrigger className="h-16 bg-muted/10 border-border/40 hover:border-rose-500/30 rounded-2xl font-black text-sm focus:ring-rose-500 shadow-sm px-8 transition-all">
                    <SelectValue placeholder="Buscar en el Kardex por Nombre o RUT..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-border/40 rounded-2xl shadow-2xl max-h-[350px]">
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id} className="font-bold py-3 px-4 border-b border-muted/20 last:border-0 hover:bg-rose-50 transition-colors">
                        <div className="flex flex-col">
                            <span className="text-[11px] uppercase tracking-tight">{emp.nombres} {emp.apellido_paterno}</span>
                            <span className="text-[9px] text-muted-foreground/60 italic font-black uppercase">{emp.rut}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* GRIDS DE DATOS */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2 ml-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-rose-500/40" /> Fecha de Egreso
                  </Label>
                  <div className="relative group">
                    <Input id="field_formdata_fecha_termino" name="field_formdata_fecha_termino" 
                        type="date" 
                        className="h-14 bg-muted/10 border-border/40 hover:border-rose-500/30 rounded-2xl font-black text-sm focus:ring-rose-500 focus:bg-white px-8 transition-all shadow-sm"
                        value={formData.fecha_termino}
                        onChange={(e) => setFormData({...formData, fecha_termino: e.target.value})}
                    />
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-rose-500/0 group-hover:ring-rose-500/10 pointer-events-none transition-all" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2 ml-1">
                      <Gavel className="w-3.5 h-3.5 text-rose-500/40" /> Causal Aplicada
                  </Label>
                  <Select id="termination_dialog_select_1" name="termination_dialog_select_1" 
                    onValueChange={(v) => setFormData({...formData, causal_despido: v || ''})}
                    value={formData.causal_despido}
                  >
                    <SelectTrigger className="h-14 bg-muted/10 border-border/40 hover:border-rose-500/30 rounded-2xl font-black uppercase text-[10px] tracking-tight focus:ring-rose-500 transition-all shadow-sm">
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} sideOffset={8} className="bg-white border-border/40 rounded-2xl shadow-2xl max-h-[450px] min-w-[500px] w-auto p-2 z-[100]">
                      {causes.map(c => (
                        <SelectItem key={c.article_code} value={c.article_code} className="font-bold text-[10px] uppercase py-4 border-b border-muted/10 last:border-0 hover:bg-rose-50 transition-colors">
                          <span className="text-rose-600 mr-2 shrink-0">{c.article_code}</span> — <span className="flex-1">{c.article_name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ESTRUCTURA DOBLE COLUMNA: HABERES Y DESCUENTOS DEL COSTADO */}
              <div className="grid grid-cols-2 gap-8 border-t border-border/40 pt-6">
                
                {/* COLUMNA IZQUIERDA: HABERES Y PROPORCIONALES */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-700 border-b border-emerald-100 pb-2">Haberes y Proporcionales</h4>
                  
                  <div className="space-y-3">
                    <Label className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest">Vacaciones Tomadas (Días)</Label>
                    <Input id="field_formdata_dias_vacaciones_tomados" name="field_formdata_dias_vacaciones_tomados" 
                      type="number" 
                      step="0.5"
                      className="h-12 bg-muted/5 border-border/40 rounded-xl font-bold text-xs"
                      value={formData.dias_vacaciones_tomados}
                      onChange={(e) => setFormData({...formData, dias_vacaciones_tomados: parseFloat(e.target.value) || 0})}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest">Horas Extras ($)</Label>
                    <Input id="field_formdata_pending_overtime_amount" name="field_formdata_pending_overtime_amount" 
                      type="number" 
                      className="h-12 bg-muted/5 border-border/40 rounded-xl font-bold text-xs"
                      value={formData.pending_overtime_amount}
                      onChange={(e) => setFormData({...formData, pending_overtime_amount: parseInt(e.target.value) || 0})}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest">Otros Bonos Finiquito ($)</Label>
                    <Input id="field_formdata_other_bonuses" name="field_formdata_other_bonuses" 
                      type="number" 
                      className="h-12 bg-muted/5 border-border/40 rounded-xl font-bold text-xs"
                      value={formData.other_bonuses}
                      onChange={(e) => setFormData({...formData, other_bonuses: parseInt(e.target.value) || 0})}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest">Asignación de Colación ($)</Label>
                    <Input id="field_formdata_asignacion_colacion" name="field_formdata_asignacion_colacion" 
                      type="number" 
                      className="h-12 bg-muted/5 border-border/40 rounded-xl font-bold text-xs"
                      value={formData.asignacion_colacion}
                      onChange={(e) => setFormData({...formData, asignacion_colacion: parseInt(e.target.value) || 0})}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest">Asignación de Movilización ($)</Label>
                    <Input id="field_formdata_asignacion_movilizacion" name="field_formdata_asignacion_movilizacion" 
                      type="number" 
                      className="h-12 bg-muted/5 border-border/40 rounded-xl font-bold text-xs"
                      value={formData.asignacion_movilizacion}
                      onChange={(e) => setFormData({...formData, asignacion_movilizacion: parseInt(e.target.value) || 0})}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest">Viáticos / Otras Asig. ($)</Label>
                    <Input id="field_formdata_viaticos" name="field_formdata_viaticos" 
                      type="number" 
                      className="h-12 bg-muted/5 border-border/40 rounded-xl font-bold text-xs"
                      value={formData.viaticos}
                      onChange={(e) => setFormData({...formData, viaticos: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                {/* COLUMNA DERECHA: DESCUENTOS Y FORMA DE PAGO */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-rose-700 border-b border-rose-100 pb-2">Descuentos y Forma de Pago</h4>

                  <div className="space-y-3">
                    <Label className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest">Préstamo CCAF ($)</Label>
                    <Input id="field_formdata_prestamo_ccaf" name="field_formdata_prestamo_ccaf" 
                      type="number" 
                      className="h-12 bg-muted/5 border-border/40 rounded-xl font-bold text-xs"
                      value={formData.prestamo_ccaf}
                      onChange={(e) => setFormData({...formData, prestamo_ccaf: parseInt(e.target.value) || 0})}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest">Anticipos de Sueldo ($)</Label>
                    <Input id="field_formdata_anticipo_sueldo" name="field_formdata_anticipo_sueldo" 
                      type="number" 
                      className="h-12 bg-muted/5 border-border/40 rounded-xl font-bold text-xs"
                      value={formData.anticipo_sueldo}
                      onChange={(e) => setFormData({...formData, anticipo_sueldo: parseInt(e.target.value) || 0})}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest">Banco Destinatario</Label>
                    <Input id="field_ej_banco_estado" name="field_ej_banco_estado" 
                      type="text" 
                      placeholder="Ej: Banco Estado"
                      className="h-12 bg-muted/5 border-border/40 rounded-xl font-bold text-xs"
                      value={formData.banco_transferencia}
                      onChange={(e) => setFormData({...formData, banco_transferencia: e.target.value})}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest">Tipo de Cuenta</Label>
                    <Select id="termination_dialog_select_1" name="termination_dialog_select_1" 
                      onValueChange={(v) => setFormData({...formData, tipo_cuenta: v || ''})}
                      value={formData.tipo_cuenta}
                    >
                      <SelectTrigger className="h-12 bg-muted/5 border-border/40 rounded-xl font-bold text-xs uppercase">
                        <SelectValue placeholder="Seleccione..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-border rounded-xl">
                        <SelectItem value="corriente" className="font-bold text-xs">Cuenta Corriente</SelectItem>
                        <SelectItem value="vista" className="font-bold text-xs">Cuenta Vista</SelectItem>
                        <SelectItem value="rut" className="font-bold text-xs">Cuenta RUT</SelectItem>
                        <SelectItem value="ahorro" className="font-bold text-xs">Cuenta de Ahorro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest">Número de Cuenta</Label>
                    <Input id="field_ej_12345678" name="field_ej_12345678" 
                      type="text" 
                      placeholder="Ej: 12345678"
                      className="h-12 bg-muted/5 border-border/40 rounded-xl font-bold text-xs"
                      value={formData.cuenta_transferencia}
                      onChange={(e) => setFormData({...formData, cuenta_transferencia: e.target.value})}
                    />
                  </div>

                  {/* AVISO PREVIO SWITCH */}
                  {selectedCause?.requires_notice && (
                    <div className="flex items-center justify-between rounded-xl border border-rose-100 p-4 bg-rose-50/20">
                      <div className="space-y-0.5">
                        <Label className="text-[10px] font-black text-rose-950 uppercase tracking-tight">Aviso Previo (30 días)</Label>
                        <p className="text-[9px] text-rose-700/60 font-bold italic leading-none">Pago sustitutivo si se omite</p>
                      </div>
                      <Switch 
                        checked={formData.aviso_previo}
                        onCheckedChange={(c: boolean) => setFormData({...formData, aviso_previo: c})}
                        className="data-[state=checked]:bg-rose-600 scale-110"
                      />
                    </div>
                  )}
                </div>

              </div>

              {/* CLÁUSULA LEGAL GLASS PANEL */}
              <div className="bg-blue-500/5 backdrop-blur-md border border-blue-500/20 rounded-[1.8rem] p-6 flex items-start gap-4 shadow-sm hover:border-blue-500/40 transition-colors group">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
                </div>
                <p className="text-[10px] text-blue-950/70 font-bold uppercase tracking-tight italic leading-relaxed pr-2">
                  <span className="text-blue-600 font-black mr-2 tracking-widest">Normativa Art. 172/163:</span>
                  El motor calculará el finiquito de forma precisa, descontando de forma atómica los préstamos y anticipos sobre la sumatoria de haberes imponibles y no imponibles.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="p-10 pt-4 flex flex-col md:flex-row gap-6 bg-muted/5 relative z-10">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="flex-1 h-16 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.4em] text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              CANCELAR PROCESO
            </Button>
            <Button 
              type="submit" 
              className="relative flex-[1.5] h-16 rounded-[1.8rem] bg-gradient-to-r from-rose-600 to-rose-400 text-white font-black uppercase text-xs tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(225,29,72,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(225,29,72,0.5)] hover:scale-[1.03] active:scale-95 transition-all gap-4 group overflow-hidden"
              disabled={loading}
            >
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-12" />
              {loading 
                ? <><Loader2 className="h-5 w-5 animate-spin" /> PROCESANDO...</>
                : <><Calculator className="h-5 w-5 group-hover:scale-125 transition-transform" /> GENERAR LIQUIDACIÓN LEGAL</>
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
