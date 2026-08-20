'use server'

import { supabaseServer } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'

export async function registrarGasto(formData: FormData) {
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
