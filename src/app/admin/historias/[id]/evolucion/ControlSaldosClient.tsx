'use client'

import React from 'react'

interface ControlSaldosProps {
  vistaSaldo: {
    sesiones_consumidas: number
    total_sesiones_contratadas: number
    sesiones_restantes: number
    estado_paquete: string
  } | null
  pacienteTelefono: string
}

export default function ControlSaldosClient({ vistaSaldo, pacienteTelefono }: ControlSaldosProps) {
  if (!vistaSaldo || !vistaSaldo.total_sesiones_contratadas) {
    return null;
  }

  const { sesiones_consumidas, total_sesiones_contratadas, sesiones_restantes, estado_paquete } = vistaSaldo;
  const porcentaje = Math.min(100, Math.round((sesiones_consumidas / total_sesiones_contratadas) * 100));

  let estadoTexto = '';
  let badgeColor = '';
  let progressColor = '';
  let alertaFinal = false;

  if (estado_paquete === 'activo') {
    estadoTexto = 'Paquete Activo';
    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    progressColor = 'bg-[#0e787a]';
  } else if (estado_paquete === 'por_vencer') {
    estadoTexto = '⚠️ Última sesión disponible - Renovar paquete';
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
    progressColor = 'bg-amber-500';
  } else {
    estadoTexto = '🚫 Paquete completado / Sin saldo disponible';
    badgeColor = 'bg-red-100 text-red-800 border-red-200';
    progressColor = 'bg-red-500';
    alertaFinal = true;
  }

  const handleWhatsApp = () => {
    const phone = pacienteTelefono.replace(/\D/g, '');
    const mensaje = `Hola, espero te encuentres muy bien. Te escribo del Consultorio Psicológico de Erika Rodríguez para informarte que has completado el paquete de sesiones que habías contratado. ¿Deseas que te enviemos un nuevo enlace para renovar tu paquete de sesiones?`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <div className="mb-8 bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            Control de Paquete
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeColor}`}>
              {estadoTexto}
            </span>
          </h2>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#224252]">
            {sesiones_consumidas} <span className="text-lg text-gray-500 font-normal">de {total_sesiones_contratadas} sesiones</span>
          </p>
          <p className="text-sm font-medium text-gray-500">
            {sesiones_restantes} {sesiones_restantes === 1 ? 'sesión restante' : 'sesiones restantes'}
          </p>
        </div>
      </div>
      
      <div className="px-6 py-5">
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${progressColor}`} 
            style={{ width: `${porcentaje}%` }}
          ></div>
        </div>
        
        {alertaFinal && (
          <div className="mt-6 bg-red-50 border border-red-100 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-bold text-red-800">El paciente ha completado su paquete de sesiones</h3>
              <p className="text-sm text-red-600 mt-1">Por favor, envía el enlace de renovación antes de agendar la próxima cita.</p>
            </div>
            <button
              type="button"
              onClick={handleWhatsApp}
              className="whitespace-nowrap inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              📱 Enviar Link por WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
