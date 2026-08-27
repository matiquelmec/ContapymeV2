'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Newspaper, 
  Plus, 
  Search, 
  Sparkles, 
  Eye, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  Image as ImageIcon,
  CheckCircle2,
  Building2,
  Calendar
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
import { createCompanyNewsAction, deleteNewsAction } from '@/actions/news'
import { assistNewsWritingAction } from '@/actions/ai'

const CATEGORIAS = [
  'MAGALLANES ACTUAL',
  'ECONOMÍA Y PYMES',
  'TURISMO Y PATAGONIA',
  'COMERCIO AUSTRAL',
  'TECNOLOGÍA E INNOVACIÓN',
  'COMUNIDAD'
]

interface NewsItem {
  id: string
  title: string
  slug: string
  category: string
  content: string
  summary: string | null
  image_url: string | null
  source_url: string | null
  source_name: string | null
  is_featured: boolean | null
  published_at: string | null
  created_at: string | null
}

interface DashboardNewsClientProps {
  initialNews: NewsItem[]
  companyName?: string
}

export function DashboardNewsClient({ initialNews, companyName }: DashboardNewsClientProps) {
  const router = useRouter()
  const [news, setNews] = useState<NewsItem[]>(initialNews)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isAILoading, setIsAILoading] = useState(false)

  // Form
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('ECONOMÍA Y PYMES')
  const [content, setContent] = useState('')
  const [summary, setSummary] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [sourceName, setSourceName] = useState(companyName || 'Comunicado Corporativo')

  const handleAIAssist = async () => {
    if (!content.trim()) {
      toast.error('Escribe un borrador o ideas principales en el contenido para que la IA lo pula.')
      return
    }

    setIsAILoading(true)
    const toastId = toast.loading('Estructurando tu comunicado con redacción periodística profesional...')
    try {
      const res = await assistNewsWritingAction({
        draftTitle: title,
        draftContent: content,
        draftCategory: category
      })

      if (res.success && res.data) {
        setTitle(res.data.title)
        setCategory(res.data.category)
        setContent(res.data.content)
        setSummary(res.data.summary)
        toast.success('¡Artículo optimizado por la IA Editorial! 🚀', { id: toastId })
      } else {
        toast.error(res.error || 'No se pudo optimizar el artículo.', { id: toastId })
      }
    } catch (err: any) {
      toast.error('Error de conexión con el asistente: ' + err.message, { id: toastId })
    } finally {
      setIsAILoading(false)
    }
  }

  const handleSubmitNews = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      toast.error('Por favor completa el título y contenido.')
      return
    }

    startTransition(async () => {
      const res = await createCompanyNewsAction({
        title,
        category,
        content,
        summary: summary || undefined,
        image_url: imageUrl || undefined,
        source_name: sourceName,
      })

      if (res.success && res.data) {
        toast.success('¡Comunicado publicado con éxito en el Diario Regional! 📰')
        setNews([res.data, ...news])
        setIsFormOpen(false)
        router.refresh()
      } else {
        toast.error(res.error || 'Error al publicar el comunicado.')
      }
    })
  }

  const handleDeleteNews = async (id: string) => {
    if (!confirm('¿Deseas eliminar este comunicado?')) return
    const res = await deleteNewsAction(id)
    if (res.success) {
      toast.success('Comunicado eliminado.')
      setNews(news.filter((n) => n.id !== id))
      router.refresh()
    } else {
      toast.error(res.error || 'Error al eliminar.')
    }
  }

  const filteredNews = news.filter(
    (n) =>
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* 💡 GUÍA EDUCATIVA EDITORIAL */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-primary/10 border border-blue-500/20 space-y-3">
        <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-black text-xs uppercase tracking-wider">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <span>Guía de Difusión de Prensa para Empresas en Magallanes</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
          <div className="p-3 rounded-2xl bg-white/80 border border-blue-500/10 space-y-1 shadow-2xs">
            <strong className="text-foreground font-black text-[11px] uppercase tracking-wide block">
              1. Redacción Periodística IA
            </strong>
            <p className="text-[11px] leading-relaxed">
              Escribe tus ideas en bruto y pulsa "Mejorar con IA" para que el motor periodístico estructure tu titular y resumen.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-white/80 border border-blue-500/10 space-y-1 shadow-2xs">
            <strong className="text-foreground font-black text-[11px] uppercase tracking-wide block">
              2. Posicionamiento Austral
            </strong>
            <p className="text-[11px] leading-relaxed">
              Tus notas sobre inauguraciones, convenios y promociones se difunden a la comunidad de Punta Arenas y la región.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-white/80 border border-blue-500/10 space-y-1 shadow-2xs">
            <strong className="text-foreground font-black text-[11px] uppercase tracking-wide block">
              3. Portada Inmediata
            </strong>
            <p className="text-[11px] leading-relaxed">
              Al publicar, tu nota se indexa en Google News y en la sección de actualidad del portal regional ContaPymePUQ.
            </p>
          </div>
        </div>
      </div>

      {/* 📊 RESUMEN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="rounded-3xl border-border/60 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground block">
                Comunicados y Publirreportajes
              </span>
              <span className="text-2xl sm:text-3xl font-black text-foreground">{news.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <Newspaper className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/60 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 block">
                Publicados en Diario Regional
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600">{news.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🔍 BARRA DE BÚSQUEDA Y BOTÓN NUEVO COMUNICADO */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-3xl bg-white border border-border/60 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por título o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-11 rounded-2xl bg-zinc-50 border-zinc-200 text-xs font-medium"
          />
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="rounded-2xl h-11 px-5 text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-white gap-2 shadow-md shadow-primary/20 shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Comunicado de Prensa</span>
        </Button>
      </div>

      {/* 📋 LISTADO DE NOTICIAS */}
      {filteredNews.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-border/60 space-y-4">
          <div className="p-4 rounded-full bg-primary/10 text-primary inline-block">
            <Newspaper className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black uppercase tracking-tight text-foreground">
              No tienes comunicados registrados
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Publica notas de prensa, inauguraciones, promociones y publirreportajes en el Diario Regional de Punta Arenas.
            </p>
          </div>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="rounded-2xl text-xs font-black uppercase tracking-wider gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Redactar Primer Comunicado
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredNews.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-3xl bg-white border border-border/60 shadow-sm hover:border-primary/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="rounded-lg text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    {item.category}
                  </Badge>
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> {item.source_name || 'ContaPymePuq'}
                  </span>
                  {item.published_at && (
                    <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {new Date(item.published_at).toLocaleDateString('es-CL')}
                    </span>
                  )}
                </div>
                <h4 className="text-base font-black text-foreground uppercase tracking-tight truncate">
                  {item.title}
                </h4>
                {item.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.summary}
                  </p>
                )}
              </div>

              {/* ACCIONES */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <Link
                  href={`/noticias/${item.slug}`}
                  target="_blank"
                  className="inline-flex items-center justify-center rounded-xl h-9 px-3 text-xs font-black uppercase tracking-wider border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 shadow-2xs gap-1.5 transition-all"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Ver en Diario</span>
                </Link>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteNews(item.id)}
                  className="rounded-xl h-9 w-9 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                  title="Eliminar comunicado"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 📝 MODAL: CREAR COMUNICADO DE PRENSA */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl rounded-3xl bg-white p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto box-border">
          <DialogHeader className="text-left space-y-1 pr-6">
            <div className="flex items-center gap-1.5 text-primary text-xs font-black uppercase tracking-wider">
              <Newspaper className="h-4 w-4" />
              <span>Redacción de Comunicado Corporativo</span>
            </div>
            <DialogTitle className="text-lg sm:text-xl font-black uppercase tracking-tight text-foreground">
              Publicar en Diario Regional de Magallanes
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Redacta tu nota de prensa. Puedes usar el Asistente IA para mejorar la estructura y el titular periodístico.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitNews} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Título de la Noticia *
                </Label>
                <Input
                  required
                  placeholder="Ej. Recasur inaugura nuevo centro de servicios en Punta Arenas"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl h-10 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Categoría *
                </Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-bold px-3"
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Cuerpo del Comunicado *
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isAILoading || !content.trim()}
                  onClick={handleAIAssist}
                  className="h-7 px-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 gap-1.5 cursor-pointer"
                >
                  {isAILoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-amber-500" />}
                  <span>Mejorar con IA</span>
                </Button>
              </div>
              <Textarea
                required
                rows={6}
                placeholder="Escribe el texto completo de tu nota de prensa, anuncio o publirreportaje..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="rounded-xl text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  URL de Imagen de Portada (Opcional)
                </Label>
                <Input
                  placeholder="https://ejemplo.com/foto.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="rounded-xl h-10 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Firma / Empresa Emisora
                </Label>
                <Input
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
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
                disabled={isPending}
                className="rounded-xl h-10 text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-white gap-2 cursor-pointer shadow-md shadow-primary/20"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>Publicar Comunicado en Diario</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
