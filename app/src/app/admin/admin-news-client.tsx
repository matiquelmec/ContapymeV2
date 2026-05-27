'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Globe,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { deleteNewsAction, syncNewsAction } from '@/actions/news'
import { NewsFormModal } from './news-form-modal'

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

interface AdminNewsClientProps {
  initialNews: NewsItem[]
}

export function AdminNewsClient({ initialNews }: AdminNewsClientProps) {
  const router = useRouter()
  const [news, setNews] = useState<NewsItem[]>(initialNews)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  
  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [newsToEdit, setNewsToEdit] = useState<NewsItem | null>(null)
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [newsToDelete, setNewsToDelete] = useState<NewsItem | null>(null)

  const [isPending, startTransition] = useTransition()
  const [isSyncing, setIsSyncing] = useState(false)

  // Filtrado
  const filteredNews = news.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.summary && item.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.source_name && item.source_name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory =
      categoryFilter === 'ALL' || item.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  // Sincronizar RSS Feeds
  const handleSyncRSS = async () => {
    setIsSyncing(true)
    const promise = syncNewsAction()

    toast.promise(promise, {
      loading: 'Sincronizando últimas noticias de feeds oficiales de Magallanes...',
      success: (res) => {
        setIsSyncing(false)
        if (res.success) {
          router.refresh()
          setTimeout(() => window.location.reload(), 1000)
          return `Sincronización completa. Se agregaron ${res.addedCount} noticias nuevas.`
        } else {
          return `Sincronización terminada con algunas alertas.`
        }
      },
      error: (err) => {
        setIsSyncing(false)
        return `Fallo al sincronizar: ${err.message || 'Error de conexión'}`
      }
    })
  }

  // Confirmar Eliminación
  const handleDeleteConfirm = () => {
    if (!newsToDelete) return

    startTransition(async () => {
      try {
        const res = await deleteNewsAction(newsToDelete.id)
        if (res.success) {
          setNews((prev) => prev.filter((item) => item.id !== newsToDelete.id))
          toast.success('Noticia eliminada correctamente del portal de forma inmutable.')
          setIsDeleteOpen(false)
          setNewsToDelete(null)
          router.refresh()
        } else {
          toast.error(res.error || 'No se pudo eliminar la noticia.')
        }
      } catch (err: any) {
        toast.error('Error al procesar la solicitud: ' + err.message)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Controles de filtro y búsqueda */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-border shadow-xs">
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3">
          {/* Campo de búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por título, contenido o fuente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 w-full bg-background/80"
            />
          </div>

          {/* Selector de categoría */}
          <div className="flex gap-1.5 p-1 bg-muted/50 rounded-lg flex-wrap">
            <Button
              variant={categoryFilter === 'ALL' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCategoryFilter('ALL')}
              className="h-7 text-[11px] font-bold px-3 rounded-md transition-all"
            >
              Todos
            </Button>
            <Button
              variant={categoryFilter === 'MAGALLANES ACTUAL' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCategoryFilter('MAGALLANES ACTUAL')}
              className="h-7 text-[11px] font-bold px-3 rounded-md transition-all"
            >
              Magallanes Actual
            </Button>
            <Button
              variant={categoryFilter === 'ECONOMÍA' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCategoryFilter('ECONOMÍA')}
              className="h-7 text-[11px] font-bold px-3 rounded-md transition-all"
            >
              Economía
            </Button>
            <Button
              variant={categoryFilter === 'SII / LEGAL' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCategoryFilter('SII / LEGAL')}
              className="h-7 text-[11px] font-bold px-3 rounded-md transition-all"
            >
              SII / Legal
            </Button>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncRSS}
            disabled={isSyncing}
            className="gap-2 h-9 font-semibold text-xs text-muted-foreground border-border cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            Sincronizar RSS
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setNewsToEdit(null)
              setIsFormOpen(true)
            }}
            className="gap-2 h-9 font-bold bg-primary hover:bg-primary/95 shadow-sm text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Redactar Noticia
          </Button>
        </div>
      </div>

      {/* Tabla de Noticias */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-border shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[80px]">Portada</TableHead>
              <TableHead>Noticia</TableHead>
              <TableHead className="hidden md:table-cell">Fuente</TableHead>
              <TableHead className="hidden sm:table-cell">Publicada</TableHead>
              <TableHead className="w-[120px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredNews.length > 0 ? (
              filteredNews.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/10 transition-colors">
                  {/* Portada */}
                  <TableCell>
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-12 h-12 rounded-lg object-cover border border-border shadow-2xs"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=150&q=50'
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-border">
                        <Globe className="w-5 h-5 text-muted-foreground/60" />
                      </div>
                    )}
                  </TableCell>

                  {/* Título y Categoría */}
                  <TableCell className="max-w-md sm:max-w-xl">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={item.category === 'FINANZAS' ? 'secondary' : 'default'}
                          className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm"
                        >
                          {item.category}
                        </Badge>
                        {item.is_featured && (
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm border-0">
                            Destacada
                          </Badge>
                        )}
                      </div>
                      <span className="font-bold text-foreground text-sm line-clamp-2 leading-snug">
                        {item.title}
                      </span>
                    </div>
                  </TableCell>

                  {/* Fuente */}
                  <TableCell className="hidden md:table-cell text-muted-foreground font-semibold text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate max-w-[120px]">
                        {item.source_name || 'ContaPymePuq'}
                      </span>
                      {item.source_url && (
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:text-primary/80 transition-colors shrink-0"
                          title="Ver enlace original"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </TableCell>

                  {/* Fecha */}
                  <TableCell className="hidden sm:table-cell text-muted-foreground font-semibold text-xs">
                    {item.published_at
                      ? new Date(item.published_at).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Sin fecha'}
                  </TableCell>

                  {/* Acciones */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={() => {
                          setNewsToEdit(item)
                          setIsFormOpen(true)
                        }}
                        title="Editar noticia"
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-xs"
                        onClick={() => {
                          setNewsToDelete(item)
                          setIsDeleteOpen(true)
                        }}
                        title="Eliminar noticia"
                        className="cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic font-semibold">
                  No se encontraron noticias que coincidan con la búsqueda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* MODAL: Eliminar Noticia */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-white border border-border rounded-2xl shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-3 text-destructive mb-2">
              <AlertCircle className="w-6 h-6" />
              <DialogTitle className="text-lg font-black uppercase tracking-tight">
                Confirmar Eliminación ⚠️
              </DialogTitle>
            </div>
            <DialogDescription className="font-medium text-muted-foreground text-xs leading-relaxed">
              ¿Está completamente seguro de que desea eliminar la noticia{' '}
              <strong className="text-foreground italic">"{newsToDelete?.title}"</strong>? Esta
              acción no se puede deshacer y retirará el artículo de la portada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsDeleteOpen(false)
                setNewsToDelete(null)
              }}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="font-bold uppercase text-xs cursor-pointer"
            >
              {isPending ? 'Eliminando...' : 'Eliminar de todas formas'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: Redactar / Editar Formulario */}
      {isFormOpen && (
        <NewsFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false)
            setNewsToEdit(null)
          }}
          newsItem={newsToEdit}
          onSuccess={(updatedOrNewNews) => {
            if (newsToEdit) {
              setNews((prev) =>
                prev.map((item) =>
                  item.id === updatedOrNewNews.id ? { ...item, ...updatedOrNewNews } : item
                )
              )
            } else {
              setNews((prev) => [updatedOrNewNews, ...prev])
            }
            setIsFormOpen(false)
            setNewsToEdit(null)
          }}
        />
      )}
    </div>
  )
}
