import React from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  PlusCircle, 
  FileText, 
  UserPlus, 
  Users as UsersIcon, 
  TrendingUp, 
  DollarSign, 
  Calendar as CalendarIcon, 
  Briefcase, 
  RefreshCcw,
  CheckCircle2,
  Calculator
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatRUT } from '@/lib/utils/rut'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import { CreateEmployeeButton } from './create-employee-button'
import { ProcessPayrollButton } from './process-payroll-button'
import { CentralizePayrollButton } from './centralize-payroll-button'
import { GenerateContractButton } from './generate-contract-button'
import { ExportPreviredButton } from './export-previred-button'
import { ExportDJ1887Button } from './export-dj1887-button'
import { ImportPreviredPDFButton } from './import-previred-button'
import { TerminateEmployeeButton } from './terminate-button'
import { DeleteEmployeeButton } from './delete-employee-button'
import { EditEmployeeButton } from './edit-employee-button'
import { DeleteLiquidationButton } from './delete-liquidation-button'
import { ApproveLiquidationButton } from './approve-liquidation-button'
import { PayrollPeriodSelector } from './payroll-period-selector'
import { BulkLiquidationsButton } from './bulk-liquidations-button'
import { BulkEmailLiquidationsButton } from './bulk-email-liquidations-button'
import { BulkApproveLiquidationsButton } from './bulk-approve-liquidations-button'
import { getActiveOrganizationId } from '@/actions/organizations'

// ==========================================
// HELPERS & SUBCOMPONENTS
// ==========================================
const formatCLP = (amount: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(amount);

function KPIItem({ label, value, sub, icon: Icon, color, borderColor }: any) {
    return (
        <Card className={cn("bg-card border-border shadow-2xl rounded-3xl overflow-hidden border-l-8 group hover:scale-[1.02] transition-all", borderColor)}>
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-2 leading-none">{label}</p>
              <p className={cn("text-3xl font-black tracking-tighter", color)}>{value}</p>
              {sub && <p className="text-[11px] text-muted-foreground/60 font-bold italic mt-2">{sub}</p>}
            </div>
            <div className={`p-4 rounded-2xl bg-muted/30 border border-border group-hover:bg-white transition-colors`}>
              <Icon className={cn("w-8 h-8 opacity-40 group-hover:opacity-100 transition-opacity", color)} />
            </div>
          </div>
        </CardContent>
      </Card>
    )
}

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  
  // Normalizar la fecha actual a la zona horaria de Chile para evitar desfases de hidratación (UTC vs Local)
  const chileDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }))
  const currentYear = chileDate.getFullYear().toString()
  const currentMonth = (chileDate.getMonth() + 1).toString().padStart(2, '0')
  
  const selectedYear = (params.year as string) || currentYear
  const selectedMonth = (params.month as string) || currentMonth
  const selectedPeriod = `${selectedYear}-${selectedMonth}-01`

  const supabase = await createClient()
  const activeOrgId = await getActiveOrganizationId()

  if (!activeOrgId) {
    return <div className="p-8 text-center text-muted-foreground font-medium">Seleccione una empresa en el encabezado para continuar.</div>
  }

  const { data: orgData } = await supabase.from('organizations').select('nombre').eq('id', activeOrgId).single()
  
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .eq('organization_id', activeOrgId)
    .order('apellido_paterno', { ascending: true })

  const totalEmployees = employees?.length || 0
  const activeEmployees = employees?.filter(e => e.activo).length || 0
  const totalBaseSalary = employees?.reduce((acc, current) => acc + Number(current.sueldo_base || 0), 0) || 0

  return (
    <div className="space-y-10 animate-in fade-in zoom-in duration-700" suppressHydrationWarning={true}>
      {/* ===== CABECERA PREMIUM ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b-2 border-primary/5">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase mb-2 bg-clip-text">
            Nómina y <span className="text-primary italic">Recursos Humanos</span>
          </h1>
          <p className="text-muted-foreground font-bold italic flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary opacity-50" />
            Control centralizado de capital humano y procesos de liquidación normativa.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <ImportPreviredPDFButton />
          <ExportPreviredButton 
            organizationId={activeOrgId} 
             periodo={selectedPeriod} 
          />
          <ExportDJ1887Button />
          <Link href="/dashboard/payroll/lre">
            <Button
              variant="outline"
              className="border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/30 font-black uppercase text-xs tracking-widest rounded-[1.5rem] h-11 px-6 shadow-lg shadow-primary/5 transition-all"
            >
              <FileText className="w-4 h-4 mr-2" />
              Libro LRE
            </Button>
          </Link>
          <Link href="/dashboard/payroll/calculator">
            <Button
              variant="outline"
              className="border-blue-200 bg-blue-50/30 text-blue-700 hover:bg-blue-50 hover:border-blue-300 font-black uppercase text-xs tracking-widest rounded-[1.5rem] h-11 px-6 shadow-lg shadow-blue-500/5 transition-all"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Calculadora Inversa
            </Button>
          </Link>
          <Link href="/dashboard/payroll/novedades">
            <Button
              variant="outline"
              className="border-emerald-200 bg-emerald-50/30 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 font-black uppercase text-xs tracking-widest rounded-[1.5rem] h-11 px-6 shadow-lg shadow-emerald-500/5 transition-all"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Novedades Masivas
            </Button>
          </Link>
          <CreateEmployeeButton />
          <ProcessPayrollButton />
          <CentralizePayrollButton />
        </div>
      </div>

      {/* ===== KPI DASHBOARD ===== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPIItem 
            label="Total Plantilla" 
            value={String(totalEmployees)} 
            icon={UsersIcon} 
            color="text-primary" 
            borderColor="border-primary"
            sub={`${activeEmployees} colaboradores activos`} 
        />
        <KPIItem 
            label="Costo Base Mensual" 
            value={formatCLP(totalBaseSalary)} 
            icon={DollarSign} 
            color="text-emerald-600" 
            borderColor="border-emerald-600"
            sub="Proyección de sueldos base" 
        />
        <KPIItem 
            label="Detalle Periodo" 
            value={`${selectedMonth}/${selectedYear}`} 
            icon={CalendarIcon} 
            color="text-amber-600" 
            borderColor="border-amber-600"
            sub="Vista de Remuneraciones" 
        />
        <KPIItem 
            label="Estado Motor" 
            value="READY" 
            icon={TrendingUp} 
            color="text-blue-600" 
            borderColor="border-blue-600"
            sub="Algoritmo V2 sincronizado" 
        />
      </div>

      <div className="grid grid-cols-1 gap-10">
        <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/10">
          <CardHeader className="bg-muted/5 border-b border-border p-10">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Kardex de Empleados</CardTitle>
                    <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                        REGISTRO FEDERAL DE COLABORADORES EN {orgData?.nombre || 'LA ORGANIZACIÓN'}
                    </CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {employees && employees.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 border-border">
                      <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">RUT</TableHead>
                      <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Nombre Completo / Identidad</TableHead>
                      <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Cargo Institucional</TableHead>
                      <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Remuneración Base</TableHead>
                      <TableHead className="text-center text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Vigencia</TableHead>
                      <TableHead className="text-right text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6 w-[200px]">Auditoría / Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/50">
                    {employees.map((emp) => (
                      <TableRow key={emp.id} className="border-border hover:bg-primary/[0.02] transition-colors group">
                        <TableCell className="px-10 py-6">
                            <span className="font-mono text-xs font-black bg-muted/50 px-3 py-1.5 rounded-lg border border-border text-foreground/70">
                                {formatRUT(emp.rut)}
                            </span>
                        </TableCell>
                        <TableCell className="px-10 py-6">
                            <div className="flex flex-col">
                                <span className="font-black text-foreground uppercase text-xs tracking-tight group-hover:text-primary transition-colors">
                                    {emp.nombres} {emp.apellido_paterno} {emp.apellido_materno}
                                </span>
                                <span className="text-[10px] text-muted-foreground/60 font-bold uppercase italic mt-0.5">Colaborador ID: {emp.id.slice(0,8)}</span>
                            </div>
                        </TableCell>
                        <TableCell className="px-10 py-6">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                <span className="text-foreground/80 font-black uppercase text-[10px] tracking-widest">{emp.cargo || 'SIN ASIGNAR'}</span>
                            </div>
                        </TableCell>
                        <TableCell className="px-10 py-6">
                          <span className="font-mono text-sm font-black text-foreground">
                            {formatCLP(Number(emp.sueldo_base))}
                          </span>
                        </TableCell>
                        <TableCell className="px-10 py-6 text-center">
                          <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${emp.activo ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-rose-600 text-white shadow-rose-600/20'}`}>
                            {emp.activo ? 'Activo' : 'Baja'}
                          </span>
                        </TableCell>
                        <TableCell className="px-10 py-6 text-right">
                          <div className="flex flex-col items-end gap-2">
                            <GenerateContractButton employeeId={emp.id} />
                            <div className="flex items-center gap-2">
                                <TerminateEmployeeButton 
                                  employeeId={emp.id} 
                                  employeeName={`${emp.nombres} ${emp.apellido_paterno}`}
                                  organizationId={activeOrgId}
                                />
                                 <EditEmployeeButton employee={emp} />
                                <DeleteEmployeeButton 
                                  employeeId={emp.id} 
                                  employeeName={`${emp.nombres} ${emp.apellido_paterno}`} 
                                />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-24 flex flex-col items-center justify-center text-muted-foreground border-4 border-dashed border-border m-10 rounded-[2rem] bg-muted/5">
                <div className="bg-muted/20 p-8 rounded-full mb-6 border border-border">
                    <UsersIcon className="w-16 h-16 text-muted-foreground/20" />
                </div>
                <p className="font-black uppercase text-xl tracking-[0.2em] text-foreground/30">Nómina Vacía</p>
                <p className="text-sm font-bold mt-2 italic max-w-xs text-center">Inyecte registros de personal utilizando el botón de creación superior.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-emerald-500/10">
          <CardHeader className="bg-muted/5 border-b border-border p-10">
            <div className="flex justify-between items-center text-left">
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-black text-foreground flex items-center gap-4 uppercase tracking-tight">
                        <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-600/20">
                            <FileText className="w-6 h-6" />
                        </div>
                        Cálculo de Liquidaciones
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic ml-16">
                        RESULTADOS DE PROCESAMIENTO — MÓDULO ALGORÍTMICO INTEGRADO
                    </CardDescription>
                </div>
                <PayrollPeriodSelector />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <LiquidationsTable orgId={activeOrgId} year={selectedYear} month={selectedMonth} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

async function LiquidationsTable({ orgId, year, month }: { orgId: string, year: string, month: string }) {
  const supabase = await createClient()

  // Normalizar el mes a 2 dígitos siempre (ej: "3" -> "03")
  const paddedMonth = month.padStart(2, '0')

  // El campo 'periodo' es de tipo DATE en PostgreSQL (ej: '2026-03-01').
  // .like() no funciona en DATE columns. Usamos un rango de fechas exacto.
  const dateStart = `${year}-${paddedMonth}-01`
  // Calcular el último día del mes correctamente
  const lastDay = new Date(parseInt(year), parseInt(paddedMonth), 0).getDate()
  const dateEnd = `${year}-${paddedMonth}-${lastDay}`

  const { data: liquidations } = await supabase
    .from('liquidations')
    .select(`
      *,
      employees (
        nombres,
        apellido_paterno
      )
    `)
    .eq('organization_id', orgId)
    .gte('periodo', dateStart)
    .lte('periodo', dateEnd)
    .order('created_at', { ascending: false })

  if (!liquidations || liquidations.length === 0) {
    return (
      <div className="text-center py-24 text-muted-foreground border-2 border-dashed border-border m-10 rounded-[2rem] bg-muted/5">
        <div className="bg-muted/20 p-8 rounded-full mb-6 border border-border inline-block mx-auto">
            <CalendarIcon className="w-12 h-12 text-muted-foreground/20" />
        </div>
        <p className="font-black uppercase text-xs tracking-widest italic opacity-60">
            No hay liquidaciones procesadas para {month}/{year}.
        </p>
        <p className="text-[10px] font-bold mt-2">Utilice el botón superior para procesar la nómina de este periodo.</p>
      </div>
    )
  }

  // Totales para el banner inteligente
  const totalNeto = liquidations.reduce((acc, l) => acc + Number(l.sueldo_liquido), 0)
  const totalDescuentos = liquidations.reduce((acc, l) => acc + Number(l.total_descuentos), 0)
  const totalCosto = liquidations.reduce((acc, l) => acc + Number(l.total_haberes_brutos), 0)
  const approvedLiquidationsCount = liquidations.filter((liq) => liq.status === 'aprobada').length
  const draftLiquidationsCount = liquidations.filter((liq) => liq.status === 'borrador').length

  return (
    <div className="space-y-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 px-6 md:px-10 py-5 border-b border-border bg-muted/10">
        <BulkApproveLiquidationsButton organizationId={orgId} year={year} month={month} count={draftLiquidationsCount} />
        <BulkLiquidationsButton organizationId={orgId} year={year} month={month} count={liquidations.length} />
        <BulkEmailLiquidationsButton organizationId={orgId} year={year} month={month} count={approvedLiquidationsCount} />
      </div>

      {/* BANNER DE RESUMEN INTELIGENTE */}
      <div className="grid grid-cols-3 gap-0 border-b border-border bg-emerald-600/5">
        <div className="px-10 py-6 border-r border-border/50">
            <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1">Total Neto Pagado</p>
            <p className="text-xl font-black text-emerald-900 tracking-tighter">{formatCLP(totalNeto)}</p>
        </div>
        <div className="px-10 py-6 border-r border-border/50">
            <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">Total Retenciones</p>
            <p className="text-xl font-black text-rose-900 tracking-tighter">{formatCLP(totalDescuentos)}</p>
        </div>
        <div className="px-10 py-6">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Costo Empresa (Bruto)</p>
            <p className="text-xl font-black text-slate-900 tracking-tighter">{formatCLP(totalCosto)}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 border-border">
              <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-7">Identidad Empleado</TableHead>
              <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-7">Haberes Brutos</TableHead>
              <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-7">Deducciones Legales</TableHead>
              <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-7">Neto Liquidado</TableHead>
              <TableHead className="text-right text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-7">Estado Auditoría</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {liquidations.map((liq) => (
              <TableRow key={liq.id} className="border-border hover:bg-emerald-600/[0.02] transition-colors group">
                <TableCell className="px-10 py-6">
                  <div className="flex flex-col">
                      <span className="font-black text-foreground uppercase text-xs tracking-tight group-hover:text-emerald-700 transition-colors">
                          {liq.employees?.nombres} {liq.employees?.apellido_paterno}
                      </span>
                      <span className="font-mono text-[10px] text-emerald-700/70 font-black tracking-widest mt-0.5">
                          {liq.folio_number || '—'}
                      </span>
                  </div>
                </TableCell>
                <TableCell className="px-10 py-6">
                  <span className="font-mono text-sm font-black text-foreground">
                      {formatCLP(Number(liq.total_haberes_brutos))}
                  </span>
                </TableCell>
                <TableCell className="px-10 py-6">
                  <span className="font-mono text-sm font-black text-rose-600">
                      -{formatCLP(Number(liq.total_descuentos))}
                  </span>
                </TableCell>
                <TableCell className="px-10 py-6">
                  <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-xl inline-block">
                      <span className="font-mono text-sm font-black text-emerald-700">
                          {formatCLP(Number(liq.sueldo_liquido))}
                      </span>
                  </div>
                </TableCell>
                <TableCell className="px-10 py-6 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <span className={cn(
                      "inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black shadow-xl uppercase tracking-[0.2em] transition-all",
                      liq.status === 'aprobada' 
                        ? "bg-emerald-600 text-white shadow-emerald-600/20" 
                        : "bg-amber-600 text-white shadow-amber-600/20"
                    )}>
                      {liq.status === 'aprobada' ? (
                        <CheckCircle2 className="w-3 h-3 mr-2" />
                      ) : (
                        <RefreshCcw className="w-3 h-3 mr-2 animate-spin-slow" />
                      )}
                      {liq.status}
                    </span>
                    {liq.status === 'borrador' && (
                      <ApproveLiquidationButton id={liq.id} employeeName={`${liq.employees?.nombres} ${liq.employees?.apellido_paterno}`} />
                    )}
                    <Link href={`/dashboard/payroll/liquidations/${liq.folio_number || liq.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 text-primary">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </Link>
                    {liq.status === 'borrador' && (
                      <DeleteLiquidationButton id={liq.id} employeeName={`${liq.employees?.nombres} ${liq.employees?.apellido_paterno}`} />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
