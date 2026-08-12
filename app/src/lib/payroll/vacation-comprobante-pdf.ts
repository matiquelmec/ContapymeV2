import jsPDF from 'jspdf'
import { formatRUT } from '@/lib/utils/rut'
import type { VacationComprobanteData } from '@/actions/vacations'

function formatName(name: string) {
  if (!name) return ''
  return name.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function formatDateLong(value?: string) {
  if (!value) return '________________'
  const d = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })
}

/** Días corridos del período (ambos extremos inclusive). */
function diasCorridos(inicio: string, fin: string): number {
  const a = new Date(`${inicio.slice(0, 10)}T12:00:00`)
  const b = new Date(`${fin.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return 0
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000) + 1
}

function normalizeFilename(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function getVacationComprobanteFilename(data: VacationComprobanteData) {
  const rut = String(data.employee.rut || 'sin_rut')
  const periodo = String(data.request.fecha_inicio || '').slice(0, 7)
  return normalizeFilename(
    `Comprobante_Feriado_${periodo}_${rut}_${data.employee.apellido_paterno || ''}.pdf`
  )
}

export function buildVacationComprobantePDF(data: VacationComprobanteData): jsPDF {
  const { request, employee, organization } = data
  const doc = new jsPDF()
  const fullName = formatName(
    `${employee.nombres || ''} ${employee.apellido_paterno || ''} ${employee.apellido_materno || ''}`
  )
  const corridos = diasCorridos(request.fecha_inicio, request.fecha_fin)
  const habiles = Number(request.dias_solicitados || 0)

  // ── Encabezado empresa ────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14)
  doc.text(organization?.nombre || 'Empresa', 20, 20)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
  doc.text(`RUT: ${organization?.rut_empresa ? formatRUT(organization.rut_empresa) : ''}`, 20, 26)
  const address = [organization?.direccion, organization?.comuna, organization?.region]
    .filter(Boolean)
    .join(', ')
  doc.text(`Direccion: ${address || 'No registrada'}`, 20, 31)

  // ── Título ────────────────────────────────────────────────────────────────
  doc.setFontSize(15); doc.setFont('helvetica', 'bold')
  doc.text('COMPROBANTE DE FERIADO LEGAL', 105, 46, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(110)
  doc.text('Articulo 74 del Codigo del Trabajo', 105, 52, { align: 'center' })
  doc.setTextColor(0)

  // ── Datos del trabajador ──────────────────────────────────────────────────
  doc.setDrawColor(0); doc.setLineWidth(0.5)
  doc.rect(20, 60, 170, 32)
  doc.setFontSize(10); doc.setFont('helvetica', 'bold')
  doc.text('DATOS DEL TRABAJADOR', 25, 67)
  doc.line(20, 70, 190, 70)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nombre: ${fullName}`, 25, 77)
  doc.text(`RUT: ${formatRUT(employee.rut)}`, 25, 84)
  doc.text(`Cargo: ${employee.cargo || '---'}`, 110, 77)
  doc.text(`Fecha Ingreso: ${employee.fecha_ingreso || '---'}`, 110, 84)

  // ── Detalle del feriado ───────────────────────────────────────────────────
  let y = 102
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  doc.setFillColor(235, 250, 240); doc.rect(20, y, 170, 7, 'F')
  doc.setTextColor(20, 100, 50); doc.text('DETALLE DEL PERIODO DE FERIADO', 25, y + 5)
  doc.setTextColor(0); doc.setFont('helvetica', 'normal')
  y += 14
  doc.text(`Desde: ${formatDateLong(request.fecha_inicio)}`, 25, y)
  doc.text(`Hasta: ${formatDateLong(request.fecha_fin)}`, 110, y)
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.text(`Dias habiles: ${habiles.toFixed(1)}`, 25, y)
  doc.text(`Dias corridos: ${corridos}`, 110, y)
  doc.setFont('helvetica', 'normal')

  // ── Texto legal ───────────────────────────────────────────────────────────
  y += 14
  const texto =
    `El trabajador individualizado declara hacer uso de su feriado legal correspondiente, ` +
    `por un total de ${habiles.toFixed(1)} dias habiles, en el periodo comprendido entre el ` +
    `${formatDateLong(request.fecha_inicio)} y el ${formatDateLong(request.fecha_fin)}, ambas fechas inclusive. ` +
    `Se deja constancia de la conformidad de ambas partes respecto del periodo de descanso senalado, ` +
    `conforme a lo dispuesto en el Titulo VII del Libro I del Codigo del Trabajo.`
  doc.setFontSize(10)
  const lines = doc.splitTextToSize(texto, 165)
  doc.text(lines, 22, y)
  y += lines.length * 6 + 6

  if (request.comentarios) {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(110)
    const obs = doc.splitTextToSize(`Observaciones: ${request.comentarios}`, 165)
    doc.text(obs, 22, y)
    y += obs.length * 5 + 4
    doc.setTextColor(0); doc.setFont('helvetica', 'normal')
  }

  // ── Firmas ────────────────────────────────────────────────────────────────
  y = Math.max(y, 205)
  doc.setLineWidth(0.2); doc.setDrawColor(0)
  doc.line(30, y, 90, y)
  doc.line(120, y, 180, y)
  doc.setFontSize(8); doc.setFont('helvetica', 'bold')
  doc.text('FIRMA EMPLEADOR', 60, y + 5, { align: 'center' })
  doc.text('FIRMA TRABAJADOR', 150, y + 5, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.text(data.rep_legal_nombre || 'Representante Legal', 60, y + 10, { align: 'center' })
  doc.text(data.rep_legal_rut ? formatRUT(data.rep_legal_rut) : 'RUT: ________', 60, y + 14, { align: 'center' })
  doc.setFont('helvetica', 'italic'); doc.setFontSize(7)
  doc.text(`p.p. ${organization?.nombre || ''}`, 60, y + 18, { align: 'center' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
  doc.text(fullName, 150, y + 10, { align: 'center' })
  doc.text(formatRUT(employee.rut), 150, y + 14, { align: 'center' })

  // ── Sello de Verificación Digital ─────────────────────────────────────────
  y += 24
  doc.setDrawColor(200); doc.setLineWidth(0.1)
  doc.line(20, y, 190, y)

  const reqId = String(request.id || '').slice(0, 12)
  const authCode = `AUTH-VAC-${reqId.toUpperCase() || 'V1'}`
  const verifyUrl = `https://contapymepuq.cl/verify/vac-${reqId || 'valid'}`

  y += 4
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(80)
  doc.text('VERIFICACION DE INTEGRIDAD DIGITAL', 20, y + 4)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(140)
  doc.text(`CODIGO: ${authCode}`, 20, y + 8)
  doc.text(`URL: ${verifyUrl}`, 20, y + 12)
  doc.text('CONTAPYMEPUQ — SELLO DE TIEMPO REGISTRADO', 20, y + 16)

  // ── Pie ───────────────────────────────────────────────────────────────────
  doc.setFontSize(7); doc.setTextColor(150)
  doc.text(
    `Documento generado por Contapymepuq | Emision: ${new Date().toLocaleString('es-CL')}`,
    105, 287, { align: 'center' }
  )

  return doc
}
