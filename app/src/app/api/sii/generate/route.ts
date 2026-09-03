import { NextRequest, NextResponse } from 'next/server'
import { engineFetch } from '@/lib/engine-client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.organization_id || !body.document_type) {
      return NextResponse.json(
        { error: 'Parámetros obligatorios faltantes (organization_id, document_type)' },
        { status: 400 }
      )
    }

    const res = await engineFetch('/api/v1/sii/generate', {
      method: 'POST',
      body
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Error al generar escrito legal' }))
      return NextResponse.json(
        { error: err.detail || err.error || 'Error en el motor backend' },
        { status: res.status }
      )
    }

    const blob = await res.blob()
    const contentDisposition = res.headers.get('content-disposition') || 'attachment; filename="Escrito_SII.docx"'

    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': contentDisposition
      }
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
