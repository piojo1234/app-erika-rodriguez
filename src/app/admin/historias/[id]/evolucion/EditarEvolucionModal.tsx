'use client'

import React, { useState } from 'react'
import { actualizarEvolucion } from './actions'

interface Evolucion {
  id: string
  numero_sesion: number
  fecha_sesion: string
  asistente_sesion: string | null
  evolucion_terapeutica: string
  observaciones_valoracion: string | null
  diagnostico_cie10: string | null
}

export default function EditarEvolucionModal({ evolucion, esPareja }: { evolucion: Evolucion, esPareja: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    try {
      const formData = new FormData(e.currentTarget)
      const res = await actualizarEvolucion(evolucion.id, formData)
      
      if (res && !res.success) {
        alert('Error al actualizar la sesión: ' + res.error)
      } else {
        setIsOpen(false)
        alert('Sesión actualizada correctamente.')
      }
    } catch (error: any) {
      alert('Error inesperado al actualizar la sesión: ' + error.message)
    } finally {
      setIsPending(false)
    }
  }

  // Formato correcto para datetime-local
  // de: "2026-08-21T20:38:50-05:00" a "YYYY-MM-DDTHH:MM"
  let defaultDate = ''
  if (evolucion.fecha_sesion) {
    const d = new Date(evolucion.fecha_sesion)
    // Para evitar problemas de zona horaria, formamos la cadena con getLocal...
    // Aunque toISOString().slice(0,16) sirve en UTC, es mejor un offset seguro
    defaultDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-gray-400 hover:text-[#0e787a] p-1 rounded-md transition-colors"
        title="Editar Sesión"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto font-sans">
            <div className="px-6 py-4 border-b border-gray-200 bg-[#0e787a] text-white flex justify-between items-center sticky top-0">
              <h2 className="text-lg font-semibold">Editar Sesión N° {evolucion.numero_sesion}</h2>
              <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800">Fecha de Sesión *</label>
                <input required type="datetime-local" name="fecha_sesion" defaultValue={defaultDate} className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg shadow-sm focus:ring-[#0e787a]" />
              </div>

              {esPareja && (
                <div>
                  <label className="block text-sm font-semibold text-slate-800">Atención realizada a *</label>
                  <select required name="asistente_sesion" defaultValue={evolucion.asistente_sesion || 'Ambos'} className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg shadow-sm focus:ring-[#0e787a]">
                    <option value="Ambos">👥 Ambos (Conjunta)</option>
                    <option value="Paciente A">👤 Paciente A (Individual)</option>
                    <option value="Paciente B">👤 Paciente B (Individual)</option>
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-slate-800">Evolución Detallada *</label>
                <textarea required name="evolucion_terapeutica" defaultValue={evolucion.evolucion_terapeutica} rows={5} className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg shadow-sm focus:ring-[#0e787a]"></textarea>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800">Observaciones</label>
                <textarea name="observaciones_valoracion" defaultValue={evolucion.observaciones_valoracion || ''} rows={3} className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg shadow-sm focus:ring-[#0e787a]"></textarea>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800">Diagnóstico CIE-10 Actualizado</label>
                <input type="text" name="diagnostico_cie10" defaultValue={evolucion.diagnostico_cie10 || ''} className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg shadow-sm focus:ring-[#0e787a]" />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-slate-700 bg-white hover:bg-gray-50"
                  disabled={isPending}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#0e787a] py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-[#0b5c5d]"
                  disabled={isPending}
                >
                  {isPending ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
