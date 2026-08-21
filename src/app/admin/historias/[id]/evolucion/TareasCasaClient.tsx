'use client'

import { useState } from 'react'
import { sugerirEjerciciosAction } from '../../ai-actions'
import toast from 'react-hot-toast'

export default function TareasCasaClient({
  diagnostico,
  motivoConsulta,
  evolucionesRecientes,
  tareasPrevias,
  pacienteNombre,
  pacienteTelefono,
}: {
  diagnostico: string
  motivoConsulta: string
  evolucionesRecientes: any[]
  tareasPrevias: any[]
  pacienteNombre: string
  pacienteTelefono: string
}) {
  // Estado para la revisión de las tareas anteriores
  const [revision, setRevision] = useState<any[]>(
    tareasPrevias.map(t => ({
      ...t,
      estado: 'No realizada',
      notas: '',
    }))
  )

  // Estado para las nuevas tareas sugeridas/creadas
  const [nuevasTareas, setNuevasTareas] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleEstadoChange = (index: number, estado: string) => {
    const newRev = [...revision]
    newRev[index].estado = estado
    setRevision(newRev)
  }

  const handleNotasChange = (index: number, notas: string) => {
    const newRev = [...revision]
    newRev[index].notas = notas
    setRevision(newRev)
  }

  const handleSugerirTareas = async () => {
    setIsGenerating(true)
    try {
      const sugerencias = await sugerirEjerciciosAction({
        diagnostico,
        motivoConsulta,
        evoluciones: evolucionesRecientes,
        tareasAnteriores: revision,
      })
      setNuevasTareas([...nuevasTareas, ...sugerencias])
      toast.success('Tareas sugeridas con éxito')
    } catch (error: any) {
      toast.error(error.message || 'Error al generar tareas')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddManual = () => {
    setNuevasTareas([...nuevasTareas, { titulo: '', descripcion: '', frecuencia: '' }])
  }

  const handleRemoveTarea = (index: number) => {
    const arr = [...nuevasTareas]
    arr.splice(index, 1)
    setNuevasTareas(arr)
  }

  const handleUpdateTarea = (index: number, field: string, value: string) => {
    const arr = [...nuevasTareas]
    arr[index][field] = value
    setNuevasTareas(arr)
  }

  const handleCopiar = (tarea: any) => {
    const texto = `📌 *${tarea.titulo || 'Tarea'}*\n📝 *Instrucciones:* ${tarea.descripcion || ''}\n⏰ *Frecuencia:* ${tarea.frecuencia || ''}`
    navigator.clipboard.writeText(texto)
    toast.success('Copiado al portapapeles')
  }

  const handleWhatsApp = (tarea: any) => {
    let telNumber = pacienteTelefono
    if (!telNumber) {
      const prompted = window.prompt('Ingresa el número de WhatsApp para enviar la tarea:')
      if (!prompted) return
      telNumber = prompted
    }
    
    const telClean = telNumber.replace(/\D/g, '')
    const telFinal = (telClean.length === 10 && !telClean.startsWith('57')) ? `57${telClean}` : telClean
    
    const mensaje = `Hola ${pacienteNombre}, te comparto la actividad acordada en nuestra sesión:

📌 *${tarea.titulo || 'Tarea'}*
📝 *Instrucciones:* ${tarea.descripcion || ''}
⏰ *Frecuencia:* ${tarea.frecuencia || ''}

Cualquier inquietud quedo atenta. ¡Un saludo!
Psicóloga Erika Rodríguez`

    const url = `https://wa.me/${telFinal}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Hidden inputs para el form */}
      <input type="hidden" name="revision_tarea_previa" value={JSON.stringify(revision)} />
      <input type="hidden" name="tareas_casa" value={JSON.stringify(nuevasTareas)} />

      {/* Tarjeta de revisión de tareas previas */}
      {tareasPrevias.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
          <h3 className="font-bold text-orange-900 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Revisión de Tareas Anteriores
          </h3>
          <div className="space-y-4">
            {revision.map((tarea, index) => (
              <div key={index} className="bg-white p-3 rounded border border-orange-100 shadow-sm">
                <p className="font-semibold text-sm text-gray-800">{tarea.titulo || 'Tarea sin título'}</p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                    <select
                      value={tarea.estado}
                      onChange={(e) => handleEstadoChange(index, e.target.value)}
                      className="w-full text-sm border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="Completada">Completada</option>
                      <option value="Parcial">Parcial</option>
                      <option value="No realizada">No realizada</option>
                      <option value="Dificultades">Dificultades</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Notas (Opcional)</label>
                    <input
                      type="text"
                      value={tarea.notas}
                      onChange={(e) => handleNotasChange(index, e.target.value)}
                      placeholder="Ej. Le costó concentrarse"
                      className="w-full text-sm border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Asignación de nuevas tareas */}
      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-indigo-900 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            Nuevas Tareas Intersesión
          </h3>
          <button
            type="button"
            onClick={handleSugerirTareas}
            disabled={isGenerating}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white py-1 px-3 rounded flex items-center disabled:opacity-50 transition-colors"
          >
            {isGenerating ? 'Generando...' : '✨ Sugerir con IA'}
          </button>
        </div>

        {nuevasTareas.length === 0 ? (
          <p className="text-sm text-indigo-700 italic">No hay tareas asignadas para la próxima sesión.</p>
        ) : (
          <div className="space-y-3">
            {nuevasTareas.map((tarea, index) => (
              <div key={index} className="bg-white p-3 rounded border border-indigo-200 shadow-sm relative group">
                <button 
                  type="button"
                  onClick={() => handleRemoveTarea(index)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Eliminar tarea"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <input
                  type="text"
                  placeholder="Título de la tarea"
                  value={tarea.titulo}
                  onChange={(e) => handleUpdateTarea(index, 'titulo', e.target.value)}
                  className="w-full font-semibold text-sm border-0 border-b border-dashed border-gray-300 focus:ring-0 focus:border-indigo-500 p-0 mb-2 pb-1"
                />
                <textarea
                  placeholder="Descripción paso a paso"
                  value={tarea.descripcion}
                  onChange={(e) => handleUpdateTarea(index, 'descripcion', e.target.value)}
                  rows={2}
                  className="w-full text-sm border-0 border-b border-dashed border-gray-300 focus:ring-0 focus:border-indigo-500 p-0 mb-2 pb-1"
                />
                <input
                  type="text"
                  placeholder="Frecuencia (Ej. Todos los días por 10 min)"
                  value={tarea.frecuencia}
                  onChange={(e) => handleUpdateTarea(index, 'frecuencia', e.target.value)}
                  className="w-full text-xs text-gray-600 border-0 border-b border-dashed border-gray-300 focus:ring-0 focus:border-indigo-500 p-0 pb-1 mb-3"
                />
                
                <div className="flex gap-2 justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => handleCopiar(tarea)}
                    className="text-[10px] sm:text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-1 px-2 rounded font-medium transition-colors border border-slate-300 flex items-center"
                  >
                    📋 Copiar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWhatsApp(tarea)}
                    className="text-[10px] sm:text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-1 px-2 rounded font-medium transition-colors border border-indigo-200 flex items-center"
                  >
                    📱 Enviar por WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <button
          type="button"
          onClick={handleAddManual}
          className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          + Añadir tarea manualmente
        </button>
      </div>
    </div>
  )
}
