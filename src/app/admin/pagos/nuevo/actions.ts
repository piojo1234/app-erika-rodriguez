'use server'

import { supabaseServer } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import crypto from 'crypto'

import { createClient } from '@/utils/supabase/server'

export async function registrarPago(formData: FormData) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const paciente_id = formData.get('paciente_id') as string
  const monto = parseFloat(formData.get('monto') as string)
  const metodo_pago = formData.get('metodo_pago') as string
  const referencia = formData.get('referencia') as string
  const concepto = formData.get('concepto') as string
  const notas = formData.get('notas') as string

  const es_menor = formData.get('es_menor') === 'true'
  const pagador_nombre = formData.get('pagador_nombre') as string
  const pagador_cedula = formData.get('pagador_cedula') as string
  const menor_nombre = formData.get('menor_nombre') as string

  const incluye_donacion = formData.get('incluye_donacion') === 'true'
  const monto_donacion = incluye_donacion ? parseFloat(formData.get('monto_donacion') as string) || 0 : 0
  const es_donacion_anonima = incluye_donacion && formData.get('es_donacion_anonima') === 'true'
  const donante_nombre = incluye_donacion && !es_donacion_anonima ? (formData.get('donante_nombre') as string) : null
  const donante_identificacion = incluye_donacion && !es_donacion_anonima ? (formData.get('donante_identificacion') as string) : null

  // Generar ID de Recibo único: REC-YYYYMM-XXXX
  const date = new Date()
  const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase() // 4 caracteres hexadecimales
  const numero_recibo = `REC-${yearMonth}-${randomSuffix}`

  const contrato_id = formData.get('contrato_id') as string

  // Prevención de Doble Clic (Duplicados en < 5 segundos)
  const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString()
  let query = supabaseServer
    .from('pagos')
    .select('id')
    .eq('paciente_id', paciente_id)
    .eq('monto', monto)
    .gte('created_at', fiveSecondsAgo)
  
  if (contrato_id) {
    query = query.eq('contrato_id', contrato_id)
  } else {
    query = query.is('contrato_id', null)
  }

  try {
    const { data: duplicates, error: dupError } = await query
    if (duplicates && duplicates.length > 0) {
      return { success: false, error: 'Pago duplicado detectado. Por favor, espere un momento antes de registrar otro pago.' }
    }
  } catch (error: any) {
    console.error('Error verificando duplicados:', error)
    return { success: false, error: 'Error de red o timeout al verificar duplicados.' }
  }

  try {
    const { error } = await supabaseServer
      .from('pagos')
      .insert({
        paciente_id,
        contrato_id: contrato_id || null,
        monto,
        metodo_pago,
        referencia: referencia || null,
        concepto,
        notas: notas || null,
        numero_recibo,
        es_menor,
        pagador_nombre: pagador_nombre || null,
        pagador_cedula: pagador_cedula || null,
        menor_nombre: menor_nombre || null,
        monto_donacion,
        es_donacion_anonima,
        donante_nombre,
        donante_identificacion,
      })

    if (error) {
      console.error('Error registrando pago:', error)
      return { success: false, error: `No se pudo registrar el pago. ${error.message}` }
    }
  } catch (error: any) {
    console.error('Error de red/timeout registrando pago:', error)
    return { success: false, error: 'Error de red o timeout al contactar la base de datos.' }
  }

  // Redirigir de vuelta al listado
  redirect('/admin/pagos')
}
