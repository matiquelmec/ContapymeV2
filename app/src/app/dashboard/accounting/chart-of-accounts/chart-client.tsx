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
  Loader2
} from "lucide-react";
import { initializeChartAction, createAccountAction, deleteAccountAction } from "@/actions/accounting";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

export default function ChartOfAccountsClient({ organizationId, initialAccounts }: { organizationId: string, initialAccounts: Account[] }) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("all");
  
  useEffect(() => {
    setAccounts(initialAccounts);
  }, [initialAccounts, organizationId]);

  const [newAccount, setNewAccount] = useState({
    codigo: "",
    nombre: "",
    nivel: 4,
    tipo: "activo",
    naturaleza: "deudora",
    acepta_movimiento: true
  });

  const handleInitialize = async () => {
    setLoading(true);
    try {
      const result = await initializeChartAction(organizationId);
      if (result.success) {
        toast.success(result.message);
        window.location.reload();
      } else {
        toast.error(result.message || "Error al inicializar");
      }
    } catch (error) {
      toast.error("Error inesperado");
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

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = acc.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         acc.codigo.includes(searchTerm);
    const matchesFilter = filterTipo === "all" || acc.tipo === filterTipo;
    return matchesSearch && matchesFilter;
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-8 bg-card border border-border rounded-[2.5rem] shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-inner" suppressHydrationWarning={true}>
            <Layers className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1.5" suppressHydrationWarning={true}>
            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight" suppressHydrationWarning={true}>Catálogo Maestro</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] italic" suppressHydrationWarning={true}>Estructura general y nodos contables</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="px-5 py-2.5 bg-muted/30 rounded-full border border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground shadow-sm">
            Total Registros: <span className="text-primary">{accounts.length} Cuentas</span>
          </div>
          
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
          <div className="relative flex-1 w-full" suppressHydrationWarning={true}>
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" suppressHydrationWarning={true} />
            <Input
              placeholder="Ej. '1.1.01.001' o 'Banco Estado'..."
              className="pl-14 bg-muted/10 border-2 border-border text-foreground font-black h-14 rounded-3xl shadow-sm focus:ring-primary focus:border-primary transition-all text-sm uppercase tracking-wide hover:border-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterTipo} onValueChange={(val) => val && setFilterTipo(val)}>
            <SelectTrigger className="w-full md:w-[240px] bg-muted/10 border-2 border-border h-14 rounded-3xl font-black text-xs uppercase tracking-widest shadow-sm hover:border-primary/50 transition-all px-6" suppressHydrationWarning={true}>
              <div className="flex items-center gap-3" suppressHydrationWarning={true}>
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
        </div>
      </div>

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
                value={newAccount.codigo}
                onChange={(e) => setNewAccount({...newAccount, codigo: e.target.value})}
                className="col-span-3 h-11 bg-muted/30 border-border font-black font-mono tracking-tighter" 
                placeholder="1.1.01.005"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-6">
              <Label htmlFor="nombre" className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre</Label>
              <Input 
                id="nombre" 
                value={newAccount.nombre}
                onChange={(e) => setNewAccount({...newAccount, nombre: e.target.value})}
                className="col-span-3 h-11 bg-muted/30 border-border font-black uppercase text-xs"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-6">
              <Label htmlFor="tipo" className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clase</Label>
              <Select 
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
              <Select 
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
            <div className="grid grid-cols-4 items-center gap-6">
              <Label htmlFor="naturaleza" className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Saldo</Label>
              <Select 
                value={newAccount.naturaleza}
                onValueChange={(val) => val && setNewAccount({...newAccount, naturaleza: val})}
              >
                <SelectTrigger className="col-span-3 h-11 bg-muted/30 border-border font-bold text-xs uppercase">
                  <SelectValue placeholder="Naturaleza" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deudora" className="text-xs font-bold">Deudor</SelectItem>
                  <SelectItem value="acreedora" className="text-xs font-bold">Acreedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="border-t border-border pt-6 mt-4">
            <Button type="submit" onClick={handleCreateAccount} disabled={loading || !newAccount.codigo || !newAccount.nombre} className="w-full h-12 bg-primary font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 transition-all rounded-xl active:scale-95">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Añadir al Plan de Cuentas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/20">
        <CardContent className="p-0">
          <div className="overflow-x-auto" suppressHydrationWarning={true}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/10 border-b border-border/50">
                  <th className="text-left py-6 px-10 font-black uppercase tracking-[0.2em] text-[10px] text-foreground w-40">Identificador</th>
                  <th className="text-left py-6 px-10 font-black uppercase tracking-[0.2em] text-[10px] text-foreground">Cuenta Contable (IFRS)</th>
                  <th className="text-left py-6 px-10 font-black uppercase tracking-[0.2em] text-[10px] text-foreground w-32">Naturaleza</th>
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
                      <div className="flex items-center gap-4" style={{ paddingLeft: `${(acc.nivel - 1) * 2}rem` }} suppressHydrationWarning={true}>
                        {acc.acepta_movimiento ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] ring-4 ring-emerald-500/10" suppressHydrationWarning={true} />
                        ) : (
                          <div className={`p-1.5 rounded-lg ${acc.nivel === 1 ? 'bg-primary/20 text-primary' : 'bg-muted/50 text-muted-foreground/30'}`} suppressHydrationWarning={true}>
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
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteAccount(acc.id)}
                          disabled={loading}
                          className="h-10 w-10 text-muted-foreground/30 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all rounded-xl ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
      
      <div className="flex items-start gap-4 text-[11px] font-bold text-muted-foreground bg-primary/5 p-6 rounded-2xl border border-primary/10 shadow-inner italic leading-relaxed" suppressHydrationWarning={true}>
        <div className="p-1.5 bg-primary/20 rounded-lg shrink-0" suppressHydrationWarning={true}>
          <Info className="h-4 w-4 text-primary" suppressHydrationWarning={true} />
        </div>
        <div suppressHydrationWarning={true}>
          <strong className="text-primary uppercase tracking-widest mb-1 block">Nota sobre Arquitectura de Datos:</strong>
          Las cuentas de niveles superiores (Clase, Grupo y Cuenta) actúan como nodos de consolidación y no aceptan cargos o abonos directos. Toda transacción debe imputarse a una <span className="text-foreground underline decoration-emerald-500/30 decoration-2">Cuenta Operacional (Nivel 4)</span> para mantener la integridad del Libro Diario.
        </div>
      </div>
    </div>
  );
}
