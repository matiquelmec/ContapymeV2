'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sendContactMessage } from "@/actions/contact";
import { Loader2 } from "lucide-react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar localmente antes de enviar
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Por favor, completa todos los campos.");
      return;
    }

    setIsPending(true);
    try {
      const response = await sendContactMessage({ name, email, message });
      if (response.success) {
        toast.success("¡Solicitud enviada! Nos contactaremos a la brevedad.");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        toast.error(response.error || "No se pudo procesar tu solicitud.");
      }
    } catch (error) {
      console.error("[ContactForm Error]:", error);
      toast.error("Error al conectar con la base de datos.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="bg-white/80 backdrop-blur-xl p-6 sm:p-10 rounded-[2.5rem] border border-primary/10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06)] space-y-6"
    >
      <div className="space-y-1">
        <h4 className="text-foreground text-xl font-black uppercase italic tracking-tight">Envíanos un Mensaje</h4>
        <p className="text-muted-foreground text-[10px] font-bold italic">Canal directo con ingenieros de soporte en Magallanes.</p>
      </div>
      
      <div className="space-y-4">
        <div className="relative group">
          <input 
            type="text"
            required
            disabled={isPending}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-14 bg-zinc-50 border border-zinc-200/80 rounded-xl px-6 text-foreground text-xs font-bold uppercase tracking-wider outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all disabled:opacity-50" 
            placeholder="Tu Nombre Completo" 
          />
        </div>
        
        <div className="relative group">
          <input 
            type="email"
            required
            disabled={isPending}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-14 bg-zinc-50 border border-zinc-200/80 rounded-xl px-6 text-foreground text-xs font-bold uppercase tracking-wider outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all disabled:opacity-50" 
            placeholder="Email Institucional" 
          />
        </div>
        
        <div className="relative group">
          <textarea 
            required
            disabled={isPending}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full h-32 bg-zinc-50 border border-zinc-200/80 rounded-xl p-6 text-foreground text-xs font-bold uppercase tracking-wider outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all resize-none disabled:opacity-50" 
            placeholder="Consulta Técnica" 
          />
        </div>
        
        <Button 
          type="submit"
          disabled={isPending}
          className="w-full h-14 bg-primary hover:bg-primary/95 text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-xl shadow-primary/15 hover:shadow-2xl hover:shadow-primary/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span>Enviando...</span>
            </>
          ) : (
            <span>Enviar Solicitud</span>
          )}
        </Button>
      </div>
    </form>
  );
}
