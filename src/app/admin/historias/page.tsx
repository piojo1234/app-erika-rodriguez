import { supabaseServer } from '@/lib/supabaseServer'
import HistoriasClient from './HistoriasClient'
import Link from 'next/link'

export const metadata = {
  title: 'Historias Clínicas | Psicóloga Erika Rodríguez',
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HistoriasPage() {
  // Fetch historias clinicas and associated pacientes
  const { data: historias, error: historiasError } = await supabaseServer
    .from('historias_clinicas')
    .select(`
      *,
      pacientes (
        id,
        nombre_completo,
        tipo_documento,
        numero_documento,
        telefono
      )
    `)
    .order('updated_at', { ascending: false })

  if (historiasError && historiasError.code !== '42P01') {
    console.error('Error fetching historias:', historiasError)
  }

  // Count evoluciones per historia
  const { data: evoluciones } = await supabaseServer
    .from('evoluciones_clinicas')
    .select('historia_clinica_id')

  const evolucionesCount = evoluciones?.reduce((acc: any, evol: any) => {
    acc[evol.historia_clinica_id] = (acc[evol.historia_clinica_id] || 0) + 1
    return acc
  }, {}) || {}

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historias Clínicas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestión de anamnesis, exámenes mentales y evoluciones terapéuticas.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/historias/nueva"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0e787a] hover:bg-[#224252] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0e787a] transition-colors"
          >
            + Nueva Historia Clínica
          </Link>
        </div>
      </div>

      {historiasError?.code === '42P01' ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-lg font-medium text-red-800">Tabla no encontrada</h3>
          <p className="text-sm text-red-700 mt-2">
            La tabla <code>historias_clinicas</code> no existe en la base de datos Supabase. Por favor, ejecuta el script SQL provisto.
          </p>
        </div>
      ) : (
        <HistoriasClient historias={historias || []} evolucionesCount={evolucionesCount} />
      )}
    </div>
  )
}
