'use client'

import { useState, useEffect } from 'react'
import { crearContrato } from './actions'
import toast from 'react-hot-toast'
import { copiarAlPortapapeles } from '@/utils/helpers'
import { useRouter } from 'next/navigation'

export default function NuevoContratoPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [modalidad, setModalidad] = useState('Individual')
  const [requiereTutor2, setRequiereTutor2] = useState(false)
  const [requiereAsentimiento, setRequiereAsentimiento] = useState(false)
  
  const [tipoServicio, setTipoServicio] = useState('Sesión Individual')
  const [cantidadSesiones, setCantidadSesiones] = useState(1)
  const [valorTotal, setValorTotal] = useState(120000)

  const serviciosPorModalidad: Record<string, string[]> = {
    'Individual': ['Sesión Individual', 'Paquete de Sesiones', 'Evaluación Psicológica'],
    'Menor de Edad': ['Sesión Individual', 'Paquete de Sesiones', 'Evaluación Psicológica'],
    'Pareja': ['Terapia de Pareja', 'Paquete de Sesiones']
  }

  const tarifasBase: Record<string, number> = {
    'Sesión Individual': 120000,
    'Terapia de Pareja': 150000,
    'Evaluación Psicológica': 200000,
    'Paquete de Sesiones': 120000
  }

  useEffect(() => {
    const validServices = serviciosPorModalidad[modalidad] || [];
    if (!validServices.includes(tipoServicio)) {
      setTipoServicio(validServices[0]);
    }
  }, [modalidad])

  useEffect(() => {
    let baseRate = tarifasBase[tipoServicio] || 120000;
    if (tipoServicio === 'Paquete de Sesiones' && modalidad === 'Pareja') {
      baseRate = 150000;
    }
    setValorTotal(baseRate * cantidadSesiones);
  }, [tipoServicio, cantidadSesiones, modalidad])
  
  const [successData, setSuccessData] = useState<{ token: string, link: string, telefono: string } | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    setIsSubmitting(true)
    setErrorMsg('')
    setSuccessData(null)
    setCopySuccess(false)

    try {
      const formData = new FormData(form)
      const res = await crearContrato(formData)

      if (!res.success) {
        setErrorMsg(res.error || 'Error desconocido')
        toast.error(res.error || 'Error desconocido')
        return
      }

      // Reconstruir la URL pública de firma
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const linkFirma = `${baseUrl}/firmar/${res.token}`

      setSuccessData({
        token: res.token!,
        link: linkFirma,
        telefono: res.telefono!
      })
      toast.success('¡Contrato generado exitosamente!')
      form.reset()
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado al procesar la solicitud.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopy = async () => {
    if (successData?.link) {
      await copiarAlPortapapeles(successData.link)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 3000)
    }
  }

  const handleWhatsApp = () => {
    if (successData) {
      const msj = `Hola, te comparto el enlace seguro para revisar y firmar tu Consentimiento Informado para la prestación de servicios psicológicos: ${successData.link}`
      const encodedMsj = encodeURIComponent(msj)
      // Limpiar el teléfono (remover espacios, símbolos)
      const telClean = successData.telefono.replace(/\D/g, '')
      // Asumimos código de país de Colombia (+57) si el número tiene 10 dígitos (estándar de celular allí)
      const finalTel = telClean.length === 10 ? `57${telClean}` : telClean
      
      window.open(`https://wa.me/${finalTel}?text=${encodedMsj}`, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden ring-1 ring-gray-900/5">
        
        <div className="bg-slate-800 p-8 text-white">
          <h1 className="text-2xl font-bold">Generar Nuevo Contrato</h1>
          <p className="text-slate-300 mt-2 text-sm">
            Ingresa los datos del paciente y las condiciones del servicio para generar el consentimiento legal y el enlace de firma.
          </p>
        </div>

        <div className="p-8">
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-start">
              <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-sm">Error en la generación</h3>
                <p className="text-sm mt-1">{errorMsg}</p>
              </div>
            </div>
          )}

          {successData && (
            <div className="mb-8 p-6 bg-green-50 rounded-xl border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ¡Contrato Generado con Éxito!
              </h3>
              <p className="text-sm text-green-800 mb-4">
                El enlace único ha sido creado. Compártelo con el paciente para que pueda firmar.
              </p>
              
              <div className="flex items-center gap-2 mb-4">
                <input 
                  type="text" 
                  readOnly 
                  value={successData.link} 
                  className="block w-full rounded-md border-green-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm bg-white py-2 px-3 text-gray-600 cursor-text"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                >
                  {copySuccess ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleWhatsApp}
                className="w-full inline-flex justify-center items-center rounded-md border border-transparent bg-[#25D366] px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-[#128C7E] focus:outline-none transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Enviar Enlace por WhatsApp
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="mt-3 w-full inline-flex justify-center items-center rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none transition-colors"
              >
                Volver al Inicio (Dashboard)
              </button>
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
                    <input required type="text" name="nombre_paciente" id="nombre_paciente" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm" placeholder="Ej: Juan Pérez" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="tipo_documento" className="block text-sm font-medium text-gray-800">Tipo de Documento</label>
                  <div className="mt-1">
                    <select required id="tipo_documento" name="tipo_documento" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm">
                      <option value="CC">Cédula de Ciudadanía</option>
                      <option value="CE">Cédula de Extranjería</option>
                      <option value="Pasaporte">Pasaporte</option>
                      <option value="TI">Tarjeta de Identidad</option>
                      {modalidad === 'Menor de Edad' && <option value="RC">Registro Civil</option>}
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label htmlFor="numero_documento" className="block text-sm font-medium text-gray-800">Número de Documento</label>
                  <div className="mt-1">
                    <input required type="text" name="numero_documento" id="numero_documento" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm" placeholder="Ej: 1020304050" />
                  </div>
                </div>

                {modalidad !== 'Menor de Edad' && (
                  <>
                    <div className="sm:col-span-3">
                      <label htmlFor="email_paciente" className="block text-sm font-medium text-gray-800">Correo Electrónico</label>
                      <div className="mt-1">
                        <input required type="email" name="email_paciente" id="email_paciente" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm" placeholder="ejemplo@correo.com" />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="telefono_paciente" className="block text-sm font-medium text-gray-800">Teléfono / WhatsApp</label>
                      <div className="mt-1">
                        <input required type="tel" name="telefono_paciente" id="telefono_paciente" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm" placeholder="Ej: 3001234567" />
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
                    <input required type="text" name="nombre_paciente_2" id="nombre_paciente_2" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm" placeholder="Ej: María Gómez" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="tipo_documento_2" className="block text-sm font-medium text-gray-800">Tipo de Documento</label>
                  <div className="mt-1">
                    <select required id="tipo_documento_2" name="tipo_documento_2" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm">
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
                    <input required type="text" name="numero_documento_2" id="numero_documento_2" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm" placeholder="Ej: 1020304051" />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="email_paciente_2" className="block text-sm font-medium text-gray-800">Correo Electrónico</label>
                  <div className="mt-1">
                    <input required type="email" name="email_paciente_2" id="email_paciente_2" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm" placeholder="ejemplo2@correo.com" />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="telefono_paciente_2" className="block text-sm font-medium text-gray-800">Teléfono / WhatsApp</label>
                  <div className="mt-1">
                    <input required type="tel" name="telefono_paciente_2" id="telefono_paciente_2" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm" placeholder="Ej: 3001234568" />
                  </div>
                </div>

              </div>
            </div>
            )}

            {/* Sección Tutores para Menor de Edad */}
            {modalidad === 'Menor de Edad' && (
              <div className="border-b border-gray-200 pb-6 pt-2 space-y-8">
                {/* Tutor 1 */}
                <div>
                  <h3 className="text-lg font-semibold text-[#224252] mb-4">Datos del Representante Legal / Tutor 1</h3>
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                      <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Nombre Completo</label>
                      <input required type="text" name="tutor_1_nombre" className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0e787a]" placeholder="Ej: Carlos Pérez" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Parentesco</label>
                      <select required name="tutor_1_parentesco" className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                        <option value="Padre">Padre</option>
                        <option value="Madre">Madre</option>
                        <option value="Representante Legal">Representante Legal</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Tipo Documento</label>
                      <select required name="tutor_1_tipo_doc" className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                        <option value="CC">Cédula</option>
                        <option value="CE">Extranjería</option>
                        <option value="Pasaporte">Pasaporte</option>
                      </select>
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Número de Documento</label>
                      <input required type="text" name="tutor_1_num_doc" className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0e787a]" placeholder="Ej: 1020304050" />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Email</label>
                      <input required type="email" name="tutor_1_email" className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0e787a]" placeholder="ejemplo@correo.com" />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Teléfono (WhatsApp)</label>
                      <input required type="tel" name="tutor_1_telefono" className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0e787a]" placeholder="Ej: 3001234567" />
                    </div>
                  </div>
                </div>

                {/* Checkboxes Extra */}
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

                {/* Tutor 2 (Opcional) */}
                {requiereTutor2 && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-md font-semibold text-[#224252] mb-4">Tutor 2</h3>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-4">
                        <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Nombre Completo</label>
                        <input required type="text" name="tutor_2_nombre" className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0e787a]" placeholder="Ej: María Gómez" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Parentesco</label>
                        <select required name="tutor_2_parentesco" className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                          <option value="Madre">Madre</option>
                          <option value="Padre">Padre</option>
                          <option value="Representante Legal">Representante Legal</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Tipo Documento</label>
                        <select required name="tutor_2_tipo_doc" className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                          <option value="CC">Cédula</option>
                          <option value="CE">Extranjería</option>
                          <option value="Pasaporte">Pasaporte</option>
                        </select>
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Número de Documento</label>
                        <input required type="text" name="tutor_2_num_doc" className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0e787a]" placeholder="Ej: 1020304051" />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Email</label>
                        <input type="email" name="tutor_2_email" className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0e787a]" placeholder="ejemplo2@correo.com" />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">Teléfono (WhatsApp)</label>
                        <input type="tel" name="tutor_2_telefono" className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0e787a]" placeholder="Ej: 3001234568" />
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
                    <select required value={modalidad} onChange={(e) => setModalidad(e.target.value)} id="modalidad_atencion" name="modalidad_atencion" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm">
                      <option value="Individual">Individual</option>
                      <option value="Pareja">Pareja</option>
                      <option value="Menor de Edad">Menor de Edad</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="tipo_servicio" className="block text-sm font-medium text-gray-800">Tipo de Servicio</label>
                  <div className="mt-1">
                    <select required value={tipoServicio} onChange={(e) => setTipoServicio(e.target.value)} id="tipo_servicio" name="tipo_servicio" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm">
                      {(serviciosPorModalidad[modalidad] || []).map(srv => (
                        <option key={srv} value={srv}>{srv}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="cantidad_sesiones" className="block text-sm font-medium text-gray-800">Cantidad de Sesiones</label>
                  <div className="mt-1">
                    <input required type="number" min="1" value={cantidadSesiones} onChange={(e) => setCantidadSesiones(parseInt(e.target.value) || 1)} name="cantidad_sesiones" id="cantidad_sesiones" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm" />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="valor_total_cop" className="block text-sm font-medium text-gray-800">Valor Total (COP)</label>
                  <div className="mt-1">
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input required type="number" min="0" value={valorTotal} onChange={(e) => setValorTotal(parseFloat(e.target.value) || 0)} name="valor_total_cop" id="valor_total_cop" className="w-full pl-7 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm" placeholder="380000" />
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="ciudad" className="block text-sm font-medium text-gray-800">Ciudad de Firma</label>
                  <div className="mt-1">
                    <input required type="text" defaultValue="Villavicencio" name="ciudad" id="ciudad" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm" />
                  </div>
                </div>

              </div>
            </div>

            <div className="pt-5 border-t border-gray-200 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center rounded-md border border-transparent bg-slate-800 py-3 px-6 text-sm font-medium text-white shadow-sm hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 transition-colors w-full sm:w-auto"
              >
                {isSubmitting ? 'Generando Contrato...' : 'Crear y Generar Enlace'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
