'use client'

import React, { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Image as ImageIcon, Upload, Loader2, Link as LinkIcon, AlertCircle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { createNewsAction, updateNewsAction, uploadNewsImageAction } from '@/actions/news'
import { assistNewsWritingAction } from '@/actions/ai'

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

interface NewsFormModalProps {
  isOpen: boolean
  onClose: () => void
  newsItem: NewsItem | null
  onSuccess: (news: any) => void
}

export function NewsFormModal({ isOpen, onClose, newsItem, onSuccess }: NewsFormModalProps) {
  const isEditMode = !!newsItem

  const [formData, setFormData] = useState({
    title: newsItem?.title || '',
    category: newsItem?.category || 'MAGALLANES ACTUAL',
    content: newsItem?.content || '',
    summary: newsItem?.summary || '',
    image_url: newsItem?.image_url || '',
    source_name: newsItem?.source_name || 'ContaPymePuq',
    source_url: newsItem?.source_url || '',
    is_featured: newsItem?.is_featured || false,
  })

  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isAILoading, setIsAILoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [, startTransition] = useTransition()

  // Asistencia por Inteligencia Artificial
  const handleAIAssist = async () => {
    if (!formData.content.trim()) return

    setIsAILoading(true)
    const toastId = toast.loading('Puliendo y estructurando tu noticia de forma profesional con IA...')

    try {
      const res = await assistNewsWritingAction({
        draftTitle: formData.title,
        draftContent: formData.content,
        draftCategory: formData.category
      })

      if (res.success && res.data) {
        setFormData({
          title: res.data.title,
          category: res.data.category,
          content: res.data.content,
          summary: res.data.summary,
          image_url: formData.image_url, // Mantener imagen actual
          source_name: formData.source_name,
          source_url: formData.source_url,
          is_featured: formData.is_featured
        })
        toast.success('¡Artículo optimizado con éxito por la IA editorial! ⚓', { id: toastId })
      } else {
        toast.error(res.error || 'No se pudo optimizar el artículo.', { id: toastId })
      }
    } catch (err: any) {
      toast.error('Error de conexión con el asistente: ' + err.message, { id: toastId })
    } finally {
      setIsAILoading(false)
    }
  }

  // Manejar cambios de texto
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Manejar toggle destaque
  const handleFeatureToggle = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_featured: checked }))
  }

  // Cargar imagen local
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, suba únicamente archivos de imagen (.jpg, .png, .webp, etc.)')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('El tamaño de la imagen no debe superar los 10MB.')
      return
    }

    setIsUploading(true)
    const uploadData = new FormData()
    uploadData.append('file', file)

    try {
      const res = await uploadNewsImageAction(uploadData)
      if (res.success && res.url) {
        setFormData((prev) => ({ ...prev, image_url: res.url }))
        toast.success('Imagen cargada con éxito en los servidores de Supabase.')
      } else {
        toast.error(res.error || 'Error al subir la imagen.')
      }
    } catch (err: any) {
      toast.error('Error de red al subir la imagen: ' + err.message)
    } finally {
      setIsUploading(false)
    }
  }

  // Guardar noticia
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!formData.title.trim()) {
      setErrorMsg('El título es requerido.')
      return
    }
    if (!formData.content.trim()) {
      setErrorMsg('El contenido de la noticia es requerido.')
      return
    }

    setIsSaving(true)
    
    startTransition(async () => {
      try {
        let res
        if (isEditMode && newsItem) {
          res = await updateNewsAction(newsItem.id, formData)
        } else {
          res = await createNewsAction(formData)
        }

        if (res.success && res.data) {
          toast.success(
            isEditMode
              ? 'Noticia corregida y actualizada con éxito.'
              : 'Nueva noticia redactada e insertada en la portada.'
          )
          onSuccess(res.data)
        } else {
          setErrorMsg(res.error || 'Ocurrió un error al guardar la noticia.')
        }
      } catch (err: any) {
        setErrorMsg('Error de conexión al servidor: ' + err.message)
      } finally {
        setIsSaving(false)
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-white border border-border rounded-2xl shadow-xl overflow-y-auto max-h-[90vh] p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground">
            {isEditMode ? 'Corregir Noticia 📝' : 'Redactar Nueva Noticia ✍️'}
          </DialogTitle>
          <DialogDescription className="text-xs font-semibold text-muted-foreground">
            {isEditMode
              ? 'Realice cambios a los campos de la noticia seleccionada para actualizarla en el feed.'
              : 'Complete la ficha para publicar una cobertura local o de finanzas de inmediato.'}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold p-3 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div className="space-y-1">
            <Label htmlFor="title" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Título de la Noticia *
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ej: Nuevas medidas de fomento productivo para PYMEs en Magallanes"
              required
              className="bg-muted/30 focus-visible:bg-background transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categoría */}
            <div className="space-y-1">
              <Label htmlFor="category" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Categoría *
              </Label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="flex h-9 w-full rounded-lg border border-input bg-muted/30 px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 focus:bg-background font-semibold"
              >
                <option value="MAGALLANES ACTUAL">Magallanes Actual (Regional)</option>
                <option value="ECONOMÍA">Economía y Finanzas</option>
                <option value="SII / LEGAL">SII y Legal</option>
              </select>
            </div>

            {/* Noticia Destacada */}
            <div className="flex items-center justify-between border border-border p-2 px-3 rounded-lg bg-muted/10 h-9 mt-5 md:mt-0">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Destacar Noticia
                </span>
                <span className="text-[10px] text-muted-foreground italic font-semibold">
                  Aparecerá en el hero principal o bento.
                </span>
              </div>
              <Switch
                checked={formData.is_featured}
                onCheckedChange={handleFeatureToggle}
              />
            </div>
          </div>

          {/* Subida de Imagen */}
          <div className="space-y-2 border border-border/80 p-4 rounded-xl bg-muted/10">
            <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground block">
              Imagen de Portada
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-muted-foreground italic">
                    Subir desde el ordenador:
                  </Label>
                  <div className="relative">
                    <input
                      type="file"
                      id="image-file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('image-file')?.click()}
                      disabled={isUploading}
                      className="w-full gap-2 border-dashed border-primary/40 hover:border-primary text-xs font-semibold h-9 cursor-pointer"
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      ) : (
                        <Upload className="w-4 h-4 text-primary" />
                      )}
                      {isUploading ? 'Subiendo archivo...' : 'Seleccionar Imagen'}
                    </Button>
                  </div>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink mx-2 text-muted-foreground text-[10px] uppercase font-bold tracking-wider">o pegar URL</span>
                  <div className="flex-grow border-t border-border"></div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="image_url" className="text-[11px] font-bold text-muted-foreground italic">
                    Dirección web de la imagen:
                  </Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      id="image_url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleChange}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      className="pl-8 text-xs h-8"
                    />
                  </div>
                </div>
              </div>

              {/* Previsualización */}
              <div className="border-2 border-dashed border-border rounded-lg bg-background flex flex-col items-center justify-center p-2 relative min-h-[140px] overflow-hidden">
                {formData.image_url ? (
                  <>
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full max-h-[140px] object-cover rounded-md"
                      onError={() => toast.error('URL de imagen no válida o inaccesible.')}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="xs"
                      onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}
                      className="absolute bottom-2 right-2 text-[10px] h-6 px-2 rounded-sm"
                    >
                      Remover
                    </Button>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground p-4">
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-1.5">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-xs font-bold">Subiendo a Supabase...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
                        <span className="text-xs font-bold uppercase tracking-wide">Sin Imagen</span>
                        <span className="text-[10px] italic">Se asignará fallback de categoría.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="space-y-1">
            <Label htmlFor="summary" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Resumen Breve (Para el feed de portada)
            </Label>
            <Textarea
              id="summary"
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              placeholder="Un resumen corto de 1 a 2 líneas sobre los aspectos más importantes de la noticia."
              rows={2}
              className="bg-muted/30 focus-visible:bg-background text-xs resize-none"
            />
          </div>

          {/* Contenido Completo */}
          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1.5">
              <Label htmlFor="content" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Contenido Completo de la Noticia *
              </Label>
              <button
                type="button"
                onClick={handleAIAssist}
                disabled={isAILoading || !formData.content.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200/50 rounded-lg shadow-2xs hover:shadow-xs transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isAILoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />
                    <span>Optimizando redacción...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-violet-500 animate-pulse" />
                    <span>Mejorar con IA / Redactar Profesional</span>
                  </>
                )}
              </button>
            </div>
            <Textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Redacte el cuerpo completo del artículo de prensa aquí..."
              required
              rows={6}
              className="bg-muted/30 focus-visible:bg-background text-sm resize-y"
            />
          </div>

          {/* Campos de Fuente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4 mt-2">
            <div className="space-y-1">
              <Label htmlFor="source_name" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Nombre de la Fuente
              </Label>
              <Input
                id="source_name"
                name="source_name"
                value={formData.source_name}
                onChange={handleChange}
                placeholder="Ej: Contapymepuq / Diario Financiero"
                className="text-xs h-8 bg-muted/30"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="source_url" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Enlace de la Fuente original (Opcional)
              </Label>
              <Input
                id="source_url"
                name="source_url"
                value={formData.source_url}
                onChange={handleChange}
                placeholder="https://diario.cl/noticia-original"
                className="text-xs h-8 bg-muted/30"
              />
            </div>
          </div>

          {/* Botones del pie */}
          <DialogFooter className="border-t border-border pt-4 mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving || isUploading}
              className="bg-primary hover:bg-primary/95 text-white font-bold uppercase text-xs px-4 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Guardando...
                </>
              ) : isEditMode ? (
                'Aplicar Corrección'
              ) : (
                'Publicar Noticia'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
