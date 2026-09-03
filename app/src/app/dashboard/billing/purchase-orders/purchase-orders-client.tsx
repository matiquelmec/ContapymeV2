'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  FileSpreadsheet, 
  Plus, 
  ArrowRightLeft, 
  FileText, 
  ShoppingBag,
  BadgeCheck,
  Building2,
  Loader2
} from 'lucide-react'
import { createPurchaseOrder, convertPurchaseOrderToDTE } from '@/actions/billing'
import { toast } from 'sonner'

interface PurchaseOrderItem {
  descripcion: string
  unidad: string
  cantidad: number
  precio_unitario: number
  descuento_pct: number
  afecto_iva: boolean
}

interface PurchaseOrdersClientProps {
  activeOrgId?: string | null
  initialOrders: any[]
}

export function PurchaseOrdersClient({ activeOrgId, initialOrders }: PurchaseOrdersClientProps) {
  const [orders, setOrders] = useState<any[]>(initialOrders)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [convertingId, setConvertingId] = useState<string | null>(null)

  const [rut, setRut] = useState('')
  const [nombre, setNombre] = useState('')
  const [giro, setGiro] = useState('Giro Comercial')
  const [direccion, setDireccion] = useState('Punta Arenas')
  const [observaciones, setObservaciones] = useState('')

  const [items, setItems] = useState<PurchaseOrderItem[]>([
    { descripcion: 'Insumos / Servicios Magallanes', unidad: 'UNI', cantidad: 1, precio_unitario: 50000, descuento_pct: 0, afecto_iva: true }
  ])

  const addItem = () => {
    setItems([...items, { descripcion: '', unidad: 'UNI', cantidad: 1, precio_unitario: 0, descuento_pct: 0, afecto_iva: true }])
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeOrgId) {
      toast.error('Debe seleccionar una empresa activa para emitir órdenes de compra.')
      return
    }

    setLoading(true)
    try {
      const res = await createPurchaseOrder({
        organization_id: activeOrgId,
        cliente_rut: rut,
        cliente_nombre: nombre,
        cliente_giro: giro,
        cliente_direccion: direccion,
        observaciones: observaciones,
        items: items
      })

      if (res.success) {
        toast.success('Orden de Compra creada exitosamente.')
        setOrders([res.data, ...orders])
        setShowModal(false)
        setRut('')
        setNombre('')
        setObservaciones('')
      } else {
        toast.error(res.error || 'Error al crear la orden de compra.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Fallo inesperado al crear orden.')
    } finally {
      setLoading(false)
    }
  }

  const handleConvertToDTE = async (ocId: string) => {
    setConvertingId(ocId)
    try {
      const res = await convertPurchaseOrderToDTE(ocId, 33)
      if (res.success) {
        toast.success(res.data?.message || 'Factura DTE generada y firmada exitosamente.')
        setOrders(orders.map(o => o.id === ocId ? { ...o, estado: 'facturada', folio_dte: res.data?.dte_result?.folio } : o))
      } else {
        toast.error(res.error || 'Error al convertir Orden de Compra a Factura DTE.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error inesperado al generar DTE.')
    } finally {
      setConvertingId(null)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-slate-100">Órdenes de Compra (OC)</h1>
            <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
              Gestión Comercial & DTE
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Crea órdenes de compra preliminares y conviértelas a Facturas DTE firmadas con 1 solo clic.
          </p>
        </div>

        <Button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-2 shadow-lg shadow-emerald-900/20"
        >
          <Plus className="w-4 h-4" />
          Nueva Orden de Compra
        </Button>
      </div>

      {/* Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">N° OC</th>
              <th className="p-4">Fecha</th>
              <th className="p-4">Cliente / Receptor</th>
              <th className="p-4 text-right">Neto</th>
              <th className="p-4 text-right">IVA (19%)</th>
              <th className="p-4 text-right">Total CLP</th>
              <th className="p-4 text-center">Estado</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                  No hay órdenes de compra registradas para esta empresa. Haz clic en "Nueva Orden de Compra" para comenzar.
                </td>
              </tr>
            ) : (
              orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-semibold text-slate-100">OC-{ord.numero}</td>
                  <td className="p-4 text-slate-400">{ord.fecha}</td>
                  <td className="p-4">
                    <div className="font-medium text-slate-200">{ord.cliente_nombre}</div>
                    <div className="text-xs text-slate-500">{ord.cliente_rut}</div>
                  </td>
                  <td className="p-4 text-right font-mono text-slate-300">${(Number(ord.neto) || 0).toLocaleString('es-CL')}</td>
                  <td className="p-4 text-right font-mono text-slate-400">${(Number(ord.iva) || 0).toLocaleString('es-CL')}</td>
                  <td className="p-4 text-right font-mono font-bold text-emerald-400">${(Number(ord.total) || 0).toLocaleString('es-CL')}</td>
                  <td className="p-4 text-center">
                    {ord.estado === 'facturada' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <BadgeCheck className="w-3.5 h-3.5" /> Factura #{ord.folio_dte || 'Emitida'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <FileSpreadsheet className="w-3.5 h-3.5" /> Emitida (Pendiente)
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {ord.estado !== 'facturada' && (
                      <Button 
                        size="sm"
                        disabled={convertingId === ord.id}
                        onClick={() => handleConvertToDTE(ord.id)}
                        className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5"
                      >
                        {convertingId === ord.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        )}
                        Convertir a DTE
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Emitir Nueva Orden de Compra
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400">RUT Cliente / Receptor</label>
                  <Input 
                    value={rut} 
                    onChange={e => setRut(e.target.value)} 
                    placeholder="76.123.456-K"
                    className="bg-slate-950 border-slate-800 text-slate-200 mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400">Razón Social</label>
                  <Input 
                    value={nombre} 
                    onChange={e => setNombre(e.target.value)} 
                    placeholder="Comercial Austral SpA"
                    className="bg-slate-950 border-slate-800 text-slate-200 mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400">Giro Comercial</label>
                  <Input 
                    value={giro} 
                    onChange={e => setGiro(e.target.value)} 
                    placeholder="Comercio al por menor"
                    className="bg-slate-950 border-slate-800 text-slate-200 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400">Dirección</label>
                  <Input 
                    value={direccion} 
                    onChange={e => setDireccion(e.target.value)} 
                    placeholder="Punta Arenas"
                    className="bg-slate-950 border-slate-800 text-slate-200 mt-1"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-semibold text-slate-300">Ítems de la Orden de Compra</label>
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <Input 
                      placeholder="Descripción producto/servicio" 
                      value={it.descripcion}
                      onChange={e => {
                        const newItems = [...items]
                        newItems[idx].descripcion = e.target.value
                        setItems(newItems)
                      }}
                      className="col-span-6 bg-slate-900 border-slate-800 text-xs text-slate-200"
                      required
                    />
                    <Input 
                      type="number"
                      placeholder="Cant" 
                      value={it.cantidad}
                      onChange={e => {
                        const newItems = [...items]
                        newItems[idx].cantidad = Number(e.target.value)
                        setItems(newItems)
                      }}
                      className="col-span-2 bg-slate-900 border-slate-800 text-xs text-slate-200"
                      required
                    />
                    <Input 
                      type="number"
                      placeholder="Precio CLP" 
                      value={it.precio_unitario}
                      onChange={e => {
                        const newItems = [...items]
                        newItems[idx].precio_unitario = Number(e.target.value)
                        setItems(newItems)
                      }}
                      className="col-span-4 bg-slate-900 border-slate-800 text-xs text-slate-200"
                      required
                    />
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="text-xs border-slate-800 text-slate-400 hover:text-slate-200">
                  + Agregar Otro Ítem
                </Button>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400">Observaciones (Opcional)</label>
                <Input 
                  value={observaciones} 
                  onChange={e => setObservaciones(e.target.value)} 
                  placeholder="Condiciones de despacho, plazo, etc."
                  className="bg-slate-950 border-slate-800 text-slate-200 mt-1"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="text-slate-400">
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Guardar Orden de Compra
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
