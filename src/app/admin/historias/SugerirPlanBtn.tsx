'use client'

import { useState } from 'react'
import { generarPlanIntervencionAction } from './ai-actions'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { copiarAlPortapapeles } from '@/utils/helpers'

export default function SugerirPlanBtn({ 
  historia, 
  evoluciones 
}: { 
  historia: any, 
  evoluciones: any[] 
}) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [showModal, setShowModal] = useState(false)

  const handleSugerir = async () => {
    setLoading(true)
    setShowModal(true)
    setResult('')
    try {
      const plan = await generarPlanIntervencionAction({ historiaClinica: historia, evoluciones })
      setResult(plan)
    } catch (error: any) {
      setResult('Error al generar sugerencia: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopiar = () => {
    copiarAlPortapapeles(result, 'Plan copiado al portapapeles.')
  }

  const handleGuardar = async () => {
    try {
      setLoading(true)
      const diag = historia.analisis_diagnostico || {}
      const newDiag = { ...diag, plan: result }
      
      const { error } = await supabase
        .from('historias_clinicas')
        .update({ analisis_diagnostico: newDiag })
        .eq('id', historia.id)

      if (error) throw error
      
      toast.success('Plan guardado exitosamente en la historia.')
      window.location.reload()
    } catch (error: any) {
      toast.error('Error al guardar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleSugerir}
        disabled={loading}
        className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
      >
        ✨ Sugerir Plan de Intervención con IA
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-black/50">
          <div className="relative w-full max-w-3xl mx-auto my-6 p-4">
            <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
              <div className="flex items-start justify-between p-5 border-b border-solid border-slate-200 rounded-t">
                <h3 className="text-xl font-semibold text-purple-700 flex items-center">
                  ✨ Plan de Intervención Sugerido
                </h3>
                <button
                  className="p-1 ml-auto bg-transparent border-0 text-black float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                  onClick={() => setShowModal(false)}
                >
                  <span className="text-black h-6 w-6 text-2xl block outline-none focus:outline-none">
                    ×
                  </span>
                </button>
              </div>
              <div className="relative p-6 flex-auto max-h-[60vh] overflow-y-auto">
                {loading && !result ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                    {result}
                  </pre>
                )}
              </div>
              <div className="flex items-center justify-end p-6 border-t border-solid border-slate-200 rounded-b">
                <button
                  className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                  type="button"
                  onClick={() => setShowModal(false)}
                >
                  Cerrar
                </button>
                <button
                  className="bg-gray-600 text-white active:bg-gray-700 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                  type="button"
                  onClick={handleCopiar}
                  disabled={loading || !result}
                >
                  Copiar
                </button>
                <button
                  className="bg-purple-600 text-white active:bg-purple-700 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                  type="button"
                  onClick={handleGuardar}
                  disabled={loading || !result}
                >
                  Guardar en la Historia
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
