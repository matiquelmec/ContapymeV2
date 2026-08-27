'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Briefcase, 
  Search, 
  MapPin, 
  Building2, 
  DollarSign, 
  Clock, 
  Trash2, 
  Eye, 
  ShieldCheck, 
  Sparkles,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { updateJobAction, deleteJobAction, type JobPosting } from '@/actions/jobs'
import { JobSocialCardGenerator } from '@/components/jobs/job-social-card-generator'

interface AdminJobsClientProps {
  initialJobs: JobPosting[]
}

export function AdminJobsClient({ initialJobs }: AdminJobsClientProps) {
  const router = useRouter()
  const [jobs, setJobs] = useState<JobPosting[]>(initialJobs)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.sector.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || j.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta vacante de la plataforma?')) return
    const res = await deleteJobAction(id)
    if (res.success) {
      toast.success('Vacante eliminada de la base de datos.')
      setJobs(jobs.filter((j) => j.id !== id))
      router.refresh()
    } else {
      toast.error(res.error || 'Error al eliminar.')
    }
  }

  const handleToggleStatus = async (job: JobPosting) => {
    const nextStatus = job.status === 'active' ? 'filled' : 'active'
    const res = await updateJobAction(job.id, { status: nextStatus })
    if (res.success) {
      toast.success(`Estado actualizado a ${nextStatus}.`)
      setJobs(jobs.map((j) => (j.id === job.id ? { ...j, status: nextStatus } : j)))
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Buscar por cargo, empresa o comuna..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {['ALL', 'active', 'filled', 'expired'].map((st) => (
            <Button
              key={st}
              size="sm"
              variant={statusFilter === st ? 'default' : 'outline'}
              onClick={() => setStatusFilter(st)}
              className="rounded-xl h-9 px-3 text-[10px] font-black uppercase tracking-wider cursor-pointer"
            >
              {st === 'ALL' ? 'Todas' : st === 'active' ? 'Activas' : st === 'filled' ? 'Cubiertas' : 'Expiradas'}
            </Button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100">
        {filteredJobs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">
            No se encontraron ofertas con los filtros aplicados.
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div key={job.id} className="p-4 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    className={`rounded-md text-[9px] font-black uppercase tracking-wider ${
                      job.status === 'active' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {job.status}
                  </Badge>
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-primary" /> {job.company_name}
                  </span>
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {job.location}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    • {job.sector}
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">
                  {job.title}
                </h4>
                {job.salary_raw && (
                  <span className="text-xs font-bold text-emerald-600 block">
                    💰 {job.salary_raw}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <JobSocialCardGenerator job={job} />

                <Link
                  href={`/empleos/${job.slug}`}
                  target="_blank"
                  className="inline-flex items-center justify-center rounded-xl h-8 px-2.5 text-xs font-bold border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 shadow-2xs transition-all"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  <span>Ver</span>
                </Link>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleStatus(job)}
                  className="rounded-xl h-8 px-2.5 text-[10px] font-black uppercase tracking-wider border-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  {job.status === 'active' ? 'Cerrar' : 'Activar'}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(job.id)}
                  className="rounded-xl h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                  title="Eliminar vacante"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
