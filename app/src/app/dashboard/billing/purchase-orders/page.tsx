"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  FileSpreadsheet, 
  Plus, 
  CheckCircle2, 
  ArrowRightLeft, 
  FileText, 
  Building2, 
  Calendar, 
  CreditCard,
  Sparkles,
  ShoppingBag,
  BadgeCheck
} from "lucide-react"

interface PurchaseOrderItem {
  descripcion: string
  unidad: string
  cantidad: number
  precio_unitario: number
  descuento_pct: number
  afecto_iva: boolean
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([
    {
      id: "oc-001",
      numero: 101,
      fecha: "2026-08-01",
      cliente_rut: "76.123.456-K",
      cliente_nombre: "Distribuidora Magallanes SpA",
      neto: 250000,
      iva: 47500,
      total: 297500,
      estado: "emitida",
      folio_dte: null
    },
    {
      id: "oc-002",
      numero: 102,
      fecha: "2026-08-02",
      cliente_rut: "77.987.654-3",
      cliente_nombre: "Servicios Marítimos Austral Ltda",
      neto: 180000,
      iva: 34200,
      total: 214200,
      estado: "facturada",
      folio_dte: 1450
    }
  ])

  const [showModal, setShowModal] = useState(false)
  const [rut, setRut] = useState("")
  const [nombre, setNombre] = useState("")
  const [items, setItems] = useState<PurchaseOrderItem[]>([
    { descripcion: "Insumos Oficina", unidad: "UNI", cantidad: 1, precio_unitario: 50000, descuento_pct: 0, afecto_iva: true }
  ])

  const addItem = () => {
    setItems([...items, { descripcion: "", unidad: "UNI", cantidad: 1, precio_unitario: 0, descuento_pct: 0, afecto_iva: true }])
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    let neto = 0
    items.forEach(it => {
      if (it.afecto_iva) {
        neto += Math.round(it.cantidad * it.precio_unitario * (1 - it.descuento_pct / 100))
      }
    })
    const iva = Math.round(neto * 0.19)
    const total = neto + iva

    const newOrder = {
      id: `oc-${Date.now()}`,
      numero: 100 + orders.length + 1,
      fecha: new Date().toISOString().split("T")[0],
      cliente_rut: rut || "76.000.000-1",
      cliente_nombre: nombre || "Empresa Cliente Test",
      neto,
      iva,
      total,
      estado: "emitida",
      folio_dte: null
    }

    setOrders([newOrder, ...orders])
    setShowModal(false)
    setRut("")
    setNombre("")
  }

  const convertToDte = (ocId: string) => {
    const nextFolio = 1451 + Math.floor(Math.random() * 50)
    setOrders(orders.map(o => o.id === ocId ? { ...o, estado: "facturada", folio_dte: nextFolio } : o))
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
              Gestión Comercial
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
            {orders.map((ord) => (
              <tr key={ord.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4 font-semibold text-slate-100">OC-{ord.numero}</td>
                <td className="p-4 text-slate-400">{ord.fecha}</td>
                <td className="p-4">
                  <div className="font-medium text-slate-200">{ord.cliente_nombre}</div>
                  <div className="text-xs text-slate-500">{ord.cliente_rut}</div>
                </td>
                <td className="p-4 text-right font-mono text-slate-300">${ord.neto.toLocaleString("es-CL")}</td>
                <td className="p-4 text-right font-mono text-slate-400">${ord.iva.toLocaleString("es-CL")}</td>
                <td className="p-4 text-right font-mono font-bold text-emerald-400">${ord.total.toLocaleString("es-CL")}</td>
                <td className="p-4 text-center">
                  {ord.estado === "facturada" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <BadgeCheck className="w-3.5 h-3.5" /> Factura #{ord.folio_dte}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Emitida (Pendiente)
                    </span>
                  )}
                </td>
                <td className="p-4 text-center">
                  {ord.estado !== "facturada" && (
                    <Button 
                      size="sm"
                      onClick={() => convertToDte(ord.id)}
                      className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      Convertir a DTE
                    </Button>
                  )}
                </td>
              </tr>
            ))}
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
                  <label className="text-xs font-medium text-slate-400">RUT Cliente / Proveedor</label>
                  <Input id="field_rut" name="field_rut" 
                    value={rut} 
                    onChange={e => setRut(e.target.value)} 
                    placeholder="76.123.456-K"
                    className="bg-slate-950 border-slate-800 text-slate-200 mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400">Razón Social</label>
                  <Input id="field_nombre" name="field_nombre" 
                    value={nombre} 
                    onChange={e => setNombre(e.target.value)} 
                    placeholder="Comercial Austral SpA"
                    className="bg-slate-950 border-slate-800 text-slate-200 mt-1"
                    required
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-semibold text-slate-300">Ítems de la Orden de Compra</label>
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <Input id="field_descripci_n_producto_servicio" name="field_descripci_n_producto_servicio" 
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
                    <Input id="field_cant" name="field_cant" 
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
                    <Input id="field_precio_clp" name="field_precio_clp" 
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

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="text-slate-400">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
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
