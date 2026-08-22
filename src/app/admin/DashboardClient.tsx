'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import PDFContratoTemplate from '@/components/PDFContratoTemplate'
import toast from 'react-hot-toast'
import { copiarAlPortapapeles } from '@/utils/helpers'
import Link from 'next/link'

interface DashboardClientProps {
  contratos: any[]
  pacientes: any[]
}

export default function DashboardClient({ contratos, pacientes }: DashboardClientProps) {
  const [generandoPDF, setGenerandoPDF] = useState<string | null>(null)
  const [pdfData, setPdfData] = useState<{ contrato: any, paciente1: any, paciente2: any, firmas: any[], imagesBase64: any } | null>(null)

  async function getBase64ImageFromUrl(imageUrl: string) {
    if (imageUrl.startsWith('data:image/')) {
      return imageUrl;
    }
    
    try {
      const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
      const data = await res.json();
      return data.dataUri;
    } catch (error) {
      console.error('Error cargando imagen mediante proxy:', error);
      return imageUrl;
    }
  }
  
  const pdfRef = useRef<HTMLDivElement>(null)

  // Métricas
  const totalContratos = contratos.length
  const pendientes = contratos.filter(c => c.estado !== 'firmado').length
  const firmados = contratos.filter(c => c.estado === 'firmado').length

  const getPacienteName = (id: string) => pacientes.find(p => p.id === id)?.nombre_completo || 'Desconocido'

  const handleCopyLink = (token: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    copiarAlPortapapeles(`${baseUrl}/firmar/${token}`, 'Link copiado al portapapeles')
  }

  const handleWhatsApp = (telefono: string, token: string, isFirmado: boolean) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const telClean = telefono.replace(/\D/g, '')
    const finalTel = telClean.length === 10 ? `57${telClean}` : telClean
    
    let msj = ''
    if (isFirmado) {
      msj = `Hola, tu contrato terapéutico ha sido firmado exitosamente. La copia oficial está lista y respaldada.`
    } else {
      msj = `Hola, te comparto el enlace seguro para revisar y firmar tu Consentimiento Informado: ${baseUrl}/firmar/${token}`
    }
    window.open(`https://wa.me/${finalTel}?text=${encodeURIComponent(msj)}`, '_blank')
  }

  const descargarPDF = async (contrato: any) => {
    setGenerandoPDF(contrato.id)

    try {
      // 1. Fetch firmas
      const { data: firmas, error } = await supabase
        .from('firmas_trazabilidad')
        .select('*')
        .eq('contrato_id', contrato.id)

      if (error) throw error

      const paciente1 = pacientes.find(p => p.id === contrato.paciente_id)
      const paciente2 = contrato.paciente_2_id ? pacientes.find(p => p.id === contrato.paciente_2_id) : null

      const getFirmaSrc = (f: any) => f ? (f.firma_base64 || f.imagen_firma || f.url_firma || f.archivo_firma_url) : '';

      const buildSignatureUrl = (firmaUrl: string) => {
        if (!firmaUrl) return '';
        if (firmaUrl.startsWith('data:image/')) return firmaUrl;
        if (firmaUrl.startsWith('http')) return firmaUrl; // Por si guardaron la URL completa
        const { data } = supabase.storage.from('firmas-contratos').getPublicUrl(firmaUrl);
        return data.publicUrl;
      }

      // Procesar TODAS las firmas dinámicamente
      const firmasBase64: Record<string, string> = {};
      const fetchFirmasPromises = (firmas || []).map(async (firmaObj) => {
        const url = buildSignatureUrl(getFirmaSrc(firmaObj));
        if (url) {
           const b64 = await getBase64ImageFromUrl(url).catch(() => url);
           firmasBase64[firmaObj.firmado_por] = b64;
        }
      });

      await Promise.all(fetchFirmasPromises);

      const [logoB64, psicologaB64] = await Promise.all([
        getBase64ImageFromUrl('https://erikarodriguezpsicologa.com/wp-content/uploads/2026/07/logo-erika-.png').catch(()=>'https://erikarodriguezpsicologa.com/wp-content/uploads/2026/07/logo-erika-.png'),
        getBase64ImageFromUrl('https://erikarodriguezpsicologa.com/wp-content/uploads/2026/07/Diseno-sin-titulo.png').catch(()=>'https://erikarodriguezpsicologa.com/wp-content/uploads/2026/07/Diseno-sin-titulo.png')
      ]);

      const imagesBase64 = {
        logo: logoB64,
        firmaPsicologa: psicologaB64,
        ...firmasBase64
      }

      // 2. Set state to render template
      setPdfData({ contrato, paciente1, paciente2, firmas: firmas || [], imagesBase64 })

      // 3. Wait for render and images to load
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

          pdf.save(`Contrato_${contrato.id.substring(0,8)}.pdf`)
        } catch (err) {
          console.error("Error generando PDF:", err)
          toast.error("Error generando el documento PDF.")
        } finally {
          setGenerandoPDF(null)
          setPdfData(null)
        }
      }, 1000) // Damos 1 segundo para que react-signature-canvas o las imágenes carguen del storage

    } catch (err) {
      console.error(err)
      toast.error("Error obteniendo firmas de trazabilidad.")
      setGenerandoPDF(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Contratos</div>
          <div className="text-3xl font-bold text-[#224252]">{totalContratos}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-sm font-medium text-amber-600 mb-1">Pendientes por Firma</div>
          <div className="text-3xl font-bold text-amber-700">{pendientes}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-sm font-medium text-[#0e787a] mb-1">Firmados Exitosamente</div>
          <div className="text-3xl font-bold text-[#0e787a]">{firmados}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Contratos Recientes</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente(s)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modalidad / Servicio</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contratos.map((contrato) => {
                const paciente1 = pacientes.find(p => p.id === contrato.paciente_id)
                const isFirmado = contrato.estado === 'firmado'
                const p1Nombre = getPacienteName(contrato.paciente_id)
                const p2Nombre = contrato.paciente_2_id ? getPacienteName(contrato.paciente_2_id) : null

                return (
                  <tr key={contrato.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(contrato.created_at).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{p1Nombre}</div>
                      {p2Nombre && <div className="text-sm text-gray-500">+ {p2Nombre}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{contrato.tipo_servicio}</div>
                      <div className="text-xs text-gray-500">{contrato.modalidad_atencion}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        isFirmado ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isFirmado ? 'Firmado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {!isFirmado ? (
                        <>
                          <Link href={`/admin/contratos/${contrato.id}/editar`} className="text-blue-500 hover:text-blue-700">Editar</Link>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => handleCopyLink(contrato.token_acceso)} className="text-[#0e787a] hover:text-[#224252]">Copiar Link</button>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => handleWhatsApp(paciente1?.telefono || '', contrato.token_acceso, false)} className="text-[#25D366] hover:text-[#128C7E]">WhatsApp</button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => descargarPDF(contrato)} 
                            disabled={generandoPDF === contrato.id}
                            className="text-[#0e787a] hover:text-[#224252] disabled:opacity-50"
                          >
                            {generandoPDF === contrato.id ? 'Generando...' : 'Descargar PDF'}
                          </button>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => handleWhatsApp(paciente1?.telefono || '', contrato.token_acceso, true)} className="text-[#25D366] hover:text-[#128C7E]">Avisar</button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
              {contratos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                    No hay contratos generados todavía.
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
          <PDFContratoTemplate 
            ref={pdfRef}
            contrato={pdfData.contrato}
            paciente1={pdfData.paciente1}
            paciente2={pdfData.paciente2}
            firmas={pdfData.firmas}
            imagesBase64={pdfData.imagesBase64}
          />
        )}
      </div>
    </div>
  )
}
