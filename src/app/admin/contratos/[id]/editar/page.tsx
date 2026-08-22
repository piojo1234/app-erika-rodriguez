import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import EditarContratoForm from './EditarContratoForm'

export const metadata = {
  title: 'Editar Contrato | Sistema de Gestión',
  description: 'Modificar los datos de un contrato',
}
export default async function EditarContratoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Obtener el contrato
  const { data: contrato, error: errorContrato } = await supabase
    .from('contratos')
    .select('*')
    .eq('id', id)
    .single()

  if (errorContrato || !contrato) {
    redirect('/admin')
  }

  if (contrato.estado === 'firmado') {
    // Si ya está firmado, no se puede editar, redirigir
    redirect('/admin')
  }

  // Obtener pacientes para pre-llenar los datos
  const { data: paciente1 } = await supabase
    .from('pacientes')
    .select('*')
    .eq('id', contrato.paciente_id)
    .single()

  let paciente2 = null
  if (contrato.paciente_2_id) {
    const { data } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', contrato.paciente_2_id)
      .single()
    paciente2 = data
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-slate-800 px-6 py-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">Editar Contrato Terapéutico</h1>
          <p className="text-slate-300 mt-1 text-sm">
            Modifica la información del contrato. Al guardar, el texto legal se regenerará con las nuevas condiciones para que el paciente lo firme.
          </p>
        </div>
        
        <EditarContratoForm contrato={contrato} paciente1={paciente1} paciente2={paciente2} />
      </div>
    </div>
  )
}
