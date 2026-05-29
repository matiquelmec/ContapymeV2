'use client'

import jsPDF from 'jspdf'
import { fCurrency } from '@/lib/utils'
import { formatRUT } from '@/lib/utils/rut'

type PdfContext = {
  liquidation: any
  organization: any
  settings: any
}

function formatName(name: string) {
  if (!name) return ''
  return name.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

async function fetchQRBase64(data: string): Promise<string | null> {
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
    console.warn('No se pudo generar QR de verificacion')
    return null
  }
}

export function getLiquidationPdfFilename(liquidation: any) {
  const rut = String(liquidation?.employees?.rut || liquidation?.employee_rut || 'sin_rut')
  const period = String(liquidation?.periodo || 'sin_periodo').slice(0, 7)
  const rawName = [
    'Liquidacion',
    period,
    rut,
    liquidation?.employees?.apellido_paterno || liquidation?.apellido_paterno || '',
    liquidation?.employees?.nombres || liquidation?.nombres || ''
  ]
    .map(part => String(part).trim())
    .filter(Boolean)
    .join('_')

  return normalizeFilename(`${rawName}.pdf`)
}

export function getLiquidationsZipFilename(year: string, month: string, organizationName?: string) {
  const org = organizationName ? normalizeFilename(organizationName) : 'Contapymepuq'
  return normalizeFilename(`Liquidaciones_${year}-${month}_${org}.zip`)
}

function normalizeFilename(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export async function buildLiquidationPDFDocument({ liquidation, organization, settings }: PdfContext): Promise<jsPDF> {
  const doc = new jsPDF()
  const emp = liquidation.employees
  const period = liquidation.periodo || 'N/A'
  const fullName = formatName(`${emp?.nombres || ''} ${emp?.apellido_paterno || ''} ${emp?.apellido_materno || ''}`)

  doc.setFont('helvetica', 'bold'); doc.setFontSize(14)
  doc.text(organization?.nombre || 'Contapymepuq', 20, 20)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
  doc.text(`RUT: ${organization?.rut_empresa || ''}`, 20, 26)
  doc.text(`Giro: ${organization?.giro || ''}`, 20, 31)
  const address = organization?.direccion || ''
  const comuna = organization?.comuna || ''
  const region = organization?.region || ''
  const baseAddress = (comuna && address.toLowerCase().includes(comuna.toLowerCase()))
    ? address
    : [address, comuna].filter(Boolean).join(', ')
  const finalAddress = [baseAddress, region].filter(Boolean).join(', ')
  doc.text(`Direccion: ${finalAddress || 'No registrada'}`, 20, 36)

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.setTextColor(20, 100, 50)
  doc.text(`FOLIO N ${liquidation.folio_number || ''}`, 190, 20, { align: 'right' })
  doc.setTextColor(0, 0, 0)

  doc.setFontSize(16); doc.setFont('helvetica', 'bold')
  doc.text('LIQUIDACION DE SUELDO', 105, 52, { align: 'center' })
  doc.setFontSize(12)
  doc.text(period.toUpperCase(), 105, 59, { align: 'center' })

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
  doc.text(`Dias Trabajados: ${liquidation.dias_trabajados || 30}`, 110, 91)
  doc.text(`AFP / Salud: ${liquidation.afp_code || ''} / ${liquidation.salud_code || ''}`, 110, 98)

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
    doc.text(label, 25, yHab); doc.text(fCurrency(value || 0), 95, yHab, { align: 'right' }); yHab += 6
  }
  const desRow = (label: string, value: number) => {
    doc.text(label, 115, yDes); doc.text(fCurrency(value || 0), 185, yDes, { align: 'right' }); yDes += 6
  }

  habRow('Sueldo Base', liquidation.sueldo_base)
  habRow('Gratificacion Legal', liquidation.gratificacion || 0)
  if (liquidation.horas_extra_monto > 0) habRow(`Horas Extras (${liquidation.horas_extra || 0} hrs)`, liquidation.horas_extra_monto)
  habRow('Bono Colacion', liquidation.asignacion_colacion || 0)
  habRow('Bono Movilizacion', liquidation.asignacion_movilizacion || 0)
  if (liquidation.otros_haberes > 0) habRow('Otros Haberes', liquidation.otros_haberes)

  desRow(`AFP: ${liquidation.afp_code || ''}`, (liquidation.afp || 0) + (liquidation.afp_comision || 0))
  desRow(`Salud: ${liquidation.salud_code || ''}`, liquidation.salud || 0)
  desRow('Seguro Cesantia (AFC)', liquidation.afc_trabajador || 0)
  if (liquidation.impuesto_unico > 0) desRow('Impuesto Unico 2da Cat.', liquidation.impuesto_unico)
  if (liquidation.otros_descuentos > 0) desRow('Otros Descuentos', liquidation.otros_descuentos)

  y = Math.max(yHab, yDes) + 2
  doc.setLineWidth(0.1); doc.line(20, y, 100, y); doc.line(110, y, 190, y)
  y += 6; doc.setFont('helvetica', 'bold')
  doc.text('TOTAL HABERES BRUTOS', 25, y)
  doc.text(fCurrency(liquidation.total_haberes_brutos || 0), 95, y, { align: 'right' })
  doc.text('TOTAL DESCUENTOS', 115, y)
  doc.text(fCurrency(liquidation.total_descuentos || 0), 185, y, { align: 'right' })

  y += 10
  doc.setFillColor(230, 245, 255); doc.rect(20, y, 170, 15, 'F')
  doc.setFontSize(14); doc.setFont('helvetica', 'bold')
  doc.text('ALCANCE LIQUIDO A PAGAR', 25, y + 10)
  doc.text(fCurrency(liquidation.sueldo_liquido || 0), 180, y + 10, { align: 'right' })

  y += 25
  const sigBase64 = liquidation.signature_base64
  const authCode = `AUTH-${liquidation.id?.slice(0, 8).toUpperCase()}-V2`
  const verifyUrl = `https://contapymepuq.cl/verify/${liquidation.id?.slice(0, 12)}`
  const qrBase64 = sigBase64 ? await fetchQRBase64(verifyUrl) : null

  doc.setLineWidth(0.2); doc.setDrawColor(0)
  doc.line(30, y, 90, y)
  doc.line(120, y, 180, y)

  if (sigBase64) {
    try {
      doc.addImage(sigBase64, 'PNG', 40, y - 22, 40, 20)
    } catch (e) {
      console.error('Error incrustando firma en PDF:', e)
    }
  }

  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(0)
  doc.text('FIRMA EMPLEADOR', 60, y + 5, { align: 'center' })
  doc.text('FIRMA TRABAJADOR', 150, y + 5, { align: 'center' })

  doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
  const repName = settings?.rep_legal_nombre || 'Representante Legal'
  const repRut = settings?.rep_legal_rut ? formatRUT(settings.rep_legal_rut) : 'RUT: ________'
  doc.text(repName, 60, y + 10, { align: 'center' })
  doc.text(repRut, 60, y + 14, { align: 'center' })
  doc.setFont('helvetica', 'italic'); doc.setFontSize(7)
  doc.text(`p.p. ${organization?.nombre || ''}`, 60, y + 18, { align: 'center' })

  doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
  doc.text(fullName, 150, y + 10, { align: 'center' })
  doc.text(formatRUT(emp?.rut), 150, y + 14, { align: 'center' })

  y += 28
  doc.setDrawColor(200); doc.setLineWidth(0.1)
  doc.line(20, y, 190, y)
  y += 3
  if (qrBase64) {
    try {
      doc.addImage(qrBase64, 'PNG', 20, y, 18, 18)
    } catch {
      console.warn('QR no disponible')
    }
  }

  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(80)
  doc.text('VERIFICACION DE INTEGRIDAD DIGITAL', 42, y + 5)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(140)
  doc.text(`CODIGO: ${authCode}`, 42, y + 9)
  doc.text(`URL: ${verifyUrl}`, 42, y + 13)
  doc.text('CONTAPYMEPUQ - SELLO DE TIEMPO REGISTRADO', 42, y + 17)

  doc.setFontSize(7); doc.setTextColor(150)
  doc.text(`Documento generado por Contapymepuq | Emision: ${new Date().toLocaleString('es-CL')}`, 105, 285, { align: 'center' })

  return doc
}
