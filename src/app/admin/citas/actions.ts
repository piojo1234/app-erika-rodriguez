'use server'

import { supabaseServer } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function agendarCita(formData: FormData) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const tipo_evento = formData.get('tipo_evento') as string || 'cita_clinica'
  const paciente_id = formData.get('paciente_id') as string || null
  const titulo = formData.get('titulo') as string || null
  const fecha = formData.get('fecha') as string
  const hora = formData.get('hora') as string
  const duracion_minutos = parseInt(formData.get('duracion_minutos') as string || '60', 10)
  const modalidad = formData.get('modalidad') as string || null
  const hora_fin = formData.get('hora_fin') as string || null
  const observaciones = formData.get('observaciones') as string

  // Combinar fecha y hora
  const fechaInicio = new Date(`${fecha}T${hora}:00`)
  let fechaFin: Date
  let computedDuracion = duracion_minutos

  if (tipo_evento === 'compromiso_personal' && hora_fin) {
    fechaFin = new Date(`${fecha}T${hora_fin}:00`)
    computedDuracion = (fechaFin.getTime() - fechaInicio.getTime()) / 60000
    if (computedDuracion <= 0) {
      computedDuracion = 60
      fechaFin = new Date(fechaInicio.getTime() + 60 * 60000)
    }
  } else {
    fechaFin = new Date(fechaInicio.getTime() + computedDuracion * 60000)
  }

  try {
    const { data, error } = await supabaseServer
      .from('citas')
      .insert({
        paciente_id,
        tipo_evento,
        titulo,
        fecha,
        hora,
        fecha_inicio: fechaInicio.toISOString(),
        fecha_fin: fechaFin.toISOString(),
        duracion_minutos: computedDuracion,
        modalidad: modalidad || 'Presencial', // Evitar nulos en BD
        estado: tipo_evento === 'compromiso_personal' ? 'Programada' : 'Programada',
        observaciones: observaciones || ''
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error guardando cita:', error)
      return { success: false, error: 'No se pudo agendar la cita: ' + error.message }
    }

    revalidatePath('/admin/citas')
    return { success: true }
  } catch (error: any) {
    console.error('Error de red/timeout agendando cita:', error)
    return { success: false, error: 'Error de red o timeout al contactar la base de datos.' }
  }
}
export async function actualizarEstadoCita(citaId: string, nuevoEstado: string) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('No autorizado')

  try {
    const { error } = await supabaseServer
      .from('citas')
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq('id', citaId)

    if (error) {
      console.error('Error actualizando estado de cita:', error)
      return { success: false, error: 'No se pudo actualizar el estado de la cita.' }
    }

    revalidatePath('/admin/citas')
    return { success: true }
  } catch (error: any) {
    console.error('Error de red/timeout actualizando cita:', error)
    return { success: false, error: 'Error de red o timeout al contactar la base de datos.' }
  }
}
