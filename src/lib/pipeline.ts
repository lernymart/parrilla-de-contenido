import type {
  FormParametros,
  InvestigacionCompetencia,
  PilarContenido,
  FilaParrilla,
  ResumenEjecutivo,
  HallazgoCompetencia,
} from "@/types/parrilla";
import { chatJson } from "./openrouter";
import {
  investigateCompetitors,
  formatSearchBundlesForLlm,
} from "./serpapi";
import { enumerateDates } from "./validators";

/**
 * Pipeline de generación en 4 pasos encadenados.
 * Paso 1 (competencia) es obligatorio y siempre corre primero.
 */

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function step1Investigacion(
  competidores: string[]
): Promise<InvestigacionCompetencia> {
  const bundles = await investigateCompetitors(competidores);
  const rawText = formatSearchBundlesForLlm(bundles);
  const fuentes = bundles.flatMap((b) => b.resultados.map((r) => r.link));

  const result = await chatJson<{
    resumenGeneral: string;
    hallazgos: HallazgoCompetencia[];
  }>({
    temperature: 0.4,
    systemExtra:
      "Tu tarea es resumir hallazgos de competencia a partir de resultados de búsqueda web. Sé concreto y orientado a contenido en redes.",
    userPrompt: `Analiza estos resultados de búsqueda sobre competidores de LernyMart y resume qué tipo de contenido están publicando en redes sociales.

${rawText}

Responde SOLO JSON con esta forma:
{
  "resumenGeneral": "string (3-6 oraciones)",
  "hallazgos": [
    {
      "competidor": "string",
      "formatosQueFuncionan": ["string"],
      "ganchosTipicos": ["string"],
      "patronesRepetidos": ["string"],
      "notas": "string"
    }
  ]
}

Incluye un hallazgo por cada competidor listado. Si hay poca evidencia para alguno, indícalo en notas sin inventar datos falsos.`,
  });

  return {
    resumenGeneral: result.resumenGeneral,
    hallazgos: result.hallazgos || [],
    fuentesConsultadas: Array.from(new Set(fuentes)).slice(0, 40),
  };
}

export async function step2Pilares(
  params: FormParametros,
  investigacion: InvestigacionCompetencia
): Promise<PilarContenido[]> {
  if (!params.pilaresIaDecide && params.pilaresManual?.length) {
    const names = params.pilaresManual.filter((p) => p.trim());
    const peso = Math.round(100 / names.length);
    return names.map((nombre, i) => ({
      nombre: nombre.trim(),
      descripcion: `Pilar definido por el equipo de marketing.`,
      pesoPorcentaje:
        i === names.length - 1 ? 100 - peso * (names.length - 1) : peso,
    }));
  }

  const result = await chatJson<{ pilares: PilarContenido[] }>({
    temperature: 0.6,
    systemExtra:
      "Propón pilares de contenido estratégicos para redes sociales de LernyMart.",
    userPrompt: `Con base en la investigación de competencia y el objetivo del mes, propone entre 4 y 6 pilares de contenido.

Objetivo / marca del mes: ${params.marcaObjetivoMes || "(sin objetivo específico)"}
Formatos a usar: ${params.formatos.join(", ")}
Redes: ${params.redes.join(", ")}

Investigación de competencia:
${JSON.stringify(investigacion, null, 2)}

Responde SOLO JSON:
{
  "pilares": [
    {
      "nombre": "string corto",
      "descripcion": "string 1-2 oraciones",
      "pesoPorcentaje": number
    }
  ]
}

Los pesoPorcentaje deben sumar 100.`,
  });

  return result.pilares || [];
}

export async function step3Parrilla(
  params: FormParametros,
  investigacion: InvestigacionCompetencia,
  pilares: PilarContenido[]
): Promise<FilaParrilla[]> {
  const fechas = enumerateDates(params.fechaDesde, params.fechaHasta);
  const dias = fechas.length;

  const result = await chatJson<{ filas: Omit<FilaParrilla, "id">[] }>({
    temperature: 0.75,
    systemExtra:
      "Generas parrillas de contenido día a día, realistas y accionables para un equipo de marketing.",
    userPrompt: `Genera UNA fila de contenido por cada fecha del rango (exactamente ${dias} filas).

Fechas (en orden): ${fechas.join(", ")}

Parámetros:
- Objetivo del mes: ${params.marcaObjetivoMes || "(ninguno)"}
- Distribución de producción (aprox. estos % en el total de filas):
  - video_persona: ${params.distribucion.video_persona}%
  - video_ia: ${params.distribucion.video_ia}%
  - diseno_estatico: ${params.distribucion.diseno_estatico}%
- Formatos permitidos (usa SOLO estos ids): ${params.formatos.join(", ")}
- Redes / plataformas (elige subset relevante por fila): ${params.redes.join(", ")}

Pilares (respeta pesos aproximados):
${JSON.stringify(pilares, null, 2)}

Hallazgos de competencia a aprovechar (sin copiar, solo inspirar):
${investigacion.resumenGeneral}

Responde SOLO JSON:
{
  "filas": [
    {
      "fecha": "YYYY-MM-DD",
      "pilar": "string (nombre de un pilar)",
      "formato": "reel_short|carrusel|imagen_estatica|story",
      "tipoProduccion": "video_persona|video_ia|diseno_estatico",
      "plataformas": ["instagram", "..."],
      "hook": "string corto gancho",
      "idea": "string descripción de la pieza",
      "copySugerido": "string copy listo para adaptar",
      "objetivoPost": "string (awareness, leads, engagement, etc.)",
      "notasProduccion": "string tips prácticos de producción"
    }
  ]
}

IMPORTANTE:
- Exactamente ${dias} filas, una por cada fecha listada.
- Respeta la distribución de tipo de producción lo más cerca posible.
- Varía pilares y formatos; no repitas el mismo hook.
- Copy en tono LernyMart (cercano, motivador, claro).`,
  });

  const filas = (result.filas || []).map((f) => ({
    ...f,
    id: uid(),
    plataformas: f.plataformas || [],
  }));

  // Garantizar cobertura de fechas si el modelo omitió alguna
  if (filas.length < fechas.length) {
    const have = new Set(filas.map((f) => f.fecha));
    for (const fecha of fechas) {
      if (!have.has(fecha)) {
        const plantilla = filas[0];
        filas.push({
          id: uid(),
          fecha,
          pilar: plantilla?.pilar || pilares[0]?.nombre || "General",
          formato: params.formatos[0],
          tipoProduccion:
            params.distribucion.diseno_estatico >=
            params.distribucion.video_persona
              ? "diseno_estatico"
              : "video_persona",
          plataformas: params.redes.slice(0, 2),
          hook: "Idea pendiente de afinar",
          idea: "Completar esta pieza según el pilar del día.",
          copySugerido: "",
          objetivoPost: "engagement",
          notasProduccion: "Fila auto-completada por cobertura de fechas; editar.",
        });
      }
    }
  }

  return filas
    .filter((f) => fechas.includes(f.fecha))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export async function step4Resumen(
  params: FormParametros,
  pilares: PilarContenido[],
  filas: FilaParrilla[]
): Promise<ResumenEjecutivo> {
  const result = await chatJson<ResumenEjecutivo>({
    temperature: 0.5,
    systemExtra:
      "Generas un resumen ejecutivo corto para que marketing valide la parrilla.",
    userPrompt: `Con la parrilla generada, arma el resumen ejecutivo.

Parámetros pedidos:
${JSON.stringify(params.distribucion)}
Formatos: ${params.formatos.join(", ")}
Pilares: ${JSON.stringify(pilares)}

Filas (resumen):
${JSON.stringify(
  filas.map((f) => ({
    fecha: f.fecha,
    pilar: f.pilar,
    formato: f.formato,
    tipoProduccion: f.tipoProduccion,
    hook: f.hook,
  })),
  null,
  2
)}

Responde SOLO JSON:
{
  "distribucionPilares": [{ "nombre": "", "porcentaje": 0, "cantidad": 0 }],
  "distribucionFormatos": [{ "formato": "", "porcentaje": 0, "cantidad": 0 }],
  "distribucionProduccion": [{ "tipo": "", "porcentaje": 0, "cantidad": 0 }],
  "videosAncla": [
    { "titulo": "", "descripcion": "", "porQue": "" }
  ],
  "metricasSugeridas": ["string"]
}

Incluye exactamente 3 videos ancla. Calcula % reales a partir de las filas.`,
  });

  return result;
}

export async function regenerateSingleRow(params: {
  form: FormParametros;
  investigacion: InvestigacionCompetencia;
  pilares: PilarContenido[];
  filaActual: FilaParrilla;
  filasVecinas: FilaParrilla[];
}): Promise<FilaParrilla> {
  const result = await chatJson<{ fila: Omit<FilaParrilla, "id"> }>({
    temperature: 0.8,
    systemExtra:
      "Regeneras UNA sola fila de la parrilla sin romper la coherencia del mes.",
    userPrompt: `Regenera solo el contenido del día ${params.filaActual.fecha}.
Mantén la misma fecha. Puedes cambiar pilar/formato/tipo si encaja con los parámetros.

Parámetros:
${JSON.stringify(params.form, null, 2)}

Pilares: ${JSON.stringify(params.pilares)}
Resumen competencia: ${params.investigacion.resumenGeneral}

Fila actual:
${JSON.stringify(params.filaActual)}

Vecinas (para no repetir):
${JSON.stringify(params.filasVecinas)}

Responde SOLO JSON:
{
  "fila": {
    "fecha": "${params.filaActual.fecha}",
    "pilar": "",
    "formato": "",
    "tipoProduccion": "",
    "plataformas": [],
    "hook": "",
    "idea": "",
    "copySugerido": "",
    "objetivoPost": "",
    "notasProduccion": ""
  }
}`,
  });

  return {
    ...result.fila,
    id: params.filaActual.id,
    fecha: params.filaActual.fecha,
  };
}

export async function runFullPipeline(params: FormParametros): Promise<{
  investigacion: InvestigacionCompetencia;
  pilares: PilarContenido[];
  filas: FilaParrilla[];
  resumen: ResumenEjecutivo;
}> {
  const investigacion = await step1Investigacion(params.competidores);
  const pilares = await step2Pilares(params, investigacion);
  const filas = await step3Parrilla(params, investigacion, pilares);
  const resumen = await step4Resumen(params, pilares, filas);
  return { investigacion, pilares, filas, resumen };
}
