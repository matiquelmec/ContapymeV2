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
import { Loader2, Calculator, Info, ShieldAlert, Gavel, CheckCircle2 } from "lucide-react";

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
    other_bonuses: 0
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
      <DialogContent className="sm:max-w-[580px] bg-card border-border shadow-2xl rounded-[2.5rem] p-0 overflow-hidden ring-1 ring-black/5">
        {/* STRIPE SUPERIOR */}
        <div className="h-2 w-full bg-gradient-to-r from-rose-600 via-rose-300 to-transparent" />
        
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                <Calculator className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tight">
                  Motor de Finiquito
                </DialogTitle>
                <DialogDescription className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] italic">
                  CÁLCULO NORMATIVO SEGÚN CÓDIGO DEL TRABAJO CHILENO
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* EMPLEADO */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">TRABAJADOR A DESVINCULARSE</Label>
              <Select 
                onValueChange={(v) => setFormData({...formData, employee_id: v})}
                value={formData.employee_id}
              >
                <SelectTrigger className="h-14 bg-white border-border rounded-2xl font-black text-sm focus:ring-rose-200 shadow-sm px-6">
                  <SelectValue placeholder="Buscar por nombre o RUT..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-border rounded-2xl shadow-2xl">
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id} className="font-bold">
                      {emp.nombres} {emp.apellido_paterno}
                      <span className="text-[10px] text-muted-foreground ml-2 italic">({emp.rut})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* FECHA + CAUSAL */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">FECHA DE TÉRMINO</Label>
                <Input 
                  type="date" 
                  className="h-14 bg-white border-border rounded-2xl font-black text-sm focus:ring-rose-200 shadow-sm px-6"
                  value={formData.fecha_termino}
                  onChange={(e) => setFormData({...formData, fecha_termino: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">CAUSAL LEGAL</Label>
                <Select 
                  onValueChange={(v) => setFormData({...formData, causal_despido: v})}
                  value={formData.causal_despido}
                >
                  <SelectTrigger className="h-14 bg-white border-border rounded-2xl font-black text-xs focus:ring-rose-200 shadow-sm px-6">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-border rounded-2xl shadow-2xl">
                    {causes.map(c => (
                      <SelectItem key={c.article_code} value={c.article_code} className="font-bold text-xs">
                        {c.article_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* AVISO PREVIO (condicional) */}
            {selectedCause?.requires_notice && (
              <div className="flex items-center justify-between rounded-3xl border-2 border-rose-100 p-6 bg-rose-50/50 transition-all animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-1">
                  <Label className="text-sm font-black text-rose-900 uppercase tracking-tight">Aviso Previo (30 días)</Label>
                  <p className="text-[11px] text-rose-700/70 font-bold italic leading-normal">
                    Si no existió aviso previo, se generará la indemnización sustitutiva correspondiente.
                  </p>
                </div>
                <Switch 
                  checked={formData.aviso_previo}
                  onCheckedChange={(c: boolean) => setFormData({...formData, aviso_previo: c})}
                  className="data-[state=checked]:bg-rose-600"
                />
              </div>
            )}

            {/* HABERES ADICIONALES */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">HABERES Y CONCEPTOS ADICIONALES</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-muted-foreground italic ml-1 uppercase">Días Vacac. Tomados</p>
                  <Input 
                    type="number" 
                    step="0.5"
                    className="h-12 bg-white border-border rounded-2xl font-black text-sm text-center focus:ring-rose-200 shadow-sm"
                    value={formData.dias_vacaciones_tomados}
                    onChange={(e) => setFormData({...formData, dias_vacaciones_tomados: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-muted-foreground italic ml-1 uppercase">Horas Extras ($)</p>
                  <Input 
                    type="number" 
                    className="h-12 bg-white border-border rounded-2xl font-black text-sm text-center focus:ring-rose-200 shadow-sm"
                    value={formData.pending_overtime_amount}
                    onChange={(e) => setFormData({...formData, pending_overtime_amount: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-muted-foreground italic ml-1 uppercase">Otros Bonos ($)</p>
                  <Input 
                    type="number" 
                    className="h-12 bg-white border-border rounded-2xl font-black text-sm text-center focus:ring-rose-200 shadow-sm"
                    value={formData.other_bonuses}
                    onChange={(e) => setFormData({...formData, other_bonuses: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>

            {/* NOTA LEGAL */}
            <div className="bg-blue-50/50 border-2 border-blue-100 rounded-3xl p-5 flex items-start gap-4">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-blue-900/70 font-black uppercase tracking-tight italic leading-relaxed">
                El motor aplicará el valor de la UF actualizado para calcular topes legales normativos (máx. 90 UF mensual / 11 años según Art. 163 C.T.).
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-4 pt-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest"
            >
              CANCELAR
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-14 rounded-2xl bg-rose-600 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-rose-600/30 hover:scale-[1.02] active:scale-95 transition-all gap-3"
              disabled={loading}
            >
              {loading 
                ? <><Loader2 className="h-5 w-5 animate-spin" /> CALCULANDO...</>
                : <><Calculator className="h-5 w-5" /> CALCULAR FINIQUITO</>
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
