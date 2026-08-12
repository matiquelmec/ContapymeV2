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
  const [inputValue, setInputValue] = useState('')

  const quickQuestions = [
    { q: 'Zona Franca 🏢', a: '¿Cómo funciona la exención de la Zona Franca en Punta Arenas?' },
    { q: 'Libro LRE 📊', a: '¿Qué es el Libro de Remuneraciones Electrónico (LRE) y cómo lo genera el sistema?' },
    { q: 'Ley Navarino ⚓', a: '¿Qué beneficios tributarios y de exención otorga la Ley Navarino?' },
    { q: 'Ley 889 (Zona Extrema) 🏔️', a: '¿Cómo se calcula el subsidio del 17% por contratación de la Ley 889?' }
  ]

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userText = inputValue;
    setInputValue('');

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat/facturin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages })
      });

      if (!response.ok) throw new Error('Error al conectar con el servidor de chat');

      const data = await response.json();
      
      const facturinMsg: Message = {
        id: Math.random().toString(),
        sender: 'facturin',
        text: data.reply || 'Disculpa, no pude procesar la respuesta en este momento.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, facturinMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: Math.random().toString(),
        sender: 'facturin',
        text: 'Lo siento, en este momento el viento magallánico interrumpió la señal. Por favor, vuelve a intentarlo en unos instantes.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSelectQuestion = async (qLabel: string, qText: string) => {
    if (isTyping) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: qText,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat/facturin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages })
      });

      if (!response.ok) throw new Error('Error al conectar');

      const data = await response.json();
      
      const facturinMsg: Message = {
        id: Math.random().toString(),
        sender: 'facturin',
        text: data.reply || 'Disculpa, tuve un inconveniente al procesar.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, facturinMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: Math.random().toString(),
        sender: 'facturin',
        text: 'El viento magallánico interrumpió la señal temporalmente. Vuelve a intentar la consulta rápida en un momento.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

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

          {/* Panel de Consultas Rápidas (Deslizable horizontal) */}
          <div className="p-3 bg-white border-t border-zinc-100 space-y-1.5 shrink-0">
            <span className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-wider block px-1">Consultas rápidas en Magallanes</span>
            <div className="flex flex-row gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectQuestion(q.q, q.a)}
                  disabled={isTyping}
                  className="whitespace-nowrap text-[9px] font-bold text-zinc-650 hover:text-emerald-700 bg-zinc-50 hover:bg-emerald-50 border border-zinc-150 rounded-lg px-3 py-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {q.q}
                </button>
              ))}
            </div>
          </div>

          {/* Formulario de Entrada de Texto */}
          <form onSubmit={handleSendMessage} className="p-3 bg-zinc-50 border-t border-zinc-150 flex gap-2 items-center shrink-0">
            <input
              id="facturinChatInput"
              name="facturinChatInput"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Escribe tu consulta tributaria o de ContaPyme..."
              disabled={isTyping}
              className="flex-1 h-10 px-3 bg-white border border-zinc-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isTyping || !inputValue.trim()}
              className="h-10 w-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg hover:shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-40 disabled:scale-100 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
