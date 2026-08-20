'use client'

import { useState, useRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import PDFHistoriaTemplate from '@/components/PDFHistoriaTemplate'
import toast from 'react-hot-toast'

interface PDFExportButtonProps {
  historia: any
  evoluciones: any[]
}

export default function PDFExportButton({ historia, evoluciones }: PDFExportButtonProps) {
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [pdfData, setPdfData] = useState<{ logoBase64: string, firmaBase64: string } | null>(null)
  const [exportMode, setExportMode] = useState('Ambos')
  const pdfRef = useRef<HTMLDivElement>(null)
  
  const esPareja = historia?.datos_demograficos?.modalidad === 'Pareja'

  const evolucionesFiltradas = evoluciones.filter(evol => {
    if (!esPareja || exportMode === 'Ambos') return true
    if (exportMode === 'Paciente A') return evol.asistente_sesion === 'Paciente A' || evol.asistente_sesion === 'Ambos'
    if (exportMode === 'Paciente B') return evol.asistente_sesion === 'Paciente B' || evol.asistente_sesion === 'Ambos'
    return true
  })

  async function getBase64ImageFromUrl(imageUrl: string) {
    try {
      const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
      const data = await res.json();
      return data.dataUri;
    } catch (error) {
      console.error('Error cargando imagen mediante proxy:', error);
      return '';
    }
  }

  const handleExportPDF = async () => {
    setGenerandoPDF(true)
    
    try {
      const logoB64 = await getBase64ImageFromUrl('https://erikarodriguezpsicologa.com/wp-content/uploads/2026/07/logo-erika-.png')
      const firmaB64 = await getBase64ImageFromUrl('https://erikarodriguezpsicologa.com/wp-content/uploads/2026/07/Diseno-sin-titulo.png')

      setPdfData({ logoBase64: logoB64, firmaBase64: firmaB64 })

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

          const filename = `HC_${historia.pacientes.numero_documento}_${new Date().getTime()}.pdf`
          pdf.save(filename)
        } catch (err) {
          console.error("Error generando PDF:", err)
          toast.error("Error generando el documento PDF.")
        } finally {
          setGenerandoPDF(false)
          setPdfData(null)
        }
      }, 800)
    } catch (err) {
      console.error(err)
      toast.error("Error procesando los datos para el PDF.")
      setGenerandoPDF(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {esPareja && (
        <select 
          value={exportMode} 
          onChange={(e) => setExportMode(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0e787a]"
        >
          <option value="Ambos">HC Conjunta</option>
          <option value="Paciente A">HC Individual (Paciente A)</option>
          <option value="Paciente B">HC Individual (Paciente B)</option>
        </select>
      )}
      <button
        onClick={handleExportPDF}
        disabled={generandoPDF}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0e787a] hover:bg-[#0b5c5d] disabled:opacity-50 transition-colors"
      >
        {generandoPDF ? 'Generando...' : 'Exportar HC (PDF)'}
      </button>

      {/* Renderizado Oculto */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, opacity: 0, zIndex: -1 }}>
        {pdfData && (
          <PDFHistoriaTemplate 
            ref={pdfRef}
            historia={historia}
            evoluciones={evolucionesFiltradas}
            exportMode={exportMode}
            logoBase64={pdfData.logoBase64}
            firmaBase64={pdfData.firmaBase64}
          />
        )}
      </div>
    </div>
  )
}
