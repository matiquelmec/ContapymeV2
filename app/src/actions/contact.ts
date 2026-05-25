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

    return { success: true }
  } catch (err: any) {
    console.error("[Contact Action Error]:", err.message)
    return { 
      success: false, 
      error: 'Error de conexión con el servidor. Por favor, inténtalo más tarde.' 
    }
  }
}
