import { getCuentasCobro } from './actions'
import CuentasList from './CuentasList'

export const dynamic = 'force-dynamic'

export default async function CuentasCobroPage() {
  const { data: cuentas, error } = await getCuentasCobro()

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded">
        Error al cargar las cuentas de cobro: {error}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <CuentasList initialData={cuentas || []} />
    </div>
  )
}
