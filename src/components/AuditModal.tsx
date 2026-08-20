'use client'

import React, { useState } from 'react'

interface AuditModalProps {
  isOpen: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: (justificacion: string) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export default function AuditModal({
  isOpen,
  title,
  description,
  confirmText = 'Continuar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  isSubmitting = false
}: AuditModalProps) {
  const [justificacion, setJustificacion] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleConfirm = () => {
    if (justificacion.trim().length < 10) {
      setError('Por favor, ingresa una justificación válida (mínimo 10 caracteres).')
      return
    }
    setError('')
    onConfirm(justificacion)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-fade-in-up">
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            Justificación / Motivo <span className="text-red-500">*</span>
          </label>
          <textarea
            value={justificacion}
            onChange={(e) => {
              setJustificacion(e.target.value)
              if (error) setError('')
            }}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
            rows={3}
            placeholder="Explique el motivo de esta acción..."
          ></textarea>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={() => {
              setJustificacion('')
              setError('')
              onCancel()
            }}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0e787a] disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 bg-orange-600 hover:bg-orange-700 focus:ring-orange-600 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </>
            ) : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
