"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Save, UserCircle, Building2, Users2, Shield, Loader2, 
  CheckCircle2, Mail, Phone, MapPin, FileText, Globe, UserCog,
  History, Fingerprint, Activity, Plus, Trash2, X, Send, 
  UploadCloud, FileUp, AlertTriangle, Info
} from "lucide-react";
import { toast } from "sonner";
import { updateProfile, updateOrganization } from "@/actions/settings";
import { inviteMember, deleteInvitation, getPendingInvitations } from "@/actions/members";
import { getAuditLogs, getAuditActions } from "@/actions/audit";
import { updateDTEConfig, uploadCAF } from "@/actions/billing";
import { formatRUT, cleanRUT } from "@/lib/utils/rut";
import { cn } from "@/lib/utils";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogTrigger, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { StatusModal, StatusType } from "../components/status-modal";

// ―― HELPER: input premium ――
const PInput = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <Input
    {...props}
    className={`h-14 bg-white border-border rounded-2xl font-black text-sm focus:ring-primary/20 shadow-sm px-6 ${props.className || ''}`}
  />
);

export default function SettingsPageClient({ 
  organizationId, 
  userEmail, 
  initialProfile, 
  initialOrganization,
  initialMembers,
  initialDTEConfig,
  initialCAFRecords,
  userId
}: {
  organizationId: string;
  userEmail: string;
  userId: string;
  initialProfile: any;
  initialOrganization: any;
  initialMembers: any[];
  initialDTEConfig: any;
  initialCAFRecords: any[];
}) {
  const [loadingOrg, setLoadingOrg] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingDTE, setLoadingDTE] = useState(false);
  const [loadingCAF, setLoadingCAF] = useState(false);
  const [cafRecords, setCafRecords] = useState<any[]>(initialCAFRecords || []);
  const [cafEnv, setCafEnv] = useState<'certification' | 'production'>('certification');
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditActions, setAuditActions] = useState<string[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "viewer" });
  const [loadingInvite, setLoadingInvite] = useState(false);

  // Status Modal State
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: 'success' as StatusType,
    title: '',
    description: '',
    actionLabel: undefined as string | undefined,
    onAction: undefined as (() => void) | undefined
  });

  const [profileForm, setProfileForm] = useState({
    full_name: initialProfile?.full_name || "",
    avatar_url: initialProfile?.avatar_url || "",
  });

  const [orgForm, setOrgForm] = useState({
    nombre: initialOrganization?.nombre || "",
    rut_empresa: initialOrganization?.rut_empresa ? formatRUT(initialOrganization.rut_empresa) : "",
    giro: initialOrganization?.giro || "",
    direccion: initialOrganization?.direccion || "",
    comuna: initialOrganization?.comuna || "",
    region: initialOrganization?.region || "",
    email: initialOrganization?.email || "",
    telefono: initialOrganization?.telefono || "",
  });

  const [dteForm, setDteForm] = useState({
    id: initialDTEConfig?.id || null,
    rut: initialDTEConfig?.rut ? formatRUT(initialDTEConfig.rut) : "",
    razon_social: initialDTEConfig?.razon_social || "",
    giro: initialDTEConfig?.giro || "",
    direccion: initialDTEConfig?.direccion || "",
    comuna: initialDTEConfig?.comuna || "",
    ciudad: initialDTEConfig?.ciudad || "",
    acteco: initialDTEConfig?.acteco || "",
    resolucion_numero: initialDTEConfig?.resolucion_numero || "",
    resolucion_fecha: initialDTEConfig?.resolucion_fecha || "",
  });

  useEffect(() => {
    setProfileForm({
      full_name: initialProfile?.full_name || "",
      avatar_url: initialProfile?.avatar_url || "",
    });
  }, [initialProfile]);

  useEffect(() => {
    setOrgForm({
      nombre: initialOrganization?.nombre || "",
      rut_empresa: initialOrganization?.rut_empresa ? formatRUT(initialOrganization.rut_empresa) : "",
      giro: initialOrganization?.giro || "",
      direccion: initialOrganization?.direccion || "",
      comuna: initialOrganization?.comuna || "",
      region: initialOrganization?.region || "",
      email: initialOrganization?.email || "",
      telefono: initialOrganization?.telefono || "",
    });
  }, [initialOrganization]);

  useEffect(() => {
    setDteForm({
      id: initialDTEConfig?.id || null,
      rut: initialDTEConfig?.rut ? formatRUT(initialDTEConfig.rut) : "",
      razon_social: initialDTEConfig?.razon_social || "",
      giro: initialDTEConfig?.giro || "",
      direccion: initialDTEConfig?.direccion || "",
      comuna: initialDTEConfig?.comuna || "",
      ciudad: initialDTEConfig?.ciudad || "",
      acteco: initialDTEConfig?.acteco || "",
      resolucion_numero: initialDTEConfig?.resolucion_numero || "",
      resolucion_fecha: initialDTEConfig?.resolucion_fecha || "",
    });
  }, [initialDTEConfig]);

  const handleSaveProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await updateProfile(profileForm);
      if (res.success) {
        toast.success("Perfil profesional sincronizado.", {
          description: "Los datos de identidad han sido actualizados.",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        });
      } else {
        toast.error("Error al actualizar perfil: " + res.error);
      }
    } catch(err) {
      toast.error("Fallo de conexión con el sistema de identidad.");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveOrg = async () => {
    setLoadingOrg(true);
    try {
      const orgDataPayload = {
        ...orgForm,
        rut_empresa: cleanRUT(orgForm.rut_empresa)
      };
      const res = await updateOrganization(organizationId, orgDataPayload);
      if (res.success) {
        toast.success("Datos corporativos sincronizados.", {
          description: "La ficha institucional ha sido actualizada en el sistema.",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        });
      } else {
        toast.error("Sin privilegios de Administrador: " + res.error);
      }
    } catch(err) {
      toast.error("Fallo de conexión. Intente de nuevo.");
    } finally {
      setLoadingOrg(false);
    }
  };

  const handleSaveDTE = async () => {
    setLoadingDTE(true);
    try {
      const dtePayload = {
        ...dteForm,
        rut: cleanRUT(dteForm.rut),
        acteco: parseInt(dteForm.acteco.toString()) || 0,
        resolucion_numero: parseInt(dteForm.resolucion_numero.toString()) || 0,
      };
      const res = await updateDTEConfig(organizationId, dtePayload);
      if (res.success) {
        setStatusModal({
          open: true,
          type: 'success',
          title: 'Configuración Sincronizada',
          description: 'La empresa ha sido habilitada exitosamente como emisor electrónico. Ahora puede proceder a cargar sus folios (CAF).',
          actionLabel: 'Ver Folios',
          onAction: () => {
             document.getElementById('caf-section')?.scrollIntoView({ behavior: 'smooth' });
          }
        });
      } else {
        setStatusModal({
          open: true,
          type: 'error',
          title: 'Fallo en Configuración',
          description: res.error || 'No se pudo actualizar la configuración del emisor.',
        });
      }
    } catch(err: any) {
      setStatusModal({
        open: true,
        type: 'error',
        title: 'Error de Sistema',
        description: 'Hubo un problema al conectar con el servidor de facturación.',
      });
    } finally {
      setLoadingDTE(false);
    }
  };

  const handleUploadCAF = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoadingCAF(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const xmlContent = e.target?.result as string;
        const res = await uploadCAF(organizationId, xmlContent, cafEnv);
        
        if (res.success) {
          setStatusModal({
            open: true,
            type: 'success',
            title: 'Folios Cargados',
            description: res.message || 'El archivo CAF ha sido procesado e inyectado correctamente en el sistema.',
            actionLabel: 'Aceptar',
            onAction: () => window.location.reload()
          });
        } else {
          setStatusModal({
            open: true,
            type: 'error',
            title: 'Error de Procesamiento',
            description: res.error || 'El archivo CAF provisto no es válido o no corresponde a esta empresa.',
          });
        }
        setLoadingCAF(false);
      };
      reader.readAsText(file);
    } catch (err) {
      setStatusModal({
        open: true,
        type: 'error',
        title: 'Error de Lectura',
        description: 'No se pudo leer el archivo XML. Asegúrese de que el formato sea correcto.',
      });
      setLoadingCAF(false);
    }
  };



  return (
    <div className="space-y-6">
      <StatusModal 
        open={statusModal.open}
        onOpenChange={(open) => setStatusModal(prev => ({ ...prev, open }))}
        type={statusModal.type}
        title={statusModal.title}
        description={statusModal.description}
        actionLabel={statusModal.actionLabel}
        onAction={statusModal.onAction}
      />

      <Tabs defaultValue="empresa" className="w-full">
      <TabsList className="bg-muted/10 p-2 h-auto rounded-[2rem] border border-border/50 grid grid-cols-5 max-w-4xl gap-2 mb-10 shadow-inner">
        <TabsTrigger value="empresa" className="py-4 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary gap-2 transition-all">
          <Building2 className="w-4 h-4 opacity-40" /> EMPRESA
        </TabsTrigger>
        <TabsTrigger value="dte" className="py-4 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary gap-2 transition-all">
          <FileText className="w-4 h-4 opacity-40" /> FACTURACIÓN
        </TabsTrigger>
        <TabsTrigger value="perfil" className="py-4 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary gap-2 transition-all">
          <UserCircle className="w-4 h-4 opacity-40" /> MI PERFIL
        </TabsTrigger>
        <TabsTrigger value="equipo" onClick={async () => {
          const invs = await getPendingInvitations(organizationId);
          setPendingInvitations(invs);
        }} className="py-4 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary gap-2 transition-all">
          <Users2 className="w-4 h-4 opacity-40" /> EQUIPO B2B
        </TabsTrigger>
        <TabsTrigger value="auditoria" onClick={async () => {
          setLoadingAudit(true);
          const [logs, actions] = await Promise.all([getAuditLogs({ limit: 50 }), getAuditActions()]);
          setAuditLogs(logs);
          setAuditActions(actions);
          setLoadingAudit(false);
        }} className="py-4 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary gap-2 transition-all">
          <History className="w-4 h-4 opacity-40" /> AUDITORÍA
        </TabsTrigger>
      </TabsList>

      {/* ===== TAB: EMPRESA ===== */}
      <TabsContent value="empresa" className="animate-in fade-in slide-in-from-top-4 duration-500 outline-none">
        <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/10">
          <CardHeader className="bg-muted/5 border-b border-border p-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Información Corporativa</CardTitle>
                <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                  DATOS FISCALES UTILIZADOS EN FACTURAS, F29 Y CONTRATOS LABORALES
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-10">

            {/* DATOS PRINCIPALES */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> IDENTIDAD LEGAL
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-muted/5 border-2 border-border/50 rounded-[2rem]">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">RAZÓN SOCIAL</Label>
                  <PInput
                    value={orgForm.nombre}
                    onChange={(e) => setOrgForm({ ...orgForm, nombre: e.target.value })}
                    placeholder="Ej: Inversiones XYZ SpA"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">RUT DE LA EMPRESA</Label>
                  <PInput
                    value={orgForm.rut_empresa}
                    onChange={(e) => setOrgForm({ ...orgForm, rut_empresa: formatRUT(e.target.value) })}
                    placeholder="76.000.000-K"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-3 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">GIRO COMERCIAL</Label>
                  <PInput
                    value={orgForm.giro}
                    onChange={(e) => setOrgForm({ ...orgForm, giro: e.target.value })}
                    placeholder="Ej: Servicios Integrales de Contabilidad"
                  />
                </div>
              </div>
            </div>

            {/* DIRECCIÓN */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> DOMICILIO COMERCIAL
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-muted/5 border-2 border-border/50 rounded-[2rem]">
                <div className="space-y-3 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">DIRECCIÓN</Label>
                  <PInput
                    value={orgForm.direccion}
                    onChange={(e) => setOrgForm({ ...orgForm, direccion: e.target.value })}
                    placeholder="Av. Ejemplo 1234"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">COMUNA</Label>
                  <PInput
                    value={orgForm.comuna}
                    onChange={(e) => setOrgForm({ ...orgForm, comuna: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">REGIÓN</Label>
                  <PInput
                    value={orgForm.region}
                    onChange={(e) => setOrgForm({ ...orgForm, region: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* CONTACTO */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" /> DATOS DE CONTACTO INSTITUCIONAL
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-muted/5 border-2 border-border/50 rounded-[2rem]">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    <Mail className="w-3 h-3 inline mr-1" /> EMAIL CORPORATIVO
                  </Label>
                  <PInput
                    type="email"
                    value={orgForm.email}
                    onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                    placeholder="contacto@empresa.cl"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    <Phone className="w-3 h-3 inline mr-1" /> TELÉFONO DE CONTACTO
                  </Label>
                  <PInput
                    value={orgForm.telefono}
                    onChange={(e) => setOrgForm({ ...orgForm, telefono: e.target.value })}
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/5 border-t border-border p-10 flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground flex items-center gap-2 font-black uppercase tracking-widest">
              <Shield className="w-4 h-4 text-emerald-600" /> Requiere privilegios de Administrador u Owner.
            </span>
            <Button
              onClick={handleSaveOrg}
              disabled={loadingOrg}
              className="h-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase text-xs tracking-[0.2em] px-10 shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-all gap-3"
            >
              {loadingOrg ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              SINCRONIZAR DATOS
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      {/* ===== TAB: FACTURACIÓN (DTE) ===== */}
      <TabsContent value="dte" className="animate-in fade-in slide-in-from-top-4 duration-500 outline-none">
        <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-amber-500/10">
          <CardHeader className="bg-muted/5 border-b border-border p-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Emisor Electrónico (DTE)</CardTitle>
                <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                  CONFIGURACIÓN TÉCNICA REQUERIDA POR EL SII PARA EMISIÓN DE DOCUMENTOS
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-10">
            
            {/* IDENTIDAD DTE */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" /> CREDENCIALES TRIBUTARIAS
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-muted/5 border-2 border-border/50 rounded-[2rem]">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">RUT EMISOR</Label>
                  <PInput
                    value={dteForm.rut}
                    onChange={(e) => setDteForm({ ...dteForm, rut: formatRUT(e.target.value) })}
                    placeholder="76.000.000-K"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">CÓDIGO ACTECO (ACTIVIDAD)</Label>
                  <PInput
                    type="number"
                    value={dteForm.acteco}
                    onChange={(e) => setDteForm({ ...dteForm, acteco: e.target.value })}
                    placeholder="Ej: 692000"
                  />
                </div>
                <div className="space-y-3 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">RAZÓN SOCIAL (SII)</Label>
                  <PInput
                    value={dteForm.razon_social}
                    onChange={(e) => setDteForm({ ...dteForm, razon_social: e.target.value })}
                    placeholder="Nombre legal completo ante el SII"
                  />
                </div>
              </div>
            </div>

            {/* RESOLUCIÓN */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" /> RESOLUCIÓN SII
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-muted/5 border-2 border-border/50 rounded-[2rem]">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">NÚMERO DE RESOLUCIÓN</Label>
                  <PInput
                    type="number"
                    value={dteForm.resolucion_numero}
                    onChange={(e) => setDteForm({ ...dteForm, resolucion_numero: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">FECHA DE RESOLUCIÓN</Label>
                  <PInput
                    type="date"
                    value={dteForm.resolucion_fecha}
                    onChange={(e) => setDteForm({ ...dteForm, resolucion_fecha: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* DOMICILIO DTE */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> DOMICILIO TRIBUTARIO
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-muted/5 border-2 border-border/50 rounded-[2rem]">
                <div className="space-y-3 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">DIRECCIÓN LEGAL</Label>
                  <PInput
                    value={dteForm.direccion}
                    onChange={(e) => setDteForm({ ...dteForm, direccion: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">COMUNA</Label>
                  <PInput
                    value={dteForm.comuna}
                    onChange={(e) => setDteForm({ ...dteForm, comuna: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">CIUDAD</Label>
                  <PInput
                    value={dteForm.ciudad}
                    onChange={(e) => setDteForm({ ...dteForm, ciudad: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* GESTIÓN DE FOLIOS (CAF) */}
            <div className="space-y-6 pt-10 border-t border-border/50">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <History className="w-3.5 h-3.5" /> FOLIOS AUTORIZADOS (CAF)
                  </p>
                  <p className="text-[9px] text-muted-foreground/60 italic font-bold uppercase tracking-wider">
                    CARGUE LOS ARCHIVOS .XML OBTENIDOS DESDE EL SII (TIMBRAJE ELECTRÓNICO)
                  </p>
                </div>
                
                <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-[2rem] border-2 border-border/50 shadow-inner">
                  <div className="space-y-1 pr-4 border-r border-border/50">
                     <Label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1">AMBIENTE</Label>
                     <Select value={cafEnv} onValueChange={(val: any) => val && setCafEnv(val)}>
                        <SelectTrigger className="h-10 w-32 rounded-xl border-none bg-white font-black uppercase text-[10px] tracking-widest shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border rounded-xl">
                          <SelectItem value="certification" className="font-black text-[10px] uppercase">Certificación</SelectItem>
                          <SelectItem value="production" className="font-black text-[10px] uppercase text-emerald-600">Producción</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  
                  <div className="relative">
                    <input 
                      type="file" 
                      id="caf-upload" 
                      className="hidden" 
                      accept=".xml" 
                      onChange={handleUploadCAF}
                      disabled={loadingCAF}
                    />
                    <Button
                      onClick={() => document.getElementById('caf-upload')?.click()}
                      disabled={loadingCAF}
                      variant="outline"
                      className="h-14 rounded-2xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-black uppercase text-xs tracking-[0.2em] px-8 shadow-lg hover:scale-[1.03] transition-all gap-3"
                    >
                      {loadingCAF ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                      CARGAR NUEVO CAF
                    </Button>
                  </div>
                </div>
              </div>

              {/* LISTA DE CAFS */}
              <div className="bg-muted/5 border-2 border-border/50 rounded-[2rem] overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 border-border">
                      <TableHead className="text-foreground font-black uppercase text-[9px] tracking-widest px-8 py-4">Tipo DTE</TableHead>
                      <TableHead className="text-foreground font-black uppercase text-[9px] tracking-widest px-8 py-4">Rango de Folios</TableHead>
                      <TableHead className="text-foreground font-black uppercase text-[9px] tracking-widest px-8 py-4">Último Usado</TableHead>
                      <TableHead className="text-foreground font-black uppercase text-[9px] tracking-widest px-8 py-4">Ambiente</TableHead>
                      <TableHead className="text-right text-foreground font-black uppercase text-[9px] tracking-widest px-8 py-4">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cafRecords.length > 0 ? (
                      cafRecords.map((caf) => (
                        <TableRow key={caf.id} className="border-border group hover:bg-white/40 transition-colors">
                          <TableCell className="px-8 py-4">
                            <span className="font-black text-xs text-foreground uppercase tracking-tight">
                              {caf.tipo_dte === 33 ? 'Factura Electrónica' : 
                               caf.tipo_dte === 39 ? 'Boleta Electrónica' : 
                               caf.tipo_dte === 61 ? 'Nota de Crédito' : 
                               `Tipo ${caf.tipo_dte}`}
                            </span>
                          </TableCell>
                          <TableCell className="px-8 py-4">
                            <span className="font-mono text-xs font-bold text-muted-foreground">
                              {caf.range_start} — {caf.range_end}
                            </span>
                          </TableCell>
                          <TableCell className="px-8 py-4">
                            <span className="font-mono text-xs font-black text-primary">
                              #{caf.last_used_folio}
                            </span>
                          </TableCell>
                          <TableCell className="px-8 py-4">
                            <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg border ${
                              caf.environment === 'production' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                              {caf.environment === 'production' ? 'PROD' : 'CERT'}
                            </span>
                          </TableCell>
                          <TableCell className="px-8 py-4 text-right">
                            {caf.is_active ? (
                              <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 shadow-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Activo
                              </span>
                            ) : (
                              <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">
                                Agotado / Inactivo
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center py-10">
                          <div className="flex flex-col items-center gap-2 opacity-30">
                            <FileUp className="w-8 h-8" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">No se han cargado folios autorizados</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* AVISO TÉCNICO */}
              <div className="p-6 bg-amber-500/[0.03] border-2 border-amber-500/10 rounded-[2rem] flex gap-4 items-start">
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-amber-900 tracking-tight">Importante: Gestión de Folios</p>
                  <p className="text-[9px] text-amber-800/70 font-bold leading-relaxed">
                    Al cargar un nuevo CAF para un mismo tipo de documento y ambiente, el sistema desactivará automáticamente el anterior. 
                    Asegúrese de cargar el archivo XML original descargado desde el sitio del SII. No modifique el contenido del archivo.
                  </p>
                </div>
              </div>
            </div>

          </CardContent>
          <CardFooter className="bg-muted/5 border-t border-border p-10 flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground flex items-center gap-2 font-black uppercase tracking-widest">
                <Shield className="w-4 h-4 text-amber-600" /> Configuración crítica de facturación.
              </span>
              <p className="text-[9px] text-muted-foreground/60 italic font-bold">Estos datos aparecerán en el PDF y XML de cada DTE emitido.</p>
            </div>
            <Button
              onClick={handleSaveDTE}
              disabled={loadingDTE}
              className="h-14 rounded-2xl bg-amber-600 text-white font-black uppercase text-xs tracking-[0.2em] px-10 shadow-xl shadow-amber-600/20 hover:scale-[1.03] active:scale-95 transition-all gap-3 hover:bg-amber-700"
            >
              {loadingDTE ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              GUARDAR CONFIGURACIÓN DTE
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      {/* ===== TAB: PERFIL ===== */}
      <TabsContent value="perfil" className="animate-in fade-in slide-in-from-top-4 duration-500 outline-none">
        <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-blue-500/10 max-w-3xl">
          <CardHeader className="bg-muted/5 border-b border-border p-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                <UserCog className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Perfil Profesional</CardTitle>
                <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                  CUENTA: <span className="text-primary">{userEmail}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            {/* AVATAR */}
            <div className="flex items-center gap-8 p-8 bg-muted/5 border-2 border-border/50 rounded-[2rem]">
              <div className="w-28 h-28 rounded-3xl bg-primary/10 flex items-center justify-center text-5xl font-black text-primary uppercase overflow-hidden shadow-xl border-2 border-primary/20 shrink-0">
                {profileForm.avatar_url ? (
                  <img src={profileForm.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{profileForm.full_name?.charAt(0) || userEmail?.charAt(0) || "?"}</span>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">URL DE FOTO DE PERFIL</Label>
                <PInput
                  placeholder="https://su-foto.com/perfil.jpg"
                  value={profileForm.avatar_url}
                  onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })}
                />
                <p className="text-[10px] text-muted-foreground italic ml-1">Enlace directo a imagen (JPG, PNG, WebP). Visible en documentos laborales.</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">NOMBRE COMPLETO DEL PROFESIONAL</Label>
              <PInput
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                placeholder="Ej: Juan Pérez Contadores"
                className="uppercase"
              />
              <p className="text-[10px] text-muted-foreground italic ml-1">Nombre que aparecerá en liquidaciones, contratos y documentos firmados.</p>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/5 border-t border-border p-10 flex justify-end">
            <Button
              onClick={handleSaveProfile}
              disabled={loadingProfile}
              variant="outline"
              className="h-14 rounded-2xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-black uppercase text-xs tracking-[0.2em] px-10 shadow-lg hover:scale-[1.03] active:scale-95 transition-all gap-3"
            >
              {loadingProfile ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              ACTUALIZAR PERFIL
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      {/* ===== TAB: EQUIPO B2B ===== */}
      <TabsContent value="equipo" className="animate-in fade-in slide-in-from-top-4 duration-500 outline-none">
        <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-purple-500/10">
          <CardHeader className="bg-muted/5 border-b border-border p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Equipo B2B — Jerarquía</CardTitle>
              <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                USUARIOS CON ACCESO ACTIVO Y SU ROL DENTRO DEL SISTEMA RLS
              </CardDescription>
            </div>
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger 
                render={
                  <Button
                    variant="outline"
                    className="h-12 px-8 rounded-2xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-black uppercase text-[10px] tracking-widest transition-all hover:scale-105"
                  >
                    <Plus className="w-4 h-4 mr-2" /> INVITAR MIEMBRO
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-[425px] bg-card border-border rounded-[2rem] shadow-2xl p-8">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-xl font-black uppercase tracking-tight">Invitar al Equipo B2B</DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                    LOS MIEMBROS RECIBIRÁN ACCESO INSTANTÁNEO BAJO EL PROTOCOLO RLS.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">EMAIL DEL PROFESIONAL</Label>
                    <PInput 
                      placeholder="ejemplo@contapyme.cl"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ROL ASIGNADO</Label>
                    <Select 
                      value={inviteForm.role} 
                      onValueChange={(val) => val && setInviteForm({ ...inviteForm, role: val })}
                    >
                      <SelectTrigger className="h-14 rounded-2xl border-2 border-border/50 font-bold uppercase text-[10px] tracking-widest">
                        <SelectValue placeholder="Seleccionar Rol" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border rounded-xl shadow-xl">
                        <SelectItem value="viewer" className="font-black text-[10px] uppercase">Viewer (Solo Lectura)</SelectItem>
                        <SelectItem value="accountant" className="font-black text-[10px] uppercase">Accountant (Operativo)</SelectItem>
                        <SelectItem value="admin" className="font-black text-[10px] uppercase text-primary">Admin (Gestión Total)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="mt-8 flex gap-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsInviteOpen(false)}
                    className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                  >
                    CANCELAR
                  </Button>
                  <Button 
                    onClick={async () => {
                      if (!inviteForm.email) return toast.error("Ingresa un email");
                      setLoadingInvite(true);
                      const res = await inviteMember(organizationId, inviteForm.email, inviteForm.role);
                      setLoadingInvite(false);
                      if (res.success) {
                        toast.success("Invitación enviada correctamente");
                        setInviteForm({ email: "", role: "viewer" });
                        setIsInviteOpen(false);
                        // Refrescar invitaciones pendientes
                        const pending = await getPendingInvitations(organizationId);
                        setPendingInvitations(pending);
                      } else {
                        toast.error(res.error || "Error al enviar invitación");
                      }
                    }}
                    disabled={loadingInvite}
                    className="flex-2 h-14 bg-primary text-primary-foreground rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 gap-3"
                  >
                    {loadingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    ENVIAR INVITACIÓN
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-border">
                    <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Usuario Profesional</TableHead>
                    <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">ID Global (Sistema)</TableHead>
                    <TableHead className="text-right text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Nivel de Acceso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/50">
                  {initialMembers && initialMembers.length > 0 ? (
                    initialMembers.map((m: any) => (
                      <TableRow key={m.id} className="border-border hover:bg-purple-600/[0.01] transition-colors group">
                        <TableCell className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-sm font-black text-primary border border-primary/10 shadow-sm shrink-0">
                              {m.profiles?.full_name?.charAt(0) || "?"}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "font-black text-foreground uppercase text-xs tracking-tight transition-colors",
                                  m.user_id === userId ? "text-primary" : "group-hover:text-primary"
                                )}>
                                  {m.profiles?.full_name || (m.user_id === userId ? userEmail : 'Usuario sin nombre')}
                                </span>
                                {m.user_id === userId && (
                                  <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase rounded-md border border-primary/10">Tú</span>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground/60 font-bold italic mt-0.5">
                                {m.profiles?.full_name ? "Acceso Activo" : (m.user_id === userId ? "Favor completar perfil" : "Nombre no configurado")}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-10 py-6 font-mono text-xs text-muted-foreground/50 font-bold">
                          {m.profiles?.id?.substring(0, 20)}...
                        </TableCell>
                        <TableCell className="px-10 py-6 text-right">
                          <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] shadow-sm border
                            ${m.role === 'owner' 
                              ? 'bg-amber-50 text-amber-700 border-amber-100' 
                              : m.role === 'admin' 
                              ? 'bg-blue-50 text-blue-700 border-blue-100' 
                              : 'bg-muted text-muted-foreground border-border'
                            }`}>
                            {m.role}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-40 text-center text-muted-foreground font-bold italic">
                        No hay miembros registrados en esta organización.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* INVITACIONES PENDIENTES */}
            {pendingInvitations && pendingInvitations.length > 0 && (
              <div className="mt-10 border-t border-border/50 pt-10 pb-10">
                <div className="px-10 mb-6 flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                    <Send className="w-3 h-3" /> INVITACIONES PENDIENTES
                  </h4>
                  <span className="text-[9px] font-black text-primary/40 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">EXPIRES IN 7 DAYS</span>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableBody>
                      {pendingInvitations.map((inv: any) => (
                        <TableRow key={inv.id} className="border-border bg-muted/5 group">
                          <TableCell className="px-10 py-5">
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground text-xs">{inv.email}</span>
                              <span className="text-[9px] text-muted-foreground/60 uppercase font-bold mt-0.5">Enviada el {new Date(inv.invited_at).toLocaleDateString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex px-3 py-1 bg-muted rounded-lg text-[9px] font-black uppercase tracking-widest text-muted-foreground border border-border/50">
                              {inv.role}
                            </span>
                          </TableCell>
                          <TableCell className="text-right px-10">
                             <Button 
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                              onClick={async () => {
                                const res = await deleteInvitation(inv.id);
                                if (res.success) {
                                  toast.success("Invitación cancelada");
                                  setPendingInvitations(pendingInvitations.filter(i => i.id !== inv.id));
                                }
                              }}
                             >
                               <Trash2 className="w-4 h-4" />
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ===== TAB: AUDITORÍA ===== */}
      <TabsContent value="auditoria" className="animate-in fade-in slide-in-from-top-4 duration-500 outline-none">
        <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-emerald-500/10">
          <CardHeader className="bg-muted/5 border-b border-border p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Registro de Auditoría (Audit Log)</CardTitle>
              <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                TRAZABILIDAD DE ACCIONES CRÍTICAS, MODIFICACIONES Y SEGURIDAD B2B
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingAudit ? (
              <div className="h-64 flex items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Consultando Caja Negra...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 border-border">
                      <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6 w-[250px]">Fecha / Hora</TableHead>
                      <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Usuario Profesional</TableHead>
                      <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Acción Ejecutada</TableHead>
                      <TableHead className="text-right text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Detalles Técnicos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/50">
                    {auditLogs && auditLogs.length > 0 ? (
                      auditLogs.map((log: any) => (
                        <TableRow key={log.id} className="border-border hover:bg-emerald-600/[0.01] transition-colors group">
                          <TableCell className="px-10 py-6">
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-[11px] font-black text-foreground">
                                {new Date(log.created_at).toLocaleDateString()}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-bold italic opacity-60">
                                {new Date(log.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-10 py-6">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-muted/20 rounded-xl border border-border/50">
                                <Fingerprint className="w-4 h-4 text-primary opacity-40" />
                              </div>
                              <span className="font-black text-foreground uppercase text-xs tracking-tight">
                                {log.profiles?.full_name || 'Sistema Contapyme'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-10 py-6">
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-muted/10 border border-border/50 rounded-xl text-[10px] font-black uppercase tracking-tight text-foreground shadow-sm">
                              <Activity className="w-3 h-3 text-emerald-500" /> {log.action.replace(/_/g, ' ')}
                            </span>
                          </TableCell>
                          <TableCell className="px-10 py-6 text-right">
                             <div className="flex flex-col items-end gap-1">
                               <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none">
                                {log.entity_type || 'GLOBAL'}
                               </span>
                               <span className="text-[9px] font-mono text-muted-foreground/40 leading-none">
                                {log.ip_address || 'Internal RPC'}
                               </span>
                             </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-40 text-center text-muted-foreground font-bold italic">
                          No hay registros de actividad en la caja negra corporativa.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>
    </div>
  );
}
