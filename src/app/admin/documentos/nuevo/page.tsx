import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabaseServer'
import NuevoDocumentoForm from './NuevoDocumentoForm'

export const metadata = {
  title: 'Nuevo Documento | Sistema de Gestión',
  description: 'Emitir un nuevo documento o certificado',
}

export default async function NuevoDocumentoPage() {
  // Obtener pacientes activos
  const { data: pacientes, error } = await supabaseServer
    .from('pacientes')
    .select('id, nombre_completo, numero_documento, tipo_documento')
    .order('nombre_completo', { ascending: true })

  if (error) {
    console.error('Error fetching pacientes:', error)
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Emitir Nuevo Documento</h1>
        <p className="mt-1 text-sm text-gray-500">
          Completa los datos para generar un certificado o carta de remisión con el formato oficial.
        </p>
      </div>
      
      <NuevoDocumentoForm pacientes={pacientes || []} />
    </div>
  )
}
