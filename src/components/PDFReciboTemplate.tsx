'use client'

import React, { forwardRef } from 'react'

interface PDFReciboProps {
  pago: any
  paciente: any
  logoBase64: string
}

const PDFReciboTemplate = forwardRef<HTMLDivElement, PDFReciboProps>(
  ({ pago, paciente, logoBase64 }, ref) => {
    
    // Formatting date to local
    const fecha = new Date(pago.created_at).toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

    const formatCop = (val: number) => new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val)

    const montoDonacion = Number(pago.monto_donacion) || 0
    const montoPaciente = Number(pago.monto) || 0
    const totalRecibido = montoPaciente + montoDonacion

    return (
      <div 
        ref={ref} 
        style={{ width: '800px', backgroundColor: '#ffffff', color: '#000000', padding: '50px', fontFamily: 'Arial, sans-serif' }}
      >
        {/* Encabezado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0e787a', paddingBottom: '20px', marginBottom: '30px' }}>
          <div>
            {logoBase64 && (
              <img 
                src={logoBase64} 
                alt="Logo Psicóloga Erika" 
                style={{ height: '70px', objectFit: 'contain' }} 
                crossOrigin="anonymous"
              />
            )}
          </div>
          <div style={{ textAlign: 'right', color: '#224252' }}>
            <h1 style={{ fontSize: '24px', margin: '0 0 5px 0' }}>RECIBO OFICIAL DE PAGO</h1>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px', color: '#0e787a' }}>{pago.numero_recibo}</p>
          </div>
        </div>

        {/* Datos de la Psicóloga Erika */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#4b5563' }}>
            <strong style={{ color: '#224252', fontSize: '15px' }}>Erika Marcela Rodríguez López</strong><br/>
            Psicóloga<br/>
            C.C. 1.121.933.244 | T.P. No. 244628<br/>
            Villavicencio, Colombia
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#4b5563', textAlign: 'right' }}>
            <strong>Fecha de Emisión:</strong><br/>
            {fecha}
          </div>
        </div>

        {/* Datos del Paciente / Pagador */}
        <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '40px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#0e787a', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
            {pago.es_menor ? 'Recibido de' : 'Información del Paciente'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
            <div>
              <strong style={{ color: '#475569' }}>Nombre:</strong><br/>
              <span style={{ color: '#0f172a', fontWeight: '500' }}>
                {pago.es_menor ? pago.pagador_nombre : paciente?.nombre_completo}
              </span>
            </div>
            <div>
              <strong style={{ color: '#475569' }}>Documento de Identidad:</strong><br/>
              <span style={{ color: '#0f172a' }}>
                {pago.es_menor ? `C.C. ${pago.pagador_cedula}` : `${paciente?.tipo_documento} ${paciente?.numero_documento}`}
              </span>
            </div>
            {!pago.es_menor && paciente?.telefono && (
              <div>
                <strong style={{ color: '#475569' }}>Teléfono:</strong><br/>
                <span style={{ color: '#0f172a' }}>{paciente?.telefono}</span>
              </div>
            )}
            {!pago.es_menor && paciente?.email && (
              <div>
                <strong style={{ color: '#475569' }}>Email:</strong><br/>
                <span style={{ color: '#0f172a' }}>{paciente?.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Detalles del Pago */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
          <thead>
            <tr style={{ backgroundColor: '#224252', color: 'white' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', borderTopLeftRadius: '6px' }}>Concepto</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px' }}>Método de Pago</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px' }}>Referencia</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', borderTopRightRadius: '6px' }}>Total Pagado</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: montoDonacion > 0 ? '1px solid #e2e8f0' : '1px solid #cbd5e1' }}>
              <td style={{ padding: '16px 12px', fontSize: '15px', color: '#1e293b' }}>
                {pago.concepto}
                {montoDonacion > 0 && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Aporte / Pago del Paciente</div>}
              </td>
              <td style={{ padding: '16px 12px', fontSize: '14px', color: '#475569' }}>{pago.metodo_pago}</td>
              <td style={{ padding: '16px 12px', fontSize: '14px', color: '#475569' }}>{pago.referencia || 'N/A'}</td>
              <td style={{ padding: '16px 12px', fontSize: montoDonacion > 0 ? '15px' : '16px', fontWeight: montoDonacion > 0 ? 'normal' : 'bold', color: '#0f172a', textAlign: 'right' }}>
                {formatCop(montoPaciente)}
              </td>
            </tr>
            {montoDonacion > 0 && (
              <tr style={{ borderBottom: '2px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                <td style={{ padding: '16px 12px', fontSize: '14px', color: '#1e293b' }} colSpan={3}>
                  <strong>Aporte / Donación Tercero:</strong><br/>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {pago.es_donacion_anonima 
                      ? '(Aporte de: Donante Anónimo)' 
                      : `(Aporte de: ${pago.donante_nombre}${pago.donante_identificacion ? ` - CC ${pago.donante_identificacion}` : ''})`}
                  </span>
                </td>
                <td style={{ padding: '16px 12px', fontSize: '15px', color: '#0f172a', textAlign: 'right' }}>
                  {formatCop(montoDonacion)}
                </td>
              </tr>
            )}
            {montoDonacion > 0 && (
              <tr>
                <td colSpan={3} style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px', color: '#224252' }}>
                  Total Recibido:
                </td>
                <td style={{ padding: '16px 12px', fontSize: '18px', fontWeight: 'bold', color: '#0e787a', textAlign: 'right' }}>
                  {formatCop(totalRecibido)}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Notas Opcionales */}
        {pago.notas && (
          <div style={{ marginBottom: '40px', fontSize: '13px', color: '#64748b' }}>
            <strong>Notas: </strong>{pago.notas}
          </div>
        )}

        {/* Pie de página */}
        <div style={{ marginTop: '80px', paddingTop: '20px', borderTop: '1px solid #cbd5e1', textAlign: 'center', fontSize: '11px', color: '#64748b', lineHeight: '1.6' }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#0e787a' }}>COMPROBANTE OFICIAL DE PAGO DIGITAL</p>
          <p style={{ margin: 0 }}>
            Este documento constituye un recibo de caja equivalente y constancia de pago por los servicios profesionales descritos.<br/>
            Erika Marcela Rodríguez López pertenece al Régimen Simplificado / No Responsable de IVA (Artículo 437 del ET).<br/>
            Los servicios psicológicos clínicos están exentos de IVA según el Artículo 476 del Estatuto Tributario colombiano.
          </p>
        </div>
      </div>
    )
  }
)

PDFReciboTemplate.displayName = 'PDFReciboTemplate'

export default PDFReciboTemplate
