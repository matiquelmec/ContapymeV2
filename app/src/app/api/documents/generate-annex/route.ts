import { NextRequest, NextResponse } from "next/server";

const ENGINE_URL = process.env.ENGINE_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const modId = searchParams.get("mod_id");

  if (!modId) {
    return NextResponse.json({ error: "Missing mod_id" }, { status: 400 });
  }

  try {
    // El motor usa POST para generación
    const response = await fetch(`${ENGINE_URL}/api/v1/documents/generate-annex?mod_id=${modId}`, {
      method: "GET",
    });

    if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "Error en el motor de anexos");
    }

    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") || `Anexo_${modId}.docx`;

    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": disposition,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
