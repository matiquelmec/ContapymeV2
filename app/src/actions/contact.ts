'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Esquema de validación del formulario
const contactSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('El correo electrónico no es válido'),
  message: z.string().min(5, 'La consulta debe tener al menos 5 caracteres'),
})

export async function sendContactMessage(formData: { name: string; email: string; message: string }) {
  try {
    // 1. Validar los datos de entrada
    const validation = contactSchema.safeParse(formData)
    if (!validation.success) {
      const errorMsg = validation.error.issues.map(e => e.message).join(', ')
      return { success: false, error: errorMsg }
    }

    const { name, email, message } = validation.data
    const supabase = await createClient()

    // 2. Insertar el mensaje en la tabla de base de datos
    const { error } = await supabase
      .from('contact_messages')
      .insert([
        {
          name,
          email,
          message,
          status: 'pending'
        }
      ])

    if (error) {
      console.error('[DATABASE ERROR] Fallo al guardar mensaje de contacto:', error.message)
      return { 
        success: false, 
        error: 'Hubo un problema de conexión con la base de datos al guardar tu mensaje.' 
      }
    }

    // 3. Enviar correo de notificación a través de Web3Forms (de forma asíncrona pero controlada)
    const accessKey = process.env.WEB3FORMS_ACCESS_KEY
    if (accessKey) {
      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            access_key: accessKey,
            name: name,
            email: email,
            message: message,
            subject: `Nueva consulta de soporte: ${name}`,
            from_name: "Contapymepuq Web"
          })
        })
        
        const resData = await response.json()
        if (!response.ok || !resData.success) {
          console.warn('[WEB3FORMS WARNING] Fallo al notificar por correo:', resData.message || response.statusText)
        }
      } catch (mailErr: any) {
        console.error('[WEB3FORMS ERROR] Error al conectar con Web3Forms:', mailErr.message)
      }
    }

    return { success: true }
  } catch (err: any) {
    console.error("[Contact Action Error]:", err.message)
    return { 
      success: false, 
      error: 'Error de conexión con el servidor. Por favor, inténtalo más tarde.' 
    }
  }
}
