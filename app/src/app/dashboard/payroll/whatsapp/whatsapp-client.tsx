'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  MessageSquare, 
  Send, 
  Bot, 
  FileText, 
  Palmtree, 
  Award, 
  HelpCircle,
  Power,
  ShieldCheck,
  CheckCircle2,
  Loader2
} from 'lucide-react'
import { updateWhatsAppSettings, simulateWhatsAppMessage } from '@/actions/whatsapp'
import { toast } from 'sonner'

interface WhatsAppClientProps {
  activeOrgId: string
  initialSettings: any
}

interface ChatMessage {
  id: string
  sender: 'user' | 'bot'
  text: string
  mediaUrl?: string | null
  time: string
}

export function WhatsAppClient({ activeOrgId, initialSettings }: WhatsAppClientProps) {
  const [settings, setSettings] = useState(initialSettings || {
    is_active: false,
    welcome_message: '¡Hola! Bienvenido al portal de autoatención laboral.',
    allow_liquidation_download: true,
    allow_vacation_query: true,
    allow_certificate_download: true,
    allow_ai_riohs: true,
    require_2fa: true
  })

  const [saving, setSaving] = useState(false)
  const [inputMsg, setInputMsg] = useState('')
  const [loadingMsg, setLoadingMsg] = useState(false)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: settings?.welcome_message || '¡Hola! Bienvenido al portal de autoatención laboral de tu empresa en Punta Arenas. ¿En qué te puedo ayudar hoy?',
      time: '12:00'
    }
  ])

  const handleToggleActive = async () => {
    const nextState = !settings.is_active
    setSaving(true)
    try {
      const res = await updateWhatsAppSettings(activeOrgId, {
        ...settings,
        is_active: nextState
      })
      if (res.success) {
        setSettings({ ...settings, is_active: nextState })
        toast.success(nextState ? 'Canal de WhatsApp Activado' : 'Canal de WhatsApp en Modo Standby (Inactivo)')
      } else {
        toast.error('Error al actualizar estado')
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const res = await updateWhatsAppSettings(activeOrgId, settings)
      if (res.success) {
        toast.success('Configuraciones guardadas exitosamente')
      } else {
        toast.error('Error al guardar configuraciones')
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMsg
    if (!textToSend.trim()) return

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    if (!customText) setInputMsg('')
    setLoadingMsg(true)

    try {
      const res = await simulateWhatsAppMessage({
        organization_id: activeOrgId,
        message: textToSend
      })

      if (res.success && res.data) {
        const botMsg: ChatMessage = {
          id: String(Date.now() + 1),
          sender: 'bot',
          text: res.data.reply_text,
          mediaUrl: res.data.media_url,
          time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
        }
        setMessages(prev => [...prev, botMsg])
      } else {
        toast.error(res.error || 'Error al procesar mensaje')
      }
    } catch (err: any) {
      toast.error('Fallo en la comunicación con el motor')
    } finally {
      setLoadingMsg(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-slate-100">Autoatención de Colaboradores (WhatsApp)</h1>
            {settings.is_active ? (
              <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Activo en Producción
              </span>
            ) : (
              <span className="bg-amber-500/10 text-amber-400 text-xs px-2.5 py-1 rounded-full border border-amber-500/20 font-medium flex items-center gap-1.5">
                <Power className="w-3.5 h-3.5" /> En Modo Standby (Inactivo)
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">
            Permite que tus colaboradores descarguen sus liquidaciones en PDF, consulten vacaciones y certificados directamente por WhatsApp.
          </p>
        </div>

        <Button 
          onClick={handleToggleActive}
          disabled={saving}
          variant={settings.is_active ? "destructive" : "default"}
          className={settings.is_active ? "" : "bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-2"}
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {settings.is_active ? "Pausar / Desactivar Canal" : "Activar Canal WhatsApp"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Configuración de Servicios */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-slate-100">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Servicios Laborales Habilitados
              </CardTitle>
              <CardDescription className="text-slate-400">
                Selecciona qué trámites pueden auto-gestionar los colaboradores a través del chat.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-sky-400" />
                  <div>
                    <div className="text-sm font-semibold text-slate-200">Descarga de Liquidaciones en PDF</div>
                    <div className="text-xs text-slate-500">Envío instantáneo del documento oficial firmado.</div>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.allow_liquidation_download}
                  onChange={e => setSettings({ ...settings, allow_liquidation_download: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Palmtree className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-sm font-semibold text-slate-200">Consulta de Saldo de Vacaciones</div>
                    <div className="text-xs text-slate-500">Cálculo legal automático de días acumulados y saldo libre.</div>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.allow_vacation_query}
                  onChange={e => setSettings({ ...settings, allow_vacation_query: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="text-sm font-semibold text-slate-200">Certificados de Antigüedad Laboral</div>
                    <div className="text-xs text-slate-500">Generación de constancia con sello criptográfico SHA-256.</div>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.allow_certificate_download}
                  onChange={e => setSettings({ ...settings, allow_certificate_download: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-sm font-semibold text-slate-200">Asistente IA para RIOHS & Ley Karin</div>
                    <div className="text-xs text-slate-500">Respuestas empáticas e institucionales a dudas laborales.</div>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.allow_ai_riohs}
                  onChange={e => setSettings({ ...settings, allow_ai_riohs: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </label>

              <div className="pt-2">
                <Button 
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium"
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Guardar Preferencias de Servicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Simulador Interactivo de Chat */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="bg-slate-900/50 border-slate-800 flex flex-col h-[560px]">
            <CardHeader className="pb-3 border-b border-slate-800">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-emerald-400" />
                  <div>
                    <CardTitle className="text-base text-slate-100">Simulador de Autoatención</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Entorno de prueba (Sandbox) sin conectar WhatsApp real.</CardDescription>
                  </div>
                </div>
                <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 font-mono">Sandbox Mode</span>
              </div>
            </CardHeader>

            {/* Mensajes */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div 
                  key={m.id} 
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    m.sender === 'user' 
                      ? 'bg-emerald-600 text-white rounded-br-none' 
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/50 rounded-bl-none'
                  }`}>
                    <div className="whitespace-pre-wrap">{m.text}</div>
                    {m.mediaUrl && (
                      <a 
                        href={m.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 pt-2 border-t border-slate-700/80 flex items-center justify-between text-[11px] text-emerald-300 hover:text-emerald-200 transition-colors"
                      >
                        <span className="flex items-center gap-1.5 font-medium">
                          <FileText className="w-3.5 h-3.5" /> Documento Oficial Disponible
                        </span>
                        <span className="underline font-semibold">Ver Documento →</span>
                      </a>
                    )}
                    <div className="mt-1 text-[10px] text-right opacity-60">{m.time}</div>
                  </div>
                </div>
              ))}
              {loadingMsg && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 rounded-2xl p-3 text-xs text-slate-400 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    Procesando solicitud...
                  </div>
                </div>
              )}
            </CardContent>

            {/* Acciones Rápidas */}
            <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/60 flex gap-2 overflow-x-auto text-xs">
              <button 
                onClick={() => handleSendMessage('Quiero mi liquidación de sueldo')}
                className="whitespace-nowrap px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-700"
              >
                Mi liquidación
              </button>
              <button 
                onClick={() => handleSendMessage('¿Cuántos días de vacaciones me quedan?')}
                className="whitespace-nowrap px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-700"
              >
                Mis vacaciones
              </button>
              <button 
                onClick={() => handleSendMessage('Necesito un certificado de antigüedad laboral')}
                className="whitespace-nowrap px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-700"
              >
                Certificado
              </button>
            </div>

            {/* Input Form */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="p-3 border-t border-slate-800 flex gap-2"
            >
              <Input 
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                placeholder="Escribe como un trabajador (ej: 'dame mi liquidación de julio')..."
                className="bg-slate-950 border-slate-800 text-xs text-slate-200"
                disabled={loadingMsg}
              />
              <Button 
                type="submit" 
                size="sm" 
                disabled={loadingMsg || !inputMsg.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
