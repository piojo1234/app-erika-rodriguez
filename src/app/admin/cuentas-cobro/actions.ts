'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type EstadoCuentaCobro = 'pendiente' | 'pagada' | 'anulada'

export interface CuentaCobroInsert {
  paciente_id?: string | null
  nombre_cliente: string
  documento_cliente: string
  telefono_cliente?: string
  concepto: string
  monto: number
  valor_letras: string
  fecha_emision: string
  fecha_vencimiento?: string
  banco?: string
  tipo_cuenta?: string
  numero_cuenta?: string
  estado?: EstadoCuentaCobro
}

export async function getCuentasCobro() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cuentas_cobro')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching cuentas cobro:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function getPacientesBasic() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pacientes')
    .select('id, nombre_completo, tipo_documento, numero_documento, telefono')
    .order('nombre_completo', { ascending: true })

  if (error) {
    console.error('Error fetching pacientes:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function getContratosByPacienteId(pacienteId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contratos')
    .select('id, tipo_servicio, cantidad_sesiones, valor_total, created_at')
    .eq('paciente_id', pacienteId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching contratos:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function getCuentaCobroById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cuentas_cobro')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching cuenta cobro:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function createCuentaCobro(formData: FormData) {
  const supabase = await createClient()

  const documento = formData.get('cliente_documento')?.toString() || formData.get('documento_cliente')?.toString() || ''
  const nombre = formData.get('cliente_nombre')?.toString() || formData.get('nombre_cliente')?.toString() || ''
  
  let numero_cuenta = formData.get('numero_cuenta')?.toString() || 'N/A'
  const banco = formData.get('banco')?.toString() || 'Bancolombia'

  // Validación Efectivo
  if (banco.toLowerCase() === 'efectivo') {
    numero_cuenta = 'N/A'
  }

  const valorNumerico = Number(formData.get('monto_total')?.toString()) || Number(formData.get('monto')?.toString()) || 0
  const letras = formData.get('valor_en_letras')?.toString() || formData.get('valor_letras')?.toString() || ''
  
  // Consecutivo (nulo por defecto para permitir que Supabase use SERIAL o Triggers)
  const formConsecutivo = formData.get('consecutivo')?.toString() || formData.get('numero_consecutivo')?.toString() || null

  const payload = {
    cliente_nombre: nombre,
    nombre_cliente: nombre,
    cliente_documento: documento,
    documento_cliente: documento,
    cliente_telefono: formData.get('cliente_telefono')?.toString() || formData.get('telefono_cliente')?.toString() || '',
    concepto: formData.get('concepto')?.toString() || '',
    monto_total: valorNumerico,
    monto: valorNumerico,
    valor: valorNumerico,
    valor_letras: letras,
    valor_en_letras: letras,
    fecha_emision: formData.get('fecha_emision')?.toString() || new Date().toISOString().split('T')[0],
    fecha_vencimiento: formData.get('fecha_vencimiento')?.toString() || null,
    banco: banco,
    banco_nombre: banco,
    tipo_cuenta: formData.get('tipo_cuenta')?.toString() || 'Ahorros',
    numero_cuenta: numero_cuenta,
    paciente_id: formData.get('paciente_id')?.toString() || null,
    estado: 'pendiente',
    consecutivo: formConsecutivo,
    numero_consecutivo: formConsecutivo
  }

  const { data, error } = await supabase
    .from('cuentas_cobro')
    .insert([payload])
    .select()
    .single()

  if (error) {
    console.error('Error creating cuenta cobro:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/cuentas-cobro')
  return { data, error: null }
}

export async function updateEstadoCuentaCobro(id: string, estado: EstadoCuentaCobro) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cuentas_cobro')
    .update({ estado })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating estado cuenta cobro:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/cuentas-cobro')
  return { data, error: null }
}
