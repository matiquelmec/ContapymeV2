"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Save, ChevronLeft, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { saveNovedadesBulk } from "@/actions/novedades";
import { toast } from "sonner";
import Link from "next/link";
import { formatRUT } from "@/lib/utils/rut";

interface EmployeeRow {
  id: string;
  rut: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  dias_trabajados?: number;
  horas_extra_pendientes?: number;
  bono_extra?: number;
  previred_movement_code?: "0" | "3" | "6";
}

export default function NovedadesClient({
  organization,
  initialEmployees,
}: {
  organization: any;
  initialEmployees: any[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<EmployeeRow[]>(
    initialEmployees.map((emp) => ({
      id: emp.id,
      rut: emp.rut,
      nombres: emp.nombres,
      apellido_paterno: emp.apellido_paterno,
      apellido_materno: emp.apellido_materno,
      dias_trabajados: emp.dias_trabajados !== undefined ? emp.dias_trabajados : 30,
      horas_extra_pendientes: emp.horas_extra_pendientes || 0,
      bono_extra: emp.bono_extra || 0,
      previred_movement_code: (emp.previred_movement_code || "0") as "0" | "3" | "6",
    }))
  );

  const handleInputChange = (index: number, field: keyof EmployeeRow, value: number | "0" | "3" | "6") => {
    const updated = [...employees];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setEmployees(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = employees.map((emp) => ({
        employee_id: emp.id,
        dias_trabajados: emp.dias_trabajados ?? 30,
        horas_extra_pendientes: emp.horas_extra_pendientes ?? 0,
        bono_extra: emp.bono_extra ?? 0,
        previred_movement_code: (emp.previred_movement_code || "0") as "0" | "3" | "6",
      }));

      const res = await saveNovedadesBulk(payload);
      if (res.success) {
        toast.success("Novedades guardadas correctamente", {
          description: "Los valores actualizados se usarán en el próximo proceso de nómina.",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        });
        router.push("/dashboard/payroll");
      } else {
        toast.error(res.error || "Error al actualizar novedades masivas");
      }
    } catch (error) {
      toast.error("Error al conectar con la base de datos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link href="/dashboard/payroll">
          <Button variant="ghost" className="rounded-xl">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Volver a Nómina
          </Button>
        </Link>
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl h-11 px-6 shadow-lg shadow-emerald-500/20"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Guardar Novedades
        </Button>
      </div>

      <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/10">
        <CardHeader className="bg-muted/5 border-b border-border p-10">
          <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">
            Planilla de Variables
          </CardTitle>
          <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
            MODIFICACIÓN RÁPIDA DE DÍAS, HORAS EXTRAS Y BONOS PARA {organization.nombre}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {employees.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-border">
                    <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">RUT</TableHead>
                    <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Empleado</TableHead>
                    <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6 text-center w-[150px]">Días Trabajados</TableHead>
                    <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6 text-center w-[150px]">Horas Extra</TableHead>
                    <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6 text-center w-[180px]">Tipo Novedad</TableHead>
                    <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6 text-center w-[200px]">Bono Extra ($)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/50">
                  {employees.map((emp, index) => (
                    <TableRow key={emp.id} className="border-border hover:bg-primary/[0.01]">
                      <TableCell className="px-10 py-4 font-mono text-xs text-foreground/70">
                        {formatRUT(emp.rut)}
                      </TableCell>
                      <TableCell className="px-10 py-4 font-black text-foreground uppercase text-xs">
                        {emp.nombres} {emp.apellido_paterno} {emp.apellido_materno}
                      </TableCell>
                      <TableCell className="px-10 py-4 text-center">
                        <Input
                          type="number"
                          min="0"
                          max="31"
                          value={emp.dias_trabajados ?? 30}
                          onChange={(e) =>
                            handleInputChange(index, "dias_trabajados", parseInt(e.target.value) || 0)
                          }
                          className="w-20 text-center font-mono font-bold rounded-lg border-border mx-auto"
                        />
                      </TableCell>
                      <TableCell className="px-10 py-4 text-center">
                        <select
                          value={emp.previred_movement_code ?? "0"}
                          onChange={(e) =>
                            handleInputChange(index, "previred_movement_code", (e.target.value as "0" | "3" | "6"))
                          }
                          className="w-40 text-center font-mono font-bold rounded-lg border border-border bg-white h-10 px-2"
                        >
                          <option value="0">Sin novedad</option>
                          <option value="3">Licencia/Subsidio</option>
                          <option value="6">Accidente</option>
                        </select>
                      </TableCell>
                      <TableCell className="px-10 py-4 text-center">
                        <Input
                          type="number"
                          min="0"
                          value={emp.horas_extra_pendientes ?? 0}
                          onChange={(e) =>
                            handleInputChange(index, "horas_extra_pendientes", parseInt(e.target.value) || 0)
                          }
                          className="w-20 text-center font-mono font-bold rounded-lg border-border mx-auto"
                        />
                      </TableCell>
                      <TableCell className="px-10 py-4 text-center">
                        <Input
                          type="number"
                          min="0"
                          value={emp.bono_extra ?? 0}
                          onChange={(e) =>
                            handleInputChange(index, "bono_extra", parseInt(e.target.value) || 0)
                          }
                          className="w-36 text-center font-mono font-bold rounded-lg border-border mx-auto"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-24 text-center text-muted-foreground border-4 border-dashed border-border m-10 rounded-[2rem] bg-muted/5">
              <p className="font-black uppercase text-lg text-foreground/30">Sin Empleados Activos</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
