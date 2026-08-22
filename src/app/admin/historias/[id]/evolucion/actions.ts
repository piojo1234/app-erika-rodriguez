'use server'

import { supabaseServer } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function guardarEvolucion(formData: FormData) {
  const historia_clinica_id = formData.get('historia_clinica_id') as string
  const paciente_id = formData.get('paciente_id') as string
  const numero_sesion = parseInt(formData.get('numero_sesion') as string, 10) || 1
  const evolucion_terapeutica = (formData.get('evolucion') || formData.get('evolucion_terapeutica')) as string
  const observaciones_valoracion = (formData.get('observaciones_valoracion') || '') as string
  const diagnostico_cie10 = (formData.get('diagnostico_cie10') || '') as string
  const asistente_sesion = (formData.get('asistente_sesion') || null) as string | null
  const fecha_sesion = formData.get('fecha_sesion') ? (formData.get('fecha_sesion') as string) : new Date().toISOString()
  const contrato_id = (formData.get('contrato_id') || null) as string | null
  
  const revision_tarea_previa_str = formData.get('revision_tarea_previa') as string
  const tareas_casa_str = formData.get('tareas_casa') as string

  let revision_tarea_previa = []
  let tareas_casa = []

  try {
    if (revision_tarea_previa_str) revision_tarea_previa = JSON.parse(revision_tarea_previa_str)
    if (tareas_casa_str) tareas_casa = JSON.parse(tareas_casa_str)
  } catch (e) {
    console.error('Error parsing JSON from tareas', e)
  }
  const { error } = await supabaseServer
    .from('evoluciones_clinicas')
    .insert({
      historia_clinica_id,
      paciente_id,
      numero_sesion,
      fecha_sesion,
      evolucion_terapeutica,
      observaciones_valoracion,
      diagnostico_cie10,
      asistente_sesion,
      revision_tarea_previa,
      tareas_casa,
      contrato_id
    })

  if (error) {
    console.error("Error detallado al guardar evolución:", error)
    throw new Error('Error guardando la sesión.')
  }

  // Actualizar updated_at de la historia
  await supabaseServer
    .from('historias_clinicas')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', historia_clinica_id)

  revalidatePath('/admin/historias')
  redirect(`/admin/historias/${historia_clinica_id}`)
}

export async function actualizarTareasEvolucion(evolucionId: string, tareasCasa: any[]) {
  const { error } = await supabaseServer
    .from('evoluciones_clinicas')
    .update({ tareas_casa: tareasCasa })
    .eq('id', evolucionId)

  if (error) {
    console.error("Error al actualizar tareas de evolución:", error)
    throw new Error('Error actualizando las tareas.')
  }

  revalidatePath('/admin/historias')
}

export async function actualizarEvolucion(id: string, formData: FormData) {
  try {
    const evolucion_terapeutica = (formData.get('evolucion_terapeutica') || '') as string
    const observaciones_valoracion = (formData.get('observaciones_valoracion') || '') as string
    const diagnostico_cie10 = (formData.get('diagnostico_cie10') || '') as string
    const asistente_sesion = (formData.get('asistente_sesion') || null) as string | null
    const fecha_sesion = formData.get('fecha_sesion') ? (formData.get('fecha_sesion') as string) : new Date().toISOString()
    
    const { data: evolucionOriginal, error: errorOriginal } = await supabaseServer
      .from('evoluciones_clinicas')
      .select('historia_clinica_id')
      .eq('id', id)
      .single()

    if (errorOriginal || !evolucionOriginal) {
      console.error('Error obteniendo evolución original:', errorOriginal)
      return { success: false, error: 'Evolución no encontrada.' }
    }

    const { error } = await supabaseServer
      .from('evoluciones_clinicas')
      .update({
        fecha_sesion,
        evolucion_terapeutica,
        observaciones_valoracion,
        diagnostico_cie10,
        asistente_sesion,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Error detallado actualizando evolucion:', JSON.stringify(error, null, 2))
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/historias')
    revalidatePath(`/admin/historias/${evolucionOriginal.historia_clinica_id}/evolucion`)
    revalidatePath(`/admin/historias/${evolucionOriginal.historia_clinica_id}/evoluciones`)
    
    return { success: true }
  } catch (err: any) {
    console.error('Excepción en actualizarEvolucion:', err)
    return { success: false, error: err.message || 'Error desconocido' }
  }
}
