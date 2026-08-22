import React from 'react'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabaseServer'
import DocumentosClient from './DocumentosClient'

export const metadata = {
  title: 'Documentos | Sistema de Gestión',
  description: 'Gestión de certificados y cartas de remisión',
}

export const revalidate = 0

export default async function DocumentosPage() {
  // 1. Obtener documentos
  const { data: documentos, error: errDocs } = await supabaseServer
    .from('documentos_clinicos')
    .select('*')
    .order('fecha_emision', { ascending: false })

  if (errDocs) {
    console.error('Error cargando documentos:', errDocs)
  }

  // 2. Obtener pacientes para mostrar el nombre
  let pacientes: any[] = []
  if (documentos && documentos.length > 0) {
    const pacienteIds = [...new Set(documentos.map(d => d.paciente_id))]
    const { data: pData } = await supabaseServer
      .from('pacientes')
      .select('id, nombre_completo, telefono, tipo_documento, numero_documento')
      .in('id', pacienteIds)
    if (pData) pacientes = pData
  }

  // Mapear el paciente dentro del documento para el cliente
  const docsConPaciente = documentos?.map(doc => ({
    ...doc,
    paciente: pacientes.find(p => p.id === doc.paciente_id) || null
  })) || []

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos y Certificados Clínicos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Emisión y gestión de certificados de asistencia y cartas de remisión.
          </p>
        </div>
      </div>

      <React.Suspense fallback={<div>Cargando...</div>}>
        <DocumentosClient documentos={docsConPaciente} />
      </React.Suspense>
    </div>
  )
}
