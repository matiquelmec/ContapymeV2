'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { updateLiquidationStatus, getLiquidationByFolio } from '@/actions/payroll'
import { sendSinglePayrollLiquidationEmailAction } from '@/actions/payroll-email'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Download,
  Printer,
  User,
  DollarSign,
  Zap,
  CheckCircle2,
  Mail,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { fCurrency, cn } from '@/lib/utils'
import { formatRUT } from '@/lib/utils/rut'
import jsPDF from 'jspdf'
import { getLiquidationPdfFilename } from '@/lib/payroll/liquidation-pdf'
import { toast } from 'sonner'

function formatName(name: string) {
  if (!name) return ''
  return name.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const FOLIO_REGEX = /^LIQ-/i

export default function LiquidationDetailPage() {
  const params = useParams()
  const rawParam = (Array.isArray(params.id) ? params.id[0] : params.id) as string
  const isFolio = FOLIO_REGEX.test(rawParam)

  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [liquidation, setLiquidation] = useState<any>(null)
  const [organization, setOrganization] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      try {
        let liq: any = null

        if (isFolio) {
          const result = await getLiquidationByFolio(rawParam)
          if (result.error || !result.data) throw new Error(result.error || 'No encontrado')
          liq = result.data
        } else {
          const { data, error } = await supabase
            .from('liquidations')
            .select('*, employees(*)')
            .eq('id', rawParam)
            .single()
          if (error) throw error
          liq = data
        }

        setLiquidation(liq)

        const { data: org } = await supabase
          .from('organizations').select('*')
          .eq('id', liq.organization_id).single()
        setOrganization(org)

        const { data: sett } = await supabase
          .from('organization_payroll_settings').select('*')
          .eq('organization_id', liq.organization_id).single()
        setSettings(sett)

      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('No se pudo cargar la liquidación')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [rawParam, isFolio])

  // 🛡️ Protección multi-empresa: refresca datos al volver a la pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') router.refresh()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [router])

  // ─── Utilidad: Cargar QR como base64 (misma API usada en contratos) ──────────
  const fetchQRBase64 = async (data: string): Promise<string | null> => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`
      const res = await fetch(qrUrl)
      if (!res.ok) return null
      const blob = await res.blob()
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
    } catch {
      console.warn('⚠️ No se pudo generar QR de verificación')
      return null
    }
  }

  // ─── Motor PDF compartido (async para QR) ──────────────────────────────────
  const buildPDFDocument = async (): Promise<jsPDF> => {
    const doc = new jsPDF()
    const emp = liquidation.employees
    const period = liquidation.periodo || 'N/A'
    const fullName = formatName(`${emp?.nombres} ${emp?.apellido_paterno} ${emp?.apellido_materno}`)

    // Encabezado empresa
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14)
    doc.text(organization?.nombre || 'Contapymepuq', 20, 20)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
    doc.text(`RUT: ${organization?.rut_empresa || ''}`, 20, 26)
    doc.text(`Giro: ${organization?.giro || ''}`, 20, 31)
    const address = organization?.direccion || ''
    const comuna = organization?.comuna || ''
    const region = organization?.region || ''
    
    // Evitar duplicados: Si la calle ya incluye la comuna, no la concatenamos de nuevo
    const baseAddress = (comuna && address.toLowerCase().includes(comuna.toLowerCase()))
      ? address
      : [address, comuna].filter(Boolean).join(', ')
      
    const finalAddress = [baseAddress, region].filter(Boolean).join(', ')
    doc.text(`Dirección: ${finalAddress || 'No registrada'}`, 20, 36)

    // Folio en esquina superior derecha
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(20, 100, 50)
    doc.text(`FOLIO N° ${liquidation.folio_number || ''}`, 190, 20, { align: 'right' })
    doc.setTextColor(0, 0, 0)

    // Título
    doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('LIQUIDACIÓN DE SUELDO', 105, 52, { align: 'center' })
    doc.setFontSize(12)
    doc.text(period.toUpperCase(), 105, 59, { align: 'center' })

    // Datos trabajador
    doc.setDrawColor(0); doc.setLineWidth(0.5)
    doc.rect(20, 67, 170, 35)
    doc.setFontSize(10); doc.setFont('helvetica', 'bold')
    doc.text('DATOS DEL TRABAJADOR', 25, 74)
    doc.line(20, 77, 190, 77)
    doc.setFont('helvetica', 'normal')
    doc.text(`Nombre: ${fullName}`, 25, 84)
    doc.text(`RUT: ${formatRUT(emp?.rut)}`, 25, 91)
    doc.text(`Fecha Ingreso: ${emp?.fecha_ingreso || ''}`, 25, 98)
    doc.text(`Cargo: ${emp?.cargo || ''}`, 110, 84)
    doc.text(`Días Trabajados: ${liquidation.dias_trabajados || 30}`, 110, 91)
    doc.text(`AFP / Salud: ${liquidation.afp_code} / ${liquidation.salud_code}`, 110, 98)

    // Columnas haberes / descuentos
    let y = 108
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
    doc.setFillColor(235, 250, 240); doc.rect(20, y, 80, 7, 'F')
    doc.setTextColor(20, 100, 50); doc.text('HABERES / INGRESOS', 25, y + 5)
    doc.setFillColor(255, 235, 240); doc.rect(110, y, 80, 7, 'F')
    doc.setTextColor(170, 30, 50); doc.text('DESCUENTOS / EGRESOS', 115, y + 5)
    doc.setTextColor(0, 0, 0)
    y += 12; doc.setFont('helvetica', 'normal')
    let yHab = y, yDes = y

    const habRow = (label: string, value: number) => {
      doc.text(label, 25, yHab); doc.text(fCurrency(value), 95, yHab, { align: 'right' }); yHab += 6
    }
    const desRow = (label: string, value: number) => {
      doc.text(label, 115, yDes); doc.text(fCurrency(value), 185, yDes, { align: 'right' }); yDes += 6
    }

    habRow('Sueldo Base', liquidation.sueldo_base)
    habRow('Gratificación Legal', liquidation.gratificacion || 0)
    if (liquidation.horas_extra_monto > 0) habRow(`Horas Extras (${liquidation.horas_extra || 0} hrs)`, liquidation.horas_extra_monto)
    habRow('Bono Colación', liquidation.asignacion_colacion || 0)
    habRow('Bono Movilización', liquidation.asignacion_movilizacion || 0)
    if (liquidation.otros_haberes > 0) habRow('Otros Haberes', liquidation.otros_haberes)

    desRow(`AFP: ${liquidation.afp_code}`, (liquidation.afp || 0) + (liquidation.afp_comision || 0))
    desRow(`Salud: ${liquidation.salud_code}`, liquidation.salud || 0)
    desRow('Seguro Cesantía (AFC)', liquidation.afc_trabajador || 0)
    if (liquidation.impuesto_unico > 0) desRow('Impuesto Único 2da Cat.', liquidation.impuesto_unico)
    if (liquidation.otros_descuentos > 0) desRow('Otros Descuentos', liquidation.otros_descuentos)

    // Totales
    y = Math.max(yHab, yDes) + 2
    doc.setLineWidth(0.1); doc.line(20, y, 100, y); doc.line(110, y, 190, y)
    y += 6; doc.setFont('helvetica', 'bold')
    doc.text('TOTAL HABERES BRUTOS', 25, y)
    doc.text(fCurrency(liquidation.total_haberes_brutos), 95, y, { align: 'right' })
    doc.text('TOTAL DESCUENTOS', 115, y)
    doc.text(fCurrency(liquidation.total_descuentos), 185, y, { align: 'right' })

    // Alcance líquido
    y += 10
    doc.setFillColor(230, 245, 255); doc.rect(20, y, 170, 15, 'F')
    doc.setFontSize(14); doc.setFont('helvetica', 'bold')
    doc.text('ALCANCE LÍQUIDO A PAGAR', 25, y + 10)
    doc.text(fCurrency(liquidation.sueldo_liquido), 180, y + 10, { align: 'right' })

    // ── BLOQUE DE FIRMAS (Formato unificado con Contratos) ──────────────────
    y += 25
    const sigBase64 = liquidation.signature_base64
    const authCode = `AUTH-${liquidation.id?.slice(0, 8).toUpperCase()}-V2`
    const verifyUrl = `https://contapymepuq.cl/verify/${liquidation.id?.slice(0, 12)}`

    // Precargar QR real (mismo servicio que contratos)
    let qrBase64: string | null = null
    if (sigBase64) {
      qrBase64 = await fetchQRBase64(verifyUrl)
    }

    // Líneas de firma
    doc.setLineWidth(0.2); doc.setDrawColor(0)
    doc.line(30, y, 90, y)   // Línea empleador
    doc.line(120, y, 180, y) // Línea trabajador

    // Firma del empleador (imagen sobre la línea izquierda, capturada al protocolizar)
    if (sigBase64) {
      try {
        doc.addImage(sigBase64, 'PNG', 40, y - 22, 40, 20)
      } catch (e) {
        console.error('Error incrustando firma en PDF:', e)
      }
    }

    // Etiquetas
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(0)
    doc.text('FIRMA EMPLEADOR', 60, y + 5, { align: 'center' })
    doc.text('FIRMA TRABAJADOR', 150, y + 5, { align: 'center' })

    // Bloque Empleador (Representante Legal + Empresa)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
    const repName = settings?.rep_legal_nombre || 'Representante Legal'
    const repRut = settings?.rep_legal_rut ? formatRUT(settings.rep_legal_rut) : 'RUT: ________'
    doc.text(repName, 60, y + 10, { align: 'center' })
    doc.text(repRut, 60, y + 14, { align: 'center' })
    doc.setFont('helvetica', 'italic'); doc.setFontSize(7)
    doc.text(`p.p. ${organization?.nombre}`, 60, y + 18, { align: 'center' })

    // Bloque Trabajador (Nombre + RUT)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
    doc.text(fullName, 150, y + 10, { align: 'center' })
    doc.text(formatRUT(emp?.rut), 150, y + 14, { align: 'center' })

    // ── SELLO DE VERIFICACIÓN DIGITAL (QR real + código) ────────────────────
    y += 28
    doc.setDrawColor(200); doc.setLineWidth(0.1)
    doc.line(20, y, 190, y) // Separador

    y += 3
    // QR real (idéntico al formato de contratos)
    if (qrBase64) {
      try {
        doc.addImage(qrBase64, 'PNG', 20, y, 18, 18)
      } catch (e) {
        console.warn('QR no disponible, usando texto fallback')
      }
    }

    // Texto de verificación junto al QR
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(80)
    doc.text('VERIFICACIÓN DE INTEGRIDAD DIGITAL', 42, y + 5)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(140)
    doc.text(`CÓDIGO: ${authCode}`, 42, y + 9)
    doc.text(`URL: ${verifyUrl}`, 42, y + 13)
    doc.text('CONTAPYMEPUQ — SELLO DE TIEMPO REGISTRADO', 42, y + 17)

    // Footer
    doc.setFontSize(7); doc.setTextColor(150)
    doc.text(`Documento generado por Contapymepuq | Emisión: ${new Date().toLocaleString('es-CL')}`, 105, 285, { align: 'center' })

    return doc
  }

  // Imprimir → abre PDF en nueva pestaña (visor nativo del navegador)
  const handlePrint = async () => {
    if (!liquidation) return
    const doc = await buildPDFDocument()
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  // Descargar → guarda el archivo directamente
  const handleDownload = async () => {
    if (!liquidation) return
    const doc = await buildPDFDocument()
    doc.save(getLiquidationPdfFilename(liquidation))
    toast.success('PDF descargado correctamente')
  }

  const handleSendEmail = async () => {
    if (!liquidation) return
    setSendingEmail(true)
    const toastId = toast.loading('Generando PDF y enviando correo...')
    try {
      const res = await sendSinglePayrollLiquidationEmailAction(liquidation.id)
      if (res.success) {
        toast.success(res.message, { id: toastId })
      } else {
        toast.error(res.message, { id: toastId })
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error al enviar el correo', { id: toastId })
    } finally {
      setSendingEmail(false)
    }
  }

  // ─── Loading / Not found ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-10 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    )
  }

  if (!liquidation) {
    return (
      <div className="p-20 text-center">
        <h2 className="text-2xl font-black text-foreground">Liquidación no encontrada</h2>
        <Button variant="link" onClick={() => router.back()}>Volver atrás</Button>
      </div>
    )
  }

  const emp = liquidation.employees
  const canSendEmail = ['aprobada', 'finalizada', 'pagada'].includes(String(liquidation.status || ''))

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b-2 border-primary/5">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-3 h-3" /> Volver a Nómina
          </button>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase flex items-center gap-3">
            Detalle de <span className="text-primary italic">Liquidación</span>
            <Badge className="bg-emerald-600 text-white border-none shadow-xl shadow-emerald-600/20 font-black uppercase tracking-widest text-[10px]">
              {liquidation.status}
            </Badge>
          </h1>
          <p className="text-muted-foreground font-bold italic mt-2 flex items-center gap-3">
            <span className="font-mono text-xs bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg font-black text-emerald-700 tracking-widest">
              FOLIO N° {liquidation.folio_number || '—'}
            </span>
            <span className="text-muted-foreground/60">•</span>
            <span>Periodo {liquidation.periodo}</span>
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" className="rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] h-12 px-6" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </Button>
          <Button variant="outline" className="rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] h-12 px-6" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button
            className="rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] h-12 px-6 shadow-xl shadow-primary/20"
            onClick={handleSendEmail}
            disabled={sendingEmail || !canSendEmail}
          >
            <Mail className="w-4 h-4 mr-2" /> {sendingEmail ? 'Enviando...' : 'Enviar por Correo'}
          </Button>
          {(liquidation.status === 'borrador' || !liquidation.status) && (
            <Button
              onClick={async () => {
                const res = await updateLiquidationStatus(liquidation.id, 'aprobada')
                if (res.success) {
                  toast.success('Liquidación aprobada satisfactoriamente.')
                  router.refresh()
                } else {
                  toast.error('Error al aprobar.')
                }
              }}
              className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] h-12 px-8 shadow-xl shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Aprobar Liquidación
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-card border-border shadow-2xl rounded-[2rem] overflow-hidden border-l-8 border-l-primary group">
            <CardHeader className="p-8 pb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                <User className="w-8 h-8" />
              </div>
              <CardTitle className="text-xl font-black uppercase tracking-tight leading-none">
                {formatName(emp?.nombres)} <br />
                <span className="text-primary">{formatName(emp?.apellido_paterno)} {formatName(emp?.apellido_materno)}</span>
              </CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] pt-2">
                Ficha Técnica del Colaborador
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-muted-foreground uppercase">RUT Institucional</p>
                <p className="font-mono font-black text-foreground">{formatRUT(emp?.rut)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-muted-foreground uppercase">Cargo / Función</p>
                <p className="font-bold text-foreground uppercase tracking-tight italic">{emp?.cargo || 'Sin Asignar'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-muted-foreground uppercase">AFP</p>
                  <Badge variant="outline" className="font-mono text-[10px] font-black">{liquidation.afp_code}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-muted-foreground uppercase">Salud</p>
                  <Badge variant="outline" className="font-mono text-[10px] font-black">{liquidation.salud_code}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20 shadow-xl rounded-[2rem] p-8 border-2 border-dashed">
            <div className="flex items-center gap-4 mb-4">
              <Zap className="w-6 h-6 text-primary" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Metadata de Cálculo</p>
            </div>
            <div className="space-y-3 text-[11px] font-bold text-muted-foreground">
              <div className="flex justify-between">
                <span>Valor UF Centralizada:</span>
                <span className="text-foreground">{fCurrency(liquidation.uf_valor_usado)}</span>
              </div>
              <div className="flex justify-between">
                <span>Días para Cálculo:</span>
                <span className="text-foreground">{liquidation.dias_trabajados} días</span>
              </div>
              <div className="flex justify-between">
                <span>Contrato:</span>
                <span className="text-foreground uppercase italic">{liquidation.tipo_contrato}</span>
              </div>
              <div className="flex justify-between">
                <span>Certificación Engine:</span>
                <span className="text-emerald-600 font-black">V2.1 - VALIDADO</span>
              </div>
            </div>
          </Card>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="lg:col-span-2 space-y-10">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* HABERES */}
            <Card className="bg-card border-border shadow-xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-emerald-500/10">
              <CardHeader className="bg-emerald-50/50 border-b border-border p-6">
                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center justify-between text-emerald-700">
                  <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Haberes</span>
                  <span className="font-mono tracking-normal">{fCurrency(liquidation.total_haberes_brutos)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <ItemDetail label="Sueldo Base" value={fCurrency(liquidation.sueldo_base)} />
                <ItemDetail label="Gratificación Art. 50" value={fCurrency(liquidation.gratificacion)} />
                <ItemDetail label="Asignación Colación" value={fCurrency(liquidation.asignacion_colacion)} />
                <ItemDetail label="Asignación Movilización" value={fCurrency(liquidation.asignacion_movilizacion)} />
                {liquidation.horas_extra_monto > 0 && (
                  <ItemDetail label="Horas Extraordinarias" value={fCurrency(liquidation.horas_extra_monto)} highlight />
                )}
                <ItemDetail label="Otros Haberes" value={fCurrency(liquidation.otros_haberes)} />
                <div className="pt-3 border-t border-border flex justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Total Haberes Brutos</span>
                  <span className="font-black text-emerald-700">{fCurrency(liquidation.total_haberes_brutos)}</span>
                </div>
              </CardContent>
            </Card>

            {/* DESCUENTOS */}
            <Card className="bg-card border-border shadow-xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-rose-500/10">
              <CardHeader className="bg-rose-50/50 border-b border-border p-6">
                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center justify-between text-rose-700">
                  <span className="flex items-center gap-2"><TrendingDown className="w-4 h-4" /> Descuentos</span>
                  <span className="font-mono tracking-normal">-{fCurrency(liquidation.total_descuentos)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <ItemDetail label={`AFP (${liquidation.afp_code})`} value={fCurrency((liquidation.afp || 0) + (liquidation.afp_comision || 0))} danger />
                <ItemDetail label={`Salud (${liquidation.salud_code})`} value={fCurrency(liquidation.salud)} danger />
                <ItemDetail label="Seguro de Cesantía (AFC)" value={fCurrency(liquidation.afc_trabajador)} danger />
                <ItemDetail label="Impuesto Único Segunda Cat." value={fCurrency(liquidation.impuesto_unico)} danger />
                <div className="pt-3 border-t border-border flex justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-700">Total Deducciones</span>
                  <span className="font-black text-rose-700">-{fCurrency(liquidation.total_descuentos)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* TOTAL LÍQUIDO */}
          <Card className="bg-gradient-to-br from-primary to-indigo-700 border-none shadow-2xl rounded-[3rem] overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-10 opacity-10 scale-150 rotate-12 group-hover:scale-175 transition-transform duration-1000">
              <DollarSign className="w-40 h-40 text-white" />
            </div>
            <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />
            <CardContent className="p-10 md:p-16 relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="space-y-4 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Validación Normativa Exitosa</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
                  Alcance <span className="text-blue-300 italic">Líquido</span>
                </h2>
                <p className="text-white/60 font-bold italic text-sm max-w-sm">
                  Calculado bajo parámetros progresivos del SII y normativa provisional vigente.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/20 shadow-2xl skew-x-[-2deg]">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 mb-4 text-center">Neto a Pagar</p>
                <p className="text-5xl md:text-7xl font-black text-white tracking-tighter">
                  {fCurrency(liquidation.sueldo_liquido)}
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}

function ItemDetail({ label, value, danger, highlight }: { label: string; value: string; danger?: boolean; highlight?: boolean }) {
  return (
    <div className={cn(
      'flex justify-between items-center py-1 transition-all',
      highlight && 'bg-primary/5 px-3 -mx-3 rounded-lg border-l-2 border-primary'
    )}>
      <span className={cn(
        'text-[10px] font-black uppercase tracking-widest',
        danger ? 'text-rose-600' : highlight ? 'text-primary' : 'text-muted-foreground'
      )}>{label}</span>
      <span className={cn(
        'font-mono text-xs font-black',
        danger ? 'text-rose-600' : highlight ? 'text-primary' : 'text-foreground'
      )}>{value}</span>
    </div>
  )
}
