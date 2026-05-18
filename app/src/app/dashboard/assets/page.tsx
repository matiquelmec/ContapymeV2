import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Building2, TrendingDown, Package, CheckCircle, Box } from 'lucide-react'
import { CreateAssetButton } from './create-asset-button'
import { DepreciateButton } from './depreciate-button'

export default async function AssetsPage() {
  const supabase = await createClient()

  const { getActiveOrganizationId } = await import('@/actions/organizations')
  const activeOrgId = await getActiveOrganizationId()

  if (!activeOrgId) {
    return <div className="p-8 text-center text-muted-foreground font-bold italic">Seleccione una empresa en el encabezado para administrar sus activos fijos.</div>
  }

  const { data: orgData } = await supabase.from('organizations').select('nombre').eq('id', activeOrgId).single()

  const { data: assets } = await supabase
    .from('fixed_assets')
    .select('*')
    .eq('organization_id', activeOrgId)
    .order('fecha_adquisicion', { ascending: false })

  const totalActivos = assets?.filter(a => a.condicion === 'activo').length || 0
  const valorTotalAdquisicion = assets?.reduce((sum, a) => sum + (a.valor_adquisicion || 0), 0) || 0
  const valorTotalLibro = assets?.reduce((sum, a) => sum + (a.valor_libro_actual || a.valor_adquisicion || 0), 0) || 0
  const depreciacionMensualTotal = assets?.reduce((sum, a) => sum + (a.depreciacion_mensual || 0), 0) || 0

  const condicionColor: Record<string, string> = {
    activo: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    vendido: 'bg-blue-50 text-blue-700 border-blue-100',
    dado_de_baja: 'bg-rose-50 text-rose-700 border-rose-100',
    en_reparacion: 'bg-amber-50 text-amber-700 border-amber-100',
  }

  const metodoLabel: Record<string, string> = {
    lineal: 'Lineal',
    acelerada: 'Acelerada',
  }

  const fCLP = (n: number) => `$${n.toLocaleString('es-CL')}`

  return (
    <div className="space-y-10 animate-in fade-in zoom-in duration-700" suppressHydrationWarning={true}>

      {/* ===== CABECERA PREMIUM ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b-2 border-primary/5">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase mb-2">
            Activos <span className="text-primary italic">Fijos</span>
          </h1>
          <p className="text-muted-foreground font-bold italic flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary opacity-50" />
            Control de bienes de capital y depreciación contable de{' '}
            <strong className="text-foreground not-italic">{orgData?.nombre || 'la empresa'}</strong>.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
          <CreateAssetButton />
          <DepreciateButton />
        </div>
      </div>

      {/* ===== KPI DASHBOARD ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden border-l-8 border-l-primary hover:scale-[1.02] transition-all group">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] leading-none mb-2">Activos Operativos</p>
                <p className="text-4xl font-black text-primary tracking-tighter">{totalActivos}</p>
                <p className="text-[11px] text-muted-foreground/60 font-bold italic mt-2">Bienes en condición activa</p>
              </div>
              <div className="p-4 rounded-2xl bg-muted/20 border border-border group-hover:bg-white transition-colors">
                <Package className="w-8 h-8 text-primary opacity-30 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden border-l-8 border-l-indigo-600 hover:scale-[1.02] transition-all group">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] leading-none mb-2">Valor Adquisición</p>
                <p className="text-2xl font-black text-indigo-700 tracking-tighter">{fCLP(valorTotalAdquisicion)}</p>
                <p className="text-[11px] text-muted-foreground/60 font-bold italic mt-2">Costo histórico total</p>
              </div>
              <div className="p-4 rounded-2xl bg-muted/20 border border-border group-hover:bg-white transition-colors">
                <Building2 className="w-8 h-8 text-indigo-600 opacity-30 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden border-l-8 border-l-emerald-600 hover:scale-[1.02] transition-all group">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] leading-none mb-2">Valor Libro Actual</p>
                <p className="text-2xl font-black text-emerald-700 tracking-tighter">{fCLP(valorTotalLibro)}</p>
                <p className="text-[11px] text-muted-foreground/60 font-bold italic mt-2">Valor contable neto vigente</p>
              </div>
              <div className="p-4 rounded-2xl bg-muted/20 border border-border group-hover:bg-white transition-colors">
                <CheckCircle className="w-8 h-8 text-emerald-600 opacity-30 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden border-l-8 border-l-amber-600 hover:scale-[1.02] transition-all group">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] leading-none mb-2">Dep. Mensual Total</p>
                <p className="text-2xl font-black text-amber-700 tracking-tighter">{fCLP(depreciacionMensualTotal)}</p>
                <p className="text-[11px] text-muted-foreground/60 font-bold italic mt-2">Cargo a resultados del período</p>
              </div>
              <div className="p-4 rounded-2xl bg-muted/20 border border-border group-hover:bg-white transition-colors">
                <TrendingDown className="w-8 h-8 text-amber-600 opacity-30 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== INVENTARIO PRINCIPAL ===== */}
      <Card className="bg-card border-border shadow-2xl rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/10">
        <CardHeader className="bg-muted/5 border-b border-border p-6 sm:p-10">
          <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Inventario de Activos Fijos</CardTitle>
          <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic leading-relaxed">
            DEPRECIACIÓN Y VALOR LIBRO PROCESADOS POR EL MOTOR PYTHON CONTABLE
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {assets && assets.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-border">
                    {['Bien de Capital', 'Adquisición', 'Método / Vida', 'Valor Adq.', 'Dep. Acum.', 'Dep. Mensual', 'Valor Libro', 'Estado'].map(h => (
                      <TableHead key={h} className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-4 sm:px-8 py-4 sm:py-6 whitespace-nowrap">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/50">
                  {assets.map((asset) => (
                    <TableRow key={asset.id} className="border-border hover:bg-primary/[0.01] transition-colors group">
                      <TableCell className="px-4 sm:px-8 py-4 sm:py-6">
                        <div className="flex flex-col">
                          <span className="font-black text-foreground uppercase text-xs tracking-tight group-hover:text-primary transition-colors">{asset.nombre}</span>
                          {asset.descripcion && (
                            <span className="text-[10px] text-muted-foreground/60 font-bold italic mt-0.5">{asset.descripcion}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 sm:px-8 py-4 sm:py-6 font-mono text-xs font-black text-foreground/70">
                        {new Date(asset.fecha_adquisicion).toLocaleDateString('es-CL')}
                      </TableCell>
                      <TableCell className="px-4 sm:px-8 py-4 sm:py-6">
                        <span className="font-black text-foreground/80 text-xs uppercase">{metodoLabel[asset.metodo_depreciacion] || asset.metodo_depreciacion}</span>
                        <span className="block text-[10px] text-muted-foreground/50 uppercase tracking-tighter font-bold italic">{asset.vida_util_meses} meses</span>
                      </TableCell>
                      <TableCell className="px-4 sm:px-8 py-4 sm:py-6 text-right font-black text-foreground/80 tabular-nums text-xs">
                        {fCLP(Number(asset.valor_adquisicion))}
                      </TableCell>
                      <TableCell className="px-4 sm:px-8 py-4 sm:py-6 text-right font-black text-rose-600 tabular-nums text-xs">
                        -{fCLP(Number(asset.depreciacion_acumulada || 0))}
                      </TableCell>
                      <TableCell className="px-4 sm:px-8 py-4 sm:py-6 text-right font-black text-amber-700 tabular-nums text-xs">
                        {fCLP(Number(asset.depreciacion_mensual || 0))}
                      </TableCell>
                      <TableCell className="px-4 sm:px-8 py-4 sm:py-6 text-right font-black text-emerald-700 tabular-nums text-xs bg-emerald-50/50">
                        {fCLP(Number(asset.valor_libro_actual || asset.valor_adquisicion))}
                      </TableCell>
                      <TableCell className="px-4 sm:px-8 py-4 sm:py-6 text-center">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${condicionColor[asset.condicion] || 'bg-muted text-muted-foreground border-border'}`}>
                          {asset.condicion.replace('_', ' ')}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-20 sm:py-32 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border/50 m-4 sm:m-10 rounded-[2rem] sm:rounded-[2.5rem] bg-muted/5">
              <div className="bg-muted/20 p-6 sm:p-8 rounded-full mb-6">
                <Box className="w-16 h-16 text-muted-foreground/20" />
              </div>
              <p className="font-black uppercase text-xl tracking-[0.2em] text-foreground/30 text-center">Sin Activos Registrados</p>
              <p className="text-sm font-bold mt-3 opacity-50 italic max-w-xs text-center px-4">Use el botón "Nuevo Activo" para comenzar el inventario de bienes de capital.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
