'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Briefcase, 
  Plus, 
  Search, 
  MapPin, 
  Building2, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  Loader2, 
  Share2,
  Check,
  X,
  Eye,
  BadgeCheck,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { createJobAction, updateJobAction, deleteJobAction, validateJobCompliance, type JobPosting } from '@/actions/jobs'
import { uploadNewsImageAction } from '@/actions/news'
import { compressImage } from '@/lib/media/image-compressor'
import { JobSocialCardGenerator } from '@/components/jobs/job-social-card-generator'

const COMUNAS = [
  'Punta Arenas',
  'Puerto Natales',
  'Porvenir',
  'Puerto Williams',
  'Cabo de Hornos',
  'Torres del Paine',
  'Primavera',
  'San Gregorio',
  'Timaukel',
  'Laguna Blanca',
  'Faena / Remoto'
]

const SECTORES = [
  'Salmonicultura y Pesca',
  'Energía y Combustibles',
  'Turismo y Hotelería',
  'Construcción y Minería',
  'Comercio y Retail',
  'Transporte y Logística',
  'Administración y Finanzas',
  'Salud y Educación',
  'Tecnología y Servicios',
  'Otros'
]

const TURNOS = [
  'Jornada Completa (40 Horas)',
  'Turno 7x7 Faena',
  'Turno 14x14 Faena',
  'Part-Time 30 Horas',
  'Turnos Rotativos',
  'Lunes a Viernes',
  'Freelance / Honorarios'
]

interface DashboardJobsClientProps {
  initialJobs: JobPosting[]
  companyName?: string
  companyRut?: string
}

export function DashboardJobsClient({ initialJobs, companyName, companyRut }: DashboardJobsClientProps) {
  const router = useRouter()
  const [jobs, setJobs] = useState<JobPosting[]>(initialJobs)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Form State
  const [title, setTitle] = useState('')
  const [empresa, setEmpresa] = useState(companyName || '')
  const [rut, setRut] = useState(companyRut || '')
  const [logoUrl, setLogoUrl] = useState('')
  const [isLogoUploading, setIsLogoUploading] = useState(false)
  const [location, setLocation] = useState('Punta Arenas')
  const [sector, setSector] = useState('Comercio y Retail')
  const [jobType, setJobType] = useState('Presencial')
  const [workShift, setWorkShift] = useState('Jornada Completa (40 Horas)')
  const [salaryRaw, setSalaryRaw] = useState('')
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState<string[]>(['Experiencia previa comprobable', 'Residencia en la región'])
  const [newReq, setNewReq] = useState('')
  const [benefits, setBenefits] = useState<string[]>(['Contrato bajo Ley 40 Horas', 'Seguro complementario de salud'])
  const [newBen, setNewBen] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactWhatsapp, setContactWhatsapp] = useState('+569 ')
  const [applicationUrl, setApplicationUrl] = useState('')

  // Subir logotipo con compresión WebP
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, sube únicamente archivos de imagen (.jpg, .png, .webp, .svg)')
      return
    }

    setIsLogoUploading(true)
    const toastId = toast.loading('Optimizando logotipo de empresa...')

    try {
      const { file: compressedFile, ratio } = await compressImage(file, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.9,
        format: 'image/webp',
      })

      const uploadData = new FormData()
      uploadData.append('file', compressedFile)

      const res = await uploadNewsImageAction(uploadData)
      if (res.success && res.url) {
        setLogoUrl(res.url)
        toast.success(`Logotipo optimizado (${ratio} ahorro) y adjuntado. 🚀`, { id: toastId })
      } else {
        toast.error(res.error || 'Error al subir el logo.', { id: toastId })
      }
    } catch (err: any) {
      toast.error('Error al procesar el logotipo: ' + err.message, { id: toastId })
    } finally {
      setIsLogoUploading(false)
    }
  }

  // Validación legal en vivo
  const [complianceViolations, setComplianceViolations] = useState<string[]>([])
  const [isCheckingCompliance, setIsCheckingCompliance] = useState(false)

  // Job para compartir modal
  const [activeJobForSocial, setActiveJobForSocial] = useState<JobPosting | null>(null)

  const handleTextChange = async (newDesc: string) => {
    setDescription(newDesc)
    if (newDesc.trim().length > 10) {
      setIsCheckingCompliance(true)
      const res = await validateJobCompliance(`${title} ${newDesc} ${requirements.join(' ')}`)
      setComplianceViolations(res.violations)
      setIsCheckingCompliance(false)
    } else {
      setComplianceViolations([])
    }
  }

  const handleAddRequirement = () => {
    if (newReq.trim()) {
      setRequirements([...requirements, newReq.trim()])
      setNewReq('')
    }
  }

  const handleRemoveRequirement = (idx: number) => {
    setRequirements(requirements.filter((_, i) => i !== idx))
  }

  const handleAddBenefit = () => {
    if (newBen.trim()) {
      setBenefits([...benefits, newBen.trim()])
      setNewBen('')
    }
  }

  const handleRemoveBenefit = (idx: number) => {
    setBenefits(benefits.filter((_, i) => i !== idx))
  }

  const handleSubmitJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !empresa.trim() || !description.trim()) {
      toast.error('Por favor completa los campos obligatorios.')
      return
    }

    if (complianceViolations.length > 0) {
      toast.error('Corrige las observaciones legales del Art. 2° DT antes de publicar.')
      return
    }

    startTransition(async () => {
      const res = await createJobAction({
        title,
        company_name: empresa,
        company_rut: rut,
        company_logo_url: logoUrl || undefined,
        location,
        sector,
        job_type: jobType,
        work_shift: workShift,
        salary_raw: salaryRaw || undefined,
        description,
        requirements,
        benefits,
        contact_email: contactEmail || undefined,
        contact_whatsapp: contactWhatsapp || undefined,
        application_url: applicationUrl || undefined,
      })

      if (res.success && res.data) {
        toast.success('¡Oferta laboral publicada con éxito en ContaEmpleos Magallanes! 🚀')
        setJobs([res.data, ...jobs])
        setIsFormOpen(false)
        router.refresh()
      } else {
        toast.error(res.error || 'Error al publicar oferta.')
      }
    })
  }

  const handleDeleteJob = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta vacante?')) return
    const res = await deleteJobAction(id)
    if (res.success) {
      toast.success('Vacante eliminada.')
      setJobs(jobs.filter((j) => j.id !== id))
      router.refresh()
    } else {
      toast.error(res.error || 'Error al eliminar.')
    }
  }

  const handleToggleFilled = async (job: JobPosting) => {
    const newStatus = job.status === 'active' ? 'filled' : 'active'
    const res = await updateJobAction(job.id, { status: newStatus })
    if (res.success) {
      toast.success(newStatus === 'filled' ? 'Vacante marcada como cubierta.' : 'Vacante reactivada.')
      setJobs(jobs.map((j) => (j.id === job.id ? { ...j, status: newStatus } : j)))
      router.refresh()
    }
  }

  const filteredJobs = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeCount = jobs.filter((j) => j.status === 'active').length
  const filledCount = jobs.filter((j) => j.status === 'filled').length

  return (
    <div className="space-y-6">
      {/* 💡 GUÍA EDUCATIVA Y BUENAS PRÁCTICAS REGIONALES */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-primary/10 border border-emerald-500/20 space-y-3">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black text-xs uppercase tracking-wider">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          <span>Guía Rápida de Empleabilidad en Magallanes & Faenas</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
          <div className="p-3 rounded-2xl bg-white/80 border border-emerald-500/10 space-y-1 shadow-2xs">
            <strong className="text-foreground font-black text-[11px] uppercase tracking-wide block">
              1. Sueldo Líquido Austral
            </strong>
            <p className="text-[11px] leading-relaxed">
              En Magallanes, las ofertas con remuneración líquida explícita reciben hasta un 40% más de candidatos calificados.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-white/80 border border-emerald-500/10 space-y-1 shadow-2xs">
            <strong className="text-foreground font-black text-[11px] uppercase tracking-wide block">
              2. Blindaje Legal Art. 2° DT
            </strong>
            <p className="text-[11px] leading-relaxed">
              El sistema audita automáticamente tu texto para evitar multas de la DT por límites de edad, fotos o certificados DICOM.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-white/80 border border-emerald-500/10 space-y-1 shadow-2xs">
            <strong className="text-foreground font-black text-[11px] uppercase tracking-wide block">
              3. Banners IA para Instagram
            </strong>
            <p className="text-[11px] leading-relaxed">
              Descarga anuncios 1:1 y 9:16 con tu logo y el link copiado al portapapeles para el Sticker de Enlace de Instagram.
            </p>
          </div>
        </div>
      </div>

      {/* 📊 RESUMEN EJECUTIVO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-3xl border-border/60 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground block">
                Vacantes Publicadas
              </span>
              <span className="text-2xl sm:text-3xl font-black text-foreground">{jobs.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <Briefcase className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/60 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 block">
                Vacantes Activas (En Difusión)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600">{activeCount}</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/60 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground block">
                Procesos Cubiertos / Cerrados
              </span>
              <span className="text-2xl sm:text-3xl font-black text-muted-foreground">{filledCount}</span>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-100 text-zinc-600">
              <BadgeCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🔍 BARRA DE BÚSQUEDA Y BOTÓN NUEVA OFERTA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-3xl bg-white border border-border/60 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar en mis vacantes por cargo o comuna..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-11 rounded-2xl bg-zinc-50 border-zinc-200 text-xs font-medium"
          />
        </div>
        <Link href="/publicar-empleo">
          <Button
            className="rounded-2xl h-11 px-5 text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-white gap-2 shadow-md shadow-primary/20 shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Publicar Oferta Laboral</span>
          </Button>
        </Link>
      </div>
      {/* 💼 PUENTE HIRE-TO-CONTRACT (CONVERSIÓN AL SOFTWARE ERP) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-zinc-900 border border-emerald-500/30 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
              Módulo de Remuneraciones & Legal DT
            </span>
            <h4 className="text-sm font-black uppercase tracking-tight text-white">
              ¿Ya seleccionaste a tu nuevo trabajador?
            </h4>
            <p className="text-xs text-zinc-300 font-medium leading-relaxed max-w-xl">
              Ingresa su ficha laboral, genera su <strong>Contrato de Trabajo (.docx/PDF)</strong> conforme al Código del Trabajo y activa sus liquidaciones mensuales automáticas.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/payroll/contracts"
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider px-6 h-12 shadow-lg shadow-emerald-900/30 shrink-0 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span>Registrar y Generar Contrato ➔</span>
        </Link>
      </div>

      {/* 📋 LISTADO DE VACANTES */}
      {filteredJobs.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-border/60 space-y-4">
          <div className="p-4 rounded-full bg-primary/10 text-primary inline-block">
            <Briefcase className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black uppercase tracking-tight text-foreground">
              No tienes ofertas laborales registradas
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Publica tu primera vacante en ContaEmpleos Magallanes y genera automáticamente kits publicitarios para redes sociales con tu logo y colores.
            </p>
          </div>
          <Link href="/publicar-empleo">
            <Button
              className="rounded-2xl text-xs font-black uppercase tracking-wider gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Publicar Primera Oferta
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="p-5 rounded-3xl bg-white border border-border/60 shadow-sm hover:border-primary/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant={job.status === 'active' ? 'default' : 'secondary'}
                    className={`rounded-lg text-[9px] font-black uppercase tracking-wider ${
                      job.status === 'active' ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    {job.status === 'active' ? 'Activa' : 'Cubierta'}
                  </Badge>
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" /> {job.location}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {job.work_shift}
                  </span>
                </div>
                <h4 className="text-base font-black text-foreground uppercase tracking-tight truncate">
                  {job.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="font-bold text-zinc-900 flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> {job.company_name}
                  </span>
                  {job.salary_raw && (
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> {job.salary_raw}
                    </span>
                  )}
                </div>
              </div>

              {/* ACCIONES */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <JobSocialCardGenerator job={job} />

                <Link
                  href={`/empleos/${job.slug}`}
                  target="_blank"
                  className="inline-flex items-center justify-center rounded-xl h-9 px-3 text-xs font-black uppercase tracking-wider border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 shadow-2xs gap-1.5 transition-all"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Ver en Portal</span>
                </Link>

                <Link
                  href="/dashboard/payroll/contracts"
                  className="inline-flex items-center justify-center rounded-xl h-9 px-3 text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-1.5 transition-all"
                  title="Generar Contrato de Trabajo en el módulo de Nómina"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Generar Contrato ➔</span>
                </Link>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleFilled(job)}
                  className="rounded-xl h-9 px-3 text-[10px] font-black uppercase tracking-wider border-zinc-200 hover:bg-zinc-100 cursor-pointer"
                >
                  {job.status === 'active' ? 'Marcar Cubierta' : 'Reactivar'}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteJob(job.id)}
                  className="rounded-xl h-9 w-9 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                  title="Eliminar vacante"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 📝 MODAL: FORMULARIO CREAR OFERTA LABORAL CON AUDITORÍA LEGAL */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl rounded-3xl bg-white p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto box-border">
          <DialogHeader className="text-left space-y-1 pr-6">
            <div className="flex items-center gap-1.5 text-primary text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" />
              <span>Publicación de Oferta Laboral Auditada</span>
            </div>
            <DialogTitle className="text-lg sm:text-xl font-black uppercase tracking-tight text-foreground">
              Nueva Vacante en Magallanes
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tu aviso será validado algorítmicamente bajo el Art. 2° del Código del Trabajo antes de publicarse en ContaEmpleos PUQ.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitJob} className="space-y-4">
            {/* Cargo y Empresa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Título del Cargo *
                </Label>
                <Input
                  required
                  placeholder="Ej. Mecánico de Faena, Contador Auditor, Jefe de Turno"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl h-10 text-xs font-medium"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Nombre de la Empresa *
                </Label>
                <Input
                  required
                  placeholder="Ej. Recasur, Australis, Empresa SpA"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  className="rounded-xl h-10 text-xs font-medium"
                />
              </div>
            </div>

            {/* Logotipo de la Empresa con Compresión WebP */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Logotipo de la Empresa (Opcional)
              </Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-200 overflow-hidden relative flex items-center justify-center shrink-0 shadow-2xs">
                  {logoUrl ? (
                    <>
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1.5" />
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white rounded-full p-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </>
                  ) : (
                    <Building2 className="h-6 w-6 text-zinc-400" />
                  )}
                </div>

                <div className="space-y-1.5 flex-1 w-full">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-foreground font-black text-xs px-3.5 h-8 shadow-2xs transition-all">
                      {isLogoUploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      ) : (
                        <Upload className="h-3.5 w-3.5 text-primary" />
                      )}
                      <span>{isLogoUploading ? 'Optimizando WebP...' : 'Subir Logotipo desde el Dispositivo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={isLogoUploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="relative">
                    <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                    <Input
                      placeholder="O pega una URL: https://ejemplo.com/logo.png"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="pl-8 h-8 text-xs rounded-xl bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Comuna, Sector y Turno */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Comuna *
                </Label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-10 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-bold px-3"
                >
                  {COMUNAS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Sector *
                </Label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full h-10 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-bold px-3"
                >
                  {SECTORES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Jornada / Turno *
                </Label>
                <select
                  value={workShift}
                  onChange={(e) => setWorkShift(e.target.value)}
                  className="w-full h-10 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-bold px-3"
                >
                  {TURNOS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sueldo Líquido Aproximado */}
            <div className="space-y-1">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Remuneración Estimada (Sueldo Líquido sugerido)
              </Label>
              <Input
                placeholder="Ej. $1.200.000 - $1.400.000 líquido / A convenir"
                value={salaryRaw}
                onChange={(e) => setSalaryRaw(e.target.value)}
                className="rounded-xl h-10 text-xs font-medium"
              />
            </div>

            {/* Descripción del Cargo con Validación en Vivo */}
            <div className="space-y-1">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Descripción de Funciones *
              </Label>
              <Textarea
                required
                rows={4}
                placeholder="Describe las principales responsabilidades del cargo..."
                value={description}
                onChange={(e) => handleTextChange(e.target.value)}
                className="rounded-xl text-xs font-medium"
              />
            </div>

            {/* ALERTA LEGAL EN VIVO SI HAY INFRACCIÓN */}
            {complianceViolations.length > 0 && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-900">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <strong className="font-bold">Observación Legal (Art. 2° Código del Trabajo):</strong>
                  <p className="text-[11px] text-rose-800">
                    Se detectaron requisitos potencialmente discriminatorios: {complianceViolations.join(', ')}. Por favor reformula el texto para cumplir la normativa laboral.
                  </p>
                </div>
              </div>
            )}

            {/* Requisitos Dinámicos */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Requisitos Clave
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ej. Licencia clase B, Manejo de Excel..."
                  value={newReq}
                  onChange={(e) => setNewReq(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddRequirement(); } }}
                  className="rounded-xl h-9 text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddRequirement}
                  className="rounded-xl h-9 text-xs font-bold shrink-0 cursor-pointer"
                >
                  Agregar
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {requirements.map((req, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[11px] font-bold bg-zinc-100 px-2.5 py-1 rounded-lg text-zinc-800"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span>{req}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement(idx)}
                      className="text-zinc-400 hover:text-rose-600 ml-1 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Canales de Postulación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Email de Recepción de CV
                </Label>
                <Input
                  type="email"
                  placeholder="rrhh@empresa.cl"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="rounded-xl h-10 text-xs font-medium"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  WhatsApp Directo de Selección
                </Label>
                <Input
                  placeholder="+569 1234 5678"
                  value={contactWhatsapp}
                  onChange={(e) => setContactWhatsapp(e.target.value)}
                  className="rounded-xl h-10 text-xs font-medium"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                className="rounded-xl h-10 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending || complianceViolations.length > 0}
                className="rounded-xl h-10 text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-white gap-2 cursor-pointer shadow-md shadow-primary/20"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>Publicar Vacante en Magallanes</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
