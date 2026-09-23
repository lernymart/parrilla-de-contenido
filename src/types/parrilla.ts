/** Tipos compartidos de la parrilla de contenido. */

export type FormatoId =
  | "reel_short"
  | "carrusel"
  | "imagen_estatica"
  | "story";

export type RedId =
  | "instagram"
  | "tiktok"
  | "facebook"
  | "youtube_shorts"
  | "linkedin";

export type TipoProduccionId =
  | "video_persona"
  | "video_ia"
  | "diseno_estatico";

export interface DistribucionProduccion {
  video_persona: number;
  video_ia: number;
  diseno_estatico: number;
}

export interface FormParametros {
  fechaDesde: string; // YYYY-MM-DD
  fechaHasta: string;
  marcaObjetivoMes?: string;
  distribucion: DistribucionProduccion;
  formatos: FormatoId[];
  redes: RedId[];
  competidores: string[];
  pilaresIaDecide: boolean;
  pilaresManual?: string[];
}

export interface HallazgoCompetencia {
  competidor: string;
  formatosQueFuncionan: string[];
  ganchosTipicos: string[];
  patronesRepetidos: string[];
  notas: string;
}

export interface InvestigacionCompetencia {
  resumenGeneral: string;
  hallazgos: HallazgoCompetencia[];
  fuentesConsultadas: string[];
}

export interface PilarContenido {
  nombre: string;
  descripcion: string;
  pesoPorcentaje: number;
}

export interface FilaParrilla {
  id: string;
  fecha: string; // YYYY-MM-DD
  pilar: string;
  formato: FormatoId | string;
  tipoProduccion: TipoProduccionId | string;
  plataformas: string[];
  hook: string;
  idea: string;
  copySugerido: string;
  objetivoPost: string;
  notasProduccion: string;
}

export interface ResumenEjecutivo {
  distribucionPilares: { nombre: string; porcentaje: number; cantidad: number }[];
  distribucionFormatos: { formato: string; porcentaje: number; cantidad: number }[];
  distribucionProduccion: {
    tipo: string;
    porcentaje: number;
    cantidad: number;
  }[];
  videosAncla: { titulo: string; descripcion: string; porQue: string }[];
  metricasSugeridas: string[];
}

/** Resultado en memoria de sesión (no se guarda en base de datos). */
export interface ParrillaGenerada {
  id: string;
  titulo: string;
  fecha_desde: string;
  fecha_hasta: string;
  parametros: FormParametros;
  investigacion_competencia: InvestigacionCompetencia;
  pilares: PilarContenido[];
  filas: FilaParrilla[];
  resumen_ejecutivo: ResumenEjecutivo;
  /** true si se cortó a mitad (faltan días o el resumen es básico). */
  parcial?: boolean;
  /** Mensaje claro para marketing cuando el resultado está incompleto. */
  aviso?: string;
}

export type GenerateRequestBody = FormParametros;

export interface GenerateResponse {
  ok: true;
  parrilla: ParrillaGenerada;
}

export interface ApiErrorResponse {
  ok: false;
  error: string;
  paso?: string;
}
