"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseError } from "@/lib/utils/errors";

export type TreasuryDocument = {
  id: string;
  document_type: "purchase_record" | "sales_record";
  folio: number;
  rut: string;
  razon_social: string;
  fecha_docto: string;
  monto_total: number;
  payment_status: "pending" | "partial" | "paid";
  paid_amount: number;
  balance: number;
};

export type PaymentMethod = {
  id: string;
  nombre: string;
  tipo: string;
  chart_account_id: string;
  bank_account_id: string | null;
};

export type TreasuryPayment = {
  id: string;
  tipo: "pago_proveedor" | "cobro_cliente";
  monto: number;
  fecha_pago: string;
  referencia: string | null;
  notas: string | null;
  journal_entry_id: string | null;
  created_at: string;
  payment_methods: { nombre: string; tipo: string } | null;
};

type PurchaseRecordRow = {
  id: string;
  folio: number | string;
  rut_emisor: string;
  razon_social_emisor: string | null;
  fecha_docto: string;
  monto_total: number | string | null;
  monto_pagado: number | string | null;
  monto_pendiente: number | string | null;
  payment_status: TreasuryDocument["payment_status"] | null;
};

type SalesRecordRow = {
  id: string;
  folio: number | string;
  rut_receptor: string;
  razon_social_receptor: string | null;
  fecha_docto: string;
  monto_total: number | string | null;
  monto_cobrado: number | string | null;
  monto_pendiente: number | string | null;
  payment_status: TreasuryDocument["payment_status"] | null;
};

type MonthPaymentRow = {
  tipo: "pago_proveedor" | "cobro_cliente";
  monto: number | string | null;
};

export type TreasuryDashboardData = {
  paymentMethods: PaymentMethod[];
  pendingPurchases: TreasuryDocument[];
  pendingSales: TreasuryDocument[];
  recentPayments: TreasuryPayment[];
  totals: {
    payable: number;
    receivable: number;
    overduePayable: number;
    overdueReceivable: number;
    paidThisMonth: number;
    collectedThisMonth: number;
  };
};

function toNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function startOfCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export async function getTreasuryDashboardData(organizationId: string | null): Promise<TreasuryDashboardData> {
  if (!organizationId) {
    return {
      paymentMethods: [],
      pendingPurchases: [],
      pendingSales: [],
      recentPayments: [],
      totals: {
        payable: 0,
        receivable: 0,
        overduePayable: 0,
        overdueReceivable: 0,
        paidThisMonth: 0,
        collectedThisMonth: 0,
      },
    };
  }

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = startOfCurrentMonth();

  const [
    methodsRes,
    purchasesRes,
    salesRes,
    recentRes,
    monthPaymentsRes,
  ] = await Promise.all([
    supabase
      .from("payment_methods")
      .select("id, nombre, tipo, chart_account_id, bank_account_id")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .order("nombre", { ascending: true }),
    supabase
      .from("v_cuentas_por_pagar")
      .select("id, folio, rut_emisor, razon_social_emisor, fecha_docto, monto_total, monto_pagado, monto_pendiente, payment_status")
      .eq("organization_id", organizationId)
      .order("fecha_docto", { ascending: true })
      .limit(80),
    supabase
      .from("v_cuentas_por_cobrar")
      .select("id, folio, rut_receptor, razon_social_receptor, fecha_docto, monto_total, monto_cobrado, monto_pendiente, payment_status")
      .eq("organization_id", organizationId)
      .order("fecha_docto", { ascending: true })
      .limit(80),
    supabase
      .from("treasury_payments")
      .select("id, tipo, monto, fecha_pago, referencia, notas, journal_entry_id, created_at, payment_methods(nombre, tipo)")
      .eq("organization_id", organizationId)
      .order("fecha_pago", { ascending: false })
      .limit(12),
    supabase
      .from("treasury_payments")
      .select("tipo, monto")
      .eq("organization_id", organizationId)
      .gte("fecha_pago", monthStart),
  ]);

  if (methodsRes.error) console.error("payment_methods:", methodsRes.error);
  if (purchasesRes.error) console.error("v_cuentas_por_pagar:", purchasesRes.error);
  if (salesRes.error) console.error("v_cuentas_por_cobrar:", salesRes.error);
  if (recentRes.error) console.error("treasury_payments:", recentRes.error);
  if (monthPaymentsRes.error) console.error("month treasury_payments:", monthPaymentsRes.error);

  const pendingPurchases = ((purchasesRes.data || []) as PurchaseRecordRow[]).map((row) => {
    const paid = toNumber(row.monto_pagado);
    const total = toNumber(row.monto_total);
    return {
      id: row.id,
      document_type: "purchase_record" as const,
      folio: Number(row.folio),
      rut: row.rut_emisor,
      razon_social: row.razon_social_emisor || "Proveedor sin razon social",
      fecha_docto: row.fecha_docto,
      monto_total: total,
      payment_status: row.payment_status || "pending",
      paid_amount: paid,
      balance: toNumber(row.monto_pendiente),
    };
  });

  const pendingSales = ((salesRes.data || []) as SalesRecordRow[]).map((row) => {
    const paid = toNumber(row.monto_cobrado);
    const total = toNumber(row.monto_total);
    return {
      id: row.id,
      document_type: "sales_record" as const,
      folio: Number(row.folio),
      rut: row.rut_receptor,
      razon_social: row.razon_social_receptor || "Cliente sin razon social",
      fecha_docto: row.fecha_docto,
      monto_total: total,
      payment_status: row.payment_status || "pending",
      paid_amount: paid,
      balance: toNumber(row.monto_pendiente),
    };
  });

  const totals = {
    payable: pendingPurchases.reduce((sum, doc) => sum + doc.balance, 0),
    receivable: pendingSales.reduce((sum, doc) => sum + doc.balance, 0),
    overduePayable: pendingPurchases
      .filter((doc) => doc.fecha_docto < today)
      .reduce((sum, doc) => sum + doc.balance, 0),
    overdueReceivable: pendingSales
      .filter((doc) => doc.fecha_docto < today)
      .reduce((sum, doc) => sum + doc.balance, 0),
    paidThisMonth: ((monthPaymentsRes.data || []) as MonthPaymentRow[])
      .filter((row) => row.tipo === "pago_proveedor")
      .reduce((sum, row) => sum + toNumber(row.monto), 0),
    collectedThisMonth: ((monthPaymentsRes.data || []) as MonthPaymentRow[])
      .filter((row) => row.tipo === "cobro_cliente")
      .reduce((sum, row) => sum + toNumber(row.monto), 0),
  };

  return {
    paymentMethods: (methodsRes.data || []) as PaymentMethod[],
    pendingPurchases,
    pendingSales,
    recentPayments: (recentRes.data || []) as TreasuryPayment[],
    totals,
  };
}

export async function registerTreasuryPayment(data: {
  organizationId: string;
  tipo: "pago_proveedor" | "cobro_cliente";
  paymentMethodId: string;
  documentType: "purchase_record" | "sales_record";
  documentId: string;
  amount: number;
  paymentDate: string;
  reference?: string;
  notes?: string;
}) {
  try {
    if (!data.organizationId || !data.paymentMethodId || !data.documentId) {
      throw new Error("Faltan datos obligatorios para registrar el movimiento.");
    }

    if (!Number.isFinite(data.amount) || data.amount <= 0) {
      throw new Error("El monto debe ser mayor a cero.");
    }

    const supabase = await createClient();
    const { data: payment, error: paymentError } = await supabase
      .from("treasury_payments")
      .insert({
        organization_id: data.organizationId,
        tipo: data.tipo,
        payment_method_id: data.paymentMethodId,
        monto: Math.round(data.amount),
        fecha_pago: data.paymentDate,
        referencia: data.reference || null,
        notas: data.notes || null,
      })
      .select("id")
      .single();

    if (paymentError) throw paymentError;

    const { error: linkError } = await supabase.from("treasury_payment_documents").insert({
      payment_id: payment.id,
      organization_id: data.organizationId,
      document_type: data.documentType,
      document_id: data.documentId,
      monto_aplicado: Math.round(data.amount),
    });

    if (linkError) throw linkError;

    revalidatePath("/dashboard/treasury");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/accounting/rcv");
    revalidatePath("/dashboard/accounting/journal");
    return { success: true };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}
