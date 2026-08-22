'use server'

import { supabaseServer } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function crearDocumento(formData: FormData) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const paciente_id = formData.get('paciente_id') as string
  const tipo_documento = formData.get('tipo_documento') as 'certificado_asistencia' | 'carta_remision'
  const dirigido_a = formData.get('dirigido_a') as string

  // Procesar contenido dinámico basado en tipo
  let contenido_dinamico: any = {}

  if (tipo_documento === 'certificado_asistencia') {
    contenido_dinamico = {
      fecha_inicio: formData.get('fecha_inicio') as string,
      fecha_fin: formData.get('fecha_fin') as string,
      total_sesiones: parseInt(formData.get('total_sesiones') as string || '0', 10),
      estado_proceso: formData.get('estado_proceso') as string,
      observacion: formData.get('observacion') as string,
    }
  } else if (tipo_documento === 'carta_remision') {
    contenido_dinamico = {
      especialidad_destino: formData.get('especialidad_destino') as string,
      motivo_remision: formData.get('motivo_remision') as string,
      impresion_diagnostica: formData.get('impresion_diagnostica') as string,
      objetivos_derivacion: formData.get('objetivos_derivacion') as string,
    }
  }

  const entidad_destino = formData.get('entidad_destino') as string || dirigido_a
  const ciudad = formData.get('ciudad') as string || 'Villavicencio'
  const fecha_emision = formData.get('fecha_emision') as string || new Date().toISOString()
  const texto_completo = formData.get('texto_completo') as string || ''

  try {
    const { data, error } = await supabaseServer
      .from('documentos_clinicos')
      .insert([{
        paciente_id,
        tipo_documento,
        dirigido_a,
        entidad_destino,
        ciudad,
        fecha_emision,
        texto_completo,
        contenido_dinamico,
        contenido: contenido_dinamico
      }])
      .select()
      .single()

    if (error) {
      console.error('Error insertando documento:', JSON.stringify(error, null, 2))
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/documentos')
    return { success: true, id: data.id }
  } catch (err: any) {
    console.error('Exception insertando documento:', err)
    return { success: false, error: err.message }
  }
}

export async function eliminarDocumento(id: string) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { error } = await supabaseServer
    .from('documentos_clinicos')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/documentos')
  return { success: true }
}

export async function redactarMotivoRemision(pacienteId: string, especialidad: string) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('No autorizado')

  try {
    // 1. Obtener la última evolución del paciente
    const { data: evoluciones, error: errEvoluciones } = await supabaseServer
      .from('evoluciones')
      .select('fecha, motivo_consulta, evolucion, estado_mental, diagnostico')
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: false })
      .limit(1)

    if (errEvoluciones || !evoluciones || evoluciones.length === 0) {
      return { success: false, error: 'No se encontraron evoluciones previas para este paciente para basar la redacción.' }
    }

    const ultimaEvolucion = evoluciones[0]
    
    // 2. Preparar el Prompt para Gemini
    const systemPrompt = `Eres un asistente clínico experto en psicología redactando una carta de remisión bajo los lineamientos de la Ley 1090 de 2006 en Colombia.
Tu tarea es redactar de forma técnica, objetiva y formal el "Motivo de Remisión y Síntomas Observados" dirigido a la especialidad de: ${especialidad}.

Contexto Clínico de la última sesión:
- Motivo de Consulta: ${ultimaEvolucion.motivo_consulta || 'No especificado'}
- Evolución: ${ultimaEvolucion.evolucion || 'No especificada'}
- Estado Mental: ${ultimaEvolucion.estado_mental || 'No especificado'}
- Diagnóstico: ${ultimaEvolucion.diagnostico || 'No especificado'}

Instrucciones:
- Escribe UN SOLO PÁRRAFO conciso y formal (máximo 120 palabras).
- No incluyas saludos ni despedidas, solo el cuerpo técnico del motivo.
- Justifica clínicamente por qué se requiere la valoración por ${especialidad}.`

    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const result = await model.generateContent(systemPrompt)
    const response = await result.response
    const text = response.text()

    return { success: true, text: text.trim() }

  } catch (error: any) {
    console.error('Error con IA:', error)
    return { success: false, error: error.message || 'Error al conectar con la IA.' }
  }
}
