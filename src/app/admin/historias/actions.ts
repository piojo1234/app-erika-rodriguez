'use server'

import { supabaseServer } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function anularHistoria(id: string, justificacion: string) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('No autorizado')

  if (!justificacion || justificacion.length < 10) {
    return { success: false, error: 'Justificación muy corta.' }
  }

  try {
    const { error } = await supabaseServer
      .from('historias_clinicas')
      .update({ 
        estado: 'anulada',
        motivo_auditoria: justificacion,
        fecha_auditoria: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Error anulando historia:', error)
      return { success: false, error: 'No se pudo anular la historia.' }
    }

    revalidatePath('/admin/historias')
    return { success: true }
  } catch (error: any) {
    console.error('Error de red/timeout anulando historia:', error)
    return { success: false, error: 'Error de red o timeout al contactar la base de datos.' }
  }
}

export async function auditarEdicionHistoria(id: string, justificacion: string) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('No autorizado')

  if (!justificacion || justificacion.length < 10) {
    return { success: false, error: 'Justificación muy corta.' }
  }

  try {
    const { error } = await supabaseServer
      .from('historias_clinicas')
      .update({ 
        estado: 'modificada',
        motivo_auditoria: justificacion,
        fecha_auditoria: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Error auditando edición de historia:', error)
      return { success: false, error: 'No se pudo registrar la auditoría.' }
    }

    revalidatePath('/admin/historias')
    return { success: true }
  } catch (error: any) {
    console.error('Error de red/timeout auditando historia:', error)
    return { success: false, error: 'Error de red o timeout al contactar la base de datos.' }
  }
}
