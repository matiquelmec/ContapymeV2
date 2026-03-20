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
  CheckCircle2, Mail, Phone, MapPin, FileText, Globe, UserCog 
} from "lucide-react";
import { toast } from "sonner";
import { updateProfile, updateOrganization } from "@/actions/settings";
import { formatRUT, cleanRUT } from "@/lib/utils/rut";

export default function SettingsPageClient({ 
  organizationId, 
  userEmail, 
  initialProfile, 
  initialOrganization, 
  initialMembers 
}: {
  organizationId: string;
  userEmail: string;
  initialProfile: any;
  initialOrganization: any;
  initialMembers: any[];
}) {
  const [loadingOrg, setLoadingOrg] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

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

  // ―― HELPER: input premium ――
  const PInput = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <Input
      {...props}
      className={`h-14 bg-white border-border rounded-2xl font-black text-sm focus:ring-primary/20 shadow-sm px-6 ${props.className || ''}`}
    />
  );

  return (
    <Tabs defaultValue="empresa" className="w-full">
      <TabsList className="bg-muted/10 p-2 h-auto rounded-[2rem] border border-border/50 grid grid-cols-3 max-w-2xl gap-2 mb-10 shadow-inner">
        <TabsTrigger value="empresa" className="py-4 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary gap-2 transition-all">
          <Building2 className="w-4 h-4 opacity-40" /> EMPRESA
        </TabsTrigger>
        <TabsTrigger value="perfil" className="py-4 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary gap-2 transition-all">
          <UserCircle className="w-4 h-4 opacity-40" /> MI PERFIL
        </TabsTrigger>
        <TabsTrigger value="equipo" className="py-4 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary gap-2 transition-all">
          <Users2 className="w-4 h-4 opacity-40" /> EQUIPO B2B
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
            <Button
              variant="outline"
              disabled
              className="h-12 px-8 rounded-2xl border-border/50 opacity-40 cursor-not-allowed font-black uppercase text-[10px] tracking-widest"
            >
              INVITAR MIEMBRO (PRÓXIMAMENTE)
            </Button>
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
                              <span className="font-black text-foreground uppercase text-xs tracking-tight group-hover:text-primary transition-colors">
                                {m.profiles?.full_name || 'Usuario sin nombre'}
                              </span>
                              <span className="text-[10px] text-muted-foreground/60 font-bold italic mt-0.5">Acceso Activo</span>
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
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
