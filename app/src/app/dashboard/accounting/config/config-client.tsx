"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Settings2, AlertCircle, Info, Loader2, Plus, Trash2, Search, UserPlus, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  updateAccountingConfigAction, 
  createMappingRuleAction, 
  deleteMappingRuleAction 
} from "@/actions/accounting";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AccountConfig {
  id: string;
  module_name: string;
  transaction_type: string;
  display_name: string;
  tax_account_code: string;
  tax_account_name: string;
  revenue_account_code: string;
  revenue_account_name: string;
  asset_account_code: string;
  asset_account_name: string;
}

interface MappingRule {
  id: string;
  context: string;
  account_id: string;
  chart_of_accounts?: {
    codigo: string;
    nombre: string;
  };
}

interface Account {
  id: string;
  codigo: string;
  nombre: string;
}

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_type: string;
  chart_account_id?: string;
}

export function ConfigClient({ 
  initialConfigs, 
  initialRules, 
  initialBankAccounts,
  accounts, 
  organizationId 
}: { 
  initialConfigs: AccountConfig[], 
  initialRules: MappingRule[],
  initialBankAccounts: BankAccount[],
  accounts: Account[],
  organizationId: string 
}) {
  const [configs, setConfigs] = useState<AccountConfig[]>(initialConfigs);
  const [rules, setRules] = useState<MappingRule[]>(initialRules);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(initialBankAccounts);
  const [loading, setLoading] = useState<string | null>(null);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  
  const [newRule, setNewRule] = useState({
    context: "",
    account_id: ""
  });

  const [newBank, setNewBank] = useState({
    bank_name: "",
    account_number: "",
    account_type: "corriente",
    chart_account_id: ""
  });

  const handleUpdate = async (configId: string, data: Partial<AccountConfig>) => {
    setLoading(configId);
    try {
      const result = await updateAccountingConfigAction(configId, data);
      if (result.success) {
        toast.success("Configuración institucional actualizada");
        setConfigs(prev => prev.map(c => c.id === configId ? { ...c, ...result.data } : c));
      } else {
        toast.error(result.error || "Fallo en la actualización centralizada");
      }
    } catch (error) {
      toast.error("Error crítico inesperado en el servidor");
    } finally {
      setLoading(null);
    }
  };

  const handleCreateRule = async () => {
    if (!newRule.context || !newRule.account_id) {
      toast.error("Complete todos los campos de la regla");
      return;
    }
    setLoading("creating_rule");
    try {
      const result = await createMappingRuleAction({
        ...newRule,
        organization_id: organizationId
      });
      if (result.success) {
        toast.success("Regla de excepción creada");
        window.location.reload();
      } else {
        toast.error(result.error || "Fallo al crear regla");
      }
    } catch (error) {
      toast.error("Error al conectar con el servidor de mapeo");
    } finally {
      setLoading(null);
    }
  };

  const handleCreateBank = async () => {
    if (!newBank.bank_name || !newBank.account_number) {
      toast.error("Complete el nombre y número de cuenta");
      return;
    }
    setLoading("creating_bank");
    const { createBankAccount } = await import("@/actions/bank-reconciliation");
    try {
      const result = await createBankAccount({
        ...newBank,
        organization_id: organizationId
      });
      if (result.success) {
        toast.success("Cuenta bancaria registrada");
        setIsBankDialogOpen(false);
        window.location.reload();
      } else {
        toast.error(result.error || "Error al registrar banco");
      }
    } catch (error) {
      toast.error("Error al conectar con el motor bancario");
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm("¿Eliminar esta regla de excepción?")) return;
    setLoading(ruleId);
    try {
      const result = await deleteMappingRuleAction(ruleId);
      if (result.success) {
        toast.success("Regla eliminada exitosamente");
        setRules(prev => prev.filter(r => r.id !== ruleId));
      }
    } catch (error) {
      toast.error("Error al eliminar la regla");
    } finally {
      setLoading(null);
    }
  };

  const handleChange = (id: string, field: keyof AccountConfig, value: string) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  if (configs.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-32 px-10 text-center bg-card border-border border-dashed border-4 rounded-[2.5rem] shadow-inner opacity-60">
        <div className="bg-white p-8 rounded-3xl shadow-2xl mb-8 border border-border">
          <Settings2 className="h-16 w-16 text-primary/20" />
        </div>
        <div className="max-w-md space-y-4">
          <CardTitle className="text-xl font-black uppercase tracking-tight text-foreground">Configuración No Inicializada</CardTitle>
          <CardDescription className="text-muted-foreground text-sm font-bold italic leading-relaxed">
            No se han detectado mapeos maestros para esta entidad fiscal. 
            Esto es habitual tras la creación de una nueva organización o reestructuración del plan contable.
          </CardDescription>
          <div className="pt-6 inline-flex">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-primary shadow-sm border border-primary/20">
              <Info className="h-4 w-4" />
              Sincronice el Plan de Cuentas IFRS
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in duration-700" suppressHydrationWarning={true}>
      {configs.map((config) => (
        <Card key={config.id} className="border-border shadow-2xl rounded-[2.5rem] overflow-hidden group hover:shadow-primary/5 transform transition-all duration-300 border-t-8 border-t-primary">
          <CardHeader className="bg-muted/5 p-8 lg:p-10 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              <div className="space-y-3">
                <CardTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-4 text-foreground">
                  <div className="p-3 bg-white rounded-2xl border-2 border-border shadow-sm">
                    <Settings2 className="h-6 w-6 text-primary" />
                  </div>
                  {config.display_name}
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.2em] border-2 border-border text-muted-foreground/80 px-4 py-1.5 rounded-full">
                    Módulo: {config.module_name}
                  </Badge>
                  <Badge className="text-[9px] font-black uppercase tracking-[0.2em] bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 shadow-sm rounded-full">
                    Operación: {config.transaction_type}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 lg:p-10 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
              {/* Sección Cuenta Impuesto */}
              <div className="space-y-5">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60 border-l-4 border-primary pl-4 py-1 block">Cuenta de Impuesto (IVA)</Label>
                <div className="space-y-4">
                  <div className="relative">
                     <Input 
                      placeholder="Identificador IFRS" 
                      value={config.tax_account_code} 
                      onChange={(e) => handleChange(config.id, 'tax_account_code', e.target.value)}
                      className="bg-muted/10 border-2 border-border font-black font-mono tracking-tighter h-14 text-sm pl-6 rounded-3xl shadow-sm focus:border-primary focus:ring-primary transition-all hover:border-primary/50"
                    />
                  </div>
                  <Input 
                    placeholder="Descripción Estática" 
                    value={config.tax_account_name} 
                    onChange={(e) => handleChange(config.id, 'tax_account_name', e.target.value)}
                    className="bg-muted/10 border-2 border-border font-black uppercase text-[11px] h-14 pl-6 rounded-3xl shadow-sm focus:border-primary focus:ring-primary transition-all hover:border-primary/50"
                  />
                </div>
              </div>

              {/* Sección Cuenta Contrapartida */}
              <div className="space-y-5">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60 border-l-4 border-amber-500 pl-4 py-1 block">Contrapartida ({config.transaction_type === 'purchases' ? 'Gasto' : 'Ingreso'})</Label>
                <div className="space-y-4">
                  <Input 
                    placeholder="Identificador IFRS" 
                    value={config.revenue_account_code} 
                    onChange={(e) => handleChange(config.id, 'revenue_account_code', e.target.value)}
                    className="bg-muted/10 border-2 border-border font-black font-mono tracking-tighter h-14 text-sm pl-6 rounded-3xl shadow-sm focus:border-amber-500 focus:ring-amber-500 transition-all hover:border-amber-500/50"
                  />
                   <Input 
                    placeholder="Descripción Estática" 
                    value={config.revenue_account_name} 
                    onChange={(e) => handleChange(config.id, 'revenue_account_name', e.target.value)}
                    className="bg-muted/10 border-2 border-border font-black uppercase text-[11px] h-14 pl-6 rounded-3xl shadow-sm focus:border-amber-500 focus:ring-amber-500 transition-all hover:border-amber-500/50"
                  />
                </div>
              </div>

              {/* Sección Cuenta Entidad (Ancho completo) */}
              <div className="space-y-5 md:col-span-2 bg-muted/5 p-6 rounded-[2rem] border border-border">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60 border-l-4 border-emerald-500 pl-4 py-1 block mb-4">Control de Entidad ({config.transaction_type === 'purchases' ? 'Proveedores' : 'Clientes'})</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                   <Input 
                    placeholder="Código de Control" 
                    value={config.asset_account_code} 
                    onChange={(e) => handleChange(config.id, 'asset_account_code', e.target.value)}
                    className="bg-white border-2 border-border font-black font-mono tracking-tighter h-14 text-sm pl-6 rounded-3xl shadow-sm focus:border-emerald-500 focus:ring-emerald-500 md:col-span-1 transition-all hover:border-emerald-500/50"
                  />
                   <Input 
                    placeholder="Nombre Institucional de la Cuenta" 
                    value={config.asset_account_name} 
                    onChange={(e) => handleChange(config.id, 'asset_account_name', e.target.value)}
                    className="bg-white border-2 border-border font-black uppercase text-[11px] h-14 pl-6 rounded-3xl shadow-sm focus:border-emerald-500 focus:ring-emerald-500 md:col-span-2 transition-all hover:border-emerald-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-5 p-6 bg-primary/5 rounded-[2rem] border border-primary/10 text-[11px] font-bold text-muted-foreground leading-relaxed italic">
              <Info className="h-6 w-6 text-primary shrink-0 opacity-50" />
              <span>Las modificaciones operativas en esta sección se aplicarán exclusivamente a la generación de asientos <span className="text-foreground font-black not-italic border-b border-primary/20 pb-0.5 inline-block ml-1">POSTERIORES</span> a la actualización. No hay retroactividad estructural.</span>
            </div>

            <Button 
              className="w-full h-14 bg-primary font-black uppercase text-[10px] tracking-widest rounded-full shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all" 
              onClick={() => handleUpdate(config.id, {
                tax_account_code: config.tax_account_code,
                tax_account_name: config.tax_account_name,
                revenue_account_code: config.revenue_account_code,
                revenue_account_name: config.revenue_account_name,
                asset_account_code: config.asset_account_code,
                asset_account_name: config.asset_account_name
              })}
              disabled={loading === config.id}
            >
              {loading === config.id ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="flex items-center gap-3">
                  <Save className="h-5 w-5" />
                  Preservar Configuración Centralizada
                </div>
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
      {/* --- SECCIÓN DE MAPEO GRANULAR (RCV ENTITY mapping) --- */}
      <Card className="xl:col-span-2 border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-emerald-500 bg-card/50 backdrop-blur-sm">
        <CardHeader className="p-8 lg:p-10 border-b border-border/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <CardTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-4 text-foreground">
                <div className="p-3 bg-white rounded-2xl border-2 border-border shadow-sm">
                  <UserPlus className="h-6 w-6 text-emerald-500" />
                </div>
                Excepciones por Entidad (RUT)
              </CardTitle>
              <CardDescription className="text-xs font-bold italic text-muted-foreground uppercase tracking-widest">
                Mapeo inteligente para proveedores o clientes específicos (Sobrescribe configuración centralizada)
              </CardDescription>
            </div>
            
            <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
            <DialogTrigger render={
              <Button className="gap-3 bg-emerald-600 hover:bg-emerald-700 font-extrabold uppercase text-[10px] tracking-widest px-8 h-12 rounded-2xl shadow-lg shadow-emerald-500/20">
                <Plus className="h-5 w-5" /> Nueva Excepción
              </Button>
            } />
              <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] border-border bg-card shadow-2xl">
                <DialogHeader className="space-y-4 pb-6 border-b border-border">
                  <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground">Crear Regla Inteligente</DialogTitle>
                  <DialogDescription className="text-xs font-bold italic text-muted-foreground leading-relaxed">
                    Defina una cuenta contable específica para un RUT determinado. Útil para préstamos bancarios, leasing o proveedores de servicios fijos.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-8">
                  <div className="space-y-3">
                    <Label htmlFor="rut" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">RUT de la Entidad (Sin puntos ni guión)</Label>
                    <Input 
                      id="rut" 
                      placeholder="Ej: 12345678K"
                      value={newRule.context}
                      onChange={(e) => setNewRule({...newRule, context: e.target.value.toUpperCase().replace(/\./g, '')})}
                      className="bg-muted/10 border-2 border-border font-black h-12 rounded-2xl pl-6 uppercase"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="account" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Cuenta Específica (Nivel 4)</Label>
                    <Select 
                      onValueChange={(val) => setNewRule({...newRule, account_id: val})}
                    >
                      <SelectTrigger className="bg-muted/10 border-2 border-border h-12 rounded-2xl pl-6 font-black text-xs uppercase">
                        <SelectValue placeholder="Seleccione Cuenta Contable" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 bg-white border-border rounded-2xl shadow-2xl p-2">
                        {accounts.filter(a => a.codigo.split('.').length === 4).map((acc) => (
                          <SelectItem key={acc.id} value={acc.id} className="font-bold text-[10px] uppercase">
                            {acc.codigo} - {acc.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="border-t border-border pt-6 mt-4">
                  <Button 
                    onClick={handleCreateRule}
                    disabled={loading === 'creating_rule'}
                    className="w-full h-12 bg-emerald-600 font-extrabold uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20"
                  >
                    {loading === 'creating_rule' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-3" />}
                    Vincular Entidad al Plan de Cuentas
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10 border-b border-border">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-6 px-10 font-black uppercase tracking-[0.2em] text-[10px] text-foreground">Identificador de Entidad</TableHead>
                <TableHead className="py-6 px-10 font-black uppercase tracking-[0.2em] text-[10px] text-foreground">Cuenta Asignada (Override)</TableHead>
                <TableHead className="py-6 px-10 font-black uppercase tracking-[0.2em] text-[10px] text-foreground text-right w-32">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {rules.length > 0 ? rules.map((rule) => (
                <TableRow key={rule.id} className="hover:bg-primary/[0.02] transition-colors group">
                  <TableCell className="py-6 px-10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                         <Search className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="font-black tracking-widest uppercase text-xs text-foreground">
                        {String(rule.context)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-10">
                    <div className="flex flex-col">
                      <span className="font-black text-xs text-foreground">{rule.chart_of_accounts?.nombre}</span>
                      <span className="text-[10px] font-bold text-muted-foreground/60 font-mono tracking-tighter">{rule.chart_of_accounts?.codigo}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-10 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteRule(rule.id)}
                      disabled={loading === rule.id}
                      className="h-10 w-10 text-muted-foreground/30 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all rounded-xl shadow-inner border border-transparent hover:border-rose-100"
                    >
                      {loading === rule.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={3} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4 text-muted-foreground">
                      <div className="p-6 bg-muted/20 rounded-full border border-border border-dashed">
                        <AlertCircle className="h-10 w-10 opacity-20" />
                      </div>
                      <span className="font-extrabold italic uppercase text-[10px] tracking-widest opacity-40">No existen reglas de excepción para esta organización.</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* --- SECCIÓN DE CUENTAS BANCARIAS --- */}
      <Card className="xl:col-span-2 border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-blue-500 bg-card/50 backdrop-blur-sm">
        <CardHeader className="p-8 lg:p-10 border-b border-border/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <CardTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-4 text-foreground">
                <div className="p-3 bg-white rounded-2xl border-2 border-border shadow-sm">
                  <Landmark className="h-6 w-6 text-blue-500" />
                </div>
                Cuentas Bancarias Maestro
              </CardTitle>
              <CardDescription className="text-xs font-bold italic text-muted-foreground uppercase tracking-widest">
                Configure las cuentas corrientes de la empresa para habilitar la conciliación persistente.
              </CardDescription>
            </div>
            
            <Dialog open={isBankDialogOpen} onOpenChange={setIsBankDialogOpen}>
              <DialogTrigger render={
                <Button className="gap-3 bg-blue-600 hover:bg-blue-700 font-extrabold uppercase text-[10px] tracking-widest px-8 h-12 rounded-2xl shadow-lg shadow-blue-500/20">
                  <Plus className="h-5 w-5" /> Registrar Banco
                </Button>
              } />
              <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] border-border bg-card shadow-2xl">
                <DialogHeader className="space-y-4 pb-6 border-b border-border">
                  <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground">Nueva Cuenta Bancaria</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Institución</Label>
                      <Input 
                        placeholder="Ej: Santander"
                        value={newBank.bank_name}
                        onChange={(e) => setNewBank({...newBank, bank_name: e.target.value})}
                        className="bg-muted/10 border-2 border-border font-black h-12 rounded-2xl"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Tipo</Label>
                      <Select 
                        value={newBank.account_type}
                        onValueChange={(val) => setNewBank({...newBank, account_type: val})}
                      >
                        <SelectTrigger className="bg-muted/10 border-2 border-border h-12 rounded-2xl font-black text-xs uppercase">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="corriente" className="font-bold text-xs uppercase">Corriente</SelectItem>
                          <SelectItem value="vista" className="font-bold text-xs uppercase">Vista</SelectItem>
                          <SelectItem value="ahorro" className="font-bold text-xs uppercase">Ahorro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Número de Cuenta</Label>
                    <Input 
                      placeholder="000-1234567-8"
                      value={newBank.account_number}
                      onChange={(e) => setNewBank({...newBank, account_number: e.target.value})}
                      className="bg-muted/10 border-2 border-border font-black h-12 rounded-2xl"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Vincular a Cuenta Contable (Libro Diario)</Label>
                    <Select 
                      onValueChange={(val) => setNewBank({...newBank, chart_account_id: val})}
                    >
                      <SelectTrigger className="bg-muted/10 border-2 border-border h-12 rounded-2xl pl-6 font-black text-xs uppercase">
                        <SelectValue placeholder="Seleccione Cuenta en Plan de Cuentas" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 bg-white border-border rounded-2xl shadow-2xl p-2">
                        {accounts.filter(a => a.codigo.startsWith('1.1.01') || a.nombre.toLowerCase().includes('banco')).map((acc) => (
                          <SelectItem key={acc.id} value={acc.id} className="font-bold text-[10px] uppercase">
                            {acc.codigo} - {acc.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="border-t border-border pt-6 mt-4">
                  <Button 
                    onClick={handleCreateBank}
                    disabled={loading === 'creating_bank'}
                    className="w-full h-12 bg-blue-600 font-extrabold uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-blue-500/20"
                  >
                    {loading === 'creating_bank' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-3" />}
                    Registrar Cuenta Bancaria
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10 border-b border-border">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-6 px-10 font-black uppercase tracking-[0.2em] text-[10px] text-foreground">Banco / Institución</TableHead>
                <TableHead className="py-6 px-10 font-black uppercase tracking-[0.2em] text-[10px] text-foreground">Número de Cuenta</TableHead>
                <TableHead className="py-6 px-10 font-black uppercase tracking-[0.2em] text-[10px] text-foreground">Asignación Contable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {bankAccounts.length > 0 ? bankAccounts.map((bank) => (
                <TableRow key={bank.id} className="hover:bg-primary/[0.02] transition-colors group">
                  <TableCell className="py-6 px-10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                         <Landmark className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black tracking-widest uppercase text-xs text-foreground">
                          {String(bank.bank_name)}
                        </span>
                        <span className="text-[9px] font-black uppercase text-blue-500 opacity-60 tracking-[0.2em] italic">Cuenta {String(bank.account_type)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-10">
                    <span className="font-black text-xs text-foreground font-mono tracking-tighter bg-muted/30 px-3 py-1.5 rounded-lg border border-border">{bank.account_number}</span>
                  </TableCell>
                  <TableCell className="py-6 px-10">
                    {bank.chart_account_id ? (
                      <Badge variant="outline" className="font-black uppercase text-[9px] border-emerald-200 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                        Vinculada ID: {String(bank.chart_account_id).substring(0,8)}
                      </Badge>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-400 italic uppercase">Sin vinculación contable</span>
                    )}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={3} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4 text-muted-foreground">
                      <div className="p-6 bg-muted/20 rounded-full border border-border border-dashed">
                        <Landmark className="h-10 w-10 opacity-20" />
                      </div>
                      <span className="font-extrabold italic uppercase text-[10px] tracking-widest opacity-40">No hay cuentas bancarias registradas para el cruce.</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
