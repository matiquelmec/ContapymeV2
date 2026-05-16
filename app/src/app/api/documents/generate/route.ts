import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employee_id");
  const type = searchParams.get("type") || "contrato";
  const description = searchParams.get("description") || "";

  if (!employeeId) {
    return NextResponse.json({ error: "Missing employee_id" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      return NextResponse.json({ error: "Sesión no válida o expirada" }, { status: 401 });
    }

    const response = await fetch(`${ENGINE_URL}/api/v1/documents/generate?employee_id=${employeeId}&type=${type}&description=${encodeURIComponent(description)}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Error in engine (Status: " + response.status + ")");
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
