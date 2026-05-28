"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Clock3,
  Loader2,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import { registerTreasuryPayment, type TreasuryDashboardData, type TreasuryDocument } from "@/actions/treasury";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type MovementType = "pago_proveedor" | "cobro_cliente";

const currency = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

function formatDate(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));
}

function statusLabel(status: TreasuryDocument["payment_status"]) {
  if (status === "paid") return "Pagado";
  if (status === "partial") return "Parcial";
  return "Pendiente";
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof WalletCards;
  tone: "primary" | "emerald" | "rose" | "amber";
}) {
  const tones = {
    primary: "bg-primary/5 text-primary border-primary/10",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  };

  return (
    <Card className="bg-white border-border shadow-sm rounded-2xl overflow-hidden">
      <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate">{label}</p>
          <p className="text-lg sm:text-xl font-black text-foreground mt-1 tabular-nums truncate">{currency.format(value)}</p>
        </div>
        <div className={`p-3 rounded-2xl border shrink-0 ${tones[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentList({
  documents,
  selectedId,
  onSelect,
}: {
  documents: TreasuryDocument[];
  selectedId: string;
  onSelect: (document: TreasuryDocument) => void;
}) {
  if (documents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
        <p className="text-xs font-black uppercase tracking-widest text-foreground">Sin documentos pendientes</p>
        <p className="text-[11px] font-bold text-muted-foreground mt-1">No hay saldos abiertos para esta vista.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
      {documents.map((doc) => (
        <button
          key={doc.id}
          type="button"
          onClick={() => onSelect(doc)}
          className={`w-full text-left rounded-2xl border p-4 transition-all active:scale-[0.99] ${
            selectedId === doc.id
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-border bg-white hover:border-primary/30 hover:bg-muted/20"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-widest text-foreground truncate">
                Folio {doc.folio} · {doc.rut}
              </p>
              <p className="text-xs font-bold text-muted-foreground mt-1 truncate">{doc.razon_social}</p>
            </div>
            <Badge
              variant={doc.payment_status === "partial" ? "outline" : "secondary"}
              className="shrink-0 text-[10px] font-black uppercase"
            >
              {statusLabel(doc.payment_status)}
            </Badge>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <p className="font-black uppercase text-muted-foreground">Fecha</p>
              <p className="font-bold text-foreground">{formatDate(doc.fecha_docto)}</p>
            </div>
            <div className="text-right">
              <p className="font-black uppercase text-muted-foreground">Saldo</p>
              <p className="font-black text-foreground tabular-nums">{currency.format(doc.balance)}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export function TreasuryClient({
  organizationId,
  initialData,
}: {
  organizationId: string;
  initialData: TreasuryDashboardData;
}) {
  const [movementType, setMovementType] = useState<MovementType>("pago_proveedor");
  const [selectedDocument, setSelectedDocument] = useState<TreasuryDocument | null>(
    initialData.pendingPurchases[0] || null
  );
  const [paymentMethodId, setPaymentMethodId] = useState(initialData.paymentMethods[0]?.id || "");
  const [amount, setAmount] = useState(String(initialData.pendingPurchases[0]?.balance || ""));
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const hasPaymentMethods = initialData.paymentMethods.length > 0;

  const selectedMethod = useMemo(
    () => initialData.paymentMethods.find((method) => method.id === paymentMethodId),
    [initialData.paymentMethods, paymentMethodId]
  );

  function changeMovementType(value: MovementType) {
    const docs = value === "pago_proveedor" ? initialData.pendingPurchases : initialData.pendingSales;
    setMovementType(value);
    setSelectedDocument(docs[0] || null);
    setAmount(String(docs[0]?.balance || ""));
  }

  function selectDocument(document: TreasuryDocument) {
    setSelectedDocument(document);
    setAmount(String(document.balance));
  }

  function submitPayment() {
    if (!selectedDocument) return toast.error("Seleccione un documento pendiente.");
    if (!paymentMethodId) return toast.error("Seleccione un medio de pago.");

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return toast.error("Ingrese un monto valido.");
    }

    if (numericAmount > selectedDocument.balance) {
      return toast.error("El monto no puede superar el saldo del documento.");
    }

    startTransition(async () => {
      const result = await registerTreasuryPayment({
        organizationId,
        tipo: movementType,
        paymentMethodId,
        documentType: selectedDocument.document_type,
        documentId: selectedDocument.id,
        amount: numericAmount,
        paymentDate,
        reference,
        notes,
      });

      if (!result.success) {
        toast.error(result.error || "No se pudo registrar el movimiento.");
        return;
      }

      toast.success(movementType === "pago_proveedor" ? "Pago registrado." : "Cobro registrado.");
      setReference("");
      setNotes("");
    });
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Por pagar" value={initialData.totals.payable} icon={ArrowUpRight} tone="rose" />
        <StatCard label="Por cobrar" value={initialData.totals.receivable} icon={ArrowDownLeft} tone="emerald" />
        <StatCard label="Pagado este mes" value={initialData.totals.paidThisMonth} icon={Banknote} tone="primary" />
        <StatCard label="Cobrado este mes" value={initialData.totals.collectedThisMonth} icon={WalletCards} tone="amber" />
      </div>

      {!hasPaymentMethods && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-amber-900">Faltan medios de pago</p>
            <p className="text-xs font-bold text-amber-800/80 mt-1 leading-relaxed">
              Cree al menos un medio de pago en base de datos para registrar pagos y cobros con asiento automatico.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] gap-6">
        <section className="space-y-4">
          <Tabs value={movementType} onValueChange={(value) => changeMovementType(value as MovementType)}>
            <TabsList className="grid w-full grid-cols-2 h-auto rounded-2xl p-1 bg-muted">
              <TabsTrigger value="pago_proveedor" className="rounded-xl py-3 text-[11px] sm:text-xs font-black uppercase gap-2">
                <ArrowUpRight className="w-4 h-4" />
                Pagar proveedores
              </TabsTrigger>
              <TabsTrigger value="cobro_cliente" className="rounded-xl py-3 text-[11px] sm:text-xs font-black uppercase gap-2">
                <ArrowDownLeft className="w-4 h-4" />
                Cobrar clientes
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pago_proveedor" className="mt-4">
              <DocumentList documents={initialData.pendingPurchases} selectedId={selectedDocument?.id || ""} onSelect={selectDocument} />
            </TabsContent>
            <TabsContent value="cobro_cliente" className="mt-4">
              <DocumentList documents={initialData.pendingSales} selectedId={selectedDocument?.id || ""} onSelect={selectDocument} />
            </TabsContent>
          </Tabs>
        </section>

        <Card className="bg-white border-border shadow-sm rounded-2xl overflow-hidden h-fit">
          <CardHeader className="p-5 border-b border-border bg-muted/10">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-3">
              <ReceiptText className="w-5 h-5 text-primary" />
              Registrar movimiento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <div className="rounded-2xl bg-muted/20 border border-border p-4 min-h-[104px]">
              {selectedDocument ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-widest text-foreground truncate">
                        Folio {selectedDocument.folio}
                      </p>
                      <p className="text-xs font-bold text-muted-foreground truncate">{selectedDocument.razon_social}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-black uppercase shrink-0">
                      {statusLabel(selectedDocument.payment_status)}
                    </Badge>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Saldo disponible</p>
                      <p className="text-xl font-black text-foreground tabular-nums">{currency.format(selectedDocument.balance)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Documento</p>
                      <p className="text-xs font-bold text-foreground">{formatDate(selectedDocument.fecha_docto)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center gap-3 text-muted-foreground">
                  <Clock3 className="w-5 h-5" />
                  <p className="text-xs font-bold">Seleccione un documento pendiente.</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Medio de pago</Label>
              <Select value={paymentMethodId} onValueChange={setPaymentMethodId} disabled={!hasPaymentMethods}>
                <SelectTrigger className="w-full h-12 rounded-xl bg-white font-bold">
                  <SelectValue placeholder="Seleccione medio" />
                </SelectTrigger>
                <SelectContent>
                  {initialData.paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.nombre} · {method.tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMethod && (
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Cuenta asociada activa</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monto</Label>
                <Input
                  type="number"
                  min="1"
                  max={selectedDocument?.balance || undefined}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="h-12 rounded-xl bg-white font-black tabular-nums"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                  className="h-12 rounded-xl bg-white font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Referencia</Label>
              <Input
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="Transferencia, cheque, comprobante"
                className="h-12 rounded-xl bg-white font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notas</Label>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="rounded-xl bg-white min-h-20 text-xs font-bold"
              />
            </div>

            <Button
              type="button"
              onClick={submitPayment}
              disabled={isPending || !selectedDocument || !hasPaymentMethods}
              className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : movementType === "pago_proveedor" ? "Registrar Pago" : "Registrar Cobro"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.35em] bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10 w-fit">
          Movimientos recientes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {initialData.recentPayments.map((payment) => (
            <Card key={payment.id} className="rounded-2xl border-border bg-white shadow-sm">
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-widest text-foreground">
                    {payment.tipo === "pago_proveedor" ? "Pago proveedor" : "Cobro cliente"}
                  </p>
                  <p className="text-xs font-bold text-muted-foreground truncate mt-1">
                    {payment.payment_methods?.nombre || "Medio no informado"} · {formatDate(payment.fecha_pago)}
                  </p>
                  {payment.referencia && <p className="text-[10px] font-bold text-muted-foreground mt-1 truncate">{payment.referencia}</p>}
                </div>
                <p className="text-sm font-black tabular-nums text-foreground shrink-0">{currency.format(payment.monto)}</p>
              </CardContent>
            </Card>
          ))}
          {initialData.recentPayments.length === 0 && (
            <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
              <p className="text-xs font-black uppercase tracking-widest text-foreground">Sin movimientos registrados</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
