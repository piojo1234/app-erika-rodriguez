import { getPacientesBasic } from '../actions'
import NuevaCuentaForm from './NuevaCuentaForm'

export const dynamic = 'force-dynamic'

export default async function NuevaCuentaPage() {
  const { data: pacientes } = await getPacientesBasic()

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nueva Cuenta de Cobro</h1>
        <p className="text-sm text-gray-500 mt-1">Completa los datos para generar una nueva cuenta de cobro</p>
      </div>
      
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <NuevaCuentaForm pacientes={pacientes || []} />
        </div>
      </div>
    </div>
  )
}
