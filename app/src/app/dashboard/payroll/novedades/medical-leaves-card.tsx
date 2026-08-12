"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { HeartPulse, Plus, Trash2, Loader2 } from "lucide-react";
import {
  MedicalLeave,
  MedicalLeaveType,
  createMedicalLeave,
  deleteMedicalLeave,
  getMedicalLeaves,
} from "@/actions/medical-leaves";

interface EmployeeOption {
  id: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string;
}

interface MedicalLeavesCardProps {
  orgId: string;
  employees: EmployeeOption[];
  initialLeaves: MedicalLeave[];
}

const TIPO_LABEL: Record<MedicalLeaveType, string> = {
  licencia_comun: "Licencia común (subsidio)",
  accidente_trabajo: "Accidente del trabajo",
  licencia_maternal: "Licencia maternal",
};

/** Días corridos del rango (ambos extremos inclusive). */
function diasCorridos(inicio: string, fin: string): number {
  if (!inicio || !fin) return 0;
  const a = new Date(`${inicio}T12:00:00`);
  const b = new Date(`${fin}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return 0;
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000) + 1;
}

export default function MedicalLeavesCard({ orgId, employees, initialLeaves }: MedicalLeavesCardProps) {
  const [leaves, setLeaves] = useState<MedicalLeave[]>(initialLeaves);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    employee_id: "",
    tipo: "licencia_comun" as MedicalLeaveType,
    fecha_inicio: "",
    fecha_fin: "",
    folio: "",
    comentarios: "",
  });

  const dias = useMemo(() => diasCorridos(form.fecha_inicio, form.fecha_fin), [form.fecha_inicio, form.fecha_fin]);

  const refresh = async () => {
    setLeaves(await getMedicalLeaves(orgId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employee_id) return toast.error("Seleccione un colaborador");
    if (dias <= 0) return toast.error("Rango de fechas inválido");

    setSaving(true);
    try {
      const res = await createMedicalLeave({
        organization_id: orgId,
        employee_id: form.employee_id,
        tipo: form.tipo,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        dias_licencia: dias,
        folio: form.folio,
        comentarios: form.comentarios,
      });
      if (res.success) {
        toast.success("Licencia registrada. Se actualizaron días y movimiento Previred.");
        setForm({ employee_id: "", tipo: "licencia_comun", fecha_inicio: "", fecha_fin: "", folio: "", comentarios: "" });
        await refresh();
      } else {
        toast.error(res.error || "Error al registrar la licencia");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await deleteMedicalLeave(id, orgId);
      if (res.success) {
        toast.success("Licencia eliminada");
        await refresh();
      } else {
        toast.error(res.error || "Error al eliminar");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const inputClass =
    "bg-muted/10 border-2 border-border text-foreground font-bold text-xs h-12 rounded-2xl focus:ring-primary";

  return (
    <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-rose-500/20">
      <CardHeader className="bg-muted/5 border-b border-border p-6">
        <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-rose-500" /> Licencias Médicas
        </CardTitle>
        <CardDescription className="text-[10px] font-bold uppercase tracking-wider">
          Registra licencias y accidentes. Ajusta automáticamente días trabajados y el movimiento Previred (3/6).
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div className="space-y-1 lg:col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Colaborador</label>
            <select id="field_form_employee_id" name="field_form_employee_id"
              value={form.employee_id}
              onChange={(e) => setForm((p) => ({ ...p, employee_id: e.target.value }))}
              className="h-12 w-full rounded-2xl border-2 border-border bg-card px-3 font-bold uppercase text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Seleccione...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.apellido_paterno} {emp.apellido_materno || ""}, {emp.nombres}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tipo</label>
            <select id="field_form_tipo" name="field_form_tipo"
              value={form.tipo}
              onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value as MedicalLeaveType }))}
              className="h-12 w-full rounded-2xl border-2 border-border bg-card px-3 font-bold uppercase text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="licencia_comun">Licencia común (3)</option>
              <option value="accidente_trabajo">Accidente del trabajo (6)</option>
              <option value="licencia_maternal">Licencia maternal (3)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Folio</label>
            <Input id="field_form_folio" name="field_form_folio"
              value={form.folio}
              onChange={(e) => setForm((p) => ({ ...p, folio: e.target.value }))}
              placeholder="N° licencia"
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Desde</label>
            <Input id="field_form_fecha_inicio" name="field_form_fecha_inicio"
              type="date"
              required
              value={form.fecha_inicio}
              onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Hasta</label>
            <Input id="field_form_fecha_fin" name="field_form_fecha_fin"
              type="date"
              required
              value={form.fecha_fin}
              onChange={(e) => setForm((p) => ({ ...p, fecha_fin: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-3">
            {dias > 0 && (
              <span className="text-[10px] font-black uppercase text-rose-600 whitespace-nowrap">
                {dias} días · {30 - Math.min(30, dias)} trab.
              </span>
            )}
            <Button
              type="submit"
              disabled={saving}
              className="h-12 flex-1 font-black uppercase text-[10px] tracking-widest rounded-full gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Registrar
            </Button>
          </div>
        </form>

        {leaves.length > 0 && (
          <div className="border border-border rounded-2xl overflow-hidden divide-y divide-border/40">
            {leaves.map((lv) => (
              <div key={lv.id} className="flex items-center justify-between gap-4 px-4 py-3 text-xs">
                <div className="flex-1 min-w-0">
                  <span className="font-black uppercase text-foreground truncate block">
                    {lv.employees?.apellido_paterno} {lv.employees?.nombres}
                  </span>
                  <span className="text-muted-foreground font-bold">
                    {TIPO_LABEL[lv.tipo]} · {lv.dias_licencia} días · mov. {lv.previred_movement_code}
                    {lv.folio ? ` · folio ${lv.folio}` : ""}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                  {new Date(lv.fecha_inicio + "T12:00:00").toLocaleDateString()} →{" "}
                  {new Date(lv.fecha_fin + "T12:00:00").toLocaleDateString()}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(lv.id)}
                  disabled={deletingId === lv.id}
                  className="text-rose-600 hover:bg-rose-50 rounded-xl h-8 w-8 p-0"
                >
                  {deletingId === lv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
