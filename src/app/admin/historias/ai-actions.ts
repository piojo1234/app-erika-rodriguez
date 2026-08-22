'use server'

import { createClient } from '@/utils/supabase/server'

export async function generateTextAction(textoOriginal: string) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('No se encontró la API Key de Gemini en las variables de entorno.');
  }

  const prompt = `Eres un asistente especializado en redacción de Historias Clínicas Psicológicas. 
Tu ÚNICA tarea es transformar el borrador o texto informal proporcionado en un texto técnico, formal, conciso y objetivo en español.

REGLAS ESTRICTAS:
1. Devuelve ÚNICAMENTE el texto redactado formalmente.
2. NO incluyas introducciones como "Aquí tienes una propuesta" o "Para la redacción técnica...".
3. NO incluyas títulos, encabezados (como ### Motivo de Consulta), viñetas ni observaciones al final.
4. Omite caracteres o cadenas sin sentido de manera silenciosa.
5. Escribe en tercera persona y en formato de párrafo limpio.

Texto original a transformar: "${textoOriginal}"`;

  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3-flash-preview'];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }]
              }
            ]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return text;
        }
      } else {
        const errJson = await response.json();
        lastError = errJson?.error?.message || response.statusText;
      }
    } catch (err: any) {
      lastError = err?.message;
    }
  }

  throw new Error(`Error en la API de IA: ${lastError}`);
}

export async function resumenEvolucionAction(evoluciones: any[]) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('No se encontró la API Key de Gemini en las variables de entorno.');
  }

  // Preparar el contexto de las evoluciones
  const evolucionesTexto = evoluciones.map((evol, index) => {
    return `Sesión ${index + 1} (${new Date(evol.fecha_sesion).toLocaleDateString()}):
Evolución: ${evol.evolucion_terapeutica}
${evol.observaciones_valoracion ? `Observaciones: ${evol.observaciones_valoracion}` : ''}`;
  }).join('\n\n');

  const prompt = `Actúa como un asistente clínico experto en psicología. Analiza la secuencia de notas de evolución del paciente y genera un 'Informe de Progreso y Evolución Clínica' técnico, formal y objetivo. Incluye:
1. Estado inicial vs. Estado actual.
2. Principales logros/avances terapéuticos.
3. Aspectos o síntomas pendientes por trabajar.

Devuelve la respuesta en formato de texto clínico limpio y estructurado sin chats conversacionales ni saludos. Usa saltos de línea para separar las secciones.

Secuencia de notas de evolución:
${evolucionesTexto}`;

  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3-flash-preview', 'gemini-1.5-flash'];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return text;
        }
      } else {
        const errJson = await response.json();
        lastError = errJson?.error?.message || response.statusText;
      }
    } catch (err: any) {
      lastError = err?.message;
    }
  }

  throw new Error(`Error en la API de IA (Resumen): ${lastError}`);
}

export async function sugerirDiagnosticoAction(motivoConsulta: string, examenMental: string) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('No se encontró la API Key de Gemini en las variables de entorno.');
  }

  const prompt = `Actúa como un asistente diagnóstico en psicología clínica bajo la normativa del Ministerio de Salud de Colombia. Con base en el motivo de consulta y examen mental proporcionados, sugiere entre 1 y 3 posibles diagnósticos en formato CIE-10 (exigido en Colombia) y su equivalente DSM-5. 
Para cada sugerencia, incluye el código oficial (ej. F41.1), el nombre del trastorno y una breve justificación clínica de 2 líneas basada únicamente en los síntomas descritos. 

Devuelve el resultado ESTRICTAMENTE como un arreglo JSON (sin Markdown, sin \`\`\`json). El formato exacto debe ser:
[
  {
    "codigo": "CIE-10 Código (Ej. F41.1)",
    "nombre": "Nombre del trastorno",
    "justificacion": "Justificación clínica breve"
  }
]

Motivo de consulta: ${motivoConsulta}
Examen mental: ${examenMental}`;

  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3-flash-preview', 'gemini-1.5-flash'];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          try {
            return JSON.parse(text);
          } catch (e) {
            // Si falla el parseo, intentar limpiarlo
            const cleaned = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
            return JSON.parse(cleaned);
          }
        }
      } else {
        const errJson = await response.json();
        lastError = errJson?.error?.message || response.statusText;
      }
    } catch (err: any) {
      lastError = err?.message;
    }
  }

  throw new Error(`Error en la API de IA (Sugerencias): ${lastError}`);
}

export async function generarPlanIntervencionAction({ historiaClinica, evoluciones }: { historiaClinica: any, evoluciones: any[] }) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('No se encontró la API Key de Gemini en las variables de entorno.');
  }

  const motivoConsulta = historiaClinica.anamnesis?.motivo_consulta || historiaClinica.motivo_consulta || 'No registrado';
  const definicionProblema = historiaClinica.anamnesis?.definicion_problema || historiaClinica.definicion_problema || 'No registrada';
  const examenMental = typeof historiaClinica.examen_mental === 'string' 
    ? historiaClinica.examen_mental 
    : JSON.stringify(historiaClinica.examen_mental || {});

  const evolucionesTexto = evoluciones && evoluciones.length > 0
    ? evoluciones.map((evol, index) => {
        return `Sesión ${index + 1} (${new Date(evol.fecha_sesion).toLocaleDateString()}):
Evolución: ${evol.evolucion_terapeutica}
${evol.observaciones_valoracion ? `Observaciones: ${evol.observaciones_valoracion}` : ''}`;
      }).join('\n\n')
    : 'No hay evoluciones previas registradas.';

  const prompt = `Actúa como un asistente clínico experto en psicología clínica. Con base en el motivo de consulta, la definición del problema, el examen mental y las evoluciones del paciente, elabora una propuesta técnica de Plan de Intervención Terapéutica. Estructúralo formalmente en:
1. Objetivo General de Tratamiento.
2. Objetivos Específicos por Fases (Evaluación, Intervención, Cierre/Prevención).
3. Enfoque Terapéutico y Técnicas Recomendadas (basadas en evidencia).
4. Tareas o Actividades para el Paciente entre sesiones.

Mantiene un lenguaje clínico, profesional y conciso en español, sin preámbulos conversacionales.

Motivo de Consulta: ${motivoConsulta}
Definición del Problema: ${definicionProblema}
Examen Mental: ${examenMental}

Evoluciones Previas:
${evolucionesTexto}`;

  const modelsToTry = ['gemini-1.5-flash', 'gemini-3.1-flash-lite', 'gemini-3-flash-preview'];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return text;
        }
      } else {
        const errJson = await response.json();
        lastError = errJson?.error?.message || response.statusText;
      }
    } catch (err: any) {
      lastError = err?.message;
    }
  }

  throw new Error(`Error en la API de IA (Plan Intervención): ${lastError}`);
}

export async function sugerirEjerciciosAction({ diagnostico, motivoConsulta, evoluciones, tareasAnteriores }: { diagnostico: string, motivoConsulta: string, evoluciones: any[], tareasAnteriores: any[] }) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('No se encontró la API Key de Gemini en las variables de entorno.');
  }

  const evolucionesTexto = evoluciones && evoluciones.length > 0
    ? evoluciones.map((evol, index) => {
        return `Sesión ${index + 1} (${new Date(evol.fecha_sesion).toLocaleDateString()}):
Evolución: ${evol.evolucion_terapeutica}
${evol.observaciones_valoracion ? `Observaciones: ${evol.observaciones_valoracion}` : ''}`;
      }).join('\n\n')
    : 'No hay evoluciones previas recientes.';

  const tareasTexto = tareasAnteriores && tareasAnteriores.length > 0
    ? tareasAnteriores.map(t => {
        return `Tarea: ${t.titulo || t.descripcion} | Estado: ${t.estado} ${t.notas ? `| Notas: ${t.notas}` : ''}`;
      }).join('\n')
    : 'No hay registro de tareas asignadas o revisadas previamente.';

  const prompt = `Actúa como asistente clínico experto en psicología. Con base en el diagnóstico, motivo de consulta, la evolución reciente y el cumplimiento de las tareas anteriores, sugiere 2 nuevos ejercicios/tareas intersesión para el paciente. No repitas ejercicios que ya domina y adapta la dificultad según cómo le fue en la última sesión.

Devuelve el resultado ESTRICTAMENTE como un arreglo JSON (sin Markdown, sin \`\`\`json). El formato exacto debe ser:
[
  {
    "titulo": "Nombre corto de la tarea",
    "descripcion": "Instrucciones paso a paso para el paciente",
    "frecuencia": "Ej: Todos los días por 10 mins"
  }
]

Diagnóstico: ${diagnostico}
Motivo de consulta: ${motivoConsulta}

Evoluciones recientes:
${evolucionesTexto}

Cumplimiento de Tareas Anteriores:
${tareasTexto}`;

  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3-flash-preview', 'gemini-1.5-flash'];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          try {
            return JSON.parse(text);
          } catch (e) {
            const cleaned = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
            return JSON.parse(cleaned);
          }
        }
      } else {
        const errJson = await response.json();
        lastError = errJson?.error?.message || response.statusText;
      }
    } catch (err: any) {
      lastError = err?.message;
    }
  }

  throw new Error(`Error en la API de IA (Sugerir Ejercicios): ${lastError}`);
}
