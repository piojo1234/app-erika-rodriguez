'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import WhatsAppReminderButton from './WhatsAppReminderButton'
import { actualizarEstadoCita } from './actions'
import ConfirmModal from '@/components/ConfirmModal'

interface CitasClientProps {
  citas: any[]
  pacientesConHistoria: Record<string, string> // paciente_id -> historia_id
}

export default function CitasClient({ citas, pacientesConHistoria }: CitasClientProps) {
  const [view, setView] = useState<'lista' | 'calendario'>('calendario')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedCita, setSelectedCita] = useState<any>(null)
  const [confirmState, setConfirmState] = useState<{isOpen: boolean, title: string, message: string, action: () => void}>({isOpen: false, title: '', message: '', action: () => {}})

  // Filtrado general
  const filteredCitas = citas.filter(cita => {
    const term = searchTerm.toLowerCase()
    const pName = (cita.pacientes?.nombre_completo || cita.titulo || '').toLowerCase()
    // Buscar también por fecha formateada (ej. 15/05/2026)
    const dStr = new Date(cita.fecha_inicio).toLocaleDateString()
    return pName.includes(term) || dStr.includes(term)
  })

  // ---- HELPER PARA CALENDARIO ----
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  
  const getDaysInMonth = () => {
    const days = []
    // Padding para los días de la semana anterior
    const startDay = startOfMonth.getDay() // 0 = Domingo
    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }
    // Días del mes actual
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i))
    }
    return days
  }

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))

  // Función para obtener color según estado
  const getColorClasses = (cita: any) => {
    if (cita.tipo_evento === 'compromiso_personal') return 'bg-slate-500 text-white border-slate-500'
    switch(cita.estado) {
      case 'Programada': return 'bg-[#0e787a] text-white border-[#0e787a]'
      case 'Completada': return 'bg-gray-500 text-white border-gray-500'
      case 'Cancelada': 
      case 'No Asistió': return 'bg-red-500 text-white border-red-500'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusBadge = (cita: any) => {
    if (cita.tipo_evento === 'compromiso_personal') return 'bg-slate-100 text-slate-700'
    const isPast = new Date(cita.fecha_inicio).getTime() < new Date().getTime()
    if (cita.estado === 'Programada' && isPast) return 'bg-orange-100 text-orange-700' // Vencida
    switch(cita.estado) {
      case 'Programada': return 'bg-teal-100 text-[#0e787a]'
      case 'Completada': return 'bg-gray-100 text-gray-600'
      case 'Cancelada': 
      case 'No Asistió': return 'bg-red-100 text-red-600'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (cita: any) => {
    if (cita.tipo_evento === 'compromiso_personal') return 'Compromiso'
    const isPast = new Date(cita.fecha_inicio).getTime() < new Date().getTime()
    if (cita.estado === 'Programada' && isPast) return 'Vencida / Sin cerrar'
    return cita.estado
  }

  // Componente de Tarjeta de Cita (Lista)
  const CitaCard = ({ cita }: { cita: any }) => {
    const isProgramada = cita.estado === 'Programada'
    const isCompromiso = cita.tipo_evento === 'compromiso_personal'
    const dateObj = new Date(cita.fecha_inicio)
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-900">{isCompromiso ? cita.titulo : (cita.pacientes?.nombre_completo || 'Desconocido')}</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(cita)}`}>
              {getStatusText(cita)}
            </span>
          </div>
          
          <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-2">
            <div><strong>Fecha:</strong> {dateObj.toLocaleDateString('es-CO')} a las {dateObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</div>
            <div><strong>Duración:</strong> {cita.duracion_minutos} min</div>
            {cita.modalidad && <div><strong>Modalidad:</strong> {cita.modalidad}</div>}
            {cita.observaciones && <div className="col-span-full"><strong>Notas:</strong> {cita.observaciones}</div>}
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-[200px]">
          {isProgramada && !isCompromiso && (
            <div className={new Date(cita.fecha_inicio).getTime() < new Date().getTime() ? 'opacity-50 pointer-events-none' : ''}>
              <WhatsAppReminderButton cita={cita} />
            </div>
          )}
          
          <div className="flex gap-2">
            {!isCompromiso && (
              <>
                <button 
                  onClick={() => actualizarEstadoCita(cita.id, 'Completada')}
                  disabled={!isProgramada}
                  className="flex-1 py-1 px-2 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Completar
                </button>
                <button 
                  onClick={() => {
                    setConfirmState({
                      isOpen: true,
                      title: 'Cancelar Cita',
                      message: '¿Estás seguro de que deseas cancelar esta cita? Esta acción la marcará como Cancelada.',
                      action: () => actualizarEstadoCita(cita.id, 'Cancelada')
                    })
                  }}
                  disabled={!isProgramada}
                  className="flex-1 py-1 px-2 border border-red-300 rounded text-xs font-medium text-red-600 bg-white hover:bg-red-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </>
            )}
            {isCompromiso && (
              <button 
                onClick={() => {
                  setConfirmState({
                    isOpen: true,
                    title: 'Eliminar Compromiso',
                    message: '¿Estás seguro de que deseas eliminar este compromiso personal?',
                    action: () => actualizarEstadoCita(cita.id, 'Cancelada')
                  })
                }}
                disabled={!isProgramada}
                className="flex-1 py-1 px-2 border border-red-300 rounded text-xs font-medium text-red-600 bg-white hover:bg-red-50 disabled:opacity-50"
              >
                Eliminar
              </button>
            )}
          </div>

          {!isCompromiso && pacientesConHistoria[cita.paciente_id] && (
            <Link 
              href={`/admin/historias/${pacientesConHistoria[cita.paciente_id]}`}
              className="text-center text-xs font-medium text-[#0e787a] hover:underline"
            >
              Ver Historia Clínica
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Barra de Controles */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Buscar por paciente o fecha..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 max-w-sm px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-[#0e787a] focus:border-[#0e787a] text-slate-800 placeholder:text-slate-500"
        />
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setView('lista')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'lista' ? 'bg-white shadow text-[#0e787a]' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Vista Lista
          </button>
          <button
            onClick={() => setView('calendario')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'calendario' ? 'bg-white shadow text-[#0e787a]' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Vista Calendario
          </button>
        </div>
      </div>

      {/* Renderizado Condicional de Vistas */}
      {view === 'lista' ? (
        <div className="space-y-2">
          {filteredCitas.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
              No se encontraron citas.
            </div>
          ) : (
            filteredCitas.map(cita => (
              <CitaCard key={cita.id} cita={cita} />
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Calendario */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-200 text-gray-600 font-bold">&larr;</button>
            <h2 className="text-lg font-bold text-gray-800 capitalize">
              {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-200 text-gray-600 font-bold">&rarr;</button>
          </div>
          
          {/* Grid Calendario */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
              <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 bg-gray-200 gap-[1px]">
            {getDaysInMonth().map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} className="bg-gray-50 min-h-[120px]" />
              
              // Filtrar citas para este día
              const dayCitas = filteredCitas.filter(c => {
                const cDate = new Date(c.fecha_inicio)
                return cDate.getDate() === date.getDate() && 
                       cDate.getMonth() === date.getMonth() && 
                       cDate.getFullYear() === date.getFullYear()
              })

              const isToday = date.toDateString() === new Date().toDateString()

              return (
                <div key={date.toISOString()} className={`bg-white min-h-[120px] p-2 ${isToday ? 'bg-teal-50/30' : ''}`}>
                  <div className={`text-right text-sm mb-1 ${isToday ? 'font-bold text-[#0e787a]' : 'text-gray-500'}`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayCitas.map(cita => (
                      <div 
                        key={cita.id} 
                        title={`${cita.tipo_evento === 'compromiso_personal' ? cita.titulo : cita.pacientes?.nombre_completo} - ${getStatusText(cita)}`}
                        onClick={() => setSelectedCita(cita)}
                        className={`text-xs p-1 rounded border truncate cursor-pointer ${getColorClasses(cita)} ${new Date(cita.fecha_inicio).getTime() < new Date().getTime() && cita.estado === 'Programada' ? 'ring-2 ring-orange-500 ring-offset-1' : ''}`}
                      >
                        {new Date(cita.fecha_inicio).toLocaleTimeString('es-CO', {hour: '2-digit', minute:'2-digit'})} {cita.tipo_evento === 'compromiso_personal' ? cita.titulo?.substring(0, 10) : cita.pacientes?.nombre_completo?.split(' ')[0]}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal Detalles Cita */}
      {selectedCita && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-slate-900">Detalles de la Cita</h3>
              <button 
                onClick={() => setSelectedCita(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">{selectedCita.tipo_evento === 'compromiso_personal' ? 'Compromiso' : 'Paciente'}</p>
                <p className="text-lg font-bold text-slate-900">{selectedCita.tipo_evento === 'compromiso_personal' ? selectedCita.titulo : (selectedCita.pacientes?.nombre_completo || 'Desconocido')}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Fecha</p>
                  <p className="text-sm font-medium text-slate-900">{new Date(selectedCita.fecha_inicio).toLocaleDateString('es-CO')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Horario</p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(selectedCita.fecha_inicio).toLocaleTimeString('es-CO', {hour: '2-digit', minute:'2-digit'})}
                    {selectedCita.fecha_fin && ` - ${new Date(selectedCita.fecha_fin).toLocaleTimeString('es-CO', {hour: '2-digit', minute:'2-digit'})}`}
                  </p>
                </div>
                {selectedCita.modalidad && (
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Modalidad</p>
                    <p className="text-sm font-medium text-slate-900">{selectedCita.modalidad}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 font-medium">Estado</p>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusBadge(selectedCita)}`}>
                    {getStatusText(selectedCita)}
                  </span>
                </div>
              </div>

              {selectedCita.observaciones && (
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Observaciones</p>
                  <p className="text-sm text-slate-900 bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedCita.observaciones}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col gap-3">
              {selectedCita.tipo_evento !== 'compromiso_personal' && (
                <>
                  <Link 
                    href={`/admin/historias/nueva?paciente_id=${selectedCita.paciente_id}`}
                    className="w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0e787a] hover:bg-[#0b5c5d] transition-colors"
                  >
                    Atender / Nueva Historia
                  </Link>
                  
                  {selectedCita.estado === 'Programada' && (
                    <div className={new Date(selectedCita.fecha_inicio).getTime() < new Date().getTime() ? 'opacity-50 pointer-events-none w-full' : 'w-full flex justify-center'}>
                      <WhatsAppReminderButton cita={selectedCita} className="w-full flex justify-center" />
                    </div>
                  )}
                </>
              )}
              {selectedCita.tipo_evento === 'compromiso_personal' && (
                 <button
                   onClick={() => {
                     setConfirmState({
                       isOpen: true,
                       title: 'Eliminar Compromiso',
                       message: '¿Estás seguro de que deseas eliminar este compromiso personal?',
                       action: () => {
                         actualizarEstadoCita(selectedCita.id, 'Cancelada')
                         setSelectedCita(null)
                       }
                     })
                   }}
                   className="w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                 >
                   Eliminar Compromiso
                 </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={() => {
          confirmState.action()
          setConfirmState(prev => ({ ...prev, isOpen: false }))
        }}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
