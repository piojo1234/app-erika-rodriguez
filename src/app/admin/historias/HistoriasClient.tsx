'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuditModal from '@/components/AuditModal'
import { anularHistoria, auditarEdicionHistoria } from './actions'

interface HistoriasClientProps {
  historias: any[]
  evolucionesCount: Record<string, number>
}

export default function HistoriasClient({ historias, evolucionesCount }: HistoriasClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [auditModal, setAuditModal] = useState<{isOpen: boolean, id: string, actionType: 'editar' | 'anular', isSubmitting: boolean}>({
    isOpen: false, id: '', actionType: 'editar', isSubmitting: false
  })
  const router = useRouter()

  const handleAuditConfirm = async (justificacion: string) => {
    if (!auditModal.id) return
    setAuditModal(prev => ({ ...prev, isSubmitting: true }))

    if (auditModal.actionType === 'anular') {
      await anularHistoria(auditModal.id, justificacion)
      setAuditModal({isOpen: false, id: '', actionType: 'editar', isSubmitting: false})
    } else {
      await auditarEdicionHistoria(auditModal.id, justificacion)
      setAuditModal({isOpen: false, id: '', actionType: 'editar', isSubmitting: false})
      router.push(`/admin/historias/${auditModal.id}/editar`)
    }
  }

  const filteredHistorias = historias.filter(h => {
    const term = searchTerm.toLowerCase()
    const paciente = h.pacientes?.nombre_completo?.toLowerCase() || ''
    const cedula = h.pacientes?.numero_documento?.toLowerCase() || ''
    return paciente.includes(term) || cedula.includes(term)
  })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Listado de Historias Clínicas</h2>
        <input
          type="text"
          placeholder="Buscar paciente o cédula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-[#0e787a] focus:border-[#0e787a]"
        />
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Actualización</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sesiones (Evoluciones)</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredHistorias.map((historia) => {
              const paciente = historia.pacientes
              const nombrePaciente = paciente?.nombre_completo || 'Desconocido'
              const sesiones = evolucionesCount[historia.id] || 0
              
              return (
                <tr key={historia.id} className={`hover:bg-gray-50 ${historia.estado === 'anulada' ? 'opacity-60 bg-gray-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {nombrePaciente} {historia.estado === 'anulada' && <span className="ml-2 text-xs text-red-500 font-bold">(ANULADA)</span>}
                    </div>
                    <div className="text-xs text-gray-500">{paciente?.tipo_documento} {paciente?.numero_documento}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span suppressHydrationWarning>
                      {new Date(historia.updated_at).toLocaleDateString('es-CO')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {sesiones}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <Link href={`/admin/historias/${historia.id}`} className="text-[#0e787a] hover:text-[#224252]">
                      Ver Detalle
                    </Link>
                    <span className="text-gray-300">|</span>
                    {historia.estado !== 'anulada' && (
                      <>
                        <button 
                          onClick={() => setAuditModal({isOpen: true, id: historia.id, actionType: 'editar', isSubmitting: false})}
                          className="text-[#f59e0b] hover:text-[#d97706]" title="Editar Historia"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <span className="text-gray-300">|</span>
                        <button 
                          onClick={() => setAuditModal({isOpen: true, id: historia.id, actionType: 'anular', isSubmitting: false})}
                          className="text-red-500 hover:text-red-700 font-semibold" title="Anular Historia"
                        >
                          Anular
                        </button>
                        <span className="text-gray-300">|</span>
                      </>
                    )}
                    <Link href={`/admin/historias/${historia.id}/evolucion`} className="text-[#25D366] hover:text-[#128C7E]">
                      Evoluciones
                    </Link>
                  </td>
                </tr>
              )
            })}
            {filteredHistorias.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                  No se encontraron historias clínicas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AuditModal
        isOpen={auditModal.isOpen}
        title={auditModal.actionType === 'anular' ? 'Anular Historia Clínica' : 'Editar Historia Clínica'}
        description={auditModal.actionType === 'anular' 
          ? 'Por favor justifique la anulación de esta historia clínica.' 
          : 'Por favor justifique el motivo de esta modificación al documento clínico.'}
        onConfirm={handleAuditConfirm}
        onCancel={() => setAuditModal({isOpen: false, id: '', actionType: 'editar', isSubmitting: false})}
        isSubmitting={auditModal.isSubmitting}
      />
    </div>
  )
}
