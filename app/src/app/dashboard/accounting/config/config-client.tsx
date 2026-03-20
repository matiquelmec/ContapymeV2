"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Settings2, AlertCircle, Info, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { updateAccountingConfigAction } from "@/actions/accounting";

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

export function ConfigClient({ initialConfigs, organizationId }: { initialConfigs: AccountConfig[], organizationId: string }) {
  const [configs, setConfigs] = useState<AccountConfig[]>(initialConfigs);
  const [loading, setLoading] = useState<string | null>(null);

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
    </div>
  );
}
