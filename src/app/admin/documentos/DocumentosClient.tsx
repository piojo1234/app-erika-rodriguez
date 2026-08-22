'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import Link from 'next/link'
import ConfirmModal from '@/components/ConfirmModal'
import toast from 'react-hot-toast'
import PDFDocumentoTemplate from '@/components/PDFDocumentoTemplate'
import { eliminarDocumento } from './actions'

interface DocumentosClientProps {
  documentos: any[]
}

export default function DocumentosClient({ documentos }: DocumentosClientProps) {
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, id: string}>({isOpen: false, id: ''})
  
  const [generandoPDF, setGenerandoPDF] = useState<string | null>(null)
  const [pdfData, setPdfData] = useState<{ documento: any, logoBase64: string, firmaBase64: string } | null>(null)
  const pdfRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const autoOpened = useRef(false)

  // Helper para proxy CORS de imagen
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

  useEffect(() => {
    const newId = searchParams?.get('new')
    if (newId && !autoOpened.current && documentos.length > 0) {
      const doc = documentos.find(d => d.id === newId)
      if (doc) {
        autoOpened.current = true
        descargarPDF(doc)
        router.replace('/admin/documentos')
      }
    }
  }, [searchParams, documentos, router])

  const handleWhatsApp = (documento: any) => {
    const telefono = documento.paciente?.telefono
    const telClean = telefono ? telefono.replace(/\D/g, '') : '';
    if (!telClean) {
      toast.error("El paciente no tiene un número de teléfono registrado.");
      return;
    }
    const finalTel = telClean.length === 10 ? `57${telClean}` : telClean;
    
    const tipoStr = documento.tipo_documento === 'certificado_asistencia' 
      ? 'tu Certificado de Asistencia' 
      : 'tu Carta de Remisión';

    const msj = `Hola ${documento.paciente?.nombre_completo || ''}, adjuntamos en este chat ${tipoStr} solicitado. Quedo atenta a cualquier inquietud. ¡Un saludo!`;
    window.open(`https://wa.me/${finalTel}?text=${encodeURIComponent(msj)}`, '_blank');
  }

  const descargarPDF = async (documento: any) => {
    setGenerandoPDF(documento.id)

    try {
      const logoB64 = await getBase64ImageFromUrl('https://erikarodriguezpsicologa.com/wp-content/uploads/2026/07/logo-erika-.png').catch(() => '')
      const firmaB64 = await getBase64ImageFromUrl('https://erikarodriguezpsicologa.com/wp-content/uploads/2026/07/Diseno-sin-titulo.png').catch(() => '')

      setPdfData({ documento, logoBase64: logoB64, firmaBase64: firmaB64 })

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

          const filename = documento.tipo_documento === 'certificado_asistencia' ? 'Certificado_Asistencia.pdf' : 'Carta_Remision.pdf'
          pdf.save(`${filename}`)
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
      toast.error("Error procesando los datos para el documento.")
      setGenerandoPDF(null)
    }
  }

  const handleDelete = (id: string) => {
    setConfirmModal({isOpen: true, id})
  }

  const confirmDelete = async () => {
    if (confirmModal.id) {
      const res = await eliminarDocumento(confirmModal.id)
      if (res.success) {
        toast.success("Documento eliminado correctamente")
      } else {
        toast.error(res.error || "Error al eliminar")
      }
      setConfirmModal({isOpen: false, id: ''})
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Documentos Emitidos</h2>
          <Link
            href="/admin/documentos/nuevo"
            className="px-4 py-2 bg-[#0e787a] text-white rounded-md text-sm font-medium hover:bg-[#0b5c5d] transition-colors"
          >
            + Nuevo Documento
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Emisión</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Documento</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirigido a</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documentos.map((doc) => {
                const isCert = doc.tipo_documento === 'certificado_asistencia'
                return (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(doc.fecha_emision).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{doc.paciente?.nombre_completo || 'Desconocido'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isCert ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {isCert ? 'Certificado de Asistencia' : 'Carta de Remisión'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {doc.dirigido_a}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button 
                        onClick={() => descargarPDF(doc)} 
                        disabled={generandoPDF === doc.id}
                        className="text-[#0e787a] hover:text-[#224252] disabled:opacity-50"
                      >
                        {generandoPDF === doc.id ? 'Generando...' : 'Ver PDF'}
                      </button>
                      <span className="text-gray-300">|</span>
                      <button 
                        onClick={() => handleWhatsApp(doc)} 
                        className="text-[#25D366] hover:text-[#128C7E]"
                      >
                        WhatsApp
                      </button>
                      <span className="text-gray-300">|</span>
                      <button 
                        onClick={() => handleDelete(doc.id)} 
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                )
              })}
              {documentos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                    No se han emitido documentos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden PDF Template Container */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, opacity: 0, zIndex: -1 }}>
        {pdfData && (
          <PDFDocumentoTemplate 
            ref={pdfRef}
            documento={pdfData.documento}
            logoBase64={pdfData.logoBase64}
            firmaBase64={pdfData.firmaBase64}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Eliminar Documento"
        message="¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({isOpen: false, id: ''})}
      />
    </div>
  )
}
