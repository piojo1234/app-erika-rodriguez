import { supabaseServer } from '@/lib/supabaseServer'
import Link from 'next/link'
import PDFExportButton from './PDFExportButton'
import SugerirPlanBtn from '../SugerirPlanBtn'
import HistoriaActions from './HistoriaActions'

export const metadata = {
  title: 'Ver Historia Clínica | Psicóloga Erika Rodríguez',
}

export default async function VerHistoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Obtener la historia clínica completa con los datos del paciente y sus evoluciones
  const { data: historia, error } = await supabaseServer
    .from('historias_clinicas')
    .select(`
      *,
      pacientes (*)
    `)
    .eq('id', id)
    .single()

  if (error || !historia) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 font-sans text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Historia no encontrada</h1>
        <Link href="/admin/historias" className="text-[#0e787a] hover:underline">&larr; Volver a Historias</Link>
      </div>
    )
  }

  const { data: evoluciones } = await supabaseServer
    .from('evoluciones_clinicas')
    .select('*')
    .eq('historia_clinica_id', historia.id)
    .order('fecha_sesion', { ascending: true })

  // Para evitar que pete por si algún JSON es null
  const acudiente = historia.acudiente || {}
  const eps = historia.eps || {}
  const antecedentes = historia.antecedentes || {}
  const anamnesis = historia.anamnesis || {}
  const ex = historia.examen_mental || {}
  const diag = historia.analisis_diagnostico || {}
  const pac = historia.pacientes || {}
  const demo = historia.datos_demograficos || {}
  const esPareja = demo.modalidad === 'Pareja'

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historia Clínica FBE.70</h1>
          <p className="mt-1 text-sm text-gray-500">Paciente: {pac.nombre_completo} ({pac.tipo_documento} {pac.numero_documento})</p>
        </div>
        <div className="flex space-x-4">
          <Link
            href="/admin/historias"
            className="text-sm font-medium text-gray-500 hover:text-gray-700 mt-2"
          >
            &larr; Volver
          </Link>
          <HistoriaActions historiaId={historia.id} estado={historia.estado || 'activa'} />
          <Link
            href={`/admin/historias/${historia.id}/evolucion`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#25D366] hover:bg-[#128C7E] transition-colors"
          >
            Añadir / Ver Evoluciones
          </Link>
          <PDFExportButton historia={historia} evoluciones={evoluciones || []} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Acudiente y EPS */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-[#0e787a] mb-4">Datos Generales {esPareja ? '(Paciente A)' : ''}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="font-semibold text-gray-600">Acudiente:</span> <br/>{acudiente.nombre || 'N/A'}</div>
            <div><span className="font-semibold text-gray-600">Parentesco:</span> <br/>{acudiente.parentesco || 'N/A'}</div>
            <div><span className="font-semibold text-gray-600">Teléfono:</span> <br/>{acudiente.telefono || 'N/A'}</div>
            <div><span className="font-semibold text-gray-600">EPS:</span> <br/>{eps.nombre || 'N/A'} ({eps.regimen || 'N/A'})</div>
          </div>
        </div>

        {esPareja && (
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-[#0e787a] mb-4">Datos Generales (Paciente B)</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div><span className="font-semibold text-gray-600">Nombre:</span> <br/>{demo.paciente_b_nombre || 'N/A'}</div>
              <div><span className="font-semibold text-gray-600">Documento:</span> <br/>{demo.paciente_b_documento || 'N/A'}</div>
              <div><span className="font-semibold text-gray-600">Edad:</span> <br/>{demo.paciente_b_edad || 'N/A'}</div>
              <div><span className="font-semibold text-gray-600">Email:</span> <br/>{demo.paciente_b_email || 'N/A'}</div>
              <div><span className="font-semibold text-gray-600">EPS:</span> <br/>{demo.paciente_b_eps || 'N/A'}</div>
            </div>
            <h3 className="text-md font-bold text-[#0e787a] mt-4 mb-2">Datos de la Relación</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="font-semibold text-gray-600">Tiempo:</span> <br/>{demo.relacion_tiempo || 'N/A'}</div>
              <div><span className="font-semibold text-gray-600">Estado Legal:</span> <br/>{demo.relacion_estado_legal || 'N/A'}</div>
              <div><span className="font-semibold text-gray-600">Hijos:</span> <br/>{demo.relacion_hijos || 'N/A'}</div>
            </div>
          </div>
        )}

        {/* Anamnesis */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-[#0e787a] mb-4">Motivo de Consulta y Anamnesis</h2>
          <div className="space-y-4 text-sm">
            {esPareja ? (
              <>
                <div>
                  <span className="font-semibold text-gray-600 block mb-1">Motivo de Consulta (Paciente A):</span>
                  <p className="bg-white p-3 border rounded-md">{anamnesis.motivo_consulta_a}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600 block mb-1">Motivo de Consulta (Paciente B):</span>
                  <p className="bg-white p-3 border rounded-md">{anamnesis.motivo_consulta_b}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600 block mb-1">Discrepancias o Visión Compartida:</span>
                  <p className="bg-white p-3 border rounded-md">{anamnesis.discrepancias}</p>
                </div>
              </>
            ) : (
              <div>
                <span className="font-semibold text-gray-600 block mb-1">Motivo de Consulta:</span>
                <p className="bg-white p-3 border rounded-md">{anamnesis.motivo_consulta}</p>
              </div>
            )}
            <div>
              <span className="font-semibold text-gray-600 block mb-1">Definición del Problema:</span>
              <p className="bg-white p-3 border rounded-md">{anamnesis.definicion_problema}</p>
            </div>
            {esPareja ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="font-semibold text-[#0e787a] block mb-2 text-md">Antecedentes Clínicos (Paciente A):</span>
                  <div className="space-y-3">
                    <div><span className="font-semibold text-gray-600 block text-xs uppercase">Médicos</span><p className="bg-white p-3 border rounded-md whitespace-pre-wrap">{antecedentes.paciente_a?.medicos || 'N/A'}</p></div>
                    <div><span className="font-semibold text-gray-600 block text-xs uppercase">Psiquiátricos</span><p className="bg-white p-3 border rounded-md whitespace-pre-wrap">{antecedentes.paciente_a?.psiquiatricos || 'N/A'}</p></div>
                    <div><span className="font-semibold text-gray-600 block text-xs uppercase">Tratamientos</span><p className="bg-white p-3 border rounded-md whitespace-pre-wrap">{antecedentes.paciente_a?.tratamientos || 'N/A'}</p></div>
                    <div><span className="font-semibold text-gray-600 block text-xs uppercase">Sustancias</span><p className="bg-white p-3 border rounded-md whitespace-pre-wrap">{antecedentes.paciente_a?.sustancias || 'N/A'}</p></div>
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-[#0e787a] block mb-2 text-md">Antecedentes Clínicos (Paciente B):</span>
                  <div className="space-y-3">
                    <div><span className="font-semibold text-gray-600 block text-xs uppercase">Médicos</span><p className="bg-white p-3 border rounded-md whitespace-pre-wrap">{antecedentes.paciente_b?.medicos || 'N/A'}</p></div>
                    <div><span className="font-semibold text-gray-600 block text-xs uppercase">Psiquiátricos</span><p className="bg-white p-3 border rounded-md whitespace-pre-wrap">{antecedentes.paciente_b?.psiquiatricos || 'N/A'}</p></div>
                    <div><span className="font-semibold text-gray-600 block text-xs uppercase">Tratamientos</span><p className="bg-white p-3 border rounded-md whitespace-pre-wrap">{antecedentes.paciente_b?.tratamientos || 'N/A'}</p></div>
                    <div><span className="font-semibold text-gray-600 block text-xs uppercase">Sustancias</span><p className="bg-white p-3 border rounded-md whitespace-pre-wrap">{antecedentes.paciente_b?.sustancias || 'N/A'}</p></div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <span className="font-semibold text-gray-600 block mb-1">Antecedentes Físicos y Mentales:</span>
                <p className="bg-white p-3 border rounded-md whitespace-pre-wrap">{antecedentes.personales_familiares || 'N/A'}</p>
              </div>
            )}
            {esPareja && (
              <>
                <h3 className="text-md font-bold text-[#0e787a] mt-4 mb-2">Dinámica Relacional</h3>
                <div>
                  <span className="font-semibold text-gray-600 block mb-1">Historia de la Relación:</span>
                  <p className="bg-white p-3 border rounded-md">{anamnesis.dinamica_historia_relacion || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600 block mb-1">Comunicación y Resolución de Conflictos:</span>
                  <p className="bg-white p-3 border rounded-md">{anamnesis.dinamica_comunicacion || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600 block mb-1">Intimidad y Satisfacción Sexual:</span>
                  <p className="bg-white p-3 border rounded-md">{anamnesis.dinamica_intimidad || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600 block mb-1">Roles y Finanzas:</span>
                  <p className="bg-white p-3 border rounded-md">{anamnesis.dinamica_roles || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600 block mb-1">Expectativas de Terapia:</span>
                  <p className="bg-white p-3 border rounded-md">{anamnesis.dinamica_expectativas || 'N/A'}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Examen Mental */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-[#0e787a] mb-4">Examen Mental</h2>
          {esPareja ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-x divide-gray-200">
              <div className="pr-4">
                <h3 className="font-bold text-[#0e787a] mb-4">Examen Mental (Paciente A)</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-semibold text-gray-600">Aspecto Físico:</span> {ex.paciente_a?.aspecto_fisico}</div>
                  <div><span className="font-semibold text-gray-600">Actitud:</span> {ex.paciente_a?.actitud}</div>
                  <div><span className="font-semibold text-gray-600">Consciencia:</span> {ex.paciente_a?.consciencia}</div>
                  <div><span className="font-semibold text-gray-600">Lenguaje:</span> {ex.paciente_a?.lenguaje}</div>
                  <div><span className="font-semibold text-gray-600">Orientación:</span> {ex.paciente_a?.orientacion}</div>
                  <div><span className="font-semibold text-gray-600">Sensopercepción:</span> {ex.paciente_a?.sensopercepcion}</div>
                  <div className="col-span-2"><span className="font-semibold text-gray-600">Pensamiento:</span> {ex.paciente_a?.pensamiento}</div>
                  <div className="col-span-2"><span className="font-semibold text-gray-600">Afectividad:</span> {ex.paciente_a?.afectividad}</div>
                  <div><span className="font-semibold text-gray-600">Riesgo Suicida:</span> {ex.paciente_a?.nivel_riesgo_suicida}</div>
                  <div><span className="font-semibold text-gray-600">Consciencia Enf.:</span> {ex.paciente_a?.consciencia_enfermedad}</div>
                </div>
              </div>
              <div className="pl-4">
                <h3 className="font-bold text-[#0e787a] mb-4">Examen Mental (Paciente B)</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-semibold text-gray-600">Aspecto Físico:</span> {ex.paciente_b?.aspecto_fisico}</div>
                  <div><span className="font-semibold text-gray-600">Actitud:</span> {ex.paciente_b?.actitud}</div>
                  <div><span className="font-semibold text-gray-600">Consciencia:</span> {ex.paciente_b?.consciencia}</div>
                  <div><span className="font-semibold text-gray-600">Lenguaje:</span> {ex.paciente_b?.lenguaje}</div>
                  <div><span className="font-semibold text-gray-600">Orientación:</span> {ex.paciente_b?.orientacion}</div>
                  <div><span className="font-semibold text-gray-600">Sensopercepción:</span> {ex.paciente_b?.sensopercepcion}</div>
                  <div className="col-span-2"><span className="font-semibold text-gray-600">Pensamiento:</span> {ex.paciente_b?.pensamiento}</div>
                  <div className="col-span-2"><span className="font-semibold text-gray-600">Afectividad:</span> {ex.paciente_b?.afectividad}</div>
                  <div><span className="font-semibold text-gray-600">Riesgo Suicida:</span> {ex.paciente_b?.nivel_riesgo_suicida}</div>
                  <div><span className="font-semibold text-gray-600">Consciencia Enf.:</span> {ex.paciente_b?.consciencia_enfermedad}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="font-semibold text-gray-600">Aspecto Físico:</span> {ex.aspecto_fisico}</div>
              <div><span className="font-semibold text-gray-600">Actitud:</span> {ex.actitud}</div>
              <div><span className="font-semibold text-gray-600">Estado de Consciencia:</span> {ex.consciencia}</div>
              <div><span className="font-semibold text-gray-600">Lenguaje:</span> {ex.lenguaje}</div>
              <div><span className="font-semibold text-gray-600">Orientación:</span> {ex.orientacion}</div>
              <div><span className="font-semibold text-gray-600">Sensopercepción:</span> {ex.sensopercepcion}</div>
              <div className="col-span-2"><span className="font-semibold text-gray-600">Pensamiento:</span> {ex.pensamiento}</div>
              <div className="col-span-2"><span className="font-semibold text-gray-600">Afectividad:</span> {ex.afectividad}</div>
              <div><span className="font-semibold text-gray-600">Riesgo Suicida:</span> {ex.nivel_riesgo_suicida || ex.riesgo_suicida}</div>
              <div><span className="font-semibold text-gray-600">Consciencia de Enf.:</span> {ex.consciencia_enfermedad}</div>
            </div>
          )}
          {ex.riesgo_vif && (
            <div className="mt-4 bg-red-50 text-red-700 p-3 rounded border border-red-200 font-bold">
              ⚠️ RIESGO DE VIOLENCIA DE PAREJA / VIF DETECTADO
            </div>
          )}
        </div>

        {/* Análisis y Plan */}
        <div className="p-6 bg-gray-50">
          <h2 className="text-lg font-bold text-[#0e787a] mb-4">Análisis, Diagnóstico y Plan</h2>
          <div className="space-y-4 text-sm">
            <div>
              <span className="font-semibold text-gray-600 block mb-1">Análisis Objetivo:</span>
              <p className="bg-white p-3 border rounded-md">{diag.analisis}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-semibold text-gray-600 block mb-1">Diagnóstico (CIE-10):</span>
                <p className="bg-white p-3 border rounded-md font-bold">{diag.cie10}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-600 block mb-1">Tipo de Tratamiento:</span>
                <p className="bg-white p-3 border rounded-md">{diag.tipo_tratamiento}</p>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-600">Plan de Intervención:</span>
                <SugerirPlanBtn historia={historia} evoluciones={evoluciones || []} />
              </div>
              <p className="bg-white p-3 border rounded-md whitespace-pre-wrap">{diag.plan}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
