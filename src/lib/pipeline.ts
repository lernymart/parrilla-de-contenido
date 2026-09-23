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
import { getBrand } from "../../config/brand-context";

/**
 * Pipeline de generación en 4 pasos encadenados.
 * Paso 1 (competencia) es obligatorio y siempre corre primero.
 *2
 * La parrilla (paso 3) se genera por lotes de ~7 días para:
 * - reducir cortes en un solo prompt enorme
 * - poder devolver lo ya generado si falla a mitad (tras agotar keys)
 */

const CHUNK_DAYS = 7;

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function emptyResumen(filas: FilaParrilla[]): ResumenEjecutivo {
  const byPilar = new Map<string, number>();
  const byFormato = new Map<string, number>();
  const byProd = new Map<string, number>();
  for (const f of filas) {
    byPilar.set(f.pilar, (byPilar.get(f.pilar) || 0) + 1);
    byFormato.set(String(f.formato), (byFormato.get(String(f.formato)) || 0) + 1);
    byProd.set(
      String(f.tipoProduccion),
      (byProd.get(String(f.tipoProduccion)) || 0) + 1
    );
  }
  const total = filas.length || 1;
  const pct = (n: number) => Math.round((n / total) * 100);

  return {
    distribucionPilares: Array.from(byPilar.entries()).map(([nombre, cantidad]) => ({
      nombre,
      porcentaje: pct(cantidad),
      cantidad,
    })),
    distribucionFormatos: Array.from(byFormato.entries()).map(
      ([formato, cantidad]) => ({
        formato,
        porcentaje: pct(cantidad),
        cantidad,
      })
    ),
    distribucionProduccion: Array.from(byProd.entries()).map(
      ([tipo, cantidad]) => ({
        tipo,
        porcentaje: pct(cantidad),
        cantidad,
      })
    ),
    videosAncla: [],
    metricasSugeridas: [
      "Revisa alcance y engagement de las piezas ya generadas.",
      "Completa los días faltantes regenerando fila por fila cuando haya crédito.",
    ],
  };
}

export async function step1Investigacion(
  competidores: string[],
  brandId?: string | null
): Promise<InvestigacionCompetencia> {
  const brand = getBrand(brandId);
  const bundles = await investigateCompetitors(competidores);
  const rawText = formatSearchBundlesForLlm(bundles);
  const fuentes = bundles.flatMap((b) => b.resultados.map((r) => r.link));

  const result = await chatJson<{
    resumenGeneral: string;
    hallazgos: HallazgoCompetencia[];
  }>({
    brandId,
    temperature: 0.4,
    systemExtra:
      "Tu tarea es resumir hallazgos de competencia a partir de resultados de búsqueda web. Sé concreto y orientado a contenido en redes.",
    userPrompt: `Analiza estos resultados de búsqueda sobre competidores de ${brand.nombre} y resume qué tipo de contenido están publicando en redes sociales.

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
      descripcion: "Pilar definido por el equipo de marketing.",
      pesoPorcentaje:
        i === names.length - 1 ? 100 - peso * (names.length - 1) : peso,
    }));
  }

  const brand = getBrand(params.brandId);
  const result = await chatJson<{ pilares: PilarContenido[] }>({
    brandId: params.brandId,
    temperature: 0.6,
    systemExtra:
      `Propón pilares de contenido estratégicos para redes sociales de ${brand.nombre}.`,
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

async function generateChunk(
  params: FormParametros,
  investigacion: InvestigacionCompetencia,
  pilares: PilarContenido[],
  fechasChunk: string[],
  filasPrevias: FilaParrilla[]
): Promise<FilaParrilla[]> {
  const dias = fechasChunk.length;
  const prevHooks = filasPrevias
    .slice(-8)
    .map((f) => f.hook)
    .filter(Boolean);

  const brand = getBrand(params.brandId);
  const result = await chatJson<{ filas: Omit<FilaParrilla, "id">[] }>({
    brandId: params.brandId,
    temperature: 0.75,
    systemExtra:
      "Generas parrillas de contenido día a día, realistas y accionables para un equipo de marketing.",
    userPrompt: `Genera UNA fila de contenido por cada fecha del lote (exactamente ${dias} filas).

Fechas de este lote (en orden): ${fechasChunk.join(", ")}

Parámetros globales:
- Objetivo del mes: ${params.marcaObjetivoMes || "(ninguno)"}
- Distribución de producción (aprox. estos % en el total del mes):
  - video_persona: ${params.distribucion.video_persona}%
  - video_ia: ${params.distribucion.video_ia}%
  - diseno_estatico: ${params.distribucion.diseno_estatico}%
- Formatos permitidos (usa SOLO estos ids): ${params.formatos.join(", ")}
- Redes / plataformas (elige subset relevante por fila): ${params.redes.join(", ")}

Pilares (respeta pesos aproximados):
${JSON.stringify(pilares, null, 2)}

Hallazgos de competencia a aprovechar (sin copiar, solo inspirar):
${investigacion.resumenGeneral}

Hooks recientes ya usados (NO los repitas):
${prevHooks.length ? prevHooks.join(" | ") : "(ninguno aún)"}

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
- Exactamente ${dias} filas, una por cada fecha listada en este lote.
- Respeta la distribución de tipo de producción lo más cerca posible.
- Varía pilares y formatos; no repitas el mismo hook.
- Copy en tono ${brand.nombre} (cercano, motivador, claro).`,
  });

  return (result.filas || [])
    .filter((f) => fechasChunk.includes(f.fecha))
    .map((f) => ({
      ...f,
      id: uid(),
      plataformas: f.plataformas || [],
    }));
}

export async function step3Parrilla(
  params: FormParametros,
  investigacion: InvestigacionCompetencia,
  pilares: PilarContenido[]
): Promise<{ filas: FilaParrilla[]; incompleto: boolean; errorLote?: string }> {
  const fechas = enumerateDates(params.fechaDesde, params.fechaHasta);
  const chunks = chunkArray(fechas, CHUNK_DAYS);
  const filas: FilaParrilla[] = [];

  for (let i = 0; i < chunks.length; i++) {
    try {
      const lote = await generateChunk(
        params,
        investigacion,
        pilares,
        chunks[i],
        filas
      );
      filas.push(...lote);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falló un lote de la parrilla.";
      console.error(`step3 lote ${i + 1}/${chunks.length}:`, err);
      if (filas.length > 0) {
        return {
          filas: [...filas].sort((a, b) => a.fecha.localeCompare(b.fecha)),
          incompleto: true,
          errorLote: message,
        };
      }
      throw err;
    }
  }

  return {
    filas: [...filas].sort((a, b) => a.fecha.localeCompare(b.fecha)),
    incompleto: false,
  };
}

export async function step4Resumen(
  params: FormParametros,
  pilares: PilarContenido[],
  filas: FilaParrilla[]
): Promise<ResumenEjecutivo> {
  if (filas.length === 0) return emptyResumen([]);

  return chatJson<ResumenEjecutivo>({
    brandId: params.brandId,
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
}

export async function regenerateSingleRow(params: {
  form: FormParametros;
  investigacion: InvestigacionCompetencia;
  pilares: PilarContenido[];
  filaActual: FilaParrilla;
  filasVecinas: FilaParrilla[];
}): Promise<FilaParrilla> {
  const result = await chatJson<{ fila: Omit<FilaParrilla, "id"> }>({
    brandId: params.form.brandId,
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

export interface PipelineResult {
  investigacion: InvestigacionCompetencia;
  pilares: PilarContenido[];
  filas: FilaParrilla[];
  resumen: ResumenEjecutivo;
  parcial: boolean;
  aviso?: string;
}

export async function runFullPipeline(
  params: FormParametros
): Promise<PipelineResult> {
  const fechasPedidas = enumerateDates(params.fechaDesde, params.fechaHasta);

  const brandId = params.brandId;

  const investigacion = await step1Investigacion(params.competidores, brandId);
  const pilares = await step2Pilares(params, investigacion);

  const { filas, incompleto, errorLote } = await step3Parrilla(
    params,
    investigacion,
    pilares
  );

  let resumen: ResumenEjecutivo;
  let parcial = incompleto;
  let aviso: string | undefined;

  if (incompleto) {
    aviso =
      `La generación se detuvo a mitad (créditos o error de IA). Se devolvieron ${filas.length} de ${fechasPedidas.length} días. ` +
      `Descarga lo que hay y regenera los días faltantes uno a uno cuando haya crédito.` +
      (errorLote ? ` Detalle: ${errorLote}` : "");
  }

  try {
    resumen = await step4Resumen(params, pilares, filas);
  } catch (err) {
    console.error("step4 resumen falló; usando resumen local:", err);
    resumen = emptyResumen(filas);
    parcial = true;
    aviso =
      (aviso ? `${aviso} ` : "") +
      "No se pudo armar el resumen ejecutivo con IA; se calculó uno básico con lo generado.";
  }

  if (filas.length === 0) {
    throw new Error(
      "No se pudo generar ningún día de la parrilla. Revisa las claves de OpenRouter e intenta de nuevo."
    );
  }

  return { investigacion, pilares, filas, resumen, parcial, aviso };
}
