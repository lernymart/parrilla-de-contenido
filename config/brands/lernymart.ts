import type { BrandConfig } from "./types";

/** Contexto de marca LernyMart (marketplace de cursos). */
export const LERNYMART_BRAND: BrandConfig = {
  id: "lernymart",
  nombre: "LernyMart",
  tagline: "Marketplace de cursos e infoproductos",
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
      primario: "#FFC847",
      secundario: "#000000",
      neutro: "#DDE3E8",
    },
    tipografia: "Inter Tight",
    simbolo: "Flecha ascendente (crecimiento)",
  },
  audiencia:
    "Emprendedores, creadores de contenido, estudiantes y profesionales en Perú y LATAM interesados en aprender y/o monetizar conocimiento.",
  competenciaDirecta: "Hotmart y otros marketplaces de infoproductos.",
  competidoresDefault: ["Hotmart", "Platzi", "Udemy", "Crehana"],
  enfoqueMarketing:
    "Prioriza ideas útiles para marketing de un marketplace de cursos: captación de alumnos, afiliados, lanzamientos de cursos, prueba social y educación práctica.",
  accentColor: "#FFC847",
};
