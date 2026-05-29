'use server'

import nodemailer from 'nodemailer'
import { createClient } from '@/lib/supabase/server'
import { buildLiquidationPDFDocument, getLiquidationPdfFilename } from '@/lib/payroll/liquidation-pdf'
import { recordAuditAction } from './audit'

type BulkEmailSkip = {
  liquidation_id: string
  employee_name: string
  reason: string
}

type BulkEmailFailure = {
  liquidation_id: string
  employee_name: string
  reason: string
}

export type BulkPayrollEmailResult = {
  success: boolean
  sent: number
  skipped: BulkEmailSkip[]
  failed: BulkEmailFailure[]
  message: string
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || '587')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.PAYROLL_EMAIL_FROM || process.env.SMTP_FROM

  if (!host || !user || !pass || !from) {
    throw new Error('Falta configurar SMTP_HOST, SMTP_USER, SMTP_PASS o PAYROLL_EMAIL_FROM.')
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: { user, pass }
    }),
    from
  }
}

function buildPeriodRange(year: string, month: string) {
  const paddedMonth = month.padStart(2, '0')
  const dateStart = `${year}-${paddedMonth}-01`
  const lastDay = new Date(Number(year), Number(paddedMonth), 0).getDate()
  const dateEnd = `${year}-${paddedMonth}-${lastDay}`
  return { paddedMonth, dateStart, dateEnd }
}

function formatEmployeeName(employee: any) {
  return [employee?.nombres, employee?.apellido_paterno, employee?.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()
}

export async function sendPayrollLiquidationsByEmailAction(params: {
  organizationId: string
  year: string
  month: string
}) : Promise<BulkPayrollEmailResult> {
  const supabase = await createClient()
  const { transporter, from } = getSmtpConfig()
  const { paddedMonth, dateStart, dateEnd } = buildPeriodRange(params.year, params.month)

  const [{ data: liquidations, error: liqError }, { data: organization }, { data: settings }] = await Promise.all([
    supabase
      .from('liquidations')
      .select(`
        *,
        employees (
          id,
          nombres,
          apellido_paterno,
          apellido_materno,
          rut,
          email,
          fecha_ingreso,
          cargo
        )
      `)
      .eq('organization_id', params.organizationId)
      .eq('status', 'aprobada')
      .gte('periodo', dateStart)
      .lte('periodo', dateEnd)
      .order('created_at', { ascending: false }),
    supabase
      .from('organizations')
      .select('*')
      .eq('id', params.organizationId)
      .single(),
    supabase
      .from('organization_payroll_settings')
      .select('*')
      .eq('organization_id', params.organizationId)
      .maybeSingle()
  ])

  if (liqError) {
    return {
      success: false,
      sent: 0,
      skipped: [],
      failed: [],
      message: liqError.message
    }
  }

  if (!liquidations || liquidations.length === 0) {
    return {
      success: false,
      sent: 0,
      skipped: [],
      failed: [],
      message: 'No hay liquidaciones aprobadas para enviar en el periodo seleccionado.'
    }
  }

  const skipped: BulkEmailSkip[] = []
  const failed: BulkEmailFailure[] = []
  let sent = 0

  for (const liquidation of liquidations as any[]) {
    const employee = liquidation.employees
    const employeeName = formatEmployeeName(employee) || 'Empleado sin nombre'
    const email = String(employee?.email || '').trim().toLowerCase()

    if (!email) {
      skipped.push({
        liquidation_id: liquidation.id,
        employee_name: employeeName,
        reason: 'Sin correo registrado'
      })
      continue
    }

    try {
      const doc = await buildLiquidationPDFDocument({ liquidation, organization, settings })
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

      const subject = `Liquidación de Sueldo ${liquidation.periodo?.slice(0, 7) || `${params.year}-${paddedMonth}`} - ${employeeName}`
      const text = [
        `Hola ${employee?.nombres || employeeName},`,
        '',
        `Adjuntamos tu liquidación de sueldo correspondiente al periodo ${liquidation.periodo?.slice(0, 7) || `${params.year}-${paddedMonth}`}.`,
        '',
        'Saludos,',
        organization?.nombre || 'Contapymepuq'
      ].join('\n')

      await transporter.sendMail({
        from,
        to: email,
        subject,
        text,
        attachments: [
          {
            filename: getLiquidationPdfFilename(liquidation),
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      })

      sent += 1
    } catch (error: any) {
      failed.push({
        liquidation_id: liquidation.id,
        employee_name: employeeName,
        reason: error?.message || 'Error desconocido enviando correo'
      })
    }
  }

  await recordAuditAction({
    action: 'PAYROLL_BULK_EMAIL_SEND',
    entity_type: 'payroll',
    entity_id: `${params.organizationId}:${params.year}-${paddedMonth}`,
    details: {
      period: `${params.year}-${paddedMonth}`,
      total: liquidations.length,
      sent,
      skipped,
      failed
    }
  })

  return {
    success: failed.length === 0,
    sent,
    skipped,
    failed,
    message: `Enviados ${sent} correos. ${skipped.length} omitidos. ${failed.length} fallidos.`
  }
}
