'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createCuentaCobro, getContratosByPacienteId } from '../actions'
import { toast } from 'react-hot-toast'

// Utilidad robusta para números a letras en español
function numeroALetras(numero: number): string {
  const Unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE']
  const Decenas = ['VENTI', 'TREINTA ', 'CUARENTA ', 'CINCUENTA ', 'SESENTA ', 'SETENTA ', 'OCHENTA ', 'NOVENTA ', 'CIEN ']
  const Centenas = ['CIENTO ', 'DOSCIENTOS ', 'TRESCIENTOS ', 'CUATROCIENTOS ', 'QUINIENTOS ', 'SEISCIENTOS ', 'SETECIENTOS ', 'OCHOCIENTOS ', 'NOVECIENTOS ']

  if (numero === 0) return 'CERO PESOS M/CTE'
  if (numero < 0) return 'MENOS ' + numeroALetras(Math.abs(numero))

  const DecenasY = (strSin: string, numUnidades: number) => {
    if (numUnidades > 0) return strSin + 'Y ' + Unidades[numUnidades]
    return strSin
  }

  const getDecenas = (num: number) => {
    let numDecena = Math.floor(num / 10)
    let numUnidad = num - (numDecena * 10)
    if (num < 21) return Unidades[num]
    if (num < 30) return Decenas[0] + Unidades[numUnidad]
    return DecenasY(Decenas[numDecena - 2], numUnidad)
  }

  const getCentenas = (num: number) => {
    let centenas = Math.floor(num / 100)
    let decenas = num - (centenas * 100)
    if (centenas === 1 && decenas === 0) return 'CIEN '
    if (centenas >= 1) return Centenas[centenas - 1] + getDecenas(decenas)
    return getDecenas(decenas)
  }

  const getMiles = (num: number) => {
    let numDiv = Math.floor(num / 1000)
    let numResto = num - (numDiv * 1000)
    if (numDiv === 0) return getCentenas(numResto)
    let strMiles = ''
    if (numDiv === 1) strMiles = 'MIL '
    else strMiles = getCentenas(numDiv) + ' MIL '
    return strMiles + getCentenas(numResto)
  }

  const getMillones = (num: number) => {
    let numDiv = Math.floor(num / 1000000)
    let numResto = num - (numDiv * 1000000)
    if (numDiv === 0) return getMiles(numResto)
    let strMillones = ''
    if (numDiv === 1) strMillones = 'UN MILLON '
    else strMillones = getCentenas(numDiv) + ' MILLONES '
    return strMillones + getMiles(numResto)
  }

  return (getMillones(Math.floor(numero)).trim() + ' PESOS M/CTE').toUpperCase().replace(/\s+/g, ' ')
}

export default function NuevaCuentaForm({ pacientes }: { pacientes: any[] }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contratos, setContratos] = useState<any[]>([])
  const [selectedContratoId, setSelectedContratoId] = useState<string>('')
  
  const [formData, setFormData] = useState({
    paciente_id: '',
    nombre_cliente: '',
    documento_cliente: '',
    telefono_cliente: '',
    concepto: 'Prestación de servicios profesionales de psicología - Consulta / Paquete terapéutico',
    monto: '',
    valor_letras: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '',
    banco: 'Bancolombia',
    tipo_cuenta: 'Cuenta de Ahorros',
    numero_cuenta: ''
  })

  // Autofill patient data when selected and fetch contratos
  useEffect(() => {
    const fetchContratos = async (pId: string) => {
      const { data } = await getContratosByPacienteId(pId)
      if (data) {
        setContratos(data)
      } else {
        setContratos([])
      }
    }

    if (formData.paciente_id) {
      const p = pacientes.find(p => p.id === formData.paciente_id)
      if (p) {
        setFormData(prev => ({
          ...prev,
          nombre_cliente: p.nombre_completo,
          documento_cliente: `${p.tipo_documento || 'CC'} ${p.numero_documento || ''}`.trim(),
          telefono_cliente: p.telefono || ''
        }))
        fetchContratos(p.id)
      }
    } else {
      setContratos([])
      setSelectedContratoId('')
    }
  }, [formData.paciente_id, pacientes])

  // Handle Contrato selection
  const handleContratoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedContratoId(val)
    if (val && val !== 'otro') {
      const c = contratos.find(c => c.id === val)
      if (c) {
        const montoNum = parseFloat(c.valor_total)
        setFormData(prev => ({
          ...prev,
          concepto: `Prestación de servicios profesionales de psicología - ${c.tipo_servicio}`,
          monto: c.valor_total,
          valor_letras: !isNaN(montoNum) ? numeroALetras(montoNum) : ''
        }))
      }
    }
  }

  // Handle monto manual change to auto-update letras
  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setFormData(prev => ({ ...prev, monto: val }))
    const num = parseFloat(val)
    if (!isNaN(num) && num > 0) {
      setFormData(prev => ({ ...prev, valor_letras: numeroALetras(num) }))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const monto = parseFloat(formData.monto)
      if (isNaN(monto) || monto <= 0) {
        toast.error('El monto debe ser un número mayor a cero')
        setIsSubmitting(false)
        return
      }

      const formPayload = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          formPayload.append(key, value)
        }
      })

      const { error } = await createCuentaCobro(formPayload)

      if (error) throw new Error(error)

      toast.success('Cuenta de cobro creada exitosamente')
      router.push('/admin/cuentas-cobro')
    } catch (err: any) {
      toast.error(err.message || 'Error al crear la cuenta')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
      <div className="space-y-6">
        {/* Selector de Paciente Opcional */}
        <div>
          <label htmlFor="paciente_id" className="block text-sm font-medium text-gray-700">
            Autocompletar desde Paciente (Opcional)
          </label>
          <select
            id="paciente_id"
            name="paciente_id"
            value={formData.paciente_id}
            onChange={handleChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#0e787a] focus:border-[#0e787a] sm:text-sm rounded-md"
          >
            <option value="">-- Seleccionar Paciente --</option>
            {pacientes.map(p => (
              <option key={p.id} value={p.id}>
                {p.nombre_completo} ({p.numero_documento})
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Contrato (Si hay paciente) */}
        {formData.paciente_id && (
          <div className="pt-2">
            <label htmlFor="contrato_id" className="block text-sm font-medium text-gray-700">
              Servicio / Contrato Contratado
            </label>
            <select
              id="contrato_id"
              name="contrato_id"
              value={selectedContratoId}
              onChange={handleContratoChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#0e787a] focus:border-[#0e787a] sm:text-sm rounded-md"
            >
              <option value="">-- Seleccionar Contrato --</option>
              {contratos.map(c => (
                <option key={c.id} value={c.id}>
                  {c.tipo_servicio} - {c.cantidad_sesiones} sesión(es) | ${c.valor_total} COP (Fecha: {new Date(c.created_at).toLocaleDateString('es-CO')})
                </option>
              ))}
              <option value="otro">Personalizado / Otro concepto</option>
            </select>
          </div>
        )}

        {/* Datos del Deudor */}
        <div className="pt-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Datos del Deudor / Pagador</h3>
          <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="nombre_cliente" className="block text-sm font-medium text-gray-700">Nombre Completo o Razón Social *</label>
              <input
                type="text"
                name="nombre_cliente"
                id="nombre_cliente"
                required
                value={formData.nombre_cliente}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#0e787a] focus:border-[#0e787a] sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="documento_cliente" className="block text-sm font-medium text-gray-700">Cédula o NIT *</label>
              <input
                type="text"
                name="documento_cliente"
                id="documento_cliente"
                required
                value={formData.documento_cliente}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#0e787a] focus:border-[#0e787a] sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="telefono_cliente" className="block text-sm font-medium text-gray-700">Teléfono / WhatsApp</label>
              <input
                type="text"
                name="telefono_cliente"
                id="telefono_cliente"
                value={formData.telefono_cliente}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#0e787a] focus:border-[#0e787a] sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Datos del Cobro */}
        <div className="pt-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Datos del Cobro</h3>
          <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="concepto" className="block text-sm font-medium text-gray-700">Concepto *</label>
              <textarea
                name="concepto"
                id="concepto"
                rows={3}
                required
                value={formData.concepto}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#0e787a] focus:border-[#0e787a] sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="monto" className="block text-sm font-medium text-gray-700">Monto Total ($ COP) *</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="monto"
                  id="monto"
                  required
                  min="0"
                  step="0.01"
                  value={formData.monto}
                  onChange={handleMontoChange}
                  className="mt-1 block w-full pl-7 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#0e787a] focus:border-[#0e787a] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="valor_letras" className="block text-sm font-medium text-gray-700">Valor en Letras *</label>
              <input
                type="text"
                name="valor_letras"
                id="valor_letras"
                required
                placeholder="Ej: CIENTO VEINTE MIL PESOS M/CTE"
                value={formData.valor_letras}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#0e787a] focus:border-[#0e787a] sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="fecha_emision" className="block text-sm font-medium text-gray-700">Fecha de Emisión *</label>
              <input
                type="date"
                name="fecha_emision"
                id="fecha_emision"
                required
                value={formData.fecha_emision}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#0e787a] focus:border-[#0e787a] sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="fecha_vencimiento" className="block text-sm font-medium text-gray-700">Fecha de Vencimiento (Opcional)</label>
              <input
                type="date"
                name="fecha_vencimiento"
                id="fecha_vencimiento"
                value={formData.fecha_vencimiento}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#0e787a] focus:border-[#0e787a] sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Datos de Pago */}
        <div className="pt-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Datos de Pago / Consignación</h3>
          <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
            <div>
              <label htmlFor="banco" className="block text-sm font-medium text-gray-700">Banco</label>
              <input
                type="text"
                name="banco"
                id="banco"
                value={formData.banco}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#0e787a] focus:border-[#0e787a] sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="tipo_cuenta" className="block text-sm font-medium text-gray-700">Tipo de Cuenta</label>
              <input
                type="text"
                name="tipo_cuenta"
                id="tipo_cuenta"
                value={formData.tipo_cuenta}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#0e787a] focus:border-[#0e787a] sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="numero_cuenta" className="block text-sm font-medium text-gray-700">Número de Cuenta</label>
              <input
                type="text"
                name="numero_cuenta"
                id="numero_cuenta"
                value={formData.numero_cuenta}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#0e787a] focus:border-[#0e787a] sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-5">
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0e787a]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#0e787a] hover:bg-[#224252] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0e787a]"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cuenta de Cobro'}
          </button>
        </div>
      </div>
    </form>
  )
}
