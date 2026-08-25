'use client'

import { useRef, useState, useEffect } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { toast } from 'react-hot-toast'

interface CuentaCobroPDFProps {
  cuenta: any
  onClose: () => void
}

export default function CuentaCobroPDF({ cuenta, onClose }: CuentaCobroPDFProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const pdfRef = useRef<HTMLDivElement>(null)
  
  const [logoBase64, setLogoBase64] = useState<string | null>(null)
  const [firmaBase64, setFirmaBase64] = useState<string | null>(null)

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const resLogo = await fetch('/api/proxy-image?url=' + encodeURIComponent('https://erikarodriguezpsicologa.com/wp-content/uploads/2026/07/logo-erika-.png'))
        if (resLogo.ok) {
          const data = await resLogo.json()
          setLogoBase64(data.dataUri)
        }
        
        const resFirma = await fetch('/api/proxy-image?url=' + encodeURIComponent('https://erikarodriguezpsicologa.com/wp-content/uploads/2026/07/Diseno-sin-titulo.png'))
        if (resFirma.ok) {
          const data = await resFirma.json()
          setFirmaBase64(data.dataUri)
        }
      } catch (err) {
        console.error('Error fetching images for PDF:', err)
      }
    }
    fetchImages()
  }, [])

  const handleDownload = async () => {
    if (!pdfRef.current) return
    setIsGenerating(true)
    
    try {
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('cuenta-cobro-pdf');
          if (clonedElement) {
            clonedElement.style.backgroundColor = '#ffffff';
            clonedElement.style.color = '#0f172a';
          }
        }
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'letter') // Formato Carta
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Cuenta_Cobro_${cuenta.consecutivo}_${cuenta.nombre_cliente.replace(/\s+/g, '_')}.pdf`)
      
      toast.success('PDF descargado exitosamente')
      onClose()
    } catch (error) {
      console.error('Error generando PDF:', error)
      toast.error('Error al generar el PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  // Format dates
  const fechaEmision = new Date(cuenta.fecha_emision).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full relative">
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between items-center border-b">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Vista Previa - Cuenta de Cobro</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={isGenerating}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#0e787a] hover:bg-[#224252] focus:outline-none"
              >
                {isGenerating ? 'Generando...' : 'Descargar PDF'}
              </button>
            </div>
          </div>

          <div className="p-8 max-h-[70vh] overflow-y-auto bg-gray-100 flex justify-center">
            {/* Contenedor del documento (A4/Carta aprox) */}
            <div 
              id="cuenta-cobro-pdf"
              ref={pdfRef} 
              style={{
                width: '210mm',
                minHeight: '297mm',
                padding: '36px 48px',
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                fontFamily: 'Arial, sans-serif',
                color: '#0f172a'
              }}
            >
              {/* Encabezado */}
              <div className="flex justify-between items-start mb-12">
                <div className="w-48">
                  {logoBase64 && (
                    <img 
                      src={logoBase64} 
                      alt="Erika Rodriguez Logo" 
                      style={{ width: '140px', height: 'auto', objectFit: 'contain', display: 'block', marginBottom: '16px' }}
                      crossOrigin="anonymous"
                    />
                  )}
                </div>
                <div className="text-right mt-4">
                  <h1 className="text-xl font-bold mb-1" style={{ color: '#0f172a' }}>CUENTA DE COBRO N° {cuenta.consecutivo}</h1>
                  <p className="text-sm" style={{ color: '#475569' }}>Fecha: {fechaEmision}</p>
                  {cuenta.fecha_vencimiento && (
                    <p className="text-sm" style={{ color: '#475569' }}>Vencimiento: {new Date(cuenta.fecha_vencimiento).toLocaleDateString('es-CO')}</p>
                  )}
                </div>
              </div>

              {/* Cuerpo de la Cuenta */}
              <div className="space-y-8 text-base">
                <div className="border-l-4 pl-4 py-2" style={{ borderColor: '#0e787a', backgroundColor: '#f8fafc' }}>
                  <p className="font-bold text-lg" style={{ color: '#0f172a' }}>{cuenta.nombre_cliente}</p>
                  <p style={{ color: '#475569' }}>NIT/C.C.: {cuenta.documento_cliente}</p>
                  {cuenta.telefono_cliente && <p style={{ color: '#475569' }}>Tel: {cuenta.telefono_cliente}</p>}
                </div>

                <div>
                  <p className="font-bold text-lg mb-2">DEBE A:</p>
                  <p className="uppercase">
                    ERIKA MARCELA RODRÍGUEZ LÓPEZ, identificada con C.C. No. 1.121.933.244, Psicóloga con T.P. No. 244628
                  </p>
                </div>

                <div>
                  <p className="font-bold text-lg mb-2">LA SUMA DE:</p>
                  <p className="uppercase mb-1">{cuenta.valor_letras}</p>
                  <p className="font-bold text-xl">
                    ({new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(cuenta.monto)} COP)
                  </p>
                </div>

                <div>
                  <p className="font-bold text-lg mb-2">POR CONCEPTO DE:</p>
                  <p className="text-justify leading-relaxed whitespace-pre-wrap">{cuenta.concepto}</p>
                </div>

                {/* Forma de Pago */}
                <div className="pt-4 border-t mt-8" style={{ borderColor: '#cbd5e1' }}>
                  {(cuenta.banco?.toUpperCase() === 'EFECTIVO' || cuenta.tipo_cuenta?.toUpperCase() === 'EFECTIVO') ? (
                    <p style={{ margin: 0, fontSize: '13px' }}><strong>FORMA DE PAGO:</strong> Cancelado en Efectivo.</p>
                  ) : (
                    <p style={{ margin: 0, fontSize: '13px' }}><strong>FORMA DE PAGO:</strong> Consignación / Transferencia a Cuenta de {cuenta.tipo_cuenta} {cuenta.banco} No. {cuenta.numero_cuenta}</p>
                  )}
                </div>

                {/* Cláusula IVA */}
                <div className="pt-6">
                  <p className="text-sm text-justify italic" style={{ color: '#475569', marginBottom: '32px' }}>
                    "Manifiesto bajo la gravedad de juramento que pertenezco al régimen de No Responsables de IVA (Art. 437 del E.T.) y no requiero expedir factura electrónica de venta."
                  </p>
                </div>

                {/* Firma */}
                <div className="pt-8">
                  <div style={{ display: 'inline-block', marginTop: '16px', position: 'relative' }}>
                    {firmaBase64 && (
                      <img 
                        src={firmaBase64} 
                        alt="Firma"
                        style={{ width: '190px', height: '55px', objectFit: 'contain', display: 'block', marginBottom: '-6px' }} 
                        crossOrigin="anonymous"
                      />
                    )}
                    <div style={{ borderTop: '1.5px solid #0f172a', width: '230px', marginBottom: '8px' }}></div>
                    <p style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a', margin: '0 0 2px 0' }}>ERIKA MARCELA RODRÍGUEZ LÓPEZ</p>
                    <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 2px 0' }}>C.C. 1.121.933.244 de Villavicencio</p>
                    <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 2px 0' }}>T.P. 244628 del Colpsic</p>
                    <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>Villavicencio, Meta</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
