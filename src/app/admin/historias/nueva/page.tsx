import { supabaseServer } from '@/lib/supabaseServer'
import HistoriaForm from '../HistoriaForm'
import { guardarHistoriaClinica } from './actions'
import Link from 'next/link'

export const metadata = {
  title: 'Nueva Historia Clínica | Psicóloga Erika Rodríguez',
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NuevaHistoriaPage() {
  // Obtener pacientes
  const { data: pacientes } = await supabaseServer
    .from('pacientes')
    .select('id, nombre_completo, numero_documento')
    .order('nombre_completo', { ascending: true })

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 font-sans">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Apertura de Historia Clínica</h1>
          <p className="mt-1 text-sm text-gray-500">
            Formato de Anamnesis y Examen Mental (FBE.70 Versión 01)
          </p>
        </div>
        <Link
          href="/admin/historias"
          className="text-sm font-medium text-[#0e787a] hover:text-[#224252]"
        >
          &larr; Volver a Historias
        </Link>
      </div>

      <HistoriaForm pacientes={pacientes || []} formAction={guardarHistoriaClinica} />
    </div>
  )
}
