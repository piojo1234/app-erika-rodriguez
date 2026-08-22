import { supabaseServer } from '@/lib/supabaseServer'
import Link from 'next/link'
import { guardarEvolucion } from './actions'
import GenerarInformeBtn from './GenerarInformeBtn'
import TareasCasaClient from './TareasCasaClient'
import TareasHistorialClient from './TareasHistorialClient'
import ControlSaldosClient from './ControlSaldosClient'
import EditarEvolucionModal from './EditarEvolucionModal'

export const metadata = {
  title: 'Evoluciones Terapéuticas | Psicóloga Erika Rodríguez',
}

export default async function EvolucionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Obtener historia y paciente
  const { data: historia, error } = await supabaseServer
    .from('historias_clinicas')
    .select('id, paciente_id, datos_demograficos, acudiente, pacientes(nombre_completo, numero_documento, telefono)')
    .eq('id', id)
    .single()

  const esPareja = historia?.datos_demograficos?.modalidad === 'Pareja'

  if (error || !historia) {
    return (
      <div className="max-w-4xl mx-auto py-8 text-center font-sans">
        <h1 className="text-2xl font-bold">Historia no encontrada</h1>
        <Link href="/admin/historias">&larr; Volver</Link>
      </div>
    )
  }

  // Obtener evoluciones
  const { data: evoluciones } = await supabaseServer
    .from('evoluciones_clinicas')
    .select('*')
    .eq('historia_clinica_id', historia.id)
    .order('numero_sesion', { ascending: false })

  // Obtener vista_saldo_paquetes
  const { data: vistaSaldo } = await supabaseServer
    .from('vista_saldo_paquetes')
    .select('*')
    .eq('paciente_id', historia.paciente_id)
    .maybeSingle()

  const numSiguienteSesion = (evoluciones?.length || 0) + 1
  const sesionPaqueteSiguiente = vistaSaldo ? vistaSaldo.sesiones_consumidas + 1 : numSiguienteSesion

  const ultimaEvolucion = evoluciones?.[0]
  const tareasPrevias = ultimaEvolucion?.tareas_casa ? (typeof ultimaEvolucion.tareas_casa === 'string' ? JSON.parse(ultimaEvolucion.tareas_casa) : ultimaEvolucion.tareas_casa) : []

  const pacienteTelefonoBase = (historia.pacientes as any)?.telefono || (historia.acudiente as any)?.telefono || ''
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 font-sans">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Evoluciones Terapéuticas</h1>
          <p className="mt-1 text-sm text-gray-500">Paciente: {(historia.pacientes as any)?.nombre_completo}</p>
        </div>
        <Link href={`/admin/historias/${historia.id}`} className="text-sm font-medium text-[#0e787a] hover:underline">
          &larr; Volver a la Historia
        </Link>
      </div>

      <ControlSaldosClient 
        vistaSaldo={vistaSaldo} 
        pacienteTelefono={pacienteTelefonoBase} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Formulario de Nueva Evolución */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
            <div className="px-6 py-4 border-b border-gray-200 bg-[#0e787a] text-white">
              <h2 className="text-lg font-semibold">Registrar Sesión {vistaSaldo ? sesionPaqueteSiguiente : numSiguienteSesion}</h2>
            </div>
            <form action={guardarEvolucion} className="p-6">
              <input type="hidden" name="historia_clinica_id" value={historia.id} />
              <input type="hidden" name="paciente_id" value={historia.paciente_id} />
              <input type="hidden" name="numero_sesion" value={numSiguienteSesion} />
              {vistaSaldo?.contrato_id && <input type="hidden" name="contrato_id" value={vistaSaldo.contrato_id} />}
              
              {vistaSaldo && (
                <div className="mb-4 bg-blue-50 text-blue-800 text-sm p-3 rounded-lg border border-blue-100 flex items-start gap-2">
                  <span className="text-lg">ℹ️</span>
                  <p>
                    Esta nota corresponderá a la <strong>Sesión {sesionPaqueteSiguiente} de {vistaSaldo.total_sesiones_contratadas}</strong> del paquete contratado.
                  </p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800">Fecha de Sesión *</label>
                  <input required type="datetime-local" name="fecha_sesion" className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:ring-[#0e787a]" />
                </div>

                {esPareja && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-800">Atención realizada a *</label>
                    <select required name="asistente_sesion" defaultValue="Ambos" className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg shadow-sm focus:ring-[#0e787a]">
                      <option value="Ambos">👥 Ambos (Conjunta)</option>
                      <option value="Paciente A">👤 Paciente A (Individual)</option>
                      <option value="Paciente B">👤 Paciente B (Individual)</option>
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-semibold text-slate-800">Evolución Detallada *</label>
                  <textarea required name="evolucion_terapeutica" rows={5} className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:ring-[#0e787a]" placeholder="Temas tratados, técnicas, respuestas del paciente..."></textarea>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800">Observaciones</label>
                  <textarea name="observaciones_valoracion" rows={3} className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:ring-[#0e787a]" placeholder="Anotaciones extra..."></textarea>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800">Diagnóstico CIE-10 Actualizado</label>
                  <input type="text" name="diagnostico_cie10" defaultValue={ultimaEvolucion?.diagnostico_cie10 || ''} className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg shadow-sm focus:ring-[#0e787a]" placeholder="Opcional. Ej: F41.1" />
                </div>

                <hr className="my-6" />

                <TareasCasaClient
                  diagnostico={ultimaEvolucion?.diagnostico_cie10 || 'No especificado'}
                  motivoConsulta={(historia as any)?.anamnesis?.motivo_consulta || (historia as any)?.motivo_consulta || 'No especificado'}
                  evolucionesRecientes={evoluciones?.slice(0, 2) || []}
                  tareasPrevias={tareasPrevias}
                  pacienteNombre={(historia.pacientes as any)?.nombre_completo || ''}
                  pacienteTelefono={pacienteTelefonoBase}
                />

                <button type="submit" className="mt-4 w-full bg-[#0e787a] py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-[#0b5c5d]">
                  Guardar Evolución
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Historial de Evoluciones */}
        <div className="md:col-span-2 space-y-6">
          <GenerarInformeBtn evoluciones={evoluciones || []} />
          
          <h2 className="text-xl font-bold text-slate-900 border-b pb-2">Historial de Sesiones</h2>
          {evoluciones?.length === 0 ? (
            <p className="text-gray-500">No hay sesiones registradas.</p>
          ) : (
            evoluciones?.map(evol => (
              <div key={evol.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#224252]">Sesión N° {evol.numero_sesion}</h3>
                    <EditarEvolucionModal evolucion={evol} esPareja={evol.asistente_sesion !== null} />
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500 block" suppressHydrationWarning>{new Date(evol.fecha_sesion).toLocaleString('es-CO')}</span>
                    {evol.asistente_sesion && (
                      <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded mt-1 inline-block">
                        Atención: {evol.asistente_sesion}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700 block">Evolución:</span>
                    <p className="whitespace-pre-wrap mt-1 text-gray-600">{evol.evolucion_terapeutica}</p>
                  </div>
                  {evol.observaciones_valoracion && (
                    <div>
                      <span className="font-semibold text-gray-700 block">Observaciones:</span>
                      <p className="whitespace-pre-wrap mt-1 text-gray-600">{evol.observaciones_valoracion}</p>
                    </div>
                  )}
                  {evol.diagnostico_cie10 && (
                    <div className="inline-block bg-gray-100 rounded px-2 py-1">
                      <span className="font-semibold text-gray-700">CIE-10:</span> {evol.diagnostico_cie10}
                    </div>
                  )}
                </div>
                
                <TareasHistorialClient
                  evolucionId={evol.id}
                  tareasIniciales={evol.tareas_casa ? (typeof evol.tareas_casa === 'string' ? JSON.parse(evol.tareas_casa) : evol.tareas_casa) : []}
                  pacienteNombre={(historia.pacientes as any)?.nombre_completo || ''}
                  pacienteTelefono={pacienteTelefonoBase}
                />
              </div>
            ))
          )}
        </div>
        
      </div>
    </div>
  )
}
