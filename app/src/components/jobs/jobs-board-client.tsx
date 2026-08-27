'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  DollarSign, 
  Search, 
  Filter, 
  BadgeCheck, 
  Send, 
  ArrowUpRight, 
  Building2, 
  ShieldCheck,
  Calendar,
  Sparkles,
  ChevronRight,
  Mail
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import type { JobPosting } from '@/actions/jobs'

interface JobsBoardClientProps {
  initialJobs: JobPosting[]
}

const COMUNAS = [
  'TODAS',
  'Punta Arenas',
  'Puerto Natales',
  'Porvenir',
  'Torres del Paine',
  'Faena / Remoto'
]

const SECTORES = [
  'TODOS',
  'Comercio / Zona Franca',
  'Salmonicultura / Marítimo',
  'Hidrógeno Verde / Energía',
  'Turismo / Gastronomía',
  'Administración / Contable',
  'Construcción / Logística'
]

export function JobsBoardClient({ initialJobs }: JobsBoardClientProps) {
  const [search, setSearch] = useState('')
  const [selectedComuna, setSelectedComuna] = useState('TODAS')
  const [selectedSector, setSelectedSector] = useState('TODOS')
  const [selectedShift, setSelectedShift] = useState('TODOS')

  const filteredJobs = useMemo(() => {
    return initialJobs.filter((job) => {
      // Filtro texto
      if (search.trim()) {
        const query = search.toLowerCase()
        const matchTitle = job.title.toLowerCase().includes(query)
        const matchCompany = job.company_name.toLowerCase().includes(query)
        const matchDesc = job.description.toLowerCase().includes(query)
        if (!matchTitle && !matchCompany && !matchDesc) return false
      }

      // Filtro Comuna
      if (selectedComuna !== 'TODAS') {
        if (!job.location.toLowerCase().includes(selectedComuna.toLowerCase())) {
          return false
        }
      }

      // Filtro Sector
      if (selectedSector !== 'TODOS') {
        if (!job.sector.toLowerCase().includes(selectedSector.toLowerCase())) {
          return false
        }
      }

      // Filtro Jornada / Turno
      if (selectedShift !== 'TODOS') {
        if (!job.work_shift?.toLowerCase().includes(selectedShift.toLowerCase())) {
          return false
        }
      }

      return true
    })
  }, [initialJobs, search, selectedComuna, selectedSector, selectedShift])

  return (
    <div className="space-y-12">
      {/* 🔍 BARRA DE BÚSQUEDA Y FILTROS RÁPIDOS */}
      <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white border border-border/60 shadow-xl shadow-primary/5 space-y-6">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por cargo (ej. Contador, Mecánico, Jefe de Turno, Recepción)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-14 h-14 rounded-2xl bg-zinc-50 border-zinc-200 text-sm font-medium focus-visible:ring-primary focus-visible:bg-white transition-all"
          />
        </div>

        {/* Filtros de Comuna (Pills) */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/70">
            Comuna o Faena
          </span>
          <div className="flex flex-wrap gap-2">
            {COMUNAS.map((comuna) => (
              <button
                key={comuna}
                onClick={() => setSelectedComuna(comuna)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  selectedComuna === comuna
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105'
                    : 'bg-zinc-100/80 text-muted-foreground hover:bg-zinc-200/80'
                }`}
              >
                {comuna}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros de Sector Productivo */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/70">
            Sector Productivo Regional
          </span>
          <div className="flex flex-wrap gap-2">
            {SECTORES.map((sector) => (
              <button
                key={sector}
                onClick={() => setSelectedSector(sector)}
                className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  selectedSector === sector
                    ? 'bg-zinc-900 text-white shadow'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {sector}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 📊 CONTADOR Y RESULTADOS */}
      <div className="flex items-center justify-between border-b border-zinc-200/60 pb-4">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          <span className="text-xs font-black uppercase tracking-widest text-foreground">
            {filteredJobs.length} {filteredJobs.length === 1 ? 'Oferta Disponible' : 'Ofertas Disponibles'} en Magallanes
          </span>
        </div>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-wider">
          Actualizado Hoy
        </span>
      </div>

      {/* 🗂️ LISTADO DE OFERTAS LABORALES */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-200 space-y-4">
          <Briefcase className="h-12 w-12 text-muted-foreground/40 mx-auto" />
          <h3 className="text-lg font-black uppercase tracking-tight text-foreground">
            No se encontraron ofertas con estos filtros
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Intenta seleccionar otra comuna o borrar el término de búsqueda para ver todas las vacantes de la región.
          </p>
          <Button 
            variant="outline" 
            onClick={() => { setSearch(''); setSelectedComuna('TODAS'); setSelectedSector('TODOS'); }}
            className="text-xs font-black uppercase tracking-widest rounded-xl"
          >
            Limpiar Filtros
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => {
            const whatsappUrl = job.contact_whatsapp
              ? `https://wa.me/${job.contact_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Hola, te escribo por la oferta laboral '${job.title}' en ${job.company_name} que vi en ContaEmpleos Magallanes.`
                )}`
              : null

            return (
              <Card 
                key={job.id} 
                className="group rounded-[2rem] border-border/70 bg-white hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                <CardContent className="p-7 space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Header de la Tarjeta: Empresa y Ubicación */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5 text-primary" />
                          <span>{job.company_name}</span>
                          {job.is_verified && (
                            <span title="Empresa Verificada con RUT">
                              <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg sm:text-xl font-black italic tracking-tight uppercase leading-snug group-hover:text-primary transition-colors">
                          <Link href={`/empleos/${job.slug}`}>
                            {job.title}
                          </Link>
                        </h3>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-zinc-100 rounded-lg text-zinc-700 shrink-0">
                        {job.location}
                      </span>
                    </div>

                    {/* Tags y Badges: Sueldo y Turno */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {job.salary_raw && (
                        <div className="flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
                          <DollarSign className="h-3 w-3" />
                          <span>{job.salary_raw}</span>
                        </div>
                      )}
                      {job.work_shift && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                          <Clock className="h-3 w-3" />
                          <span>{job.work_shift}</span>
                        </div>
                      )}
                      <div className="text-[10px] font-bold text-muted-foreground bg-zinc-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                        {job.sector}
                      </div>
                    </div>

                    {/* Descripción breve */}
                    <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-3">
                      {job.description}
                    </p>
                  </div>

                  {/* Footer de la tarjeta con Botones de Acción */}
                  <div className="pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/70">
                      <span className="bg-zinc-100 px-2 py-0.5 rounded-md font-mono text-zinc-600">
                        {job.source_name || 'BNE Magallanes'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {job.contact_email && (
                        <a
                          href={`mailto:${job.contact_email}?subject=Postulaci%C3%B3n%20${encodeURIComponent(job.title)}%20-%20ContaEmpleos`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-[10px] font-black uppercase tracking-wider hover:bg-zinc-800 shadow-sm transition-all active:scale-95"
                          title={`Enviar CV a ${job.contact_email}`}
                        >
                          <Mail className="h-3 w-3" />
                          <span>Email</span>
                        </a>
                      )}
                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 shadow-sm transition-all active:scale-95"
                          title="Contactar vía WhatsApp"
                        >
                          <Send className="h-3 w-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                      <Link href={`/empleos/${job.slug}`}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-xl text-[10px] font-black uppercase tracking-wider border-zinc-200 group-hover:border-primary/40 group-hover:bg-primary group-hover:text-primary-foreground transition-all h-8"
                        >
                          Detalles <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
