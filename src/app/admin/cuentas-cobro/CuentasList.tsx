'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getCuentasCobro, updateEstadoCuentaCobro, EstadoCuentaCobro } from './actions'
import CuentaCobroPDF from '@/components/cuentas/CuentaCobroPDF'
import { toast } from 'react-hot-toast'

type CuentaCobro = any // Using any for simplicity here, ideally typed

export default function CuentasList({ initialData }: { initialData: CuentaCobro[] }) {
  const [cuentas, setCuentas] = useState<CuentaCobro[]>(initialData)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  
  // PDF state
  const [cuentaForPDF, setCuentaForPDF] = useState<CuentaCobro | null>(null)

  const handleUpdateEstado = async (id: string, nuevoEstado: EstadoCuentaCobro) => {
    setIsUpdating(id)
    try {
      const { error } = await updateEstadoCuentaCobro(id, nuevoEstado)
      if (error) throw new Error(error)
      
      // Update local state
      setCuentas(cuentas.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c))
      toast.success(`Cuenta marcada como ${nuevoEstado}`)
    } catch (err: any) {
      toast.error(`Error: ${err.message}`)
    } finally {
      setIsUpdating(null)
    }
  }

  const handleWhatsApp = (cuenta: CuentaCobro) => {
    const telefono = cuenta.telefono_cliente?.replace(/\D/g, '') || ''
    if (!telefono) {
      toast.error('El cliente no tiene un teléfono registrado')
      return
    }
    
    // Format currency
    const montoFormatted = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(cuenta.monto)

    const mensaje = `Hola ${cuenta.nombre_cliente},\n\nTe comparto el aviso de cobro formal por concepto de:\n*${cuenta.concepto}*\n\nPor valor de: *${montoFormatted}*\n\nPor favor realizar el pago a la ${cuenta.tipo_cuenta} ${cuenta.banco} N° ${cuenta.numero_cuenta}.\n\nQuedo atenta, ¡gracias!`
    
    const url = `https://wa.me/57${telefono}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'pagada':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Pagada</span>
      case 'anulada':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Anulada</span>
      case 'pendiente':
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Cuentas de Cobro</h1>
        <Link 
          href="/admin/cuentas-cobro/nueva"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#0e787a] hover:bg-[#224252]"
        >
          + Nueva Cuenta de Cobro
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  # Consecutivo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Concepto
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cuentas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay cuentas de cobro registradas
                  </td>
                </tr>
              ) : (
                cuentas.map((cuenta) => (
                  <tr key={cuenta.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {cuenta.consecutivo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(cuenta.fecha_emision).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cuenta.nombre_cliente}
                      <div className="text-xs text-gray-500">{cuenta.documento_cliente}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={cuenta.concepto}>
                      {cuenta.concepto}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(cuenta.monto)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(cuenta.estado)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setCuentaForPDF(cuenta)}
                          className="text-[#0e787a] hover:text-[#224252] border border-[#0e787a] rounded p-1"
                          title="Descargar PDF"
                        >
                          📄
                        </button>
                        <button
                          onClick={() => handleWhatsApp(cuenta)}
                          className="text-green-600 hover:text-green-800 border border-green-600 rounded p-1"
                          title="Enviar por WhatsApp"
                        >
                          📱
                        </button>
                        
                        {cuenta.estado === 'pendiente' && (
                          <>
                            <button
                              onClick={() => handleUpdateEstado(cuenta.id, 'pagada')}
                              disabled={isUpdating === cuenta.id}
                              className="text-white bg-green-500 hover:bg-green-600 rounded p-1 text-xs px-2"
                            >
                              Pagada
                            </button>
                            <button
                              onClick={() => handleUpdateEstado(cuenta.id, 'anulada')}
                              disabled={isUpdating === cuenta.id}
                              className="text-white bg-red-500 hover:bg-red-600 rounded p-1 text-xs px-2"
                            >
                              Anular
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* PDF Generator hidden/overlay */}
      {cuentaForPDF && (
        <CuentaCobroPDF 
          cuenta={cuentaForPDF} 
          onClose={() => setCuentaForPDF(null)} 
        />
      )}
    </div>
  )
}
