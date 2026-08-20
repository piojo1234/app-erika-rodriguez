'use client'

import { useState, useEffect, useRef } from 'react'
import AITextArea from './AITextArea'
import SugerirDiagnosticoBtn from './SugerirDiagnosticoBtn'
import toast from 'react-hot-toast'
import { maskDocument } from '@/utils/helpers'

interface HistoriaFormProps {
  pacientes: any[]
  formAction: (formData: FormData) => Promise<{ success: boolean; id?: string; error?: string }> | any
  initialData?: any // Para edición futura
}

export default function HistoriaForm({ pacientes, formAction, initialData }: HistoriaFormProps) {
  const [activeTab, setActiveTab] = useState(1)
  const [subTabAnamnesis, setSubTabAnamnesis] = useState<'A' | 'B' | 'Conjunta'>('A')
  const [subTabExamen, setSubTabExamen] = useState<'A' | 'B'>('A')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Nuevos estados para demografía
  const [modalidad, setModalidad] = useState<'Individual' | 'Pareja'>(initialData?.datos_demograficos?.modalidad || 'Individual')
  const [fechaNacimiento, setFechaNacimiento] = useState(initialData?.datos_demograficos?.fecha_nacimiento || '')
  const [edadAnos, setEdadAnos] = useState(initialData?.datos_demograficos?.edad_atencion_anos || '')
  const [edadMeses, setEdadMeses] = useState(initialData?.datos_demograficos?.edad_atencion_meses || '')
  const [esEstudiante, setEsEstudiante] = useState(initialData?.datos_demograficos?.es_estudiante || false)
  const [esRemitido, setEsRemitido] = useState(initialData?.datos_demograficos?.es_remitido_colegio || false)
  const [riesgoSuicida, setRiesgoSuicida] = useState(initialData?.examen_mental?.nivel_riesgo_suicida || initialData?.examen_mental?.paciente_a?.nivel_riesgo_suicida || 'Sin Riesgo')
  const [riesgoSuicidaB, setRiesgoSuicidaB] = useState(initialData?.examen_mental?.paciente_b?.nivel_riesgo_suicida || 'Sin Riesgo')
  const [riesgoVif, setRiesgoVif] = useState(initialData?.examen_mental?.riesgo_vif || false)
  const [cie10, setCie10] = useState(initialData?.analisis_diagnostico?.cie10 || '')

  useEffect(() => {
    if (modalidad === 'Pareja' && !cie10) {
      setCie10('Z63.0')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalidad])

  const formRef = useRef<HTMLFormElement>(null)
  
  // Cálculo de edad
  useEffect(() => {
    if (fechaNacimiento) {
      const birth = new Date(fechaNacimiento)
      const now = new Date()
      let years = now.getFullYear() - birth.getFullYear()
      let months = now.getMonth() - birth.getMonth()
      
      if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
        years--
        months += 12
      }
      
      if (now.getDate() < birth.getDate()) {
        months--
        if (months < 0) {
          months += 12
        }
      }
      
      setEdadAnos(years.toString())
      setEdadMeses(months.toString())
    } else {
      setEdadAnos('')
      setEdadMeses('')
    }
  }, [fechaNacimiento])

  const validateStep = (step: number) => {
    if (!formRef.current) return true;
    const formData = new FormData(formRef.current);

    if (step === 1) {
      const paciente_id = formData.get('paciente_id');
      const fechaNacimiento = formData.get('datos_demograficos.fecha_nacimiento');
      const genero = formData.get('datos_demograficos.genero');
      const estadoCivil = formData.get('datos_demograficos.estado_civil');
      const municipio = formData.get('datos_demograficos.municipio_residencia');
      
      if (!paciente_id || !fechaNacimiento || !genero || !estadoCivil || !municipio) {
        toast.error("Por favor, complete todos los campos obligatorios (*) en Datos Generales (Pestaña 1).");
        return false;
      }
    }
    
    return true;
  }

  // Handlers para avanzar tabs fácilmente
  const nextTab = () => {
    if (validateStep(activeTab)) {
      setActiveTab(prev => Math.min(prev + 1, 4))
    }
  }
  const prevTab = () => setActiveTab(prev => Math.max(prev - 1, 1))

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Evitar envío al presionar Enter, excepto en textareas
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement
      if (target.tagName !== 'TEXTAREA') {
        e.preventDefault()
      }
    }
  }

  const getDatosForSugerencias = () => {
    if (!formRef.current) return { motivoConsulta: '', examenMental: '' }
    
    const formData = new FormData(formRef.current)
    const motivoConsulta = formData.get('anamnesis.motivo_consulta') as string || formData.get('anamnesis.motivo_consulta_a') as string || ''
    
    // Recopilar un breve resumen del examen mental
    const aspecto = formData.get('examen_mental.aspecto_fisico') as string || ''
    const actitud = formData.get('examen_mental.actitud') as string || ''
    const pensamiento = formData.get('examen_mental.pensamiento') as string || ''
    const afectividad = formData.get('examen_mental.afectividad') as string || ''
    const lenguaje = formData.get('examen_mental.lenguaje') as string || ''
    
    const examenMental = `Aspecto: ${aspecto}. Actitud: ${actitud}. Lenguaje: ${lenguaje}. Pensamiento: ${pensamiento}. Afectividad: ${afectividad}.`
    
    return { motivoConsulta, examenMental }
  }

  const handleSubmit = async (formData: FormData) => {
    if (!validateStep(1)) {
      setActiveTab(1)
      return
    }

    try {
      setIsSubmitting(true)
      const res = await formAction(formData)
      if (res && res.success) {
        toast.success("Historia clínica guardada exitosamente.");
        window.location.href = `/admin/historias/${res.id}/evolucion`
      } else if (res && !res.success) {
        toast.error(res.error || "Error desconocido guardando la historia clínica.")
        setIsSubmitting(false)
      }
    } catch (err: any) {
      toast.error("Error en la petición: " + err.message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab(1)}
          className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 1 ? 'border-b-2 border-[#0e787a] text-[#0e787a]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          1. Datos Generales
        </button>
        <button
          type="button"
          onClick={() => setActiveTab(2)}
          className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 2 ? 'border-b-2 border-[#0e787a] text-[#0e787a]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          2. Anamnesis
        </button>
        <button
          type="button"
          onClick={() => setActiveTab(3)}
          className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 3 ? 'border-b-2 border-[#0e787a] text-[#0e787a]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          3. Examen Mental
        </button>
        <button
          type="button"
          onClick={() => setActiveTab(4)}
          className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 4 ? 'border-b-2 border-[#0e787a] text-[#0e787a]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          4. Análisis y Plan
        </button>
      </div>

      <form ref={formRef} action={handleSubmit} onKeyDown={handleKeyDown} className="p-8">
        {/* Hidden inputs if editing */}
        {initialData && <input type="hidden" name="id" value={initialData.id} />}
        
        {/* TAB 1: DATOS GENERALES */}
        <div className={activeTab === 1 ? 'block' : 'hidden'}>
          <div className="mb-8">
            <label className="block text-sm font-bold text-[#0e787a] mb-2">Modalidad de Atención</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="radio" name="datos_demograficos.modalidad" value="Individual" checked={modalidad === 'Individual'} onChange={(e) => setModalidad('Individual')} className="mr-2 text-[#0e787a] focus:ring-[#0e787a]" />
                Individual
              </label>
              <label className="flex items-center">
                <input type="radio" name="datos_demograficos.modalidad" value="Pareja" checked={modalidad === 'Pareja'} onChange={(e) => setModalidad('Pareja')} className="mr-2 text-[#0e787a] focus:ring-[#0e787a]" />
                Pareja
              </label>
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-900 mb-6 border-t pt-6">Datos de Identificación {modalidad === 'Pareja' ? '(Paciente A)' : ''}</h2>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 mb-8">
            <div className="sm:col-span-6">
              <label htmlFor="paciente_id" className="block text-sm font-semibold text-slate-800">Seleccionar Paciente *</label>
              <select id="paciente_id" name="paciente_id" defaultValue={initialData?.paciente_id} className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                <option value="">Buscar paciente...</option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre_completo} - {maskDocument(p.numero_documento)}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-800">Fecha de Nacimiento *</label>
              <input type="date" name="datos_demograficos.fecha_nacimiento" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-800">Edad Calculada (Años) *</label>
              <input type="number" readOnly name="datos_demograficos.edad_atencion_anos" value={edadAnos} className="mt-1 w-full px-3 py-2 border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-800">Edad Calculada (Meses) *</label>
              <input type="number" readOnly name="datos_demograficos.edad_atencion_meses" value={edadMeses} className="mt-1 w-full px-3 py-2 border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-800">Género / Sexo *</label>
              <select name="datos_demograficos.genero" defaultValue={initialData?.datos_demograficos?.genero} className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                <option value="">Seleccionar...</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-800">Estado Civil *</label>
              <select name="datos_demograficos.estado_civil" defaultValue={initialData?.datos_demograficos?.estado_civil} className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                <option value="">Seleccionar...</option>
                <option value="Soltero/a">Soltero/a</option>
                <option value="Casado/a">Casado/a</option>
                <option value="Unión Libre">Unión Libre</option>
                <option value="Divorciado/a">Divorciado/a</option>
                <option value="Viudo/a">Viudo/a</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-800">Municipio de Residencia *</label>
              <input type="text" name="datos_demograficos.municipio_residencia" defaultValue={initialData?.datos_demograficos?.municipio_residencia || "Villavicencio"} className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
            </div>
          </div>

          {modalidad === 'Pareja' && (
            <>
              <h2 className="text-lg font-bold text-slate-900 mb-6 border-t pt-6">Datos de Identificación (Paciente B)</h2>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 mb-8">
                <div className="sm:col-span-3">
                  <label className="block text-sm font-semibold text-slate-800">Nombres y Apellidos</label>
                  <input type="text" name="datos_demograficos.paciente_b_nombre" defaultValue={initialData?.datos_demograficos?.paciente_b_nombre} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-[#0e787a]" />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm font-semibold text-slate-800">Documento de Identidad</label>
                  <input type="text" name="datos_demograficos.paciente_b_documento" defaultValue={initialData?.datos_demograficos?.paciente_b_documento} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-[#0e787a]" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-800">Edad</label>
                  <input type="text" name="datos_demograficos.paciente_b_edad" defaultValue={initialData?.datos_demograficos?.paciente_b_edad} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-[#0e787a]" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-800">Ocupación</label>
                  <input type="text" name="datos_demograficos.paciente_b_ocupacion" defaultValue={initialData?.datos_demograficos?.paciente_b_ocupacion} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-[#0e787a]" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-800">Teléfono</label>
                  <input type="text" name="datos_demograficos.paciente_b_telefono" defaultValue={initialData?.datos_demograficos?.paciente_b_telefono} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-[#0e787a]" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-800">Email</label>
                  <input type="email" name="datos_demograficos.paciente_b_email" defaultValue={initialData?.datos_demograficos?.paciente_b_email} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-[#0e787a]" />
                </div>
                <div className="sm:col-span-6">
                  <label className="block text-sm font-semibold text-slate-800">EPS</label>
                  <input type="text" name="datos_demograficos.paciente_b_eps" defaultValue={initialData?.datos_demograficos?.paciente_b_eps} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-[#0e787a]" />
                </div>
              </div>

              <h2 className="text-lg font-bold text-slate-900 mb-6 border-t pt-6">Datos de la Relación</h2>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 mb-8">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-800">Tiempo de Relación / Convivencia</label>
                  <input type="text" name="datos_demograficos.relacion_tiempo" defaultValue={initialData?.datos_demograficos?.relacion_tiempo} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-[#0e787a]" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-800">Estado Legal Actual</label>
                  <select name="datos_demograficos.relacion_estado_legal" defaultValue={initialData?.datos_demograficos?.relacion_estado_legal || 'Unión Libre'} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-[#0e787a]">
                    <option value="Noviazgo">Noviazgo</option>
                    <option value="Unión Libre">Unión Libre</option>
                    <option value="Matrimonio">Matrimonio Civil / Religioso</option>
                    <option value="Separados">Separados de Hecho</option>
                    <option value="En proceso de divorcio">En proceso de divorcio</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-800">Hijos en Común / Previos</label>
                  <input type="text" name="datos_demograficos.relacion_hijos" defaultValue={initialData?.datos_demograficos?.relacion_hijos} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-[#0e787a]" placeholder="Ej: 1 en común, 1 de previa" />
                </div>
              </div>
            </>
          )}

          <h2 className="text-lg font-bold text-slate-900 mb-6 border-t pt-6">Información Académica / Remisión</h2>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 mb-8">
            <div className="sm:col-span-6 flex items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
              <input type="hidden" name="datos_demograficos.es_estudiante" value={esEstudiante ? 'true' : 'false'} />
              <input
                id="es_estudiante"
                type="checkbox"
                checked={esEstudiante}
                onChange={(e) => setEsEstudiante(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#0e787a] focus:ring-[#0e787a]"
              />
              <label htmlFor="es_estudiante" className="ml-3 block text-sm font-semibold text-slate-800">
                ¿El paciente es estudiante?
              </label>
            </div>

            {esEstudiante && (
              <div className="sm:col-span-6 flex flex-col space-y-4 bg-slate-50 p-6 rounded-lg border border-slate-200">
                <div className="flex items-center">
                  <input type="hidden" name="datos_demograficos.es_remitido_colegio" value={esRemitido ? 'true' : 'false'} />
                  <input
                    id="es_remitido_colegio"
                    type="checkbox"
                    checked={esRemitido}
                    onChange={(e) => setEsRemitido(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#0e787a] focus:ring-[#0e787a]"
                  />
                  <label htmlFor="es_remitido_colegio" className="ml-3 block text-sm font-semibold text-slate-800">
                    ¿Es remitido por una institución educativa o colegio?
                  </label>
                </div>

                {esRemitido && (
                  <div>
                    <label htmlFor="institucion_remite" className="block text-sm font-semibold text-slate-800">
                      Nombre de la Institución / Colegio que remite *
                    </label>
                    <input
                      type="text"
                      id="institucion_remite"
                      name="datos_demograficos.institucion_remite"
                      defaultValue={initialData?.datos_demograficos?.institucion_remite}
                      className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
                      placeholder="Ej: Colegio Departamental La Esperanza"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold text-slate-900 mb-6 border-t pt-6">Datos del Acudiente (Opcional)</h2>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 mb-8">
            <div className="sm:col-span-3">
              <label className="block text-sm font-semibold text-slate-800">Nombre del Acudiente</label>
              <input type="text" name="acudiente.nombre" defaultValue={initialData?.acudiente?.nombre} className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-semibold text-slate-800">Parentesco</label>
              <input type="text" name="acudiente.parentesco" defaultValue={initialData?.acudiente?.parentesco} className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-800">Teléfono</label>
              <input type="text" name="acudiente.telefono" defaultValue={initialData?.acudiente?.telefono} className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-sm font-semibold text-slate-800">Dirección</label>
              <input type="text" name="acudiente.direccion" defaultValue={initialData?.acudiente?.direccion} className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-900 mb-6 border-t pt-6">Datos EPS</h2>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 mb-8">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-800">Nombre EPS</label>
              <input type="text" name="eps.nombre" defaultValue={initialData?.eps?.nombre} className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-800">Régimen</label>
              <select name="eps.regimen" defaultValue={initialData?.eps?.regimen || 'Contributivo'} className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                <option value="Contributivo">Contributivo</option>
                <option value="Subsidiado">Subsidiado</option>
                <option value="Especial">Especial</option>
                <option value="Ninguno">Ninguno</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-800">Tipo de Afiliado</label>
              <select name="eps.tipo_afiliado" defaultValue={initialData?.eps?.tipo_afiliado || 'Cotizante'} className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                <option value="Cotizante">Cotizante</option>
                <option value="Beneficiario">Beneficiario</option>
              </select>
            </div>
          </div>
        </div>

        {/* TAB 2: ANAMNESIS Y ANTECEDENTES */}
        <div className={activeTab === 2 ? 'block' : 'hidden'}>
          {modalidad === 'Individual' ? (
            <>
              <h2 className="text-lg font-bold text-slate-900 mb-6">Antecedentes de Salud y Psicológicos</h2>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-1 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Salud Física y Mental Personal / Familiar</label>
                  <textarea name="antecedentes.personales_familiares" defaultValue={initialData?.antecedentes?.personales_familiares} rows={3} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]" placeholder="Describa antecedentes médicos, psiquiátricos, psicológicos previos..."></textarea>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  type="button"
                  onClick={() => setSubTabAnamnesis('A')}
                  className={`px-4 py-2 text-sm font-medium ${subTabAnamnesis === 'A' ? 'border-b-2 border-[#0e787a] text-[#0e787a]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  👤 Antecedentes (Pac. A)
                </button>
                <button
                  type="button"
                  onClick={() => setSubTabAnamnesis('B')}
                  className={`px-4 py-2 text-sm font-medium ${subTabAnamnesis === 'B' ? 'border-b-2 border-[#0e787a] text-[#0e787a]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  👤 Antecedentes (Pac. B)
                </button>
                <button
                  type="button"
                  onClick={() => setSubTabAnamnesis('Conjunta')}
                  className={`px-4 py-2 text-sm font-medium ${subTabAnamnesis === 'Conjunta' ? 'border-b-2 border-[#0e787a] text-[#0e787a]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  👥 Historia Conjunta
                </button>
              </div>

              <div className={subTabAnamnesis === 'A' ? 'block' : 'hidden'}>
                <h3 className="text-md font-bold text-[#0e787a] mb-4">Antecedentes Clínicos - Paciente A</h3>
                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 gap-x-4 mb-8">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1">Médicos</label>
                    <textarea name="antecedentes_a.medicos" defaultValue={initialData?.antecedentes?.paciente_a?.medicos} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-[#0e787a]" placeholder="Enfermedades crónicas, alergias..."></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1">Psiquiátricos</label>
                    <textarea name="antecedentes_a.psiquiatricos" defaultValue={initialData?.antecedentes?.paciente_a?.psiquiatricos} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-[#0e787a]" placeholder="Diagnósticos previos..."></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1">Tratamientos Previos (Psicológicos)</label>
                    <textarea name="antecedentes_a.tratamientos" defaultValue={initialData?.antecedentes?.paciente_a?.tratamientos} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-[#0e787a]"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1">Consumo de Sustancias / Medicamentos</label>
                    <textarea name="antecedentes_a.sustancias" defaultValue={initialData?.antecedentes?.paciente_a?.sustancias} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-[#0e787a]"></textarea>
                  </div>
                </div>
              </div>

              <div className={subTabAnamnesis === 'B' ? 'block' : 'hidden'}>
                <h3 className="text-md font-bold text-[#0e787a] mb-4">Antecedentes Clínicos - Paciente B</h3>
                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 gap-x-4 mb-8">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1">Médicos</label>
                    <textarea name="antecedentes_b.medicos" defaultValue={initialData?.antecedentes?.paciente_b?.medicos} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-[#0e787a]"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1">Psiquiátricos</label>
                    <textarea name="antecedentes_b.psiquiatricos" defaultValue={initialData?.antecedentes?.paciente_b?.psiquiatricos} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-[#0e787a]"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1">Tratamientos Previos (Psicológicos)</label>
                    <textarea name="antecedentes_b.tratamientos" defaultValue={initialData?.antecedentes?.paciente_b?.tratamientos} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-[#0e787a]"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1">Consumo de Sustancias / Medicamentos</label>
                    <textarea name="antecedentes_b.sustancias" defaultValue={initialData?.antecedentes?.paciente_b?.sustancias} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-[#0e787a]"></textarea>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className={modalidad === 'Individual' || subTabAnamnesis === 'Conjunta' ? 'block' : 'hidden'}>
            <h2 className="text-lg font-bold text-slate-900 mb-6 border-t pt-6">Anamnesis</h2>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-1 mb-8">
              {modalidad === 'Individual' ? (
              <AITextArea
                name="anamnesis.motivo_consulta"
                label="Motivo de Consulta (Referido por el paciente)"
                defaultValue={initialData?.anamnesis?.motivo_consulta}
                rows={3}
                placeholder='"Vengo porque..."'
                seccion="Motivo de consulta. Se espera una descripción inicial del problema desde la perspectiva del paciente."
              />
            ) : (
              <>
                <AITextArea
                  name="anamnesis.motivo_consulta_a"
                  label="Motivo de Consulta (Referido por Paciente A)"
                  defaultValue={initialData?.anamnesis?.motivo_consulta_a}
                  rows={3}
                  seccion="Motivo de consulta desde la perspectiva del paciente A."
                />
                <AITextArea
                  name="anamnesis.motivo_consulta_b"
                  label="Motivo de Consulta (Referido por Paciente B)"
                  defaultValue={initialData?.anamnesis?.motivo_consulta_b}
                  rows={3}
                  seccion="Motivo de consulta desde la perspectiva del paciente B."
                />
                <AITextArea
                  name="anamnesis.discrepancias"
                  label="Discrepancias o Visión Compartida del Problema"
                  defaultValue={initialData?.anamnesis?.discrepancias}
                  rows={3}
                  seccion="Análisis de diferencias o similitudes en cómo ambos perciben el problema."
                />
              </>
            )}
            <AITextArea
              name="anamnesis.definicion_problema"
              label="Definición del Problema (Perspectiva profesional)"
              defaultValue={initialData?.anamnesis?.definicion_problema}
              rows={4}
              placeholder="Análisis clínico del problema actual..."
              seccion="Definición del problema. Se espera una descripción técnica y profesional de la sintomatología y situación clínica."
            />
            <AITextArea
              name="anamnesis.vinculos"
              label="Vínculos Afectivos, Comunicación y Contexto"
              defaultValue={initialData?.anamnesis?.vinculos}
              rows={3}
              seccion="Vínculos afectivos y contexto social/familiar. Se espera una descripción de las relaciones interpersonales y dinámicas sociales del paciente."
            />
          </div>

          {modalidad === 'Pareja' && (
            <>
              <h2 className="text-lg font-bold text-slate-900 mb-6 border-t pt-6">Evaluación de Pareja y Dinámica Relacional</h2>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-1 mb-8">
                <AITextArea
                  name="anamnesis.dinamica_historia_relacion"
                  label="Historia de la Relación (Inicio, hitos, inicio de conflictos)"
                  defaultValue={initialData?.anamnesis?.dinamica_historia_relacion}
                  rows={3}
                  seccion="Historia de la relación: cómo se conocieron, hitos positivos y cuándo/cómo iniciaron los conflictos."
                />
                <AITextArea
                  name="anamnesis.dinamica_comunicacion"
                  label="Estilo de Comunicación y Resolución de Conflictos"
                  defaultValue={initialData?.anamnesis?.dinamica_comunicacion}
                  rows={3}
                  seccion="Patrones de comunicación en la pareja, cómo abordan y resuelven conflictos."
                />
                <AITextArea
                  name="anamnesis.dinamica_intimidad"
                  label="Intimidad, Afecto y Satisfacción Sexual"
                  defaultValue={initialData?.anamnesis?.dinamica_intimidad}
                  rows={3}
                  seccion="Nivel de conexión emocional, afectiva y sexual."
                />
                <AITextArea
                  name="anamnesis.dinamica_roles"
                  label="Roles, Finanzas y Límites (Familia extensa)"
                  defaultValue={initialData?.anamnesis?.dinamica_roles}
                  rows={3}
                  seccion="Distribución de roles, manejo del dinero y cómo interactúan con familias de origen."
                />
                <AITextArea
                  name="anamnesis.dinamica_expectativas"
                  label="Expectativas Individuales frente a la Terapia"
                  defaultValue={initialData?.anamnesis?.dinamica_expectativas}
                  rows={3}
                  seccion="Qué espera cada miembro del proceso terapéutico (e.g., continuar juntos o separación consciente)."
                />
                </div>
              </>
            )}
          </div>
        </div>

        {/* TAB 3: EXAMEN MENTAL */}
        <div className={activeTab === 3 ? 'block' : 'hidden'}>
          <h2 className="text-lg font-bold text-slate-900 mb-6">Examen Mental Estructurado</h2>
          
          {modalidad === 'Pareja' && (
            <div className="flex border-b border-gray-200 mb-6">
              <button
                type="button"
                onClick={() => setSubTabExamen('A')}
                className={`px-4 py-2 text-sm font-medium ${subTabExamen === 'A' ? 'border-b-2 border-[#0e787a] text-[#0e787a]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                👤 Examen Mental (Pac. A)
              </button>
              <button
                type="button"
                onClick={() => setSubTabExamen('B')}
                className={`px-4 py-2 text-sm font-medium ${subTabExamen === 'B' ? 'border-b-2 border-[#0e787a] text-[#0e787a]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                👤 Examen Mental (Pac. B)
              </button>
            </div>
          )}

          <div className={modalidad === 'Individual' || subTabExamen === 'A' ? 'block' : 'hidden'}>
            {modalidad === 'Pareja' && <h3 className="text-md font-bold text-[#0e787a] mb-4">Examen Mental - Paciente A</h3>}
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 mb-8">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Aspecto Físico</label>
                <select name={modalidad === 'Pareja' ? "examen_mental_a.aspecto_fisico" : "examen_mental.aspecto_fisico"} defaultValue={modalidad === 'Pareja' ? initialData?.examen_mental?.paciente_a?.aspecto_fisico : initialData?.examen_mental?.aspecto_fisico || 'Adecuado'} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                  <option value="Adecuado">Adecuado</option>
                  <option value="No Adecuado">No Adecuado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Actitud</label>
                <select name={modalidad === 'Pareja' ? "examen_mental_a.actitud" : "examen_mental.actitud"} defaultValue={modalidad === 'Pareja' ? initialData?.examen_mental?.paciente_a?.actitud : initialData?.examen_mental?.actitud || 'Adecuada'} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                  <option value="Adecuada">Adecuada (Colaboradora)</option>
                  <option value="Hostil">Hostil / Defensiva</option>
                  <option value="Indiferente">Indiferente</option>
                  <option value="Seductora">Seductora</option>
                  <option value="Otra">Otra</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Estado de Consciencia</label>
                <select name={modalidad === 'Pareja' ? "examen_mental_a.consciencia" : "examen_mental.consciencia"} defaultValue={modalidad === 'Pareja' ? initialData?.examen_mental?.paciente_a?.consciencia : initialData?.examen_mental?.consciencia || 'Alerta'} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                  <option value="Alerta">Alerta</option>
                  <option value="Hiperalerta">Hiperalerta</option>
                  <option value="Somnoliento">Somnoliento</option>
                  <option value="Obnubilado">Obnubilado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Lenguaje y Habla</label>
                <select name={modalidad === 'Pareja' ? "examen_mental_a.lenguaje" : "examen_mental.lenguaje"} defaultValue={modalidad === 'Pareja' ? initialData?.examen_mental?.paciente_a?.lenguaje : initialData?.examen_mental?.lenguaje || 'Organizado y Coherente'} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                  <option value="Organizado y Coherente">Organizado y Coherente</option>
                  <option value="Desorganizado">Desorganizado</option>
                  <option value="Taquilalia">Taquilalia</option>
                  <option value="Bradilalia">Bradilalia</option>
                  <option value="Mutismo">Mutismo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Orientación (Tiempo/Espacio/Persona)</label>
                <select name={modalidad === 'Pareja' ? "examen_mental_a.orientacion" : "examen_mental.orientacion"} defaultValue={modalidad === 'Pareja' ? initialData?.examen_mental?.paciente_a?.orientacion : initialData?.examen_mental?.orientacion || 'Orientado'} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                  <option value="Orientado">Orientado globalmente</option>
                  <option value="Desorientado en tiempo">Desorientado en tiempo</option>
                  <option value="Desorientado en espacio">Desorientado en espacio</option>
                  <option value="Desorientado en persona">Desorientado en persona</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Sensopercepción</label>
                <select name={modalidad === 'Pareja' ? "examen_mental_a.sensopercepcion" : "examen_mental.sensopercepcion"} defaultValue={modalidad === 'Pareja' ? initialData?.examen_mental?.paciente_a?.sensopercepcion : initialData?.examen_mental?.sensopercepcion || 'Sin alteraciones'} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                  <option value="Sin alteraciones">Sin alteraciones evidentes</option>
                  <option value="Alucinaciones visuales">Alucinaciones visuales</option>
                  <option value="Alucinaciones auditivas">Alucinaciones auditivas</option>
                  <option value="Ilusiones">Ilusiones</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Curso y Contenido del Pensamiento</label>
                <input type="text" name={modalidad === 'Pareja' ? "examen_mental_a.pensamiento" : "examen_mental.pensamiento"} defaultValue={modalidad === 'Pareja' ? initialData?.examen_mental?.paciente_a?.pensamiento : initialData?.examen_mental?.pensamiento || 'Lógico y coherente'} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]" placeholder="Lógico, fuga de ideas, ideas delirantes..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Afectividad</label>
                <input type="text" name={modalidad === 'Pareja' ? "examen_mental_a.afectividad" : "examen_mental.afectividad"} defaultValue={modalidad === 'Pareja' ? initialData?.examen_mental?.paciente_a?.afectividad : initialData?.examen_mental?.afectividad || 'Eutímico'} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]" placeholder="Eutímico, hipertímico, aplanado..." />
              </div>
              
              <div className="sm:col-span-2 bg-slate-50 p-6 rounded-lg border border-slate-200 mt-4">
                <label className="block text-sm font-semibold text-slate-800 mb-2">Evaluación de Riesgo Suicida *</label>
                <select 
                  name={modalidad === 'Pareja' ? "examen_mental_a.nivel_riesgo_suicida" : "examen_mental.nivel_riesgo_suicida"} 
                  value={riesgoSuicida}
                  onChange={(e) => setRiesgoSuicida(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a] mb-4"
                >
                  <option value="Sin Riesgo">Sin Riesgo</option>
                  <option value="Bajo">Bajo</option>
                  <option value="Medio">Medio</option>
                  <option value="Alto">Alto</option>
                </select>

                {(riesgoSuicida === 'Medio' || riesgoSuicida === 'Alto') && (
                  <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
                    <strong className="block text-red-900 font-bold mb-1">⚠️ Alerta de Riesgo {riesgoSuicida}</strong>
                    Se recomienda activar el protocolo de seguridad de inmediato.
                  </div>
                )}
              </div>

              <div className="sm:col-span-2 mt-4">
                <label className="block text-sm font-semibold text-slate-800 mb-1">Consciencia de Enfermedad</label>
                <select name={modalidad === 'Pareja' ? "examen_mental_a.consciencia_enfermedad" : "examen_mental.consciencia_enfermedad"} defaultValue={modalidad === 'Pareja' ? initialData?.examen_mental?.paciente_a?.consciencia_enfermedad : initialData?.examen_mental?.consciencia_enfermedad || 'Presente'} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                  <option value="Presente">Presente</option>
                  <option value="Ausente">Ausente</option>
                  <option value="Parcial">Parcial</option>
                </select>
              </div>
            </div>
          </div>

          {modalidad === 'Pareja' && (
            <div className={subTabExamen === 'B' ? 'block' : 'hidden'}>
              <h3 className="text-md font-bold text-[#0e787a] mb-4">Examen Mental - Paciente B</h3>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Aspecto Físico</label>
                  <select name="examen_mental_b.aspecto_fisico" defaultValue={initialData?.examen_mental?.paciente_b?.aspecto_fisico || 'Adecuado'} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                    <option value="Adecuado">Adecuado</option>
                    <option value="No Adecuado">No Adecuado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Actitud</label>
                  <select name="examen_mental_b.actitud" defaultValue={initialData?.examen_mental?.paciente_b?.actitud || 'Adecuada'} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                    <option value="Adecuada">Adecuada (Colaboradora)</option>
                    <option value="Hostil">Hostil / Defensiva</option>
                    <option value="Indiferente">Indiferente</option>
                    <option value="Seductora">Seductora</option>
                    <option value="Otra">Otra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Estado de Consciencia</label>
                  <select name="examen_mental_b.consciencia" defaultValue={initialData?.examen_mental?.paciente_b?.consciencia || 'Alerta'} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                    <option value="Alerta">Alerta</option>
                    <option value="Hiperalerta">Hiperalerta</option>
                    <option value="Somnoliento">Somnoliento</option>
                    <option value="Obnubilado">Obnubilado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Lenguaje y Habla</label>
                  <select name="examen_mental_b.lenguaje" defaultValue={initialData?.examen_mental?.paciente_b?.lenguaje || 'Organizado y Coherente'} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                    <option value="Organizado y Coherente">Organizado y Coherente</option>
                    <option value="Desorganizado">Desorganizado</option>
                    <option value="Taquilalia">Taquilalia</option>
                    <option value="Bradilalia">Bradilalia</option>
                    <option value="Mutismo">Mutismo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Orientación (Tiempo/Espacio/Persona)</label>
                  <select name="examen_mental_b.orientacion" defaultValue={initialData?.examen_mental?.paciente_b?.orientacion || 'Orientado'} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                    <option value="Orientado">Orientado globalmente</option>
                    <option value="Desorientado en tiempo">Desorientado en tiempo</option>
                    <option value="Desorientado en espacio">Desorientado en espacio</option>
                    <option value="Desorientado en persona">Desorientado en persona</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Sensopercepción</label>
                  <select name="examen_mental_b.sensopercepcion" defaultValue={initialData?.examen_mental?.paciente_b?.sensopercepcion || 'Sin alteraciones'} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                    <option value="Sin alteraciones">Sin alteraciones evidentes</option>
                    <option value="Alucinaciones visuales">Alucinaciones visuales</option>
                    <option value="Alucinaciones auditivas">Alucinaciones auditivas</option>
                    <option value="Ilusiones">Ilusiones</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Curso y Contenido del Pensamiento</label>
                  <input type="text" name="examen_mental_b.pensamiento" defaultValue={initialData?.examen_mental?.paciente_b?.pensamiento || 'Lógico y coherente'} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]" placeholder="Lógico, fuga de ideas, ideas delirantes..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Afectividad</label>
                  <input type="text" name="examen_mental_b.afectividad" defaultValue={initialData?.examen_mental?.paciente_b?.afectividad || 'Eutímico'} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]" placeholder="Eutímico, hipertímico, aplanado..." />
                </div>
                
                <div className="sm:col-span-2 bg-slate-50 p-6 rounded-lg border border-slate-200 mt-4">
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Evaluación de Riesgo Suicida *</label>
                  <select 
                    name="examen_mental_b.nivel_riesgo_suicida" 
                    value={riesgoSuicidaB}
                    onChange={(e) => setRiesgoSuicidaB(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a] mb-4"
                  >
                    <option value="Sin Riesgo">Sin Riesgo</option>
                    <option value="Bajo">Bajo</option>
                    <option value="Medio">Medio</option>
                    <option value="Alto">Alto</option>
                  </select>

                  {(riesgoSuicidaB === 'Medio' || riesgoSuicidaB === 'Alto') && (
                    <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
                      <strong className="block text-red-900 font-bold mb-1">⚠️ Alerta de Riesgo {riesgoSuicidaB}</strong>
                      Se recomienda activar el protocolo de seguridad de inmediato para Paciente B.
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2 mt-4">
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Consciencia de Enfermedad</label>
                  <select name="examen_mental_b.consciencia_enfermedad" defaultValue={initialData?.examen_mental?.paciente_b?.consciencia_enfermedad || 'Presente'} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                    <option value="Presente">Presente</option>
                    <option value="Ausente">Ausente</option>
                    <option value="Parcial">Parcial</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 border-t pt-8">
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
              <div className="flex items-center">
                <input type="hidden" name="examen_mental.riesgo_vif" value={riesgoVif ? 'true' : 'false'} />
                <input
                  id="riesgo_vif"
                  type="checkbox"
                  checked={riesgoVif}
                  onChange={(e) => setRiesgoVif(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-600"
                />
                <label htmlFor="riesgo_vif" className="ml-3 block text-sm font-bold text-red-700">
                  ⚠️ Riesgo de Violencia de Pareja / VIF Detectado
                </label>
              </div>
              {riesgoVif && (
                <p className="mt-2 text-sm text-red-600">
                  Alerta: Se recomienda evaluar cuidadosamente la seguridad, notificar a las autoridades competentes si la ley lo requiere, y proveer líneas de atención de emergencia.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* TAB 4: ANÁLISIS Y DIAGNÓSTICO */}
        <div className={activeTab === 4 ? 'block' : 'hidden'}>
          <h2 className="text-lg font-bold text-slate-900 mb-6">Impresión Diagnóstica y Plan</h2>
          
          <div className="mb-6">
            <AITextArea
              name="analisis_diagnostico.analisis"
              label="Análisis Objetivo (Observaciones del profesional)"
              defaultValue={initialData?.analisis_diagnostico?.analisis}
              rows={4}
              seccion="Análisis objetivo y observaciones clínicas generales previas al diagnóstico."
            />
          </div>

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">Diagnóstico Principal (CIE-10)</label>
              <SugerirDiagnosticoBtn 
                getDatos={getDatosForSugerencias} 
                onSelect={(code) => setCie10(code)} 
              />
              <input 
                type="text" 
                name="analisis_diagnostico.cie10" 
                value={cie10}
                onChange={(e) => setCie10(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]" 
                placeholder="Ej: F32.0 Episodio depresivo leve" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">Tipo de Tratamiento Propuesto</label>
              <select name="analisis_diagnostico.tipo_tratamiento" defaultValue={initialData?.analisis_diagnostico?.tipo_tratamiento || 'Terapia Individual'} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e787a]">
                <option value="Terapia Individual">Terapia Individual</option>
                <option value="Terapia de Pareja">Terapia de Pareja</option>
                <option value="Terapia de Familia">Terapia de Familia</option>
                <option value="Valoración por Psiquiatría">Valoración por Psiquiatría</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <AITextArea
              name="analisis_diagnostico.plan"
              label="Plan de Intervención / Recomendaciones"
              defaultValue={initialData?.analisis_diagnostico?.plan}
              rows={4}
              seccion="Plan de intervención terapéutica y recomendaciones para el paciente."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-8 mt-8 border-t border-gray-200 flex justify-between">
          <button
            type="button"
            onClick={prevTab}
            disabled={activeTab === 1}
            className="bg-white py-2 px-4 border border-slate-300 text-slate-900 rounded-lg shadow-sm text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            &larr; Anterior
          </button>
          
          {activeTab < 4 ? (
            <button
              type="button"
              onClick={nextTab}
              className="bg-[#224252] py-2 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-[#1a323f]"
            >
              Siguiente &rarr;
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#0e787a] py-2 px-8 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-[#0b5c5d] disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando historia...' : initialData ? 'Actualizar Historia Clínica' : 'Guardar Historia Clínica'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
