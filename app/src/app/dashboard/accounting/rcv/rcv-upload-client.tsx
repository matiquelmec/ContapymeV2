"use client";

import { useState, useRef, useCallback, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Upload, FileText, CheckCircle, AlertCircle,
  Loader2, ShoppingCart, TrendingUp, X, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { importRCVAction } from "@/actions/rcv";
import { generateAccountingFromRCV } from "@/actions/accounting";

const formatPeriodo = (periodo: string) => {
  if (!periodo) return "";
  const [y, m] = periodo.split("-");
  const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  return `${months[parseInt(m) - 1]} ${y}`;
};

// ==========================================
// TIPOS
// ==========================================
interface FileState {
  file: File | null;
  status: "idle" | "loading" | "success" | "error";
  result: { inserted?: number; tipo_suma?: number; tipo_resta?: number; error?: string } | null;
  dragging: boolean;
}

interface UploadClientProps {
  organizationId: string;
  onImportSuccess?: () => void;
}

// ==========================================
// SUB-COMPONENTE: DROPZONE (EXTRACTED)
// ==========================================
const DropZone = ({
  state, handleDragEvents, handleDrop, handleFileChange, clearFile, handleImport, handleGenerateAccounting, 
  inputRef, type, label, icon: Icon, isGenerating
}: any) => {
  const isPurchase = type === "purchases";
  const borderColor = state.dragging
    ? `border-primary bg-primary/5`
    : state.status === "success"
    ? "border-emerald-500/50 bg-emerald-50/50"
    : state.status === "error"
    ? "border-rose-500/50 bg-rose-50/50"
    : "border-border/60 hover:border-primary/50 bg-muted/5 hover:bg-muted/10";

  return (
    <Card className={`bg-card shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 transition-colors ${
      isPurchase ? 'border-primary/20 border-t-blue-500 shadow-blue-500/5' : 'border-primary/20 border-t-emerald-500 shadow-emerald-500/5'
    }`}>
      <CardHeader className="pb-8 border-b border-border/50 bg-muted/5 p-10">
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <CardTitle className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-4">
              <div className={`p-4 rounded-2xl bg-white border border-border shadow-md ${isPurchase ? 'text-blue-600' : 'text-emerald-600'}`}>
                  <Icon className="w-7 h-7" />
              </div>
              {label}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.25em] pl-[4.5rem] italic">
              CANAL DE INYECTADO SII · CSV UTF-8
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8 p-10">
        <div
          className={`relative border-2 border-dashed rounded-[2rem] p-12 text-center cursor-pointer transition-all duration-300 group min-h-[220px] flex flex-col justify-center ${borderColor}`}
          onDragOver={handleDragEvents(true)}
          onDragLeave={handleDragEvents(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]" />
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />

          {state.file ? (
            <div className="flex items-center justify-center gap-6 relative z-10 animate-in zoom-in duration-300">
              <div className="p-6 bg-white rounded-3xl border border-border/50 shadow-xl">
                <FileText className="w-12 h-12 text-primary" />
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-base text-foreground font-black truncate max-w-[220px] uppercase tracking-tighter mb-2">{state.file.name}</p>
                <p className="text-[10px] text-primary/80 font-black italic mt-1 bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-full inline-block uppercase tracking-widest shrink-0">
                  {(state.file.size / 1024).toFixed(1)} KB — LISTO
                </p>
              </div>
              <button
                className="ml-4 p-4 rounded-2xl bg-rose-50 text-rose-500 hover:text-white hover:bg-rose-600 transition-all border border-rose-100 shadow-sm"
                onClick={(e) => { e.stopPropagation(); clearFile(); }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          ) : (
            <div className="space-y-5 relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-3xl border border-border/50 shadow-sm flex items-center justify-center mb-2 text-muted-foreground/30 group-hover:text-primary group-hover:scale-110 group-hover:border-primary/30 group-hover:bg-primary/5 transition-all duration-300">
                <Upload className="w-10 h-10" />
              </div>
              <p className="text-sm text-foreground font-black uppercase tracking-[0.2em]">Depositar Archivo RCV</p>
              <p className="text-[10px] text-muted-foreground font-bold italic bg-muted/50 px-4 py-2 rounded-full inline-block">Sincronización nativa con motor de auditoría</p>
            </div>
          )}
        </div>

        {state.status === "success" && state.result && (
           <div className="border border-emerald-200 bg-emerald-50 rounded-3xl overflow-hidden shadow-inner flex flex-col animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-5 p-6 border-b border-emerald-200/50 bg-emerald-100/30">
                <div className="p-3 bg-white rounded-2xl shadow-md border border-emerald-100">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <p className="uppercase text-xs font-black tracking-[0.2em] text-emerald-800">Carga Procesada con Éxito</p>
                  <p className="text-[10px] uppercase font-black tracking-widest text-emerald-600/70 italic">ASIENTOS DISPONIBLES EN SISTEMA</p>
                </div>
              </div>
              <div className="p-6 grid grid-cols-3 gap-4 bg-white/50">
                  <div className="flex flex-col gap-1 items-center bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
                    <span className="text-[10px] font-black uppercase text-emerald-700/60 tracking-widest text-center">Registros Totales</span>
                    <span className="text-2xl font-black text-emerald-700 tracking-tighter">{state.result.inserted}</span>
                  </div>
                  <div className="flex flex-col gap-1 items-center bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
                    <span className="text-[10px] font-black uppercase text-emerald-700/60 tracking-widest text-center">Facturas / (+V)</span>
                    <span className="text-2xl font-black text-emerald-700 tracking-tighter">{state.result.tipo_suma}</span>
                  </div>
                  <div className="flex flex-col gap-1 items-center bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
                    <span className="text-[10px] font-black uppercase text-emerald-700/60 tracking-widest text-center">Notas Cr / (-V)</span>
                    <span className="text-2xl font-black text-emerald-700 tracking-tighter">{state.result.tipo_resta}</span>
                  </div>
              </div>
           </div>
        )}
        
        {state.status === "error" && state.result && (
          <div className="flex items-center gap-5 bg-rose-50 border-2 border-rose-100 rounded-[2rem] p-6 text-rose-900 shadow-sm animate-in slide-in-from-top-4 duration-500">
             <div className="p-3 bg-white rounded-2xl shadow-sm border border-rose-200">
               <AlertCircle className="w-8 h-8 text-rose-600" />
             </div>
             <div className="space-y-1">
               <p className="uppercase text-[11px] font-black tracking-widest text-rose-800">Error en Protocolo de Carga</p>
               <span className="text-xs font-bold leading-relaxed">{state.result.error}</span>
             </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Button
            className={`flex-1 font-black uppercase text-[10px] tracking-[0.2em] rounded-full h-16 shadow-xl transition-all hover:scale-[1.02] active:scale-95 text-white justify-center items-center gap-3 ${
              state.status === "error" && state.result?.error?.includes("YA EXISTE")
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/30'
                : isPurchase ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'
            }`}
            disabled={!state.file || state.status === "loading"}
            onClick={() => handleImport(state.status === "error" && !!state.result?.error?.includes("YA EXISTE"))}
          >
            {state.status === "loading" ? (
              <><Loader2 className="w-6 h-6 animate-spin" /> PROCESANDO…</>
            ) : state.status === "error" && state.result?.error?.includes("YA EXISTE") ? (
              <><RefreshCw className="w-6 h-6" /> FORZAR SOBREESCRITURA</>
            ) : state.status === "success" ? (
              <><CheckCircle className="w-6 h-6" /> ACTUALIZAR CARGA</>
            ) : (
              <><Upload className="w-6 h-6" /> INYECTAR DATOS SII</>
            )}
          </Button>

          {state.status === "success" && (
            <Button
              variant="outline"
              className="flex-shrink-0 border-2 border-emerald-600/50 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-black uppercase text-[10px] tracking-widest h-16 rounded-full px-8 shadow-xl shadow-emerald-500/10 transition-all hover:scale-[1.02] active:scale-95 gap-3"
              disabled={isGenerating}
              onClick={handleGenerateAccounting}
            >
              {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCw className="w-6 h-6" />}
              <div className="flex flex-col leading-none items-start text-left">
                <span>CONTABILIZAR</span>
                <span className="text-[8px] opacity-80">MOTOR DB</span>
              </div>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ==========================================
// UTILS
// ==========================================
function extractPeriodFromFilename(filename: string): string | null {
  // Busca patrones como 2024_01 o 202401 en el nombre del archivo
  const pattern1 = /(\d{4})_(\d{2})/; // Formato SII estándar
  const pattern2 = /(\d{4})(\d{2})/;  // Formato compacto
  
  const match1 = filename.match(pattern1);
  if (match1) return `${match1[1]}-${match1[2]}-01`;
  
  const match2 = filename.match(pattern2);
  if (match2) {
    const year = parseInt(match2[1]);
    const month = parseInt(match2[2]);
    if (year > 2000 && year < 2100 && month >= 1 && month <= 12) {
      return `${match2[1]}-${match2[2]}-01`;
    }
  }
  return null;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export function RCVUploadClient({ organizationId, onImportSuccess }: UploadClientProps) {
  const [periodo, setPeriodo] = useState("");
  const [showManualPicker, setShowManualPicker] = useState(false);
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [purchases, setPurchases] = useState<FileState>({ file: null, status: "idle", result: null, dragging: false });
  const [sales, setSales] = useState<FileState>({ file: null, status: "idle", result: null, dragging: false });
  const [isGenerating, startGenerating] = useTransition();

  const purchaseInputRef = useRef<HTMLInputElement>(null);
  const salesInputRef = useRef<HTMLInputElement>(null);

  const createHandleDragEvent = (setter: any) => (isDragging: boolean) => (e: any) => {
    e.preventDefault(); e.stopPropagation();
    setter((prev: any) => ({ ...prev, dragging: isDragging }));
  };

  const createHandleDrop = (setter: any) => (e: any) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file?.name.endsWith(".csv")) {
      setter({ file, status: "idle", result: null, dragging: false });
      
      // Auto-detección inteligente de periodo
      const detected = extractPeriodFromFilename(file.name);
      if (detected) {
        setPeriodo(detected);
        setIsAutoDetected(true);
        toast.info(`Periodo detectado: ${detected.slice(0, 7)}`, { 
          description: "Ajustado automáticamente según el nombre del archivo."
        });
      } else {
        setIsAutoDetected(false);
      }
    } else {
      toast.error("Protocolo Ilimitado: Solo se aceptan archivos CSV del SII.");
      setter((prev: any) => ({ ...prev, dragging: false }));
    }
  };

  const createHandleFileChange = (setter: any) => (e: any) => {
    const file = e.target.files?.[0] ?? null;
    setter({ file, status: "idle", result: null, dragging: false });
    
    if (file) {
      const detected = extractPeriodFromFilename(file.name);
      if (detected) {
        setPeriodo(detected);
        toast.info(`Periodo detectado: ${detected.slice(0, 7)}`, { 
          description: "Ajustado automáticamente según el nombre del archivo."
        });
      }
    }
  };

  const createClearFile = (setter: any, inputRef: any) => () => {
    setter({ file: null, status: "idle", result: null, dragging: false });
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleImport = async (type: "purchases" | "sales", state: FileState, setter: any, force: boolean = false) => {
    if (!state.file) return;
    setter((s: any) => ({ ...s, status: "loading" }));
    const formData = new FormData();
    formData.append("file", state.file);
    const result = await importRCVAction(formData, organizationId, periodo, type, force);
    if (result.success) {
      setter((s: any) => ({ ...s, status: "success", result }));
      toast.success(`Libro de ${type === "purchases" ? "Compras" : "Ventas"} sincronizado.`, { icon: <CheckCircle className="w-5 h-5 text-emerald-500" /> });
      onImportSuccess?.();
    } else {
      setter((s: any) => ({ ...s, status: "error", result }));
      toast.error(`Error: ${result.error}`, { icon: <AlertCircle className="w-5 h-5 text-rose-500" /> });
    }
  };

  const handleGenerateAccounting = (type: "purchases" | "sales") => {
    startGenerating(async () => {
      const result = await generateAccountingFromRCV({ organization_id: organizationId, periodo, type });
      if (result?.success) {
        toast.success(`${result.entries_created} asientos generados.`, { icon: <CheckCircle className="w-5 h-5 text-emerald-500" /> });
      } else {
        toast.error(`Error: ${result?.error}`, { icon: <AlertCircle className="w-5 h-5 text-rose-500" /> });
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-card border border-border shadow-2xl p-6 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-muted/50 rounded-xl border border-border shadow-sm">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div className="flex flex-col">
            <Label htmlFor="periodo-picker" className="text-foreground text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 block">
              Período Tributario Activo
            </Label>
            <span className="text-[11px] text-muted-foreground font-bold italic tracking-wide">
              Mapeo de asientos contables RCV → Libro Diario
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
            {!periodo && !showManualPicker && (
              <span className="text-[10px] font-black uppercase text-rose-500 bg-rose-50 px-6 py-3 rounded-2xl border border-rose-100 animate-pulse tracking-widest">
                Esperando Archivos...
              </span>
            )}

            {periodo && !showManualPicker && (
              <div className="flex items-center gap-3 bg-emerald-50 border-2 border-emerald-200 px-6 py-3 rounded-2xl shadow-sm animate-in zoom-in duration-300">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-sm font-black text-emerald-700 uppercase tracking-tighter">
                  Periodo Detectado: {formatPeriodo(periodo)}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-emerald-100 text-emerald-600 rounded-lg ml-2"
                  onClick={() => setShowManualPicker(true)}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            )}

            {showManualPicker && (
              <Input
                id="periodo-picker"
                type="month"
                className="bg-muted/10 border-2 border-primary/30 text-foreground w-48 h-14 font-black text-sm rounded-2xl px-6 focus:ring-primary/20 hover:border-primary/50 transition-all uppercase tracking-widest"
                value={periodo.slice(0, 7)}
                onChange={(e) => {
                  setPeriodo(e.target.value ? `${e.target.value}-01` : periodo);
                  setIsAutoDetected(false);
                }}
                onBlur={() => { if(periodo) setShowManualPicker(false) }}
                autoFocus
              />
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DropZone
          state={purchases}
          handleDragEvents={createHandleDragEvent(setPurchases)}
          handleDrop={createHandleDrop(setPurchases)}
          handleFileChange={createHandleFileChange(setPurchases)}
          clearFile={createClearFile(setPurchases, purchaseInputRef)}
          handleImport={(force: boolean) => handleImport("purchases", purchases, setPurchases, force)}
          handleGenerateAccounting={() => handleGenerateAccounting("purchases")}
          inputRef={purchaseInputRef}
          type="purchases"
          label="Libro de Compras (SII)"
          icon={ShoppingCart}
          isGenerating={isGenerating}
        />
        <DropZone
          state={sales}
          handleDragEvents={createHandleDragEvent(setSales)}
          handleDrop={createHandleDrop(setSales)}
          handleFileChange={createHandleFileChange(setSales)}
          clearFile={createClearFile(setSales, salesInputRef)}
          handleImport={(force: boolean) => handleImport("sales", sales, setSales, force)}
          handleGenerateAccounting={() => handleGenerateAccounting("sales")}
          inputRef={salesInputRef}
          type="sales"
          label="Libro de Ventas (SII)"
          icon={TrendingUp}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
}
