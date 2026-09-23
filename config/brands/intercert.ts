import type { BrandConfig } from "./types";

/**
 * Contexto de marca Intercert Latam (certificadora ISO).
 * Fuentes de referencia públicas: intercertlatam.com, intercert.com.pe, LinkedIn Intercert Latam.
 */
export const INTERCERT_BRAND: BrandConfig = {
  id: "intercert",
  nombre: "Intercert Latam",
  tagline: "Certificación ISO y sistemas de gestión",
  descripcion:
    "Organismo de certificación internacional con presencia en Latinoamérica (Perú, México, Colombia y más). Ofrece certificación, auditoría y capacitación en normas ISO y sistemas de gestión. Ayuda a empresas a cumplir estándares de calidad, seguridad, medio ambiente, anticorrupción y seguridad de la información, con respaldo de reconocimiento internacional y experiencia en licitaciones y mejora operativa.",
  diferenciales: [
    "Respaldo de organismos de reconocimiento internacional",
    "Experiencia regional en LATAM (+15 años de trayectoria del grupo)",
    "Enfoque práctico: reducir costos y riesgos, mejorar rentabilidad",
    "Acompañamiento cercano a empresas y entidades públicas",
    "Capacitación y formación de auditores además de certificación",
  ],
  funcionalidades: [
    "Certificación de sistemas de gestión (ISO 9001 calidad, ISO 14001 ambiental, ISO 45001 SST, ISO 27001 seguridad de la información, ISO 37001 antisoborno, entre otras)",
    "Auditorías de certificación y seguimiento",
    "Certificación / formación de personas (auditores)",
    "Capacitación en interpretación e implementación de normas ISO",
    "Apoyo a empresas que postulan a licitaciones donde se valoran certificaciones",
  ],
  tono:
    "Profesional, claro y confiable. Técnico cuando hace falta, pero entendible para gerentes y dueños de empresa. Sin sonar a burocracia vacía ni a consultora genérica.",
  identidadVisual: {
    colores: {
      primario: "#0B3A6E",
      secundario: "#1F6FEB",
      neutro: "#E8EEF5",
    },
    tipografia: "Inter Tight",
    simbolo: "Sello / escudo de certificación (confianza y cumplimiento)",
  },
  audiencia:
    "Empresas privadas y entidades públicas en Perú y LATAM que buscan certificarse en ISO, mejorar procesos, ganar licitaciones, reducir riesgos y demostrar cumplimiento ante clientes y autoridades.",
  competenciaDirecta:
    "Otras certificadoras y organismos de evaluación de la conformidad en la región (p. ej. SGS, Bureau Veritas, TÜV, AENOR/UNE, Icontec y similares).",
  competidoresDefault: [
    "SGS",
    "Bureau Veritas",
    "TÜV Rheinland",
    "AENOR",
    "Icontec",
  ],
  enfoqueMarketing:
    "Prioriza contenido B2B: valor de certificarse, normas ISO más demandadas, casos de éxito, tips para licitaciones, mitos de la certificación, diferencia entre implementación y certificación, y llamados claros a solicitar cotización o diagnóstico. LinkedIn e Instagram suelen ser clave; el tono es experto pero accesible.",
  accentColor: "#1F6FEB",
};
