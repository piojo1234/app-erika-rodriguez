import { supabaseServer } from '@/lib/supabaseServer'
import PagosClient from './PagosClient'
import Link from 'next/link'

export const metadata = {
  title: 'Gestión de Pagos | Psicóloga Erika Rodríguez',
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PagosPage() {
  // Obtener pagos con datos del paciente
  const { data: pagos, error: pagosError } = await supabaseServer
    .from('pagos')
    .select(`
      *,
      pacientes (
        nombre_completo,
        tipo_documento,
        numero_documento,
        telefono,
        email
      )
    `)
    .order('created_at', { ascending: false })

  if (pagosError && pagosError.code !== '42P01') {
    // 42P01 es undefined table, que ocurrirá si no han corrido el script SQL
    console.error('Error fetching pagos:', pagosError)
  }

  // Obtener gastos
  const { data: gastos, error: gastosError } = await supabaseServer
    .from('gastos')
    .select('*')
    .order('fecha_gasto', { ascending: false })

  if (gastosError && gastosError.code !== '42P01') {
    console.error('Error fetching gastos:', gastosError)
  }

  const { data: pacientes } = await supabaseServer
    .from('pacientes')
    .select('*')
    .order('nombre_completo', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Pagos y Recibos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra los pagos recibidos y genera recibos digitales en PDF.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/pagos/nuevo"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0e787a] hover:bg-[#224252] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0e787a] transition-colors"
          >
            + Registrar Nuevo Pago
          </Link>
        </div>
      </div>

      {pagosError?.code === '42P01' || gastosError?.code === '42P01' ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-lg font-medium text-red-800">Tabla no encontrada</h3>
          <p className="text-sm text-red-700 mt-2">
            Alguna de las tablas (<code>pagos</code> o <code>gastos</code>) no existe en la base de datos Supabase. Por favor, ejecuta el script SQL provisto.
          </p>
        </div>
      ) : (
        <PagosClient pagos={pagos || []} pacientes={pacientes || []} gastos={gastos || []} />
      )}
    </div>
  )
}
