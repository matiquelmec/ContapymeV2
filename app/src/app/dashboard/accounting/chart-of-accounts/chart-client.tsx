"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Plus, 
  Settings2, 
  ChevronRight, 
  ChevronDown, 
  Info,
  RefreshCcw,
  Zap,
  Search,
  Filter,
  Layers,
  Trash2,
  Loader2,
  FileDown,
  Edit2,
  BarChart3,
  CheckCircle2
} from "lucide-react";
import { initializeChartAction, createAccountAction, deleteAccountAction, updateAccountAction } from "@/actions/accounting";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Account {
  id: string;
  codigo: string;
  nombre: string;
  nivel: number;
  tipo: string;
  naturaleza: string;
  acepta_movimiento: boolean;
}

export default function ChartOfAccountsClient({ 
  organizationId, 
  initialAccounts, 
  initialStats 
}: { 
  organizationId: string, 
  initialAccounts: Account[], 
  initialStats?: any 
}) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterNivel, setFilterNivel] = useState("all");
  
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  useEffect(() => {
    setAccounts(initialAccounts);
    if (initialStats) setStats(initialStats);
  }, [initialAccounts, initialStats, organizationId]);

  const [newAccount, setNewAccount] = useState({
    codigo: "",
    nombre: "",
    nivel: 4,
    tipo: "activo",
    naturaleza: "deudora",
    acepta_movimiento: true
  });

  // --- LÓGICA DE INTELIGENCIA CONTABLE ---
  
  const autoDetectFromCode = (code: string) => {
    const firstDigit = code[0];
    let detectedType = newAccount.tipo;
    let detectedNature = newAccount.naturaleza;

    const typeMap: Record<string, string> = {
      '1': 'activo',
      '2': 'pasivo',
      '3': 'patrimonio',
      '4': 'ingreso',
      '5': 'gasto'
    };

    if (firstDigit && typeMap[firstDigit]) {
      detectedType = typeMap[firstDigit];
    }

    if (detectedType === 'activo' || detectedType === 'gasto') {
      detectedNature = 'deudora';
    } else {
      detectedNature = 'acreedora';
    }

    const parts = code.split('.').filter(p => p !== "");
    const detectedLevel = Math.min(Math.max(parts.length, 1), 4);
    const acceptsMovement = detectedLevel === 4;

    return { 
      tipo: detectedType, 
      naturaleza: detectedNature, 
      nivel: detectedLevel,
      acepta_movimiento: acceptsMovement 
    };
  };

  const formatCodeInput = (input: string) => {
    const numbersOnly = input.replace(/[^\d]/g, '');
    if (numbersOnly.length === 0) return "";

    let formatted = "";
    if (numbersOnly.length === 1) {
      formatted = numbersOnly;
    } else if (numbersOnly.length === 2) {
      formatted = `${numbersOnly[0]}.${numbersOnly[1]}`;
    } else if (numbersOnly.length === 3) {
      formatted = `${numbersOnly[0]}.${numbersOnly[1]}.${numbersOnly[2].padStart(2, '0')}`;
    } else if (numbersOnly.length >= 4) {
      const p1 = numbersOnly[0];
      const p2 = numbersOnly[1];
      const p3 = numbersOnly.slice(2, 4).padStart(2, '0');
      const p4 = numbersOnly.slice(4).padStart(3, '0');
      formatted = `${p1}.${p2}.${p3}.${p4}`;
    }
    return formatted;
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    if (e.target.value.length < newAccount.codigo.length) {
      const stripped = e.target.value.replace(/[^\d\.]/g, '');
      setNewAccount(prev => ({ ...prev, codigo: stripped }));
      return;
    }
    const formatted = formatCodeInput(rawValue);
    const detections = autoDetectFromCode(formatted);
    setNewAccount(prev => ({ ...prev, codigo: formatted, ...detections }));
  };

  const handleInitialize = async () => {
    setLoading(true);
    const promise = initializeChartAction(organizationId);
    
    toast.promise(promise, {
      loading: 'Sincronizando Plan de Cuentas IFRS...',
      success: (result: any) => {
        if (result.success) {
          setTimeout(() => window.location.reload(), 1500);
          return result.message || "Plan de Cuentas IFRS inicializado correctamente";
        }
        throw new Error(result.error || result.message || "Error al inicializar");
      },
      error: (err) => err.message || "Error inesperado al sincronizar",
    });

    try {
      await promise;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    setLoading(true);
    try {
      const result = await createAccountAction({
        ...newAccount,
        organization_id: organizationId
      });
      if (result.success) {
        toast.success("Cuenta creada exitosamente");
        setIsDialogOpen(false);
        window.location.reload();
      } else {
        toast.error(result.error || "Error al crear cuenta");
      }
    } catch (error) {
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta cuenta? Esta acción no se puede deshacer y solo funcionará si la cuenta no tiene movimientos.")) {
      return;
    }
    setLoading(true);
    try {
      const result = await deleteAccountAction(accountId, organizationId);
      if (result.success) {
        toast.success("Cuenta eliminada");
        window.location.reload();
      } else {
        toast.error(result.error || "Error al eliminar cuenta");
      }
    } catch (error) {
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount) return;
    setLoading(true);
    try {
      const result = await updateAccountAction(editingAccount.id, {
        nombre: editingAccount.nombre
      });
      if (result.success) {
        toast.success("Cuenta actualizada");
        setIsEditOpen(false);
        window.location.reload();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Codigo", "Nombre", "Nivel", "Tipo", "Naturaleza", "Imputable"];
    const rows = accounts.map(acc => [
      acc.codigo,
      acc.nombre,
      acc.nivel,
      acc.tipo,
      acc.naturaleza,
      acc.acepta_movimiento ? "SI" : "NO"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Plan_de_Cuentas_${organizationId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = acc.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         acc.codigo.includes(searchTerm);
    const matchesFilter = filterTipo === "all" || acc.tipo === filterTipo;
    const matchesNivel = filterNivel === "all" || String(acc.nivel) === filterNivel;
    return matchesSearch && matchesFilter && matchesNivel;
  });

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'activo': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pasivo': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'patrimonio': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ingreso': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'gasto': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (accounts.length === 0) {
    return (
      <Card className="border-dashed border-2 flex flex-col items-center justify-center p-16 text-center space-y-6 bg-card rounded-2xl shadow-sm">
        <div className="bg-primary/10 p-6 rounded-3xl shadow-inner">
          <Settings2 className="h-12 w-12 text-primary" />
        </div>
        <div className="max-w-md">
          <CardTitle className="text-2xl font-black uppercase tracking-tight text-foreground">Plan de Cuentas Vacío</CardTitle>
          <CardDescription className="mt-3 text-sm font-bold italic text-muted-foreground">
            Parece que aún no tienes configurado tu plan de cuentas. Para comenzar a registrar movimientos, necesitas una estructura base sólida bajo normativa IFRS.
          </CardDescription>
        </div>
        <Button onClick={handleInitialize} disabled={loading} size="lg" className="gap-3 font-black uppercase text-xs tracking-widest rounded-xl px-8 h-14 shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
          {loading ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5 fill-current text-amber-400" />}
          Inicializar Plan Maestro IFRS
        </Button>
        <div className="flex items-center gap-4 mt-6 p-4 bg-primary/5 border border-primary/10 rounded-2xl max-w-lg">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Info className="h-5 w-5 text-primary shrink-0" />
          </div>
          <p className="text-[11px] text-muted-foreground text-left font-bold leading-relaxed">
            <strong className="text-primary block mb-0.5">ESTRATEGIA DE SEGURIDAD:</strong> Este proceso solo crea las cuentas obligatorias que falten. Tus cuentas personalizadas y datos históricos no serán afectados.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700" suppressHydrationWarning={true}>
      
      {/* --- DASHBOARD DE ESTADÍSTICAS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border border-l-4 border-l-primary rounded-3xl shadow-sm hover:translate-y-[-4px] transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estructura Total</span>
              <div className="p-2 bg-primary/10 rounded-xl">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground">{stats?.total || accounts.length}</div>
            <p className="text-[10px] font-bold italic text-muted-foreground mt-1">Nodos contables activos</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border border-l-4 border-l-emerald-500 rounded-3xl shadow-sm hover:translate-y-[-4px] transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cuentas Imputables</span>
              <div className="p-2 bg-emerald-100 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600">{stats?.imputables || accounts.filter(a => a.acepta_movimiento).length}</div>
            <p className="text-[10px] font-bold italic text-muted-foreground mt-1">Permiten cargos y abonos</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border border-l-4 border-l-blue-500 rounded-3xl shadow-sm hover:translate-y-[-4px] transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Activos vs Pasivos</span>
              <div className="p-2 bg-blue-100 rounded-xl">
                <Layers className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground">{stats?.activos || 0}</span>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-2xl font-black text-amber-600">{stats?.pasivos || 0}</span>
            </div>
            <p className="text-[10px] font-bold italic text-muted-foreground mt-1">Nodos Balance General</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border border-l-4 border-l-rose-500 rounded-3xl shadow-sm hover:translate-y-[-4px] transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gestión RCV</span>
              <div className="p-2 bg-rose-100 rounded-xl">
                <Zap className="w-4 h-4 text-rose-600" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-600">Integrado</div>
            <p className="text-[10px] font-bold italic text-muted-foreground mt-1">Conectado a Compras/Ventas</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-8 bg-card border border-border rounded-[2.5rem] shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-inner">
            <Layers className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Catálogo Maestro</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] italic">Estructura general y nodos contables</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button 
            variant="outline"
            onClick={exportToCSV}
            className="gap-3 border-2 border-border font-black uppercase text-[11px] tracking-widest rounded-3xl h-14 px-8 hover:bg-muted hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
          >
            <FileDown className="h-5 w-5" /> Exportar
          </Button>

          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="gap-3 font-black uppercase text-[11px] tracking-widest rounded-3xl shadow-xl shadow-primary/20 h-14 px-8 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="h-5 w-5" /> Añadir Nodo
          </Button>

          <Button 
            variant="outline" 
            onClick={handleInitialize} 
            disabled={loading}
            className="gap-3 border-2 border-border font-black uppercase text-[11px] tracking-widest rounded-3xl h-14 px-8 hover:bg-muted hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
          >
            {loading ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <RefreshCcw className="h-5 w-5" />}
            Sincronizar IFRS
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-card border border-border rounded-[2.5rem] shadow-2xl p-6">
        <div className="flex-1 w-full flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
            <Input
              id="chartSearchTerm"
              name="chartSearchTerm"
              placeholder="Ej. '1.1.01.001' o 'Banco Estado'..."
              className="pl-14 bg-muted/10 border-2 border-border text-foreground font-black h-14 rounded-3xl shadow-sm focus:ring-primary focus:border-primary transition-all text-sm uppercase tracking-wide hover:border-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select id="field_filtertipo" name="field_filtertipo" value={filterTipo} onValueChange={(val) => val && setFilterTipo(val)}>
            <SelectTrigger className="w-full md:w-[200px] bg-muted/10 border-2 border-border h-14 rounded-3xl font-black text-xs uppercase tracking-widest shadow-sm hover:border-primary/50 transition-all px-6">
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-muted-foreground/50" />
                <SelectValue placeholder="CLASE" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white border-border rounded-2xl shadow-2xl p-2">
              <SelectItem value="all" className="font-black text-xs uppercase cursor-pointer rounded-xl h-10 mb-1 tracking-widest hover:bg-muted">Todas las Clases</SelectItem>
              <SelectItem value="activo" className="font-black text-xs uppercase text-blue-600 cursor-pointer rounded-xl h-10 mb-1 tracking-widest hover:bg-blue-50/50">Activos (C1)</SelectItem>
              <SelectItem value="pasivo" className="font-black text-xs uppercase text-amber-600 cursor-pointer rounded-xl h-10 mb-1 tracking-widest hover:bg-amber-50/50">Pasivos (C2)</SelectItem>
              <SelectItem value="patrimonio" className="font-black text-xs uppercase text-purple-600 cursor-pointer rounded-xl h-10 mb-1 tracking-widest hover:bg-purple-50/50">Patrimonio (C3)</SelectItem>
              <SelectItem value="ingreso" className="font-black text-xs uppercase text-emerald-600 cursor-pointer rounded-xl h-10 mb-1 tracking-widest hover:bg-emerald-50/50">Ingresos (C4)</SelectItem>
              <SelectItem value="gasto" className="font-black text-xs uppercase text-rose-600 cursor-pointer rounded-xl h-10 tracking-widest hover:bg-rose-50/50">Gastos (C5)</SelectItem>
            </SelectContent>
          </Select>

          <Select id="field_filternivel" name="field_filternivel" value={filterNivel} onValueChange={(val) => val && setFilterNivel(val)}>
            <SelectTrigger className="w-full md:w-[200px] bg-muted/10 border-2 border-border h-14 rounded-3xl font-black text-xs uppercase tracking-widest shadow-sm hover:border-primary/50 transition-all px-6">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-muted-foreground/50" />
                <SelectValue placeholder="NIVEL" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white border-border rounded-2xl shadow-2xl p-2">
              <SelectItem value="all" className="font-black text-xs uppercase cursor-pointer rounded-xl h-10 mb-1 tracking-widest hover:bg-muted">Todos los Niveles</SelectItem>
              <SelectItem value="1" className="font-black text-xs uppercase cursor-pointer rounded-xl h-10 mb-1 tracking-widest hover:bg-muted">Nivel 1 (Clase)</SelectItem>
              <SelectItem value="2" className="font-black text-xs uppercase cursor-pointer rounded-xl h-10 mb-1 tracking-widest hover:bg-muted">Nivel 2 (Grupo)</SelectItem>
              <SelectItem value="3" className="font-black text-xs uppercase cursor-pointer rounded-xl h-10 mb-1 tracking-widest hover:bg-muted">Nivel 3 (Cuenta)</SelectItem>
              <SelectItem value="4" className="font-black text-xs uppercase cursor-pointer rounded-xl h-10 tracking-widest hover:bg-muted">Nivel 4 (Operacional)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* --- MODAL DE CREACIÓN --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-3xl border-border bg-card shadow-2xl">
          <DialogHeader className="space-y-3 pb-4 border-b border-border">
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground">Añadir Nodo Estructural</DialogTitle>
            <DialogDescription className="text-xs font-bold italic text-muted-foreground leading-relaxed">
              Configure la nueva cuenta dentro del Plan Maestro siguiendo la jerarquía IFRS vigente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-8">
            <div className="grid grid-cols-4 items-center gap-6">
              <Label htmlFor="codigo" className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Código</Label>
              <Input 
                id="codigo" 
                name="codigo"
                value={newAccount.codigo}
                onChange={handleCodeChange}
                className="col-span-3 h-11 bg-muted/30 border-border font-black font-mono tracking-tighter" 
                placeholder="Ej: 1101001 -> 1.1.01.001"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-6">
              <Label htmlFor="nombre" className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre</Label>
              <Input 
                id="nombre" 
                name="nombre"
                value={newAccount.nombre}
                onChange={(e) => setNewAccount({...newAccount, nombre: e.target.value})}
                className="col-span-3 h-11 bg-muted/30 border-border font-black uppercase text-xs"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-6">
              <Label htmlFor="tipo" className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clase</Label>
              <Select id="field_newaccount_tipo" name="field_newaccount_tipo" 
                value={newAccount.tipo}
                onValueChange={(val) => val && setNewAccount({...newAccount, tipo: val})}
              >
                <SelectTrigger className="col-span-3 h-11 bg-muted/30 border-border font-bold text-xs uppercase">
                  <SelectValue placeholder="Tipo de cuenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo" className="text-xs font-bold">Activo</SelectItem>
                  <SelectItem value="pasivo" className="text-xs font-bold">Pasivo</SelectItem>
                  <SelectItem value="patrimonio" className="text-xs font-bold">Patrimonio</SelectItem>
                  <SelectItem value="ingreso" className="text-xs font-bold">Ingreso</SelectItem>
                  <SelectItem value="gasto" className="text-xs font-bold">Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-6">
              <Label htmlFor="nivel" className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nivel</Label>
              <Select id="field_string_newaccount_nivel" name="field_string_newaccount_nivel" 
                value={String(newAccount.nivel)}
                onValueChange={(val) => val && setNewAccount({...newAccount, nivel: Number(val), acepta_movimiento: val === "4"})}
              >
                <SelectTrigger className="col-span-3 h-11 bg-muted/30 border-border font-bold text-xs uppercase">
                  <SelectValue placeholder="Selecciona nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1" className="text-xs font-bold">Nivel 1 (Clase)</SelectItem>
                  <SelectItem value="2" className="text-xs font-bold">Nivel 2 (Grupo)</SelectItem>
                  <SelectItem value="3" className="text-xs font-bold">Nivel 3 (Cuenta)</SelectItem>
                  <SelectItem value="4" className="text-xs font-bold">Nivel 4 (Operacional)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="border-t border-border pt-6 mt-4">
            <Button type="submit" onClick={handleCreateAccount} disabled={loading} className="w-full h-12 bg-primary font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 transition-all rounded-xl active:scale-95">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Añadir al Plan de Cuentas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL DE EDICIÓN --- */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-3xl border-border bg-card shadow-2xl">
          <DialogHeader className="space-y-3 pb-4 border-b border-border">
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground">Editar Nodo Contable</DialogTitle>
            <DialogDescription className="text-xs font-bold italic text-muted-foreground leading-relaxed">
              Modifique el nombre o descripción de la cuenta {editingAccount?.codigo}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-8">
            <div className="grid grid-cols-4 items-center gap-6">
              <Label htmlFor="edit-nombre" className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre</Label>
              <Input 
                id="edit-nombre" 
                value={editingAccount?.nombre || ""}
                onChange={(e) => editingAccount && setEditingAccount({...editingAccount, nombre: e.target.value})}
                className="col-span-3 h-11 bg-muted/30 border-border font-black uppercase text-xs"
              />
            </div>
          </div>
          <DialogFooter className="border-t border-border pt-6 mt-4">
            <Button onClick={handleUpdateAccount} disabled={loading || !editingAccount?.nombre} className="w-full h-12 bg-primary font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 transition-all rounded-xl active:scale-95">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/20">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/10 border-b border-border/50">
                  <th className="text-left py-6 px-10 font-black uppercase tracking-[0.2em] text-[10px] text-foreground w-40">Identificador</th>
                  <th className="text-left py-6 px-10 font-black uppercase tracking-[0.2em] text-[10px] text-foreground">Cuenta Contable (IFRS)</th>
                  <th className="text-left py-6 px-10 font-black uppercase tracking-[0.2em] text-[10px] text-foreground w-32">Clase</th>
                  <th className="text-left py-6 px-10 font-black uppercase tracking-[0.2em] text-[10px] text-foreground w-32">Saldo</th>
                  <th className="text-left py-6 px-10 font-black uppercase tracking-[0.2em] text-[10px] text-foreground w-40">Imputable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAccounts.length > 0 ? filteredAccounts.map((acc) => (
                  <tr key={acc.id} className={`hover:bg-primary/[0.02] transition-colors group ${acc.nivel === 1 ? 'bg-muted/10' : ''}`}>
                    <td className="py-6 px-10">
                       <span className={`font-black tracking-widest uppercase text-[11px] ${acc.nivel === 1 ? 'text-primary' : 'text-muted-foreground/50 font-mono'}`}>
                        {acc.codigo}
                       </span>
                    </td>
                    <td className="py-6 px-10">
                      <div className="flex items-center gap-4" style={{ paddingLeft: `${(acc.nivel - 1) * 2}rem` }}>
                        {acc.acepta_movimiento ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] ring-4 ring-emerald-500/10" />
                        ) : (
                          <div className={`p-1.5 rounded-lg ${acc.nivel === 1 ? 'bg-primary/20 text-primary' : 'bg-muted/50 text-muted-foreground/30'}`}>
                            {acc.nivel === 1 ? <Layers className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          </div>
                        )}
                        <span className={`${acc.nivel <= 2 ? "font-black uppercase tracking-tight text-foreground text-sm" : "font-black tracking-tight text-foreground/80 text-xs"}`}>
                          {acc.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="py-6 px-10">
                      <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getTipoColor(acc.tipo)} shadow-sm`}>
                        {acc.tipo}
                      </span>
                    </td>
                    <td className="py-6 px-10">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                        {acc.naturaleza}
                      </span>
                    </td>
                    <td className="py-6 px-10">
                      <div className="flex items-center justify-between">
                        {acc.acepta_movimiento ? (
                          <Badge className="text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 border-emerald-200">Imputable</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 border-border">Agrupador</Badge>
                        )}
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ml-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => { setEditingAccount(acc); setIsEditOpen(true); }}
                            className="h-10 w-10 text-muted-foreground/30 hover:text-primary hover:bg-primary/5 rounded-xl border border-transparent hover:border-primary/10"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteAccount(acc.id)}
                            disabled={loading}
                            className="h-10 w-10 text-muted-foreground/30 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4 text-muted-foreground">
                        <div className="p-6 bg-muted rounded-full animate-pulse">
                          <Search className="h-10 w-10 opacity-20" />
                        </div>
                        <span className="font-bold italic uppercase text-xs tracking-widest">No se detectaron cuentas con los filtros aplicados.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-start gap-4 text-[11px] font-bold text-muted-foreground bg-primary/5 p-6 rounded-2xl border border-primary/10 shadow-inner italic leading-relaxed">
        <div className="p-1.5 bg-primary/20 rounded-lg shrink-0">
          <Info className="h-4 w-4 text-primary" />
        </div>
        <div>
          <strong className="text-primary uppercase tracking-widest mb-1 block">Nota sobre Arquitectura de Datos:</strong>
          Las cuentas de niveles superiores (Clase, Grupo y Cuenta) actúan como nodos de consolidación y no aceptan cargos o abonos directos. Toda transacción debe imputarse a una <span className="text-foreground underline decoration-emerald-500/30 decoration-2">Cuenta Operacional (Nivel 4)</span> para mantener la integridad del Libro Diario.
        </div>
      </div>
    </div>
  );
}
