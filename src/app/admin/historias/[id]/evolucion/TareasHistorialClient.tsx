'use client'

import { useState } from 'react'
import { actualizarTareasEvolucion } from './actions'
import toast from 'react-hot-toast'

export default function TareasHistorialClient({
  evolucionId,
  tareasIniciales,
  pacienteNombre,
  pacienteTelefono
}: {
  evolucionId: string
  tareasIniciales: any[]
  pacienteNombre: string
  pacienteTelefono: string
}) {
  const [tareas, setTareas] = useState<any[]>(tareasIniciales || [])
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleUpdateTarea = (index: number, field: string, value: string) => {
    const arr = [...tareas]
    arr[index][field] = value
    setTareas(arr)
    setHasChanges(true)
  }

  const handleAddManual = () => {
    setTareas([...tareas, { titulo: '', descripcion: '', frecuencia: '' }])
    setHasChanges(true)
  }

  const handleRemoveTarea = (index: number) => {
    const arr = [...tareas]
    arr.splice(index, 1)
    setTareas(arr)
    setHasChanges(true)
  }

  const handleGuardar = async () => {
    setIsSaving(true)
    try {
      await actualizarTareasEvolucion(evolucionId, tareas)
      toast.success('Tareas actualizadas con éxito')
      setHasChanges(false)
    } catch (e: any) {
      toast.error('Error al guardar tareas')
    } finally {
      setIsSaving(false)
    }
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

  if (tareas.length === 0 && !hasChanges) {
    return (
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={handleAddManual}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          + Añadir tareas intersesión a esta evolución
        </button>
      </div>
    )
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-indigo-900 text-sm flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
          Tareas Intersesión
        </h4>
        {hasChanges && (
          <button
            onClick={handleGuardar}
            disabled={isSaving}
            className="text-xs bg-[#0e787a] hover:bg-[#0b5c5d] text-white py-1 px-3 rounded shadow-sm disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {tareas.map((tarea, index) => (
          <div key={index} className="bg-indigo-50/50 p-3 rounded border border-indigo-100 shadow-sm relative group">
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
              value={tarea.titulo || ''}
              onChange={(e) => handleUpdateTarea(index, 'titulo', e.target.value)}
              className="w-full font-semibold text-sm border-0 border-b border-dashed border-gray-300 focus:ring-0 focus:border-indigo-500 bg-transparent p-0 mb-2 pb-1"
            />
            <textarea
              placeholder="Descripción paso a paso"
              value={tarea.descripcion || ''}
              onChange={(e) => handleUpdateTarea(index, 'descripcion', e.target.value)}
              rows={2}
              className="w-full text-sm border-0 border-b border-dashed border-gray-300 focus:ring-0 focus:border-indigo-500 bg-transparent p-0 mb-2 pb-1"
            />
            <input
              type="text"
              placeholder="Frecuencia (Ej. Todos los días por 10 min)"
              value={tarea.frecuencia || ''}
              onChange={(e) => handleUpdateTarea(index, 'frecuencia', e.target.value)}
              className="w-full text-xs text-gray-600 border-0 border-b border-dashed border-gray-300 focus:ring-0 focus:border-indigo-500 bg-transparent p-0 pb-1 mb-3"
            />
            
            <div className="flex gap-2 justify-end mt-2">
              <button
                type="button"
                onClick={() => handleCopiar(tarea)}
                className="text-[10px] sm:text-xs bg-white hover:bg-slate-100 text-slate-700 py-1 px-2 rounded font-medium transition-colors border border-slate-300 flex items-center"
              >
                📋 Copiar
              </button>
              <button
                type="button"
                onClick={() => handleWhatsApp(tarea)}
                className="text-[10px] sm:text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-800 py-1 px-2 rounded font-medium transition-colors border border-indigo-300 flex items-center"
              >
                📱 Enviar por WhatsApp
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <button
        type="button"
        onClick={handleAddManual}
        className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
      >
        + Añadir otra tarea
      </button>
    </div>
  )
}
