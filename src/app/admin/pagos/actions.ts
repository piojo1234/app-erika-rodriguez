'use server'

import { supabaseServer } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function registrarGasto(formData: FormData) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const concepto = formData.get('concepto') as string
  const categoria = formData.get('categoria') as string
  const monto = parseInt(formData.get('monto') as string, 10)
  const fecha_gasto = formData.get('fecha_gasto') as string
  const metodo_pago = formData.get('metodo_pago') as string
  const notas = formData.get('notas') as string

  if (!concepto || !categoria || isNaN(monto) || !fecha_gasto || !metodo_pago) {
    return { success: false, error: 'Faltan campos obligatorios' }
  }

  try {
    const { data, error } = await supabaseServer
      .from('gastos')
      .insert({
        concepto,
        categoria,
        monto,
        fecha_gasto,
        metodo_pago,
        notas: notas || null
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error registrando gasto:', error)
      return { success: false, error: 'No se pudo registrar el gasto: ' + error.message }
    }

    revalidatePath('/admin/pagos')
    return { success: true, id: data.id }
  } catch (error: any) {
    console.error('Error de red/timeout registrando gasto:', error)
    return { success: false, error: 'Error de red o timeout al contactar la base de datos.' }
  }
}

export async function eliminarGasto(id: string) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('No autorizado')

  try {
    const { error } = await supabaseServer
      .from('gastos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error eliminando gasto:', error)
      return { success: false, error: 'No se pudo eliminar el gasto.' }
    }

    revalidatePath('/admin/pagos')
    return { success: true }
  } catch (error: any) {
    console.error('Error de red/timeout eliminando gasto:', error)
    return { success: false, error: 'Error de red o timeout al contactar la base de datos.' }
  }
}

export async function anularPago(id: string, justificacion: string) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('No autorizado')

  if (!justificacion || justificacion.length < 10) {
    return { success: false, error: 'Justificación muy corta.' }
  }

  try {
    const { error } = await supabaseServer
      .from('pagos')
      .update({ 
        estado: 'anulado',
        motivo_anulacion: justificacion,
        fecha_anulacion: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Error anulando pago:', error)
      return { success: false, error: 'No se pudo anular el pago.' }
    }

    revalidatePath('/admin/pagos')
    return { success: true }
  } catch (error: any) {
    console.error('Error de red/timeout anulando pago:', error)
    return { success: false, error: 'Error de red o timeout al contactar la base de datos.' }
  }
}

export async function eliminarPago(id: string) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('No autorizado')

  try {
    const { error } = await supabaseServer
      .from('pagos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error eliminando pago:', error)
      return { success: false, error: 'No se pudo eliminar el pago.' }
    }

    revalidatePath('/admin/pagos')
    return { success: true }
  } catch (error: any) {
    console.error('Error de red/timeout eliminando pago:', error)
    return { success: false, error: 'Error de red o timeout al contactar la base de datos.' }
  }
}

export async function actualizarPago(formData: FormData) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const pago_id = formData.get('pago_id') as string
  const paciente_id = formData.get('paciente_id') as string
  const contrato_id = formData.get('contrato_id') as string
  const es_menor = formData.get('es_menor') === 'true'
  const menor_nombre = formData.get('menor_nombre') as string
  const pagador_nombre = formData.get('pagador_nombre') as string
  const pagador_cedula = formData.get('pagador_cedula') as string
  const concepto = formData.get('concepto') as string
  const monto = parseInt(formData.get('monto') as string, 10)
  const metodo_pago = formData.get('metodo_pago') as string
  const referencia = formData.get('referencia') as string
  const notas = formData.get('notas') as string

  // Donaciones
  const incluye_donacion = formData.get('incluye_donacion') === 'true'
  const es_donacion_anonima = formData.get('es_donacion_anonima') === 'true'
  const monto_donacion = incluye_donacion ? parseInt(formData.get('monto_donacion') as string, 10) : 0
  const donante_nombre = (incluye_donacion && !es_donacion_anonima) ? (formData.get('donante_nombre') as string) : null
  const donante_identificacion = (incluye_donacion && !es_donacion_anonima) ? (formData.get('donante_identificacion') as string) : null

  if (!pago_id || !paciente_id || !concepto || isNaN(monto) || !metodo_pago) {
    return { success: false, error: 'Faltan campos obligatorios' }
  }

  try {
    const { error } = await supabaseServer
      .from('pagos')
      .update({
        paciente_id,
        contrato_id: contrato_id || null,
        es_menor,
        menor_nombre: es_menor ? menor_nombre : null,
        pagador_nombre: es_menor ? pagador_nombre : null,
        pagador_cedula: es_menor ? pagador_cedula : null,
        concepto,
        monto,
        metodo_pago,
        referencia: referencia || null,
        notas: notas || null,
        monto_donacion: monto_donacion || 0,
        es_donacion_anonima,
        donante_nombre,
        donante_identificacion
      })
      .eq('id', pago_id)

    if (error) {
      console.error('Error actualizando pago:', error)
      return { success: false, error: 'No se pudo actualizar el pago: ' + error.message }
    }

    revalidatePath('/admin/pagos')
    return { success: true }
  } catch (error: any) {
    console.error('Error de red/timeout actualizando pago:', error)
    return { success: false, error: 'Error de red o timeout al contactar la base de datos.' }
  }
}
