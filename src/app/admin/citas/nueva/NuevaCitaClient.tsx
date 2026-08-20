'use client'

import React, { useState } from 'react'
import { maskDocument } from '@/utils/helpers'
import { agendarCita } from '../actions'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface NuevaCitaClientProps {
  pacientes: any[]
}

export default function NuevaCitaClient({ pacientes }: NuevaCitaClientProps) {
  const router = useRouter()
  const [tipoEvento, setTipoEvento] = useState<'cita_clinica' | 'compromiso_personal'>('cita_clinica')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true)
      const res = await agendarCita(formData)
      if (res && res.success === false) {
        toast.error(res.error || "Error al agendar cita")
      } else {
        toast.success("Cita agendada exitosamente")
        router.push('/admin/citas')
      }
    } catch (err: any) {
      toast.error("Error de conexión.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setTipoEvento('cita_clinica')}
          className={`flex-1 py-4 text-center text-sm font-semibold transition-colors ${
            tipoEvento === 'cita_clinica'
              ? 'text-[#0e787a] border-b-2 border-[#0e787a] bg-gray-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Cita de Paciente
        </button>
        <button
          type="button"
          onClick={() => setTipoEvento('compromiso_personal')}
          className={`flex-1 py-4 text-center text-sm font-semibold transition-colors ${
            tipoEvento === 'compromiso_personal'
              ? 'text-[#0e787a] border-b-2 border-[#0e787a] bg-gray-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Compromiso Personal
        </button>
      </div>

      <form action={handleSubmit} className="p-8 space-y-6">
        <input type="hidden" name="tipo_evento" value={tipoEvento} />

        {tipoEvento === 'cita_clinica' ? (
          <>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">Paciente *</label>
              <select required name="paciente_id" className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:text-slate-900 rounded-lg shadow-sm focus:ring-[#0e787a] focus:border-[#0e787a]">
                <option value="">Seleccione un paciente...</option>
                {pacientes?.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre_completo} - {maskDocument(p.numero_documento)}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">Fecha *</label>
                <input required type="date" name="fecha" className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:text-slate-900 rounded-lg shadow-sm focus:ring-[#0e787a] focus:border-[#0e787a]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">Hora *</label>
                <input required type="time" name="hora" className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:text-slate-900 rounded-lg shadow-sm focus:ring-[#0e787a] focus:border-[#0e787a]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">Duración</label>
                <select name="duracion_minutos" className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:text-slate-900 rounded-lg shadow-sm focus:ring-[#0e787a] focus:border-[#0e787a]">
                  <option value="45">45 minutos</option>
                  <option value="50">50 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="90">1.5 horas</option>
                  <option value="120">2 horas</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">Modalidad</label>
                <select name="modalidad" className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:text-slate-900 rounded-lg shadow-sm focus:ring-[#0e787a] focus:border-[#0e787a]">
                  <option value="Presencial">Presencial</option>
                  <option value="Virtual (Meet/Zoom)">Virtual (Meet/Zoom)</option>
                </select>
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">Título del Compromiso *</label>
              <input required type="text" name="titulo" placeholder="Ej. Reunión, Trámite personal, Almuerzo..." className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:text-slate-900 rounded-lg shadow-sm focus:ring-[#0e787a] focus:border-[#0e787a]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">Fecha *</label>
                <input required type="date" name="fecha" className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:text-slate-900 rounded-lg shadow-sm focus:ring-[#0e787a] focus:border-[#0e787a]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">Hora de Inicio *</label>
                <input required type="time" name="hora" className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:text-slate-900 rounded-lg shadow-sm focus:ring-[#0e787a] focus:border-[#0e787a]" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">Hora de Fin (Opcional)</label>
              <input type="time" name="hora_fin" className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:text-slate-900 rounded-lg shadow-sm focus:ring-[#0e787a] focus:border-[#0e787a]" />
              <p className="text-xs text-gray-500 mt-1">Si dejas esto en blanco, por defecto durará 1 hora.</p>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">Notas / Observaciones</label>
          <textarea name="observaciones" rows={3} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:text-slate-900 rounded-lg shadow-sm focus:ring-[#0e787a] focus:border-[#0e787a]" placeholder={tipoEvento === 'cita_clinica' ? "Motivo o indicaciones previas..." : "Anotaciones adicionales..."}></textarea>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#0e787a] py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-[#0b5c5d] disabled:opacity-50"
          >
            {isSubmitting ? 'Procesando...' : (tipoEvento === 'cita_clinica' ? 'Confirmar Agendamiento' : 'Guardar Compromiso')}
          </button>
        </div>
      </form>
    </div>
  )
}
