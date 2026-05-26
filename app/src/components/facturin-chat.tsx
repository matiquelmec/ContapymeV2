'use client'

import { useState } from 'react'
import { MessageSquare, X, Send, Bot, User, Check, ArrowRight } from 'lucide-react'

interface Message {
  id: string
  sender: 'facturin' | 'user'
  text: string
  timestamp: Date
}

export function FacturinChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: 'facturin',
      text: '¡Hola! Soy Facturín 🤖, tu asistente contable para Magallanes. ¿Tienes dudas sobre boletas, exenciones tributarias o normativas del SII en Punta Arenas? ¡Pregúntame o selecciona una opción abajo!',
      timestamp: new Date()
    }
  ])
  const [isTyping, setIsTyping] = useState(false)

  const quickQuestions = [
    {
      q: '¿Cómo funciona la exención de la Zona Franca?',
      a: 'La Zona Franca de Punta Arenas permite importar y comercializar productos exentos del 19% de IVA y aranceles aduaneros dentro del recinto. Las empresas autorizadas también gozan de beneficios en el Impuesto de Primera Categoría. Nuestro software Contapymepuq emite y clasifica automáticamente los DTE exentos requeridos por el SII para esta zona.'
    },
    {
      q: '¿Qué es el LRE y cómo se genera?',
      a: 'El Libro de Remuneraciones Electrónico (LRE) es un registro mensual obligatorio para informar sueldos y cotizaciones previsionales ante la Dirección del Trabajo (DT). Nuestro sistema exporta automáticamente el archivo CSV oficial con el formato exacto requerido por el portal de la DT, ahorrándote horas de carga manual.'
    },
    {
      q: '¿Qué beneficios otorga la Ley Navarino?',
      a: 'La Ley Navarino (N° 18.392) concede exención de IVA en compras/ventas y del Impuesto de Primera Categoría a empresas instaladas en Tierra del Fuego y Cabo de Hornos, además de una bonificación a las ventas. Contapymepuq te permite configurar la facturación bajo este régimen tributario regional especial de forma nativa.'
    },
    {
      q: '¿Cómo calculo la bonificación de la Ley 889?',
      a: 'La Ley 889 entrega una bonificación fiscal a los empleadores del 17% sobre la remuneración imponible de los trabajadores contratados en zonas extremas (con un tope imponible). Nuestro motor de remuneraciones calcula esta bonificación de forma automática en cada liquidación de sueldo y genera el reporte consolidado para cobrar el subsidio en la Tesorería General.'
    }
  ]

  const handleSelectQuestion = (qText: string, aText: string) => {
    // Añadir pregunta de usuario
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: qText,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    // Simular respuesta de Facturín con delay de lectura
    setTimeout(() => {
      const facturinMsg: Message = {
        id: Math.random().toString(),
        sender: 'facturin',
        text: aText,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, facturinMsg])
      setIsTyping(false)
    }, 1000)
  }

  return (
    <>
      {/* Burbuja flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl hover:shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 animate-bounce"
        style={{ animationDuration: '3s' }}
        title="Consultas Contables Facturín"
      >
        {isOpen ? (
          <X className="h-6 w-6 transition-transform group-hover:rotate-90 duration-300" />
        ) : (
          <div className="relative">
            <MessageSquare className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
            </span>
          </div>
        )}
      </button>

      {/* Ventana de chat Glassmorphic */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] sm:w-[400px] h-[500px] rounded-3xl bg-white/80 border border-white/30 backdrop-blur-2xl shadow-[0_30px_90px_-20px_rgba(0,0,0,0.2)] hover:border-emerald-500/20 transition-all duration-300 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
          
          {/* Cabecera del Chat */}
          <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center gap-3 relative">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center border border-white/10 shrink-0">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 leading-none">
              <span className="text-[8px] font-black uppercase tracking-widest text-emerald-100">Asistente Tributario</span>
              <h4 className="text-sm font-black uppercase tracking-wider mt-1 text-white">Facturín de Contapyme</h4>
              <div className="flex items-center gap-1 mt-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-200" />
                </span>
                <span className="text-[8px] font-bold text-emerald-100">En línea para la Patagonia</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Cuerpo de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-zinc-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-zinc-100 border-zinc-200 text-zinc-600'
                      : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>

                <div className="space-y-1">
                  <div
                    className={`p-3 rounded-2xl text-[11px] leading-relaxed font-semibold shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-white text-zinc-700 border border-zinc-150 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className={`text-[7.5px] font-bold text-muted-foreground/40 block ${
                    msg.sender === 'user' ? 'text-right' : ''
                  }`}>
                    {msg.timestamp.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 max-w-[85%] animate-pulse">
                <div className="h-7 w-7 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="bg-white border border-zinc-150 rounded-2xl rounded-tl-none p-3 text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                  <span>Escribiendo...</span>
                </div>
              </div>
            )}
          </div>

          {/* Panel de Consultas Rápidas (Educativo) */}
          <div className="p-3 bg-white border-t border-zinc-100 space-y-2 shrink-0">
            <span className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-wider block px-1">Consultas rápidas en Magallanes</span>
            <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectQuestion(q.q, q.a)}
                  disabled={isTyping}
                  className="w-full text-left text-[9.5px] font-semibold text-zinc-600 hover:text-emerald-700 bg-zinc-50 hover:bg-emerald-50 border border-zinc-150 rounded-xl px-3 py-2 transition-all cursor-pointer flex items-center justify-between disabled:opacity-50 group"
                >
                  <span className="pr-2 line-clamp-1">{q.q}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-zinc-300 group-hover:text-emerald-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
