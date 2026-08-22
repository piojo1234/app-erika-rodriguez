'use server'

import { supabaseServer } from '@/lib/supabaseServer'
import crypto from 'crypto'
import { createClient } from '@/utils/supabase/server'

export async function crearContrato(formData: FormData) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('No autorizado')

  try {
    const nombre_paciente = formData.get('nombre_paciente') as string
    const tipo_documento = formData.get('tipo_documento') as string
    const numero_documento = formData.get('numero_documento') as string
    const email_paciente = formData.get('email_paciente') as string
    const telefono_paciente = formData.get('telefono_paciente') as string
    
    const modalidad_atencion = formData.get('modalidad_atencion') as string || 'Individual'
    const nombre_paciente_2 = formData.get('nombre_paciente_2') as string
    const tipo_documento_2 = formData.get('tipo_documento_2') as string
    const numero_documento_2 = formData.get('numero_documento_2') as string
    const email_paciente_2 = formData.get('email_paciente_2') as string
    const telefono_paciente_2 = formData.get('telefono_paciente_2') as string

    const tipo_servicio = formData.get('tipo_servicio') as string
    const cantidad_sesiones = parseInt(formData.get('cantidad_sesiones') as string, 10)
    const valor_total_cop = parseFloat(formData.get('valor_total_cop') as string)
    const ciudad = formData.get('ciudad') as string

    // Datos Menor de Edad
    const requiere_tutor_2 = formData.get('requiere_tutor_2') === 'on'
    const requiere_asentimiento = formData.get('requiere_asentimiento') === 'on'
    const tutor_1_nombre = formData.get('tutor_1_nombre') as string
    const tutor_1_tipo_doc = formData.get('tutor_1_tipo_doc') as string
    const tutor_1_num_doc = formData.get('tutor_1_num_doc') as string
    const tutor_1_parentesco = formData.get('tutor_1_parentesco') as string
    const tutor_1_email = formData.get('tutor_1_email') as string
    const tutor_1_telefono = formData.get('tutor_1_telefono') as string
    
    const tutor_2_nombre = formData.get('tutor_2_nombre') as string
    const tutor_2_tipo_doc = formData.get('tutor_2_tipo_doc') as string
    const tutor_2_num_doc = formData.get('tutor_2_num_doc') as string
    const tutor_2_parentesco = formData.get('tutor_2_parentesco') as string
    const tutor_2_email = formData.get('tutor_2_email') as string
    const tutor_2_telefono = formData.get('tutor_2_telefono') as string

    // 1. Buscar o Crear Paciente 1 (o Menor)
    let paciente_id: string

    const { data: p1Existente, error: errorP1 } = await supabaseServer
      .from('pacientes')
      .select('id')
      .eq('numero_documento', numero_documento)
      .limit(1)
      .maybeSingle()

    if (p1Existente) {
      paciente_id = p1Existente.id
      await supabaseServer.from('pacientes').update({
        nombre_completo: nombre_paciente,
        tipo_documento,
        email: email_paciente,
        telefono: telefono_paciente
      }).eq('id', paciente_id)
    } else {
      const { data: p1Nuevo, error: errC1 } = await supabaseServer
        .from('pacientes')
        .insert({
          nombre_completo: nombre_paciente,
          tipo_documento,
          numero_documento,
          email: email_paciente,
          telefono: telefono_paciente
        })
        .select('id')
        .limit(1)
      .maybeSingle()
      
      if (errC1 || !p1Nuevo) throw new Error(`Error al crear paciente 1: ${errC1?.message}`)
      paciente_id = p1Nuevo.id
    }

    // Buscar o Crear Paciente 2 (Si es pareja)
    let paciente_2_id: string | null = null
    if (modalidad_atencion === 'Pareja') {
      const { data: p2Existente } = await supabaseServer
        .from('pacientes')
        .select('id')
        .eq('numero_documento', numero_documento_2)
        .limit(1)
      .maybeSingle()

      if (p2Existente) {
        paciente_2_id = p2Existente.id
        await supabaseServer.from('pacientes').update({
          nombre_completo: nombre_paciente_2,
          tipo_documento: tipo_documento_2,
          email: email_paciente_2,
          telefono: telefono_paciente_2
        }).eq('id', paciente_2_id)
      } else {
        const { data: p2Nuevo, error: errC2 } = await supabaseServer
          .from('pacientes')
          .insert({
            nombre_completo: nombre_paciente_2,
            tipo_documento: tipo_documento_2,
            numero_documento: numero_documento_2,
            email: email_paciente_2,
            telefono: telefono_paciente_2
          })
          .select('id')
          .limit(1)
      .maybeSingle()
        
        if (errC2 || !p2Nuevo) throw new Error(`Error al crear paciente 2: ${errC2?.message}`)
        paciente_2_id = p2Nuevo.id
      }
    }

    // 2. Generar Token y Texto Legal
    const token_acceso = crypto.randomUUID()
    const fecha_actual = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
    const valorFormateado = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(valor_total_cop)

    let metadata: any = null;
    let tituloContrato = '';

    if (modalidad_atencion === 'Menor de Edad') {
      let firmas_requeridas = 1; // Tutor 1 mínimo
      if (requiere_tutor_2) firmas_requeridas++;
      if (requiere_asentimiento) firmas_requeridas++;

      metadata = {
        es_menor: true,
        firmas_requeridas,
        requiere_tutor_2,
        requiere_asentimiento,
        tutor_1: {
          nombre: tutor_1_nombre,
          tipo_doc: tutor_1_tipo_doc,
          num_doc: tutor_1_num_doc,
          parentesco: tutor_1_parentesco
        },
        tutor_2: requiere_tutor_2 ? {
          nombre: tutor_2_nombre,
          tipo_doc: tutor_2_tipo_doc,
          num_doc: tutor_2_num_doc,
          parentesco: tutor_2_parentesco
        } : null,
        menor: {
          nombre: nombre_paciente,
          tipo_doc: tipo_documento,
          num_doc: numero_documento
        }
      };

      tituloContrato = `Consentimiento Informado Menor - ${nombre_paciente}`;
    } else {
      metadata = {
        es_menor: false,
        firmas_requeridas: modalidad_atencion === 'Pareja' ? 2 : 1
      };
      tituloContrato = `Consentimiento Informado - ${nombre_paciente}${modalidad_atencion === 'Pareja' ? ` y ${nombre_paciente_2}` : ''}`;
    }

    const contenido_legal = generarTextoLegal(
      modalidad_atencion, nombre_paciente, tipo_documento, numero_documento,
      nombre_paciente_2, tipo_documento_2, numero_documento_2,
      tipo_servicio, cantidad_sesiones, valor_total_cop, ciudad,
      requiere_tutor_2, tutor_1_nombre, tutor_1_tipo_doc, tutor_1_num_doc, tutor_1_parentesco,
      tutor_2_nombre, tutor_2_tipo_doc, tutor_2_num_doc, tutor_2_parentesco
    );

    // 3. Insertar Contrato
    const { error: errorContrato } = await supabaseServer
      .from('contratos')
      .insert({
        paciente_id,
        paciente_2_id,
        modalidad_atencion,
        titulo: tituloContrato,
        tipo_servicio,
        cantidad_sesiones,
        valor_total: valor_total_cop,
        ciudad,
        contenido_texto: contenido_legal,
        metadata: metadata, // Nueva columna requerida en Supabase
        token_acceso,
        estado: 'pendiente'
      })

    if (errorContrato) {
      throw new Error(`Error al crear contrato: ${errorContrato.message}`)
    }

    return { success: true, token: token_acceso, telefono: telefono_paciente }

  } catch (error: any) {
    console.error('Error en Server Action crearContrato:', error)
    return { success: false, error: error.message || 'Error desconocido' }
  }
}

function generarTextoLegal(
  modalidad_atencion: string,
  nombre_paciente: string,
  tipo_documento: string,
  numero_documento: string,
  nombre_paciente_2: string,
  tipo_documento_2: string,
  numero_documento_2: string,
  tipo_servicio: string,
  cantidad_sesiones: number,
  valor_total_cop: number,
  ciudad: string,
  requiere_tutor_2: boolean,
  tutor_1_nombre: string,
  tutor_1_tipo_doc: string,
  tutor_1_num_doc: string,
  tutor_1_parentesco: string,
  tutor_2_nombre: string,
  tutor_2_tipo_doc: string,
  tutor_2_num_doc: string,
  tutor_2_parentesco: string
) {
  const fecha_actual = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
  const valorFormateado = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(valor_total_cop)

  let contenido_legal = '';
  let introLegal = '';

  if (modalidad_atencion === 'Menor de Edad') {
    const textoTutor2 = requiere_tutor_2 ? ` y ${tutor_2_nombre}, identificado/a con ${tutor_2_tipo_doc} No. ${tutor_2_num_doc}, en calidad de ${tutor_2_parentesco} del/la menor,` : '';
    const repLegalesPlural = requiere_tutor_2 ? 'Los Representantes Legales' : 'El Representante Legal';
    
    introLegal = `y ${tutor_1_nombre}, identificado/a con ${tutor_1_tipo_doc} No. ${tutor_1_num_doc}, en calidad de ${tutor_1_parentesco} y representante legal del/la menor ${nombre_paciente}, identificado/a con ${tipo_documento} No. ${numero_documento},${textoTutor2} en adelante '${repLegalesPlural}'`;

    contenido_legal = `Consentimiento Informado para Menores de Edad

La profesional en psicología Erika Marcela Rodríguez López, identificada con cédula de ciudadanía No. 1.121.933.244 y tarjeta profesional No. 244628, en adelante 'La Psicóloga', ${introLegal}, celebran el presente contrato terapéutico de acuerdo a las siguientes cláusulas:

Primera. Objeto del Contrato
El objeto del presente contrato es establecer las condiciones bajo las cuales se llevará a cabo la intervención psicológica del/la menor en el consultorio de La Psicóloga, conforme a las leyes de la República de Colombia, al Código Deontológico y Bioético del Psicólogo (Ley 1090 de 2006) y al Código de la Infancia y la Adolescencia.

Segunda. Autorización y Consentimiento
${repLegalesPlural} de manera libre, voluntaria e informada, AUTORIZA(N) la atención psicoterapéutica del/la menor, comprendiendo los alcances, riesgos y beneficios del proceso.

Tercera. Confidencialidad y Manejo de la Información
La Psicóloga se compromete a mantener la confidencialidad de la información suministrada por el/la menor en las sesiones terapéuticas (Ley 1090 de 2006). ${repLegalesPlural} comprende(n) que el espacio terapéutico es privado. La Psicóloga compartirá con ${repLegalesPlural} únicamente información general sobre el progreso, riesgos detectados u orientaciones, sin vulnerar el secreto profesional, salvo en situaciones que involucren riesgo inminente para la vida o la integridad del/la menor o de terceras personas.

Cuarta. Duración y Frecuencia de las Sesiones
El proceso terapéutico tendrá una duración indefinida y su terminación dependerá del acuerdo mutuo. Las sesiones se realizarán con la frecuencia acordada y cada una tendrá una duración de aproximadamente 60 minutos.

Quinta. Honorarios y Modalidades de Pago
El costo correspondiente al servicio de ${tipo_servicio} (${cantidad_sesiones} sesión/es) será de ${valorFormateado}, que ${repLegalesPlural} se compromete(n) a pagar con anterioridad. Los pagos podrán realizarse en efectivo, transferencia bancaria o medios electrónicos. La reprogramación o cancelación requiere al menos 24 horas de antelación, de lo contrario, se cobrará el 50% del valor de la sesión.

Sexta. Compromisos de las Partes
La Psicóloga se compromete a proporcionar atención con altos estándares éticos. ${repLegalesPlural} se compromete(n) a garantizar la asistencia puntual del/la menor, colaborar con las pautas indicadas en casa, y mantener una comunicación respetuosa.

Séptima. Terminación del Contrato
Este contrato podrá darse por terminado en cualquier momento por mutuo acuerdo, o unilateralmente informando con al menos 48 horas de anticipación.

Octava. Modificaciones al Contrato
Cualquier modificación a los términos del presente contrato deberá ser acordada por ambas partes y formalizada por escrito.

Novena. Legislación Aplicable
Este contrato se rige por la Ley 1090 de 2006 y las normas vigentes de protección a la infancia y adolescencia en Colombia.

En constancia de lo anterior, firman en señal de aceptación, en la ciudad de ${ciudad}, a los ${fecha_actual}.`;

  } else {
    // Individual o Pareja
    introLegal = modalidad_atencion === 'Pareja'
      ? `y los pacientes ${nombre_paciente}, identificado/a con ${tipo_documento} No. ${numero_documento}, y ${nombre_paciente_2}, identificado/a con ${tipo_documento_2} No. ${numero_documento_2}, en adelante 'Los Pacientes'`
      : `y el/la paciente ${nombre_paciente}, identificado/a con ${tipo_documento} No. ${numero_documento}, en adelante 'El/La Paciente'`;

    const term = modalidad_atencion === 'Pareja' ? 'Los Pacientes' : 'El/La Paciente';
    const termCompromete = modalidad_atencion === 'Pareja' ? 'Los Pacientes se comprometen' : 'El/La Paciente se compromete';
    const termConjugacion = modalidad_atencion === 'Pareja' ? 'sinceros/as' : 'sincero/a';

    contenido_legal = `Contrato Terapéutico de Psicología

La profesional en psicología Erika Marcela Rodríguez López, identificada con cédula de ciudadanía No. 1.121.933.244 y tarjeta profesional No. 244628, en adelante 'La Psicóloga', ${introLegal}, celebran el presente contrato terapéutico de acuerdo a las siguientes cláusulas:

Primera. Objeto del Contrato
El objeto del presente contrato es establecer las condiciones bajo las cuales se llevará a cabo la intervención psicológica en el consultorio de la Psicóloga, conforme a las leyes de la República de Colombia y al Código Deontológico y Bioético del Psicólogo en Colombia (Ley 1090 de 2006).

Segunda. Confidencialidad
La Psicóloga se compromete a mantener la confidencialidad de la información suministrada por ${term} en las sesiones terapéuticas, de acuerdo con lo establecido en la Ley 1090 de 2006 y la Ley 1581 de 2012 (Protección de Datos Personales). Solo se podrá divulgar información con el consentimiento expreso de ${term} o en situaciones que involucren riesgo para la vida o la integridad física de terceras personas.

Tercera. Duración y Frecuencia de las Sesiones
El proceso terapéutico tendrá una duración indefinida y su terminación dependerá del acuerdo mutuo entre La Psicóloga y ${term}. Las sesiones se realizarán con la frecuencia acordada y cada una tendrá una duración de aproximadamente 60 minutos.

Cuarta. Honorarios y Modalidades de Pago
El costo correspondiente al servicio de ${tipo_servicio} (${cantidad_sesiones} sesión/es) será de ${valorFormateado}, que ${termCompromete} a pagar con anterioridad para dar apertura a su proceso psicoterapéutico. Los pagos podrán realizarse en efectivo, transferencia bancaria o por medios electrónicos acordados con La Psicóloga. En caso de requerir reprogramación o cancelación de una sesión, deberá ser notificado con al menos 24 horas de antelación, de lo contrario, se cobrará el 50% del valor de la sesión.

Quinta. Compromisos de las Partes
La Psicóloga se compromete a:
a) Proporcionar un servicio de atención psicológica conforme a los estándares éticos y profesionales.
b) Cumplir con el horario acordado para las sesiones.
c) Mantener el respeto y la neutralidad en la relación terapéutica.

${termCompromete} a:
a) Asistir puntualmente a las sesiones.
b) Ser ${termConjugacion} en el proceso terapéutico y aportar la información necesaria para el tratamiento.
c) Pagar oportunamente los honorarios acordados.

Sexta. Terminación del Contrato
Este contrato podrá darse por terminado en cualquier momento por mutuo acuerdo de las partes, o unilateralmente por cualquiera de ellas, informando a la otra parte con al menos 48 horas de anticipación. También se dará por terminado en caso de incumplimiento grave de las obligaciones aquí establecidas.

Séptima. Resolución de Conflictos
Cualquier controversia surgida en relación con este contrato será resuelta de manera amigable entre las partes. En caso de no llegar a un acuerdo, las partes acudirán a los mecanismos de resolución de conflictos establecidos por la ley colombiana.

Octava. Modificaciones al Contrato
Cualquier modificación a los términos del presente contrato deberá ser acordada por ambas partes y formalizada por escrito.

Novena. Legislación Aplicable
El presente contrato se rige por las leyes de la República de Colombia, en especial por lo dispuesto en la Ley 1090 de 2006.

En constancia de lo anterior, firman en señal de aceptación, en la ciudad de ${ciudad}, a los ${fecha_actual}.`;
  }
  return contenido_legal;
}

export async function actualizarContrato(id: string, formData: FormData) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('No autorizado')

  try {
    const { data: contratoExistente } = await supabaseServer
      .from('contratos')
      .select('estado, paciente_id, paciente_2_id, metadata, token_acceso')
      .eq('id', id)
      .single();

    if (!contratoExistente || contratoExistente.estado === 'firmado') {
      return { success: false, error: 'Contrato no encontrado o ya está firmado y no es editable.' };
    }

    const nombre_paciente = formData.get('nombre_paciente') as string
    const tipo_documento = formData.get('tipo_documento') as string
    const numero_documento = formData.get('numero_documento') as string
    const email_paciente = formData.get('email_paciente') as string
    const telefono_paciente = formData.get('telefono_paciente') as string
    
    const modalidad_atencion = formData.get('modalidad_atencion') as string || 'Individual'
    const nombre_paciente_2 = formData.get('nombre_paciente_2') as string
    const tipo_documento_2 = formData.get('tipo_documento_2') as string
    const numero_documento_2 = formData.get('numero_documento_2') as string
    const email_paciente_2 = formData.get('email_paciente_2') as string
    const telefono_paciente_2 = formData.get('telefono_paciente_2') as string

    const tipo_servicio = formData.get('tipo_servicio') as string
    const cantidad_sesiones = parseInt(formData.get('cantidad_sesiones') as string, 10)
    const valor_total_cop = parseFloat(formData.get('valor_total_cop') as string)
    const ciudad = formData.get('ciudad') as string

    // Datos Menor de Edad
    const requiere_tutor_2 = formData.get('requiere_tutor_2') === 'on'
    const requiere_asentimiento = formData.get('requiere_asentimiento') === 'on'
    const tutor_1_nombre = formData.get('tutor_1_nombre') as string
    const tutor_1_tipo_doc = formData.get('tutor_1_tipo_doc') as string
    const tutor_1_num_doc = formData.get('tutor_1_num_doc') as string
    const tutor_1_parentesco = formData.get('tutor_1_parentesco') as string
    const tutor_1_email = formData.get('tutor_1_email') as string
    const tutor_1_telefono = formData.get('tutor_1_telefono') as string
    
    const tutor_2_nombre = formData.get('tutor_2_nombre') as string
    const tutor_2_tipo_doc = formData.get('tutor_2_tipo_doc') as string
    const tutor_2_num_doc = formData.get('tutor_2_num_doc') as string
    const tutor_2_parentesco = formData.get('tutor_2_parentesco') as string
    const tutor_2_email = formData.get('tutor_2_email') as string
    const tutor_2_telefono = formData.get('tutor_2_telefono') as string

    // 1. Actualizar Paciente 1
    if (contratoExistente.paciente_id) {
      await supabaseServer.from('pacientes').update({
        nombre_completo: nombre_paciente,
        tipo_documento,
        numero_documento,
        email: email_paciente,
        telefono: telefono_paciente
      }).eq('id', contratoExistente.paciente_id)
    }

    // Actualizar Paciente 2 (Si es pareja)
    let paciente_2_id = contratoExistente.paciente_2_id;
    if (modalidad_atencion === 'Pareja') {
      if (paciente_2_id) {
        await supabaseServer.from('pacientes').update({
          nombre_completo: nombre_paciente_2,
          tipo_documento: tipo_documento_2,
          numero_documento: numero_documento_2,
          email: email_paciente_2,
          telefono: telefono_paciente_2
        }).eq('id', paciente_2_id)
      } else {
        // Crear paciente 2 si cambió de individual a pareja
        const { data: p2Nuevo } = await supabaseServer.from('pacientes').insert({
          nombre_completo: nombre_paciente_2,
          tipo_documento: tipo_documento_2,
          numero_documento: numero_documento_2,
          email: email_paciente_2,
          telefono: telefono_paciente_2
        }).select('id').limit(1).maybeSingle()
        if (p2Nuevo) paciente_2_id = p2Nuevo.id
      }
    }

    // 2. Regenerar Texto Legal y Metadata
    let metadata: any = null;
    let tituloContrato = '';

    if (modalidad_atencion === 'Menor de Edad') {
      let firmas_requeridas = 1;
      if (requiere_tutor_2) firmas_requeridas++;
      if (requiere_asentimiento) firmas_requeridas++;

      metadata = {
        es_menor: true,
        firmas_requeridas,
        requiere_tutor_2,
        requiere_asentimiento,
        tutor_1: {
          nombre: tutor_1_nombre,
          tipo_doc: tutor_1_tipo_doc,
          num_doc: tutor_1_num_doc,
          parentesco: tutor_1_parentesco
        },
        tutor_2: requiere_tutor_2 ? {
          nombre: tutor_2_nombre,
          tipo_doc: tutor_2_tipo_doc,
          num_doc: tutor_2_num_doc,
          parentesco: tutor_2_parentesco
        } : null,
        menor: {
          nombre: nombre_paciente,
          tipo_doc: tipo_documento,
          num_doc: numero_documento
        }
      };
      tituloContrato = `Consentimiento Informado Menor - ${nombre_paciente}`;
    } else {
      metadata = {
        es_menor: false,
        firmas_requeridas: modalidad_atencion === 'Pareja' ? 2 : 1
      };
      tituloContrato = `Consentimiento Informado - ${nombre_paciente}${modalidad_atencion === 'Pareja' ? ` y ${nombre_paciente_2}` : ''}`;
    }

    const contenido_legal = generarTextoLegal(
      modalidad_atencion, nombre_paciente, tipo_documento, numero_documento,
      nombre_paciente_2, tipo_documento_2, numero_documento_2,
      tipo_servicio, cantidad_sesiones, valor_total_cop, ciudad,
      requiere_tutor_2, tutor_1_nombre, tutor_1_tipo_doc, tutor_1_num_doc, tutor_1_parentesco,
      tutor_2_nombre, tutor_2_tipo_doc, tutor_2_num_doc, tutor_2_parentesco
    );

    // 3. Update Contrato
    const { error: errorContrato } = await supabaseServer
      .from('contratos')
      .update({
        paciente_2_id,
        modalidad_atencion,
        titulo: tituloContrato,
        tipo_servicio,
        cantidad_sesiones,
        valor_total: valor_total_cop,
        ciudad,
        contenido_texto: contenido_legal,
        metadata: metadata
      })
      .eq('id', id)

    if (errorContrato) {
      throw new Error(`Error al actualizar contrato: ${errorContrato.message}`)
    }

    return { success: true, token: contratoExistente.token_acceso, telefono: telefono_paciente }
  } catch (error: any) {
    console.error('Error en Server Action actualizarContrato:', error)
    return { success: false, error: error.message || 'Error desconocido' }
  }
}
