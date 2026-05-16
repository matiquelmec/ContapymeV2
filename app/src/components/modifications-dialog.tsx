"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getEmployeeModifications,
  createContractModification,
  ModificationType,
  ContractModification
} from "@/actions/contract-modifications";
import { toast } from "sonner";
import { parseError } from "@/lib/utils/errors";
import {
  History,
  FileText,
  ShieldCheck,
  Clock,
  TrendingUp,
  Download,
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  employeeId: string;
  employeeName: string;
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
  currentData?: {
    sueldo_base?: number;
    horas_semanales?: number;
    cargo?: string;
    tipo_contrato?: string;
  };
}

export function ModificationsDialog({ employeeId, employeeName, organizationId, isOpen, onClose, currentData }: Props) {
  const [mods, setMods] = useState<ContractModification[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'create'>('list');

  const [selectedFields, setSelectedFields] = useState<string[]>(['salary']);
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState("");

  const [newSalary, setNewSalary] = useState(currentData?.sueldo_base?.toString() || "");
  const [newHours, setNewHours] = useState(currentData?.horas_semanales?.toString() || "42");
  const [newPosition, setNewPosition] = useState(currentData?.cargo || "");
  const [newType, setNewType] = useState(currentData?.tipo_contrato || "indefinido");
  const [customClause, setCustomClause] = useState("");

  useEffect(() => {
    if (isOpen) {
      setView('list');
      setReason("");
      setSelectedFields(['salary']);
      setNewSalary(currentData?.sueldo_base?.toString() || "");
      setNewHours(currentData?.horas_semanales?.toString() || "42");
      setNewPosition(currentData?.cargo || "");
      setNewType(currentData?.tipo_contrato || "indefinido");
      setCustomClause("");
      setEffectiveDate(new Date().toISOString().split('T')[0]);
      loadMods();
    }
  }, [isOpen, employeeId, currentData]);

  async function loadMods() {
    setLoading(true);
    const data = await getEmployeeModifications(employeeId);
    setMods(data);
    setLoading(false);
  }

  const toggleField = (f: string) => {
    setSelectedFields(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  async function handleSave() {
    if (!effectiveDate) return toast.error("Fecha requerida");

    const changes: Record<string, any> = {};
    const old_values: Record<string, any> = {};

    if (selectedFields.includes('salary')) {
      changes.sueldo_base = parseInt(newSalary);
      old_values.sueldo_base = currentData?.sueldo_base;
    }
    if (selectedFields.includes('hours')) {
      changes.horas_semanales = parseInt(newHours);
      old_values.horas_semanales = currentData?.horas_semanales;
    }
    if (selectedFields.includes('position')) {
      changes.cargo = newPosition;
      old_values.cargo = currentData?.cargo;
    }
    if (selectedFields.includes('type')) {
      changes.tipo_contrato = newType;
      old_values.tipo_contrato = currentData?.tipo_contrato;
    }
    if (selectedFields.includes('custom')) {
      changes.custom_clause = customClause;
      old_values.custom_clause = null;
    }

    if (Object.keys(changes).length === 0) return toast.error("Seleccione al menos un cambio");

    setLoading(true);
    
    // Mapeo correcto para el ENUM de la base de datos
    const fieldTypeMapping: Record<string, ModificationType> = {
        salary: 'salary_change',
        hours: 'hours_change',
        position: 'position_change',
        type: 'contract_type_change',
        custom: 'other'
    };

    const modification_type = selectedFields.length > 1 
      ? 'other' 
      : fieldTypeMapping[selectedFields[0]] || 'other';

    const res = await createContractModification({
      organization_id: organizationId,
      employee_id: employeeId,
      modification_type: modification_type,
      effective_date: effectiveDate,
      changes,
      old_values,
      reason: reason || "Actualización de Condiciones Laborales"
    });

    if (res.success) {
      toast.success("Anexo registrado y datos actualizados");
      if (res.data?.id) downloadAnnex(res.data.id);
      setView('list');
      loadMods();
    } else {
      toast.error(parseError(res.error));
    }
    setLoading(false);
  }

  const downloadAnnex = async (modId: string) => {
    try {
      const response = await fetch(`/api/documents/generate-annex?mod_id=${modId}`);
      if (!response.ok) throw new Error("Error en motor");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Anexo_${employeeName.replace(' ', '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Error al generar documento Word");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[850px] bg-white border-0 shadow-2xl rounded-[3rem] p-0 overflow-hidden">
        <div className="h-2.5 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-500 animate-gradient-x" />

        <DialogHeader className="p-10 pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-indigo-50 rounded-[2rem] border border-indigo-100 shadow-sm">
                <ShieldCheck className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Gestor de Anexos</DialogTitle>
                <DialogDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600/60 italic">
                  {employeeName} • Master Performance Auditor
                </DialogDescription>
              </div>
            </div>
            {view === 'list' ? (
              <Button onClick={() => setView('create')} className="rounded-2xl bg-indigo-600 font-black text-[10px] uppercase tracking-widest h-11 px-6 shadow-indigo-200 shadow-xl hover:scale-105 transition-all">
                Crear Nuevo Anexo
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setView('list')} className="text-[10px] uppercase font-black tracking-widest">
                Volver al Historial
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="px-10 py-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
          {view === 'create' ? (
            <div className="grid grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Lado Izquierdo: Selección de qué cambia */}
              <div className="col-span-4 space-y-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 text-left">¿Qué vamos a modificar?</h3>
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 cursor-pointer transition-all" onClick={() => toggleField('salary')}>
                  <Checkbox checked={selectedFields.includes('salary')} />
                  <Label className="font-black text-[11px] uppercase cursor-pointer">Sueldo Base</Label>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 cursor-pointer transition-all" onClick={() => toggleField('hours')}>
                  <Checkbox checked={selectedFields.includes('hours')} />
                  <Label className="font-black text-[11px] uppercase cursor-pointer">Jornada (Hrs)</Label>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 cursor-pointer transition-all" onClick={() => toggleField('position')}>
                  <Checkbox checked={selectedFields.includes('position')} />
                  <Label className="font-black text-[11px] uppercase cursor-pointer">Cargo / Rol</Label>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 cursor-pointer transition-all" onClick={() => toggleField('type')}>
                  <Checkbox checked={selectedFields.includes('type')} />
                  <Label className="font-black text-[11px] uppercase cursor-pointer">Tipo Contrato</Label>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 cursor-pointer transition-all" onClick={() => toggleField('custom')}>
                  <Checkbox checked={selectedFields.includes('custom')} />
                  <Label className="font-black text-[11px] uppercase cursor-pointer">Otra Modificación (Libre)</Label>
                </div>
              </div>

              {/* Lado Derecho: Los nuevos valores */}
              <div className="col-span-8 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 text-left">
                    <Label className="text-[9px] font-black uppercase tracking-widest ml-1 text-slate-500">Fecha Efectiva</Label>
                    <Input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} className="h-14 rounded-2xl border-slate-200 font-bold" />
                  </div>
                  <div className="space-y-2 text-left">
                    <Label className="text-[9px] font-black uppercase tracking-widest ml-1 text-slate-500">Motivo de Anexo</Label>
                    <Input placeholder="Ej: Cambio de condiciones" value={reason} onChange={e => setReason(e.target.value)} className="h-14 rounded-2xl border-slate-200 italic" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-4">
                  {selectedFields.includes('salary') && (
                    <div className="space-y-2 text-left animate-in zoom-in-95 duration-300">
                      <Label className="text-[10px] font-black text-indigo-600 uppercase">Nuevo Sueldo Base</Label>
                      <Input type="number" value={newSalary} onChange={e => setNewSalary(e.target.value)} className="h-14 rounded-2xl border-indigo-100 text-lg font-black text-slate-700" />
                      <span className="text-[9px] text-slate-400 italic block">Anterior: ${currentData?.sueldo_base?.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedFields.includes('hours') && (
                    <div className="space-y-2 text-left animate-in zoom-in-95 duration-300">
                      <Label className="text-[10px] font-black text-indigo-600 uppercase">Nuevas Horas Semanales</Label>
                      <Input type="number" value={newHours} onChange={e => setNewHours(e.target.value)} className="h-14 rounded-2xl border-indigo-100" />
                      <span className="text-[9px] text-slate-400 italic block">Anterior: {currentData?.horas_semanales}h</span>
                    </div>
                  )}
                  {selectedFields.includes('position') && (
                    <div className="space-y-2 text-left animate-in zoom-in-95 duration-300 col-span-2">
                      <Label className="text-[10px] font-black text-indigo-600 uppercase">Nuevo Cargo</Label>
                      <Input value={newPosition} onChange={e => setNewPosition(e.target.value)} className="h-14 rounded-2xl border-indigo-100 uppercase font-bold" />
                      <span className="text-[9px] text-slate-400 italic block">Anterior: {currentData?.cargo}</span>
                    </div>
                  )}
                  {selectedFields.includes('type') && (
                    <div className="space-y-2 text-left animate-in zoom-in-95 duration-300 col-span-2">
                      <Label className="text-[10px] font-black text-indigo-600 uppercase">Nuevo Tipo de Contrato</Label>
                      <select
                        value={newType}
                        onChange={e => setNewType(e.target.value)}
                        className="flex h-14 w-full rounded-2xl border border-indigo-100 bg-white px-4 py-2 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                      >
                        <option value="plazo_fijo">PLAZO FIJO</option>
                        <option value="indefinido">INDEFINIDO</option>
                        <option value="por_obra_o_faena">POR OBRA O FAENA</option>
                      </select>
                      <span className="text-[9px] text-slate-400 italic block uppercase">Actual: {currentData?.tipo_contrato || 'INDEFINIDO'}</span>
                    </div>
                  )}
                  {selectedFields.includes('custom') && (
                    <div className="space-y-2 text-left animate-in zoom-in-95 duration-300 col-span-2">
                      <Label className="text-[10px] font-black text-indigo-600 uppercase">Redacción de Cláusula Personalizada</Label>
                      <textarea
                        value={customClause}
                        onChange={e => setCustomClause(e.target.value)}
                        placeholder="Escriba aquí la modificación legal exactamente como desea que aparezca..."
                        className="flex min-h-[120px] w-full rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                      />
                      <span className="text-[9px] text-slate-400 italic block uppercase">Se incorporará como una cláusula adicional en el anexo.</span>
                    </div>
                  )}
                </div>

                <Button onClick={handleSave} disabled={loading} className="w-full h-16 rounded-[2rem] bg-black text-white font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-800 shadow-2xl mt-4">
                  {loading ? "Sincronizando..." : "Registrar y Generar Anexo"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {mods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                  <AlertCircle className="w-16 h-16 mb-4" />
                  <p className="font-black uppercase tracking-widest text-xs">Sin rastro de modificaciones.</p>
                </div>
              ) : (
                mods.map((mod, i) => (
                  <div key={mod.id} className="group relative overflow-hidden bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-2xl transition-all duration-500">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-6 items-center">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm text-left">
                          <FileText className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="text-left">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                            ANEXO {mod.effective_date}
                          </span>
                          <h4 className="font-black text-lg text-slate-900 mt-1 uppercase">
                            {Object.keys(mod.changes).map(k => k.replace('_', ' ')).join(' + ')}
                          </h4>
                        </div>
                      </div>
                      <Button onClick={() => downloadAnnex(mod.id!)} variant="outline" className="rounded-2xl border-slate-200 h-14 px-6 gap-2 font-black text-[10px] uppercase hover:bg-indigo-600 hover:text-white transition-all">
                        <Download className="w-4 h-4" /> Word Anexo
                      </Button>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/80 rounded-[2rem] border border-slate-100 shadow-inner">
                      {Object.entries(mod.changes).map(([key, val]: [string, any]) => (
                        <div key={key} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                          <div className="flex flex-col text-left">
                            <span className="text-[9px] font-black text-slate-400 uppercase">{key.replace('_', ' ')}</span>
                            <span className="text-sm font-bold opacity-60 line-through">
                              {typeof mod.old_values === 'object' ? JSON.stringify((mod.old_values as any)[key]) : 'N/A'}
                            </span>
                          </div>
                          <ArrowRight className="w-5 h-5 text-indigo-400" />
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black text-indigo-600 uppercase">Nuevo</span>
                            <span className="text-sm font-black text-indigo-900">{String(val)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-10 pt-4 bg-slate-50/50">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mx-auto flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            SISTEMA AUDITADO INTEGRAL - CONTAPYME V2 MASTER
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
