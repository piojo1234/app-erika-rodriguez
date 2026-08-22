import React, { forwardRef } from 'react'

interface PDFDocumentoTemplateProps {
  documento: any
  logoBase64: string
  firmaBase64: string
}

const PDFDocumentoTemplate = forwardRef<HTMLDivElement, PDFDocumentoTemplateProps>(
  ({ documento, logoBase64, firmaBase64 }, ref) => {
    if (!documento) return null

    const paciente = documento.paciente || {}
    const isCertificado = documento.tipo_documento === 'certificado_asistencia'
    const dynamic = documento.contenido_dinamico || {}
    const fechaActual = new Date(documento.fecha_emision).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const tipoDoc = paciente?.tipo_documento || 'CC';
    const numDoc = paciente?.numero_documento || 'Sin registrar';
    const tipoDocFull = tipoDoc === 'TI' ? 'Tarjeta de Identidad' : tipoDoc === 'CC' ? 'Cédula de Ciudadanía' : tipoDoc;

    return (
      <div
        ref={ref}
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '36px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          backgroundColor: '#ffffff',
          fontFamily: '"Times New Roman", Times, serif',
          color: '#000000',
          boxSizing: 'border-box'
        }}
      >
        {/* Contenedor Superior: Encabezado y Cuerpo */}
        <div>
          {/* Logo */}
          <div style={{ marginBottom: '12px' }}>
            {logoBase64 ? (
              <img 
                src={logoBase64} 
                alt="Logo" 
                style={{ width: '135px', height: 'auto', objectFit: 'contain' }} 
              />
            ) : (
              <div style={{ fontSize: '18pt', fontWeight: 'bold' }}>
                ERIKA MARCELA RODRÍGUEZ LÓPEZ
                <div style={{ fontSize: '12pt', fontWeight: 'normal' }}>Psicóloga</div>
              </div>
            )}
          </div>

          {/* Fecha y Ciudad */}
          <div style={{ textAlign: 'right', marginBottom: '10px', fontSize: '13px' }}>
            Villavicencio, {fechaActual}
          </div>

          {/* Destinatario */}
          <div style={{ marginBottom: '16px', fontWeight: 700, textTransform: 'uppercase', fontSize: '13px' }}>
            {documento.dirigido_a}
          </div>

          {/* Asunto o Título central */}
          <div style={{ textAlign: 'center', fontWeight: 700, marginBottom: '20px', textTransform: 'uppercase', fontSize: '14px' }}>
            {isCertificado ? 'CERTIFICADO DE ASISTENCIA A CONSULTA PSICOLÓGICA' : 'CARTA DE REMISIÓN INTERDISCIPLINARIA'}
          </div>

          {/* Cuerpo del Mensaje */}
          <div style={{ textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', lineHeight: '1.6' }}>
            {isCertificado ? (
              <>
                <div>
                  La suscrita psicóloga, con Tarjeta Profesional No. 244628 expedida por el Colegio Colombiano de Psicólogos, en cumplimiento de lo establecido por la Ley 1090 de 2006, 
                  <strong> HACE CONSTAR QUE:</strong>
                </div>
                <div>
                  El/la paciente <strong>{paciente.nombre_completo}</strong>, identificado/a con {tipoDocFull} No. {numDoc},
                  se encuentra {dynamic.estado_proceso?.toLowerCase() === 'activo' || dynamic.estado_proceso?.toLowerCase() === 'en proceso' ? 'asistiendo activamente' : 'registrado/a'} en proceso de evaluación e intervención psicológica.
                </div>
                <div>
                  <strong>Detalle de Asistencia:</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: '12px' }}>
                    <li><strong>Período de atención:</strong> {dynamic.fecha_inicio} al {dynamic.fecha_fin || 'Presente'}.</li>
                    <li><strong>Número total de sesiones asistidas:</strong> {dynamic.total_sesiones} sesiones.</li>
                    <li><strong>Estado actual del proceso:</strong> {dynamic.estado_proceso}.</li>
                  </ul>
                </div>
                {dynamic.observacion && (
                  <div><strong>Observación adicional:</strong> {dynamic.observacion}</div>
                )}
                <div>
                  Se expide el presente certificado a solicitud del/la interesado/a, bajo los preceptos de confidencialidad y secreto profesional amparados por el Código Deontológico y Bioético de Psicología (Ley 1090 de 2006).
                </div>
              </>
            ) : (
              <>
                <div>
                  La suscrita psicóloga, con Tarjeta Profesional No. 244628 expedida por el Colegio Colombiano de Psicólogos, se dirige a la especialidad de <strong>{dynamic.especialidad_destino}</strong> con el propósito de realizar una remisión y solicitud de valoración interdisciplinaria para el paciente:
                </div>
                <div>
                  <strong>DATOS DEL PACIENTE:</strong><br />
                  Nombre: {paciente.nombre_completo}<br />
                  Documento: {tipoDocFull} No. {numDoc}
                </div>
                <div>
                  <strong>IMPRESIÓN DIAGNÓSTICA (CIE-10):</strong><br />
                  {dynamic.impresion_diagnostica}
                </div>
                <div>
                  <strong>MOTIVO DE REMISIÓN Y SÍNTOMAS OBSERVADOS:</strong><br />
                  {dynamic.motivo_remision}
                </div>
                <div>
                  <strong>OBJETIVOS DE LA DERIVACIÓN:</strong><br />
                  {dynamic.objetivos_derivacion}
                </div>
                <div>
                  Se remite esta información de manera confidencial y protegida por el secreto profesional establecido en la Ley 1090 de 2006, con el fin de aunar esfuerzos en pro del bienestar integral del consultante. Quedo a entera disposición para comunicación o trabajo conjunto.
                </div>
              </>
            )}
          </div>
        </div>

        {/* Firma */}
        <div style={{ marginTop: '40px', display: 'inline-block', position: 'relative' }}>
          {firmaBase64 && (
            <img 
              src={firmaBase64} 
              alt="Firma" 
              style={{ width: '170px', height: '52px', objectFit: 'contain', display: 'block', marginBottom: '-6px' }}
              crossOrigin="anonymous"
            />
          )}
          <div style={{ borderTop: '1.5px solid #0f172a', width: '240px', marginBottom: '8px' }}></div>
          <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
            <strong style={{ fontSize: '13px' }}>Erika Marcela Rodríguez López</strong><br />
            Psicóloga<br />
            T.P. No. 244628 Colpsic<br />
            C.C. 1.121.933.244
          </div>
        </div>
        
        {/* Footer con datos de contacto */}
        <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', borderTop: '1px solid #ccc', paddingTop: '20px', marginTop: 'auto' }}>
          Consultorio Psicológico | Villavicencio, Colombia<br />
          Celular: 310 262 5711 | Email: erikarodriguezpsicologa@gmail.com
        </div>
      </div>
    )
  }
)

PDFDocumentoTemplate.displayName = 'PDFDocumentoTemplate'
export default PDFDocumentoTemplate
