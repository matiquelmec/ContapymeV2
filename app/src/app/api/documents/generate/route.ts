import { NextRequest, NextResponse } from "next/server";

const ENGINE_URL = process.env.ENGINE_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employee_id");
  const type = searchParams.get("type") || "contrato";

  if (!employeeId) {
    return NextResponse.json({ error: "Missing employee_id" }, { status: 400 });
  }

  try {
    const response = await fetch(`${ENGINE_URL}/api/v1/documents/generate/${employeeId}?type=${type}`, {
      method: "POST",
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Error in engine");
    }

    const blob = await response.blob();
    const filename = response.headers.get("Content-Disposition") || `Documento_${employeeId}.docx`;

    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": filename,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
