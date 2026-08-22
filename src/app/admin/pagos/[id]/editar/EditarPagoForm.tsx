'use client'

import { useState, useEffect } from 'react'
import { maskDocument } from '@/utils/helpers'
import { actualizarPago } from '../../actions'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function EditarPagoForm({ pacientes, pago }: { pacientes: any[], pago: any }) {
  const [esMenor, setEsMenor] = useState(pago.es_menor || false)
  const [menorNombre, setMenorNombre] = useState(pago.menor_nombre || '')
  const [concepto, setConcepto] = useState(pago.concepto || '')
  const [selectedPacienteId, setSelectedPacienteId] = useState(pago.paciente_id || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  
  const [monto, setMonto] = useState<number | ''>(pago.monto || '')
  
  const hasDonacion = Number(pago.monto_donacion) > 0 || !!pago.donante_nombre || pago.es_donacion_anonima
  const [incluyeDonacion, setIncluyeDonacion] = useState(hasDonacion)
  const [montoDonacion, setMontoDonacion] = useState<number | ''>(pago.monto_donacion || '')
  const [esDonacionAnonima, setEsDonacionAnonima] = useState(pago.es_donacion_anonima || false)

  const router = useRouter()

  const totalPagado = (Number(monto) || 0) + (incluyeDonacion ? (Number(montoDonacion) || 0) : 0)

  useEffect(() => {
    if (esMenor && menorNombre.trim()) {
      if (!concepto.startsWith('Atención Psicológica para el/la menor')) {
        setConcepto(`Atención Psicológica para el/la menor ${menorNombre.trim()}`)
      }
    }
  }, [esMenor, menorNombre])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg('')
    const formData = new FormData(e.currentTarget)
    
    // Añadimos valores booleanos explícitamente
    formData.set('es_menor', esMenor ? 'true' : 'false')
    formData.set('incluye_donacion', incluyeDonacion ? 'true' : 'false')
    formData.set('es_donacion_anonima', esDonacionAnonima ? 'true' : 'false')
    formData.set('pago_id', pago.id)

    try {
      setIsSubmitting(true)
      const res = await actualizarPago(formData)
      if (res && res.success === false) {
        toast.error("Error actualizando pago: " + res.error)
      } else {
        toast.success("Pago actualizado exitosamente.")
        router.push('/admin/pagos')
      }
    } catch (error: any) {
      toast.error("Error inesperado: " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <form onSubmit={handleSubmit} className="p-8">
        
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-6">
            <label htmlFor="paciente_id" className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">
              Paciente Registrado
            </label>
            <div className="mt-1">
              <select
                required
                id="paciente_id"
                name="paciente_id"
                value={selectedPacienteId}
                onChange={(e) => setSelectedPacienteId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
              >
                <option value="">Selecciona un paciente...</option>
                {pacientes?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre_completo} ({p.tipo_documento} {maskDocument(p.numero_documento)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedPacienteId && pacientes?.find((p) => p.id === selectedPacienteId)?.contratos?.length > 0 && (
            <div className="sm:col-span-6">
              <label htmlFor="contrato_id" className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">
                Contrato Asociado al Pago <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <div className="mt-1">
                <select
                  id="contrato_id"
                  name="contrato_id"
                  defaultValue={pago.contrato_id || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
                >
                  <option value="">Ninguno / Pago Independiente</option>
                  {pacientes.find((p) => p.id === selectedPacienteId).contratos.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.modalidad_atencion} - Estado: {c.estado}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Menor de edad Checkbox */}
          <div className="sm:col-span-6 flex items-center bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
            <input
              id="es_menor"
              name="es_menor"
              type="checkbox"
              checked={esMenor}
              onChange={(e) => setEsMenor(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#0e787a] focus:ring-[#0e787a]"
            />
            <label htmlFor="es_menor" className="ml-3 block text-sm font-semibold text-slate-800 opacity-100">
              ¿El pago es por atención a un menor de edad?
            </label>
          </div>

          {/* Campos de Menor de Edad */}
          {esMenor && (
            <div className="sm:col-span-6 bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-6">
              <h3 className="text-md font-semibold text-[#224252]">Datos del Pagador y el Menor</h3>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                
                <div className="sm:col-span-3">
                  <label htmlFor="pagador_nombre" className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">
                    Nombre del Pagador / Tutor
                  </label>
                  <input
                    type="text"
                    name="pagador_nombre"
                    id="pagador_nombre"
                    required={esMenor}
                    defaultValue={pago.pagador_nombre || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
                    placeholder="Ej: Carlos Pérez"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="pagador_cedula" className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">
                    Cédula del Pagador / Tutor
                  </label>
                  <input
                    type="text"
                    name="pagador_cedula"
                    id="pagador_cedula"
                    required={esMenor}
                    defaultValue={pago.pagador_cedula || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
                    placeholder="Ej: 1020304050"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="menor_nombre" className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">
                    Nombre del Menor de Edad
                  </label>
                  <input
                    type="text"
                    name="menor_nombre"
                    id="menor_nombre"
                    required={esMenor}
                    value={menorNombre}
                    onChange={(e) => setMenorNombre(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Monto */}
          <div className="sm:col-span-3">
            <label htmlFor="monto" className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">
              Monto Pagado ($ COP)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-slate-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="monto"
                id="monto"
                required
                min="0"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value ? Number(e.target.value) : '')}
                className="w-full pl-7 px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Donación Checkbox */}
          <div className="sm:col-span-6 flex items-center bg-indigo-50 p-4 rounded-lg border border-indigo-200 mt-2">
            <input
              id="incluye_donacion"
              type="checkbox"
              checked={incluyeDonacion}
              onChange={(e) => {
                setIncluyeDonacion(e.target.checked)
                if (!e.target.checked) {
                  setMontoDonacion('')
                  setEsDonacionAnonima(false)
                }
              }}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
            />
            <label htmlFor="incluye_donacion" className="ml-3 block text-sm font-semibold text-slate-800 opacity-100">
              ¿Incluye donación o aporte de un tercero?
            </label>
          </div>

          {/* Campos de Donación */}
          {incluyeDonacion && (
            <div className="sm:col-span-6 bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-6">
              <h3 className="text-md font-semibold text-slate-800">Detalles del Aporte / Donación</h3>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="monto_donacion" className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">
                    Monto Donación / Aporte ($ COP) *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-slate-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="monto_donacion"
                      id="monto_donacion"
                      required={incluyeDonacion}
                      min="1"
                      step="0.01"
                      value={montoDonacion}
                      onChange={(e) => setMontoDonacion(e.target.value ? Number(e.target.value) : '')}
                      className="w-full pl-7 px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3 flex items-center pt-6">
                  <input
                    id="es_donacion_anonima"
                    type="checkbox"
                    checked={esDonacionAnonima}
                    onChange={(e) => setEsDonacionAnonima(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <label htmlFor="es_donacion_anonima" className="ml-3 block text-sm font-semibold text-slate-800 opacity-100">
                    Aporte Anónimo
                  </label>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="donante_nombre" className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">
                    Nombre del Donante / Aportante
                  </label>
                  <input
                    type="text"
                    name="donante_nombre"
                    id="donante_nombre"
                    disabled={esDonacionAnonima}
                    required={!esDonacionAnonima && incluyeDonacion}
                    defaultValue={pago.donante_nombre || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 disabled:bg-gray-100 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    placeholder={esDonacionAnonima ? 'Donante Anónimo' : 'Ej: María Gómez'}
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="donante_identificacion" className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">
                    Identificación del Donante <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    name="donante_identificacion"
                    id="donante_identificacion"
                    disabled={esDonacionAnonima}
                    defaultValue={pago.donante_identificacion || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 disabled:bg-gray-100 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    placeholder="Ej: 1234567890"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Resumen Total */}
          <div className="sm:col-span-6 bg-[#0e787a]/10 p-4 rounded-lg border border-[#0e787a]/20 mt-4 flex justify-between items-center">
            <span className="text-lg font-bold text-[#0e787a]">Total Recibo:</span>
            <span className="text-2xl font-black text-[#224252]">
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalPagado)}
            </span>
          </div>

          {/* Método de Pago */}
          <div className="sm:col-span-3">
            <label htmlFor="metodo_pago" className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">
              Método de Pago
            </label>
            <div className="mt-1">
              <select
                required
                id="metodo_pago"
                name="metodo_pago"
                defaultValue={pago.metodo_pago}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                <option value="Nequi">Nequi</option>
                <option value="Daviplata">Daviplata</option>
                <option value="Tarjeta de Crédito / Débito">Tarjeta de Crédito / Débito</option>
              </select>
            </div>
          </div>

          {/* Referencia */}
          <div className="sm:col-span-6">
            <label htmlFor="referencia" className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">
              Referencia / Número de Comprobante <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="referencia"
                id="referencia"
                defaultValue={pago.referencia || ''}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
                placeholder="Ej: Aprobación #12345 o Transacción Nequi"
              />
            </div>
          </div>

          {/* Concepto */}
          <div className="sm:col-span-6">
            <label htmlFor="concepto" className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">
              Concepto
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="concepto"
                id="concepto"
                required
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
                placeholder="Ej: Sesión Individual de Psicología"
              />
            </div>
          </div>

          {/* Notas */}
          <div className="sm:col-span-6">
            <label htmlFor="notas" className="block text-sm font-semibold text-slate-800 opacity-100 mb-1">
              Notas internas <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <div className="mt-1">
              <textarea
                id="notas"
                name="notas"
                rows={3}
                defaultValue={pago.notas || ''}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
                placeholder="Anotaciones privadas sobre este pago..."
              />
            </div>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-slate-200 flex justify-end">
          <Link
            href="/admin/pagos"
            className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0e787a] mr-4"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#0e787a] hover:bg-[#224252] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0e787a] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando cambios...
              </>
            ) : 'Actualizar Pago'}
          </button>
        </div>
      </form>
    </div>
  )
}
