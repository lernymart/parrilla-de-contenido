import type { BrandConfig, BrandId } from "./types";
import { LERNYMART_BRAND } from "./lernymart";
import { INTERCERT_BRAND } from "./intercert";

export type { BrandConfig, BrandId } from "./types";
export { LERNYMART_BRAND } from "./lernymart";
export { INTERCERT_BRAND } from "./intercert";

export const BRANDS: Record<BrandId, BrandConfig> = {
  lernymart: LERNYMART_BRAND,
  intercert: INTERCERT_BRAND,
};

export const BRAND_LIST: BrandConfig[] = [LERNYMART_BRAND, INTERCERT_BRAND];

export const DEFAULT_BRAND_ID: BrandId = "lernymart";

export function getBrand(id?: string | null): BrandConfig {
  if (id && id in BRANDS) {
    return BRANDS[id as BrandId];
  }
  return BRANDS[DEFAULT_BRAND_ID];
}

export function isBrandId(value: unknown): value is BrandId {
  return value === "lernymart" || value === "intercert";
}

/** Prompt de sistema por empresa (se inyecta en cada llamada al LLM). */
export function buildBrandSystemPrompt(brandId?: BrandId | string | null): string {
  const b = getBrand(brandId);
  return `Eres un estratega de contenido para redes sociales del equipo de marketing de ${b.nombre}.

CONTEXTO DE MARCA:
- Qué es: ${b.descripcion}
- Diferenciales: ${b.diferenciales.join("; ")}.
- Servicios / funcionalidades: ${b.funcionalidades.join("; ")}.
- Tono de comunicación: ${b.tono}
- Audiencia: ${b.audiencia}
- Competencia directa: ${b.competenciaDirecta}
- Identidad visual (referencia, no inventes assets): primario ${b.identidadVisual.colores.primario}, secundario ${b.identidadVisual.colores.secundario}, neutro ${b.identidadVisual.colores.neutro}; tipografía ${b.identidadVisual.tipografia}; símbolo ${b.identidadVisual.simbolo}.

ENFOQUE DE MARKETING:
${b.enfoqueMarketing}

REGLAS:
- Responde siempre en español (Perú/LATAM), claro y accionable.
- No suenes a "gurú" de internet ni uses frases vacías de motivación genérica.
- Adapta ideas, hooks y copies al negocio real de ${b.nombre} (no copies plantillas de otra industria).
- Cuando se te pida JSON, responde SOLO con JSON válido, sin markdown ni texto fuera del JSON.`;
}

/** Constantes compartidas de formatos/redes/producción (iguales para todas las marcas). */
export const OPENROUTER_MODEL = "openai/gpt-4o-mini";

export const FORMATOS_DISPONIBLES = [
  { id: "reel_short", label: "Reel / Short" },
  { id: "carrusel", label: "Carrusel" },
  { id: "imagen_estatica", label: "Imagen estática" },
  { id: "story", label: "Story" },
] as const;

export const REDES_DISPONIBLES = [
  { id: "instagram", label: "Instagram", default: true },
  { id: "tiktok", label: "TikTok", default: true },
  { id: "facebook", label: "Facebook", default: true },
  { id: "youtube_shorts", label: "YouTube / Shorts", default: true },
  { id: "linkedin", label: "LinkedIn", default: true },
] as const;

export const TIPOS_PRODUCCION = [
  { id: "video_persona", label: "Video con persona real" },
  { id: "video_ia", label: "Video generado con IA (Google Flow)" },
  { id: "diseno_estatico", label: "Diseño estático (imagen/carrusel)" },
] as const;

/** @deprecated Usa getBrand(id).competidoresDefault */
export const COMPETIDORES_DEFAULT = LERNYMART_BRAND.competidoresDefault;
