"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Layers, Plus, Trash2, Loader2 } from "lucide-react";
import {
  CustomItem,
  CustomItemTipo,
  createCustomItem,
  deleteCustomItem,
  getCustomItems,
} from "@/actions/payroll-custom-items";

interface EmployeeOption {
  id: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string;
}

interface CustomItemsCardProps {
  orgId: string;
  employees: EmployeeOption[];
  initialItems: CustomItem[];
}

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function CustomItemsCard({ orgId, employees, initialItems }: CustomItemsCardProps) {
  const [items, setItems] = useState<CustomItem[]>(initialItems);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    employee_id: "",
    periodo: currentMonth(),
    tipo: "haber" as CustomItemTipo,
    nombre: "",
    monto: "",
    es_imponible: true,
  });

  const refresh = async () => setItems(await getCustomItems(orgId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employee_id) return toast.error("Seleccione un colaborador");
    const monto = parseInt(form.monto || "0", 10);
    if (!form.nombre.trim()) return toast.error("Ingrese un nombre para el concepto");
    if (monto <= 0) return toast.error("El monto debe ser mayor a cero");

    setSaving(true);
    try {
      const res = await createCustomItem({
        organization_id: orgId,
        employee_id: form.employee_id,
        periodo: form.periodo,
        tipo: form.tipo,
        nombre: form.nombre,
        monto,
        es_imponible: form.es_imponible,
      });
      if (res.success) {
        toast.success("Concepto agregado. Se aplicará al procesar la nómina del período.");
        setForm({ ...form, nombre: "", monto: "" });
        await refresh();
      } else {
        toast.error(res.error || "Error al agregar el concepto");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await deleteCustomItem(id, orgId);
      if (res.success) {
        toast.success("Concepto eliminado");
        await refresh();
      } else {
        toast.error(res.error || "Error al eliminar");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const inputClass = "bg-muted/10 border-2 border-border text-foreground font-bold text-xs h-12 rounded-2xl focus:ring-primary";

  return (
    <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-indigo-500/20">
      <CardHeader className="bg-muted/5 border-b border-border p-6">
        <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" /> Haberes y Descuentos Adicionales
        </CardTitle>
        <CardDescription className="text-[10px] font-bold uppercase tracking-wider">
          Conceptos propios por colaborador y período (un bono especial, un descuento puntual, etc.).
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1 lg:col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Colaborador</label>
            <select
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
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Período</label>
            <Input
              type="month"
              required
              value={form.periodo}
              onChange={(e) => setForm((p) => ({ ...p, periodo: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value as CustomItemTipo }))}
              className="h-12 w-full rounded-2xl border-2 border-border bg-card px-3 font-bold uppercase text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="haber">Haber</option>
              <option value="descuento">Descuento</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre</label>
            <Input
              value={form.nombre}
              onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              placeholder="Ej. Bono producción"
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Monto ($)</label>
            <Input
              type="number"
              min="0"
              value={form.monto}
              onChange={(e) => setForm((p) => ({ ...p, monto: e.target.value }))}
              className={inputClass}
            />
          </div>

          {form.tipo === "haber" && (
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 h-12">
              <input
                type="checkbox"
                checked={form.es_imponible}
                onChange={(e) => setForm((p) => ({ ...p, es_imponible: e.target.checked }))}
                className="w-4 h-4 accent-indigo-600"
              />
              Imponible
            </label>
          )}

          <div className={form.tipo === "haber" ? "lg:col-span-2" : "lg:col-span-3"}>
            <Button type="submit" disabled={saving} className="h-12 w-full font-black uppercase text-[10px] tracking-widest rounded-full gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Agregar
            </Button>
          </div>
        </form>

        {items.length > 0 && (
          <div className="border border-border rounded-2xl overflow-hidden divide-y divide-border/40">
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between gap-4 px-4 py-3 text-xs">
                <div className="flex-1 min-w-0">
                  <span className="font-black uppercase text-foreground truncate block">
                    {it.employees?.apellido_paterno} {it.employees?.nombres}
                  </span>
                  <span className="text-muted-foreground font-bold">
                    {it.tipo === "haber"
                      ? `Haber ${it.es_imponible ? "imponible" : "no imponible"}`
                      : "Descuento"}{" "}
                    · {it.nombre} · {String(it.periodo).slice(0, 7)}
                  </span>
                </div>
                <span className={`font-mono font-black whitespace-nowrap ${it.tipo === "descuento" ? "text-rose-600" : "text-emerald-600"}`}>
                  {it.tipo === "descuento" ? "−" : "+"}${Number(it.monto).toLocaleString("es-CL")}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(it.id)}
                  disabled={deletingId === it.id}
                  className="text-rose-600 hover:bg-rose-50 rounded-xl h-8 w-8 p-0"
                >
                  {deletingId === it.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
