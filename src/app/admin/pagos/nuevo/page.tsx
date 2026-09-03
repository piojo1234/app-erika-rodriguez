import { supabaseServer } from '@/lib/supabaseServer'
import NuevoPagoForm from './NuevoPagoForm'
import Link from 'next/link'
export const metadata = {
  title: 'Registrar Pago | Psicóloga Erika Rodríguez',
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RegistrarPagoPage() {
  // Obtener pacientes para el select
  const { data: pacientes } = await supabaseServer
    .from('pacientes')
    .select('id, nombre_completo, tipo_documento, numero_documento, contratos!contratos_paciente_id_fkey(id, modalidad_atencion, estado)')
    .order('nombre_completo', { ascending: true })

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registrar Nuevo Pago</h1>
          <p className="mt-1 text-sm text-gray-500">
            Ingresa los detalles del pago para generar un recibo oficial.
          </p>
        </div>
        <Link
          href="/admin/pagos"
          className="text-sm font-medium text-[#0e787a] hover:text-[#224252] flex items-center"
        >
          &larr; Volver a Pagos
        </Link>
      </div>

      <NuevoPagoForm pacientes={pacientes || []} />
    </div>
  )
}
