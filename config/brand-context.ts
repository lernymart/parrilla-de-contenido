/**
 * Contexto de marca de LernyMart.
 * Edita este archivo cuando cambie el manual de marca o el negocio.
 * No hace falta tocar la lógica de la app.
 */

export const BRAND_CONTEXT = {
  nombre: "LernyMart",
  descripcion:
    "Marketplace peruano de cursos e infoproductos donde se puede comprar cursos, vender cursos (como infoproductor) y ser afiliado.",
  diferenciales: [
    "Facilidad para subir contenido",
    "Herramientas de IA para crear cursos más rápido",
    "Comisiones justas",
  ],
  funcionalidades: [
    "Cursos con video, imagen, PDF y texto",
    "Exámenes",
    "Ebooks",
    "Podcasts",
    "Webinars",
  ],
  tono: "Cercano, motivador, claro, sin sonar a gurú genérico.",
  identidadVisual: {
    colores: {
      amarillo: "#FFC847",
      negro: "#000000",
      gris: "#DDE3E8",
    },
    tipografia: "Inter Tight",
    simbolo: "Flecha ascendente (crecimiento)",
  },
  audiencia:
    "Emprendedores, creadores de contenido, estudiantes y profesionales en Perú y LATAM interesados en aprender y/o monetizar conocimiento.",
  competenciaDirecta: "Hotmart y otros marketplaces de infoproductos.",
} as const;

/** Prompt de sistema base que se inyecta en las llamadas al LLM. */
export function buildBrandSystemPrompt(): string {
  const b = BRAND_CONTEXT;
  return `Eres un estratega de contenido para redes sociales del equipo de marketing de ${b.nombre}.

CONTEXTO DE MARCA:
- Qué es: ${b.descripcion}
- Diferenciales: ${b.diferenciales.join("; ")}.
- Funcionalidades: ${b.funcionalidades.join(", ")}.
- Tono de comunicación: ${b.tono}
- Audiencia: ${b.audiencia}
- Competencia directa: ${b.competenciaDirecta}
- Identidad visual (referencia, no inventes assets): amarillo ${b.identidadVisual.colores.amarillo}, negro ${b.identidadVisual.colores.negro}, gris ${b.identidadVisual.colores.gris}; tipografía ${b.identidadVisual.tipografia}; símbolo ${b.identidadVisual.simbolo}.

REGLAS:
- Responde siempre en español (Perú/LATAM), claro y accionable.
- No suenes a "gurú" de internet ni uses frases vacías de motivación genérica.
- Prioriza ideas útiles para marketing de un marketplace de cursos.
- Cuando se te pida JSON, responde SOLO con JSON válido, sin markdown ni texto fuera del JSON.`;
}

export const OPENROUTER_MODEL = "openai/gpt-4o-mini";

export const COMPETIDORES_DEFAULT = [
  "Hotmart",
  "Platzi",
  "Udemy",
  "Crehana",
] as const;

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
