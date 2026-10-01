import { notFound } from 'next/navigation'
import CanvasFirmaWrapper from './CanvasFirmaWrapper'
import { supabaseServer } from '@/lib/supabaseServer'
import Image from 'next/image'

interface PageProps {
  params: Promise<{
    token: string
  }>
}

export default async function FirmarContratoPage({ params }: PageProps) {
  const resolvedParams = await params
  const { token } = resolvedParams

  // Obtener el contrato por token desde Supabase
  const { data: contrato, error } = await supabaseServer
    .from('contratos')
    .select('*')
    .eq('token_acceso', token)
    .single()
  
  if (error || !contrato) {
    notFound()
  }

  // Obtener datos del paciente
  const { data: paciente } = await supabaseServer
    .from('pacientes')
    .select('*')
    .eq('id', contrato.paciente_id)
    .single()

  let paciente2 = null;
  if (contrato.modalidad_atencion === 'Pareja' && contrato.paciente_2_id) {
    const { data: p2 } = await supabaseServer
      .from('pacientes')
      .select('*')
      .eq('id', contrato.paciente_2_id)
      .single()
    paciente2 = p2;
  }

  const isMenor = contrato.modalidad_atencion === 'Menor de Edad';
  const meta = contrato.metadata || {};

  let numColumnas = 2;
  if (contrato.modalidad_atencion === 'Pareja') numColumnas = 3;
  if (isMenor) {
    if (meta.requiere_tutor_2) numColumnas++;
    if (meta.requiere_asentimiento) numColumnas++;
  }

  const gridClasses = numColumnas === 2 ? 'md:grid-cols-2' 
                    : numColumnas === 3 ? 'md:grid-cols-3' 
                    : 'md:grid-cols-2 lg:grid-cols-4';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
        
        {/* Cabecera del Documento con Logo Institucional */}
        <div className="p-8 md:p-10 text-center border-b border-gray-100 bg-white">
          <img 
            src="/logo-erika.png" 
            alt="Psicóloga Erika Rodríguez" 
            className="h-24 mx-auto object-contain mb-6"
          />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#224252]">
            Contrato Terapéutico de Psicología
          </h1>
          <div className="mt-4 inline-flex items-center space-x-1 bg-[#57a6b2]/10 text-[#0e787a] px-3 py-1 rounded-full text-xs font-medium border border-[#57a6b2]/20">
            <span className="w-2 h-2 rounded-full bg-[#0e787a]"></span>
            <span>Documento Seguro y Encriptado</span>
          </div>
        </div>
        
        {/* Cuerpo del Documento */}
        <div className="p-8 md:p-12 bg-white">
          <div className="prose prose-sm md:prose-base text-gray-800 mb-12 max-w-none">
            <div className="whitespace-pre-wrap leading-relaxed text-justify">
              {contrato.contenido_texto}
            </div>
          </div>

          {/* Sección de Firmas */}
          <div className="pt-10 border-t border-gray-200">
            <div className={`grid grid-cols-1 ${gridClasses} gap-8 md:gap-4 lg:gap-8 items-end`}>
              
              {/* Columna 1: La Psicóloga */}
              <div className="flex flex-col items-center text-center">
                <img 
                  src="/firma-erika.png" 
                  alt="Firma Psicóloga Erika Rodríguez"
                  className="object-contain mix-blend-multiply relative z-10"
                  style={{ maxWidth: '180px', height: 'auto', maxHeight: '120px', marginBottom: '-15px' }}
                />
                <div className="border-t border-[#224252] w-full max-w-[200px] pt-4 mx-auto relative z-0">
                  <p className="font-bold text-[#224252] text-sm leading-tight">Erika Marcela Rodríguez López</p>
                  <p className="text-xs text-gray-600 mt-1">Psicóloga • C.C. 1.121.933.244</p>
                  <p className="text-xs text-gray-600">T.P. No. 244628</p>
                </div>
              </div>

              {!isMenor && (
                <>
                  {/* El/La Paciente 1 */}
                  <div className="flex flex-col items-center">
                    <div className="w-full max-w-xs mb-4">
                      <CanvasFirmaWrapper token={token} firmante="paciente_1" />
                    </div>
                    
                    <div className="border-t border-[#224252] w-full max-w-[200px] pt-4 text-center mx-auto">
                      <p className="font-bold text-[#224252] text-sm leading-tight">{paciente?.nombre_completo || 'Nombre del Paciente'}</p>
                      <p className="text-xs text-gray-600 mt-1">{paciente?.tipo_documento || 'ID'} {paciente?.numero_documento}</p>
                    </div>
                  </div>

                  {/* El/La Paciente 2 (Si aplica) */}
                  {contrato.modalidad_atencion === 'Pareja' && (
                    <div className="flex flex-col items-center">
                      <div className="w-full max-w-xs mb-4">
                        <CanvasFirmaWrapper token={token} firmante="paciente_2" />
                      </div>
                      
                      <div className="border-t border-[#224252] w-full max-w-[200px] pt-4 text-center mx-auto">
                        <p className="font-bold text-[#224252] text-sm leading-tight">{paciente2?.nombre_completo || 'Nombre del Paciente'}</p>
                        <p className="text-xs text-gray-600 mt-1">{paciente2?.tipo_documento || 'ID'} {paciente2?.numero_documento}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {isMenor && (
                <>
                  {/* Tutor 1 */}
                  <div className="flex flex-col items-center">
                    <div className="w-full max-w-xs mb-4">
                      <CanvasFirmaWrapper token={token} firmante="tutor_1" />
                    </div>
                    
                    <div className="border-t border-[#224252] w-full max-w-[200px] pt-4 text-center mx-auto">
                      <p className="font-bold text-[#224252] text-sm leading-tight">{meta.tutor_1?.nombre}</p>
                      <p className="text-xs text-gray-600 mt-1">{meta.tutor_1?.tipo_doc} {meta.tutor_1?.num_doc}</p>
                      <p className="text-xs text-blue-700 mt-1 uppercase font-semibold">{meta.tutor_1?.parentesco}</p>
                    </div>
                  </div>

                  {/* Tutor 2 */}
                  {meta.requiere_tutor_2 && (
                    <div className="flex flex-col items-center">
                      <div className="w-full max-w-xs mb-4">
                        <CanvasFirmaWrapper token={token} firmante="tutor_2" />
                      </div>
                      
                      <div className="border-t border-[#224252] w-full max-w-[200px] pt-4 text-center mx-auto">
                        <p className="font-bold text-[#224252] text-sm leading-tight">{meta.tutor_2?.nombre}</p>
                        <p className="text-xs text-gray-600 mt-1">{meta.tutor_2?.tipo_doc} {meta.tutor_2?.num_doc}</p>
                        <p className="text-xs text-blue-700 mt-1 uppercase font-semibold">{meta.tutor_2?.parentesco}</p>
                      </div>
                    </div>
                  )}

                  {/* Menor (Asentimiento) */}
                  {meta.requiere_asentimiento && (
                    <div className="flex flex-col items-center">
                      <div className="w-full max-w-xs mb-4">
                        <CanvasFirmaWrapper token={token} firmante="menor_asentimiento" />
                      </div>
                      
                      <div className="border-t border-[#224252] w-full max-w-[200px] pt-4 text-center mx-auto">
                        <p className="font-bold text-[#224252] text-sm leading-tight">{meta.menor?.nombre}</p>
                        <p className="text-xs text-gray-600 mt-1">{meta.menor?.tipo_doc} {meta.menor?.num_doc}</p>
                        <p className="text-xs text-blue-700 mt-1 uppercase font-semibold">ASENTIMIENTO DEL MENOR</p>
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
