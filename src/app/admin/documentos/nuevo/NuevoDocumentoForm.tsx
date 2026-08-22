'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { crearDocumento, redactarMotivoRemision } from '../actions'

export default function NuevoDocumentoForm({ pacientes }: { pacientes: any[] }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [tipoDocumento, setTipoDocumento] = useState('certificado_asistencia')
  const [pacienteId, setPacienteId] = useState('')
  const [especialidadDestino, setEspecialidadDestino] = useState('')
  const [motivoRemision, setMotivoRemision] = useState('')

  const handleAIMotivo = async () => {
    if (!pacienteId) {
      toast.error('Selecciona un paciente primero.')
      return
    }
    if (!especialidadDestino) {
      toast.error('Escribe la especialidad de destino primero.')
      return
    }

    setIsAiLoading(true)
    const res = await redactarMotivoRemision(pacienteId, especialidadDestino)
    if (res.success && res.text) {
      setMotivoRemision(res.text)
      toast.success('Motivo redactado por IA')
    } else {
      toast.error(res.error || 'No se pudo generar el texto')
    }
    setIsAiLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const res = await crearDocumento(formData)

    if (res.success) {
      toast.success('Documento generado exitosamente')
      router.push('/admin/documentos?new=' + res.id)
    } else {
      toast.error(res.error || 'Error al generar el documento')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        
        {/* Información Básica */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Información Básica</h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="tipo_documento" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Documento *
              </label>
              <select
                id="tipo_documento"
                name="tipo_documento"
                required
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
              >
                <option value="certificado_asistencia">Certificado de Asistencia</option>
                <option value="carta_remision">Carta de Remisión</option>
              </select>
            </div>

            <div>
              <label htmlFor="paciente_id" className="block text-sm font-medium text-gray-700 mb-1">
                Paciente *
              </label>
              <select
                id="paciente_id"
                name="paciente_id"
                required
                value={pacienteId}
                onChange={(e) => setPacienteId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
              >
                <option value="">Seleccione un paciente...</option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre_completo} - {p.numero_documento}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="dirigido_a" className="block text-sm font-medium text-gray-700 mb-1">
                Dirigido a / Entidad *
              </label>
              <input
                type="text"
                id="dirigido_a"
                name="dirigido_a"
                required
                placeholder="Ej: A quien pueda interesar, Dr. Psiquiatra, Juzgado Primero..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
              />
            </div>
          </div>
        </div>

        {/* Campos Específicos: Certificado */}
        {tipoDocumento === 'certificado_asistencia' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Detalles del Certificado</h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Inicio de Atención *
                </label>
                <input
                  type="date"
                  id="fecha_inicio"
                  name="fecha_inicio"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
                />
              </div>

              <div>
                <label htmlFor="fecha_fin" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Fin de Atención <span className="text-gray-400 font-normal">(Dejar en blanco si sigue activo)</span>
                </label>
                <input
                  type="date"
                  id="fecha_fin"
                  name="fecha_fin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
                />
              </div>

              <div>
                <label htmlFor="total_sesiones" className="block text-sm font-medium text-gray-700 mb-1">
                  Total de Sesiones Asistidas *
                </label>
                <input
                  type="number"
                  id="total_sesiones"
                  name="total_sesiones"
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
                />
              </div>

              <div>
                <label htmlFor="estado_proceso" className="block text-sm font-medium text-gray-700 mb-1">
                  Estado del Proceso *
                </label>
                <select
                  id="estado_proceso"
                  name="estado_proceso"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
                >
                  <option value="Activo">Activo / En curso</option>
                  <option value="Finalizado (De alta)">Finalizado (De alta)</option>
                  <option value="Suspendido por el paciente">Suspendido por el paciente</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="observacion" className="block text-sm font-medium text-gray-700 mb-1">
                  Observación adicional <span className="text-gray-400 font-normal">(Opcional)</span>
                </label>
                <textarea
                  id="observacion"
                  name="observacion"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Campos Específicos: Carta de Remisión */}
        {tipoDocumento === 'carta_remision' && (
          <div className="space-y-6 bg-purple-50 p-6 rounded-lg border border-purple-100">
            <h3 className="text-lg font-semibold text-purple-900 border-b border-purple-200 pb-2">
              Detalles de la Remisión
            </h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="especialidad_destino" className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidad de Destino *
                </label>
                <input
                  type="text"
                  id="especialidad_destino"
                  name="especialidad_destino"
                  required
                  value={especialidadDestino}
                  onChange={(e) => setEspecialidadDestino(e.target.value)}
                  placeholder="Ej: Psiquiatría, Neurología, Medicina General..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="sm:col-span-2 relative">
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="motivo_remision" className="block text-sm font-medium text-gray-700">
                    Motivo de Remisión y Síntomas *
                  </label>
                  <button
                    type="button"
                    onClick={handleAIMotivo}
                    disabled={isAiLoading || !pacienteId}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded hover:bg-purple-200 disabled:opacity-50 transition-colors"
                  >
                    {isAiLoading ? 'Generando...' : '✨ Redactar Clínico con IA'}
                  </button>
                </div>
                <textarea
                  id="motivo_remision"
                  name="motivo_remision"
                  required
                  rows={4}
                  value={motivoRemision}
                  onChange={(e) => setMotivoRemision(e.target.value)}
                  placeholder="Describe la justificación clínica..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <p className="mt-1 text-xs text-gray-500">
                  La IA utilizará la última evolución registrada de este paciente para generar una redacción formal.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="impresion_diagnostica" className="block text-sm font-medium text-gray-700 mb-1">
                  Impresión Diagnóstica (CIE-10) *
                </label>
                <input
                  type="text"
                  id="impresion_diagnostica"
                  name="impresion_diagnostica"
                  required
                  placeholder="Ej: F32.1 Episodio depresivo moderado"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="objetivos_derivacion" className="block text-sm font-medium text-gray-700 mb-1">
                  Objetivos de la Derivación *
                </label>
                <input
                  type="text"
                  id="objetivos_derivacion"
                  name="objetivos_derivacion"
                  required
                  placeholder="Ej: Valoración por especialista y posible tratamiento farmacológico"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-6 border-t border-gray-200 flex justify-end gap-4">
          <Link
            href="/admin/documentos"
            className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0e787a]"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#0e787a] hover:bg-[#224252] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0e787a] disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : 'Generar Documento'}
          </button>
        </div>
      </form>
    </div>
  )
}
