'use client'

import { useState, useRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import PDFReciboTemplate from '@/components/PDFReciboTemplate'
import Link from 'next/link'
import { registrarGasto, eliminarGasto, anularPago, eliminarPago } from './actions'
import ConfirmModal from '@/components/ConfirmModal'
import AuditModal from '@/components/AuditModal'
import toast from 'react-hot-toast'

interface PagosClientProps {
  pagos: any[]
  pacientes: any[]
  gastos: any[]
}

export default function PagosClient({ pagos, pacientes, gastos }: PagosClientProps) {
  const [tab, setTab] = useState<'ingresos' | 'gastos'>('ingresos')
  const [showGastoModal, setShowGastoModal] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, id: string}>({isOpen: false, id: ''})
  const [confirmPagoModal, setConfirmPagoModal] = useState<{isOpen: boolean, id: string}>({isOpen: false, id: ''})
  const [auditModal, setAuditModal] = useState<{isOpen: boolean, id: string, isSubmitting: boolean}>({isOpen: false, id: '', isSubmitting: false})
  
  const [generandoPDF, setGenerandoPDF] = useState<string | null>(null)
  const [pdfData, setPdfData] = useState<{ pago: any, paciente: any, logoBase64: string } | null>(null)
  const pdfRef = useRef<HTMLDivElement>(null)

  // Estados Formulario Gasto
  const [gastoForm, setGastoForm] = useState({
    concepto: '',
    categoria: 'Suministros/Materiales',
    monto: '',
    fecha_gasto: new Date().toISOString().split('T')[0],
    metodo_pago: 'Efectivo',
    notas: ''
  })
  const [isSubmittingGasto, setIsSubmittingGasto] = useState(false)
  const [gastoError, setGastoError] = useState('')

  // Helper para convertir imagen a base64 usando el proxy existente
  async function getBase64ImageFromUrl(imageUrl: string) {
    if (imageUrl.startsWith('data:image/')) return imageUrl;
    try {
      const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
      const data = await res.json();
      return data.dataUri;
    } catch (error) {
      console.error('Error cargando imagen mediante proxy:', error);
      return imageUrl;
    }
  }

  const handleWhatsApp = (telefono: string, pago: any, pacienteNombre: string) => {
    const telClean = telefono ? telefono.replace(/\D/g, '') : '';
    if (!telClean) {
      toast.error("El paciente no tiene un número de teléfono registrado.");
      return;
    }
    const finalTel = telClean.length === 10 ? `57${telClean}` : telClean;
    
    const montoFormateado = new Intl.NumberFormat('es-CO', { 
      style: 'decimal'
    }).format(pago.monto);

    const msj = `Hola ${pacienteNombre}, adjuntamos tu recibo oficial de pago [${pago.numero_recibo}] por valor de $${montoFormateado} COP correspondiente a: ${pago.concepto}. ¡Gracias por tu confianza!`;
    window.open(`https://wa.me/${finalTel}?text=${encodeURIComponent(msj)}`, '_blank');
  }

  const descargarPDF = async (pago: any) => {
    setGenerandoPDF(pago.id)

    try {
      const paciente = pago.pacientes || pacientes.find(p => p.id === pago.paciente_id)
      const logoB64 = await getBase64ImageFromUrl('https://erikarodriguezpsicologa.com/wp-content/uploads/2026/07/logo-erika-.png').catch(() => '')

      setPdfData({ pago, paciente, logoBase64: logoB64 })

      setTimeout(async () => {
        if (!pdfRef.current) return
        
        try {
          const canvas = await html2canvas(pdfRef.current, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false
          })

          const imgData = canvas.toDataURL('image/png')
          const pdf = new jsPDF('p', 'mm', 'a4')
          
          const pdfWidth = pdf.internal.pageSize.getWidth()
          const pageHeight = pdf.internal.pageSize.getHeight()
          
          const imgProps = pdf.getImageProperties(imgData)
          const imgHeight = (imgProps.height * pdfWidth) / imgProps.width
          
          let heightLeft = imgHeight
          let position = 0

          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight)
          heightLeft -= pageHeight

          while (heightLeft > 0) {
            position = heightLeft - imgHeight
            pdf.addPage()
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight)
            heightLeft -= pageHeight
          }

          pdf.save(`${pago.numero_recibo}.pdf`)
        } catch (err) {
          console.error("Error generando PDF:", err)
          toast.error("Error generando el documento PDF.")
        } finally {
          setGenerandoPDF(null)
          setPdfData(null)
        }
      }, 500)
    } catch (err) {
      console.error(err)
      toast.error("Error procesando los datos para el recibo.")
      setGenerandoPDF(null)
    }
  }

  const handleGuardarGasto = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingGasto(true)
    setGastoError('')
    try {
      const formData = new FormData()
      formData.append('concepto', gastoForm.concepto)
      formData.append('categoria', gastoForm.categoria)
      formData.append('monto', gastoForm.monto)
      formData.append('fecha_gasto', gastoForm.fecha_gasto)
      formData.append('metodo_pago', gastoForm.metodo_pago)
      formData.append('notas', gastoForm.notas)

      const result = await registrarGasto(formData)
      if (result.success) {
        setShowGastoModal(false)
        setGastoForm({
          concepto: '',
          categoria: 'Suministros/Materiales',
          monto: '',
          fecha_gasto: new Date().toISOString().split('T')[0],
          metodo_pago: 'Efectivo',
          notas: ''
        })
      } else {
        setGastoError(result.error || 'Error desconocido')
      }
    } catch (err: any) {
      setGastoError(err.message)
    } finally {
      setIsSubmittingGasto(false)
    }
  }

  const handleDeleteGasto = async (id: string) => {
    setConfirmModal({isOpen: true, id})
  }

  const confirmDeleteGasto = async () => {
    if (confirmModal.id) {
      await eliminarGasto(confirmModal.id)
      setConfirmModal({isOpen: false, id: ''})
    }
  }

  const confirmAnularPago = async (justificacion: string) => {
    if (auditModal.id) {
      setAuditModal(prev => ({ ...prev, isSubmitting: true }))
      await anularPago(auditModal.id, justificacion)
      setAuditModal({isOpen: false, id: '', isSubmitting: false})
    }
  }

  const handleDeletePago = (id: string) => {
    setConfirmPagoModal({isOpen: true, id})
  }

  const confirmDeletePago = async () => {
    if (confirmPagoModal.id) {
      await eliminarPago(confirmPagoModal.id)
      setConfirmPagoModal({isOpen: false, id: ''})
    }
  }

  const totalIngresos = pagos.filter((p: any) => p.estado !== 'anulado').reduce((sum, pago) => sum + Number(pago.monto), 0)
  const totalGastos = gastos.reduce((sum, gasto) => sum + Number(gasto.monto), 0)
  const balanceNeto = totalIngresos - totalGastos

  const formatoMoneda = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Ingresos</div>
          <div className="text-3xl font-bold text-[#0e787a]">{formatoMoneda(totalIngresos)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Gastos (Egresos)</div>
          <div className="text-3xl font-bold text-red-500">{formatoMoneda(totalGastos)}</div>
        </div>
        <div className={`bg-white rounded-xl shadow-sm p-6 border border-gray-100`}>
          <div className="text-sm font-medium text-gray-500 mb-1">Balance Neto</div>
          <div className={`text-3xl font-bold ${balanceNeto >= 0 ? 'text-[#224252]' : 'text-red-600'}`}>{formatoMoneda(balanceNeto)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`px-6 py-3 text-sm font-medium transition-colors ${tab === 'ingresos' ? 'border-b-2 border-[#0e787a] text-[#0e787a]' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setTab('ingresos')}
        >
          Ingresos (Pagos de Pacientes)
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium transition-colors ${tab === 'gastos' ? 'border-b-2 border-[#0e787a] text-[#0e787a]' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setTab('gastos')}
        >
          Gastos (Egresos)
        </button>
      </div>

      {/* Table: Ingresos */}
      {tab === 'ingresos' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Historial de Pagos</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"># Recibo</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método / Concepto</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagos.map((pago) => {
                  const pacienteInfo = pago.pacientes || pacientes.find(p => p.id === pago.paciente_id)
                  const nombrePaciente = pacienteInfo?.nombre_completo || 'Desconocido'
                  
                  return (
                    <tr key={pago.id} className={`hover:bg-gray-50 ${pago.estado === 'anulado' ? 'opacity-60 bg-gray-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {pago.numero_recibo} {pago.estado === 'anulado' && <span className="ml-2 text-xs text-red-500 font-bold">(ANULADO)</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(pago.created_at).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{nombrePaciente}</div>
                        {pago.referencia && <div className="text-xs text-gray-500">Ref: {pago.referencia}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{pago.metodo_pago}</div>
                        <div className="text-xs text-gray-500 line-clamp-1" title={pago.concepto}>{pago.concepto}</div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${pago.estado === 'anulado' ? 'line-through text-gray-500' : 'text-[#0e787a]'}`}>
                        {formatoMoneda(pago.monto)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {pago.estado !== 'anulado' ? (
                          <>
                            <button 
                              onClick={() => descargarPDF(pago)} 
                              disabled={generandoPDF === pago.id}
                              className="text-[#0e787a] hover:text-[#224252] disabled:opacity-50"
                            >
                              {generandoPDF === pago.id ? 'Generando...' : 'PDF'}
                            </button>
                            <span className="text-gray-300">|</span>
                            <button 
                              onClick={() => handleWhatsApp(pacienteInfo?.telefono, pago, nombrePaciente)} 
                              className="text-[#25D366] hover:text-[#128C7E]"
                            >
                              WhatsApp
                            </button>
                            <span className="text-gray-300">|</span>
                            <button 
                              onClick={() => setAuditModal({isOpen: true, id: pago.id, isSubmitting: false})} 
                              className="text-red-500 hover:text-red-700"
                            >
                              Anular
                            </button>
                            <span className="text-gray-300">|</span>
                            <button 
                              onClick={() => handleDeletePago(pago.id)} 
                              className="text-red-600 hover:text-red-800 font-medium"
                            >
                              Eliminar
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center justify-end space-x-2">
                            <span className="text-xs text-red-500 italic max-w-xs block truncate" title={pago.motivo_anulacion}>
                              Motivo: {pago.motivo_anulacion}
                            </span>
                            <span className="text-gray-300">|</span>
                            <button 
                              onClick={() => handleDeletePago(pago.id)} 
                              className="text-red-600 hover:text-red-800 font-medium"
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {pagos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                      No se han registrado pagos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table: Gastos */}
      {tab === 'gastos' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Historial de Gastos</h2>
            <button
              onClick={() => setShowGastoModal(true)}
              className="px-4 py-2 bg-[#0e787a] text-white rounded-md text-sm font-medium hover:bg-[#0b5c5d] transition-colors"
            >
              + Registrar Gasto
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concepto</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {gastos.map((gasto) => (
                  <tr key={gasto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(gasto.fecha_gasto).toLocaleDateString('es-CO', { timeZone: 'UTC' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{gasto.concepto}</div>
                      {gasto.notas && <div className="text-xs text-gray-500">{gasto.notas}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {gasto.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {gasto.metodo_pago}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-500">
                      {formatoMoneda(gasto.monto)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleDeleteGasto(gasto.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {gastos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                      No se han registrado gastos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Nuevo Gasto */}
      {showGastoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-slate-900">Registrar Nuevo Gasto</h3>
              <button 
                onClick={() => setShowGastoModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleGuardarGasto} className="p-6 space-y-4">
              {gastoError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200">
                  {gastoError}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Concepto / Descripción *</label>
                <input 
                  type="text" 
                  required
                  value={gastoForm.concepto}
                  onChange={(e) => setGastoForm({...gastoForm, concepto: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
                  placeholder="Ej: Pago arriendo, papelería..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Categoría *</label>
                  <select 
                    required
                    value={gastoForm.categoria}
                    onChange={(e) => setGastoForm({...gastoForm, categoria: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
                  >
                    <option value="Arriendo">Arriendo</option>
                    <option value="Suministros/Materiales">Suministros/Materiales</option>
                    <option value="Software/Tecnología">Software/Tecnología</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Publicidad/Marketing">Publicidad/Marketing</option>
                    <option value="Impuestos">Impuestos</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Monto ($) *</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={gastoForm.monto}
                    onChange={(e) => setGastoForm({...gastoForm, monto: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Fecha del Gasto *</label>
                  <input 
                    type="date" 
                    required
                    value={gastoForm.fecha_gasto}
                    onChange={(e) => setGastoForm({...gastoForm, fecha_gasto: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Método de Pago *</label>
                  <select 
                    required
                    value={gastoForm.metodo_pago}
                    onChange={(e) => setGastoForm({...gastoForm, metodo_pago: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta">Tarjeta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Notas / Observaciones</label>
                <textarea 
                  rows={2}
                  value={gastoForm.notas}
                  onChange={(e) => setGastoForm({...gastoForm, notas: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
                  placeholder="Detalles adicionales opcionales..."
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowGastoModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmittingGasto}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-[#0e787a] hover:bg-[#0b5c5d] focus:outline-none focus:ring-2 focus:ring-[#0e787a] disabled:opacity-50"
                >
                  {isSubmittingGasto ? 'Guardando...' : 'Registrar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden PDF Template Container */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, opacity: 0, zIndex: -1 }}>
        {pdfData && (
          <PDFReciboTemplate 
            ref={pdfRef}
            pago={pdfData.pago}
            paciente={pdfData.paciente}
            logoBase64={pdfData.logoBase64}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Eliminar Gasto"
        message="¿Estás seguro de que deseas eliminar este gasto? Esta acción no se puede deshacer."
        onConfirm={confirmDeleteGasto}
        onCancel={() => setConfirmModal({isOpen: false, id: ''})}
      />

      <ConfirmModal
        isOpen={confirmPagoModal.isOpen}
        title="Eliminar Pago"
        message="¿Estás seguro de que deseas eliminar este pago? Esta acción no se puede deshacer y borrará el registro de la base de datos permanentemente."
        onConfirm={confirmDeletePago}
        onCancel={() => setConfirmPagoModal({isOpen: false, id: ''})}
      />

      <AuditModal
        isOpen={auditModal.isOpen}
        title="Anular Recibo de Pago"
        description="Esta acción marcará el recibo como anulado y descontará el monto del balance neto. Debes proporcionar una justificación válida (mínimo 10 caracteres)."
        onConfirm={confirmAnularPago}
        onCancel={() => setAuditModal({isOpen: false, id: '', isSubmitting: false})}
        isSubmitting={auditModal.isSubmitting}
      />
    </div>
  )
}
