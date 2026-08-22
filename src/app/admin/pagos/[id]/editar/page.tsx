import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabaseServer'
import EditarPagoForm from './EditarPagoForm'

export const metadata = {
  title: 'Editar Pago | Sistema de Gestión',
  description: 'Modificar los datos de un pago registrado',
}
export default async function EditarPagoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Obtener el pago
  const { data: pago, error: errorPago } = await supabaseServer
    .from('pagos')
    .select('*')
    .eq('id', id)
    .single()

  if (errorPago || !pago) {
    console.error('Error fetching pago:', errorPago ? JSON.stringify(errorPago, null, 2) : 'Pago no encontrado')
    redirect('/admin/pagos')
  }

  // Obtener pacientes activos
  const { data: pacientes, error } = await supabaseServer
    .from('pacientes')
    .select('id, nombre_completo, numero_documento, tipo_documento, telefono')
    .order('nombre_completo', { ascending: true })

  if (error) {
    console.error('Error fetching pacientes:', JSON.stringify(error, null, 2))
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-slate-800 px-6 py-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">Editar Pago / Ingreso</h1>
          <p className="text-slate-300 mt-1 text-sm">
            Modifica la información del comprobante. Los cambios quedarán registrados en el sistema.
          </p>
        </div>
        
        <EditarPagoForm pacientes={pacientes || []} pago={pago} />
      </div>
    </div>
  )
}
