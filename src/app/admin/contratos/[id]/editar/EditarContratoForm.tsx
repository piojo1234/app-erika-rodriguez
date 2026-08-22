'use client'

import { useState, useEffect } from 'react'
import { actualizarContrato } from '../../../nuevo-contrato/actions'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditarContratoForm({ contrato, paciente1, paciente2 }: { contrato: any, paciente1: any, paciente2: any }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  
  const [modalidad, setModalidad] = useState(contrato.modalidad_atencion || 'Individual')
  
  const [tipoServicio, setTipoServicio] = useState(contrato.tipo_servicio || 'Sesión Individual')
  const [cantidadSesiones, setCantidadSesiones] = useState(contrato.cantidad_sesiones || 1)
  const [valorTotal, setValorTotal] = useState(contrato.valor_total || 120000)

  // Extraer metadata si existe
  const meta = contrato.metadata || {}
  
  const [requiereTutor2, setRequiereTutor2] = useState(meta.requiere_tutor_2 || false)
  const [requiereAsentimiento, setRequiereAsentimiento] = useState(meta.requiere_asentimiento || false)

  const serviciosPorModalidad: Record<string, string[]> = {
    'Individual': ['Sesión Individual', 'Paquete de Sesiones', 'Evaluación Psicológica'],
    'Menor de Edad': ['Sesión Individual', 'Paquete de Sesiones', 'Evaluación Psicológica'],
    'Pareja': ['Terapia de Pareja', 'Paquete de Sesiones']
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const formData = new FormData(form)
      const res = await actualizarContrato(contrato.id, formData)

      if (!res.success) {
        setErrorMsg(res.error || 'Error desconocido')
        toast.error(res.error || 'Error desconocido')
        return
      }

      toast.success('¡Contrato actualizado exitosamente!')
      router.push('/admin')
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado al procesar la solicitud.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 bg-white">
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-start">
          <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="font-semibold text-sm">Error en la actualización</h3>
            <p className="text-sm mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección Paciente */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Paciente</h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            
            <div className="sm:col-span-6">
              <label htmlFor="nombre_paciente" className="block text-sm font-medium text-gray-800">
                {modalidad === 'Menor de Edad' ? 'Nombre Completo del Menor' : (modalidad === 'Pareja' ? 'Nombre Completo (Paciente 1)' : 'Nombre Completo')}
              </label>
              <div className="mt-1">
                <input required type="text" name="nombre_paciente" defaultValue={paciente1?.nombre_completo} id="nombre_paciente" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="tipo_documento" className="block text-sm font-medium text-gray-800">Tipo de Documento</label>
              <div className="mt-1">
                <select required id="tipo_documento" name="tipo_documento" defaultValue={paciente1?.tipo_documento} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="TI">Tarjeta de Identidad</option>
                  <option value="RC">Registro Civil</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="numero_documento" className="block text-sm font-medium text-gray-800">Número de Documento</label>
              <div className="mt-1">
                <input required type="text" name="numero_documento" defaultValue={paciente1?.numero_documento} id="numero_documento" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
              </div>
            </div>

            {modalidad !== 'Menor de Edad' && (
              <>
                <div className="sm:col-span-3">
                  <label htmlFor="email_paciente" className="block text-sm font-medium text-gray-800">Correo Electrónico</label>
                  <div className="mt-1">
                    <input required type="email" name="email_paciente" defaultValue={paciente1?.email} id="email_paciente" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="telefono_paciente" className="block text-sm font-medium text-gray-800">Teléfono / WhatsApp</label>
                  <div className="mt-1">
                    <input required type="tel" name="telefono_paciente" defaultValue={paciente1?.telefono} id="telefono_paciente" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
                  </div>
                </div>
              </>
            )}

          </div>
        </div>

        {/* Sección Segundo Paciente (Condicional) */}
        {modalidad === 'Pareja' && (
        <div className="border-b border-gray-200 pb-6 pt-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Segundo Paciente</h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            
            <div className="sm:col-span-6">
              <label htmlFor="nombre_paciente_2" className="block text-sm font-medium text-gray-800">Nombre Completo (Paciente 2)</label>
              <div className="mt-1">
                <input required type="text" name="nombre_paciente_2" defaultValue={paciente2?.nombre_completo} id="nombre_paciente_2" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="tipo_documento_2" className="block text-sm font-medium text-gray-800">Tipo de Documento</label>
              <div className="mt-1">
                <select required id="tipo_documento_2" name="tipo_documento_2" defaultValue={paciente2?.tipo_documento} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="TI">Tarjeta de Identidad</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="numero_documento_2" className="block text-sm font-medium text-gray-800">Número de Documento</label>
              <div className="mt-1">
                <input required type="text" name="numero_documento_2" defaultValue={paciente2?.numero_documento} id="numero_documento_2" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="email_paciente_2" className="block text-sm font-medium text-gray-800">Correo Electrónico</label>
              <div className="mt-1">
                <input required type="email" name="email_paciente_2" defaultValue={paciente2?.email} id="email_paciente_2" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="telefono_paciente_2" className="block text-sm font-medium text-gray-800">Teléfono / WhatsApp</label>
              <div className="mt-1">
                <input required type="tel" name="telefono_paciente_2" defaultValue={paciente2?.telefono} id="telefono_paciente_2" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
              </div>
            </div>

          </div>
        </div>
        )}

        {/* Sección Tutores para Menor de Edad */}
        {modalidad === 'Menor de Edad' && (
          <div className="border-b border-gray-200 pb-6 pt-2 space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-[#224252] mb-4">Datos del Representante Legal / Tutor 1</h3>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Nombre Completo</label>
                  <input required type="text" name="tutor_1_nombre" defaultValue={meta?.tutor_1?.nombre} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Parentesco</label>
                  <select required name="tutor_1_parentesco" defaultValue={meta?.tutor_1?.parentesco} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                    <option value="Padre">Padre</option>
                    <option value="Madre">Madre</option>
                    <option value="Representante Legal">Representante Legal</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Tipo Documento</label>
                  <select required name="tutor_1_tipo_doc" defaultValue={meta?.tutor_1?.tipo_doc} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                    <option value="CC">Cédula</option>
                    <option value="CE">Extranjería</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Número de Documento</label>
                  <input required type="text" name="tutor_1_num_doc" defaultValue={meta?.tutor_1?.num_doc} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
                </div>
                {/* Asumimos que los pacientes (tutor 1) usan los campos email/telefono en el contrato o en pacientes. En el form de menores se le pedía email y telefono del tutor pero se guardaban en pacientes o metadata. Aquí recuperamos de paciente1 para tutor_1_email, tutor_1_telefono o dejamos vacío si no se guardaron. El form original de menores enviaba `tutor_1_email` pero NO se guardaba en metadata. Oh! 
                    Mirando crearContrato, tutor_1_email y telefono no se guardaban en metadata. Guardaremos vacío o lo que el usuario ponga. */}
                <div className="sm:col-span-3">
                  <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Email</label>
                  <input required type="email" name="tutor_1_email" defaultValue={paciente1?.email || ''} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Teléfono (WhatsApp)</label>
                  <input required type="tel" name="tutor_1_telefono" defaultValue={paciente1?.telefono || ''} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="requiere_tutor_2"
                  name="requiere_tutor_2"
                  type="checkbox"
                  checked={requiereTutor2}
                  onChange={(e) => setRequiereTutor2(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                />
                <label htmlFor="requiere_tutor_2" className="ml-3 text-sm font-medium text-gray-700">
                  ¿Requiere firma de un segundo padre/tutor?
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="requiere_asentimiento"
                  name="requiere_asentimiento"
                  type="checkbox"
                  checked={requiereAsentimiento}
                  onChange={(e) => setRequiereAsentimiento(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                />
                <label htmlFor="requiere_asentimiento" className="ml-3 text-sm font-medium text-gray-700">
                  ¿Incluir bloque de firma para el Asentimiento Informado del menor?
                </label>
              </div>
            </div>

            {requiereTutor2 && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-md font-semibold text-[#224252] mb-4">Tutor 2</h3>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Nombre Completo</label>
                    <input required type="text" name="tutor_2_nombre" defaultValue={meta?.tutor_2?.nombre} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Parentesco</label>
                    <select required name="tutor_2_parentesco" defaultValue={meta?.tutor_2?.parentesco} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                      <option value="Madre">Madre</option>
                      <option value="Padre">Padre</option>
                      <option value="Representante Legal">Representante Legal</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Tipo Documento</label>
                    <select required name="tutor_2_tipo_doc" defaultValue={meta?.tutor_2?.tipo_doc} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                      <option value="CC">Cédula</option>
                      <option value="CE">Extranjería</option>
                      <option value="Pasaporte">Pasaporte</option>
                    </select>
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Número de Documento</label>
                    <input required type="text" name="tutor_2_num_doc" defaultValue={meta?.tutor_2?.num_doc} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Email</label>
                    <input type="email" name="tutor_2_email" className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Teléfono (WhatsApp)</label>
                    <input type="tel" name="tutor_2_telefono" className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sección Servicio */}
        <div className="pt-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Condiciones del Servicio</h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            
            <div className="sm:col-span-6">
              <label htmlFor="modalidad_atencion" className="block text-sm font-medium text-gray-800">Modalidad de Atención</label>
              <div className="mt-1">
                <select required value={modalidad} onChange={(e) => setModalidad(e.target.value)} id="modalidad_atencion" name="modalidad_atencion" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                  <option value="Individual">Individual</option>
                  <option value="Pareja">Pareja</option>
                  <option value="Menor de Edad">Menor de Edad</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="tipo_servicio" className="block text-sm font-medium text-gray-800">Tipo de Servicio</label>
              <div className="mt-1">
                <select required value={tipoServicio} onChange={(e) => setTipoServicio(e.target.value)} id="tipo_servicio" name="tipo_servicio" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                  {(serviciosPorModalidad[modalidad] || []).map(srv => (
                    <option key={srv} value={srv}>{srv}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="cantidad_sesiones" className="block text-sm font-medium text-gray-800">Cantidad de Sesiones</label>
              <div className="mt-1">
                <input required type="number" min="1" value={cantidadSesiones} onChange={(e) => setCantidadSesiones(parseInt(e.target.value) || 1)} name="cantidad_sesiones" id="cantidad_sesiones" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="valor_total_cop" className="block text-sm font-medium text-gray-800">Valor Total (COP)</label>
              <div className="mt-1">
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input required type="number" min="0" value={valorTotal} onChange={(e) => setValorTotal(parseFloat(e.target.value) || 0)} name="valor_total_cop" id="valor_total_cop" className="w-full pl-7 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
                </div>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="ciudad" className="block text-sm font-medium text-gray-800">Ciudad de Firma</label>
              <div className="mt-1">
                <input required type="text" defaultValue={contrato.ciudad || 'Villavicencio'} name="ciudad" id="ciudad" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
              </div>
            </div>

          </div>
        </div>

        <div className="pt-5 border-t border-gray-200 flex justify-end">
          <Link
            href="/admin"
            className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0e787a] mr-4"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center rounded-md border border-transparent bg-[#0e787a] py-2 px-6 text-sm font-medium text-white shadow-sm hover:bg-[#224252] focus:outline-none focus:ring-2 focus:ring-[#0e787a] focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Guardando Cambios...' : 'Actualizar Contrato'}
          </button>
        </div>
      </form>
    </div>
  )
}
