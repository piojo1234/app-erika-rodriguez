'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuditModal from '@/components/AuditModal'
import { anularHistoria, auditarEdicionHistoria } from '../actions'

interface HistoriaActionsProps {
  historiaId: string
  estado: string
}

export default function HistoriaActions({ historiaId, estado }: HistoriaActionsProps) {
  const [auditModal, setAuditModal] = useState<{isOpen: boolean, actionType: 'editar' | 'anular', isSubmitting: boolean}>({
    isOpen: false, actionType: 'editar', isSubmitting: false
  })
  const router = useRouter()

  const handleAuditConfirm = async (justificacion: string) => {
    setAuditModal(prev => ({ ...prev, isSubmitting: true }))

    if (auditModal.actionType === 'anular') {
      await anularHistoria(historiaId, justificacion)
      setAuditModal({isOpen: false, actionType: 'editar', isSubmitting: false})
      router.refresh()
    } else {
      await auditarEdicionHistoria(historiaId, justificacion)
      setAuditModal({isOpen: false, actionType: 'editar', isSubmitting: false})
      router.push(`/admin/historias/${historiaId}/editar`)
    }
  }

  if (estado === 'anulada') {
    return (
      <span className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-500 cursor-not-allowed">
        Historia Anulada
      </span>
    )
  }

  return (
    <>
      <button
        onClick={() => setAuditModal({isOpen: true, actionType: 'editar', isSubmitting: false})}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        Editar Historia
      </button>
      
      <button
        onClick={() => setAuditModal({isOpen: true, actionType: 'anular', isSubmitting: false})}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
      >
        Anular Historia
      </button>

      <AuditModal
        isOpen={auditModal.isOpen}
        title={auditModal.actionType === 'anular' ? 'Anular Historia Clínica' : 'Editar Historia Clínica'}
        description={auditModal.actionType === 'anular' 
          ? 'Por favor justifique la anulación de esta historia clínica.' 
          : 'Por favor justifique el motivo de esta modificación al documento clínico.'}
        onConfirm={handleAuditConfirm}
        onCancel={() => setAuditModal({isOpen: false, actionType: 'editar', isSubmitting: false})}
        isSubmitting={auditModal.isSubmitting}
      />
    </>
  )
}
