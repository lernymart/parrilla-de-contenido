/** Tipos de configuración de marca / empresa. */

export type BrandId = "lernymart" | "intercert";

export interface BrandConfig {
  id: BrandId;
  /** Nombre comercial */
  nombre: string;
  /** Subtítulo corto bajo el logo */
  tagline: string;
  /** Qué es la empresa */
  descripcion: string;
  diferenciales: string[];
  funcionalidades: string[];
  tono: string;
  identidadVisual: {
    colores: {
      primario: string;
      secundario: string;
      neutro: string;
    };
    tipografia: string;
    simbolo: string;
  };
  audiencia: string;
  competenciaDirecta: string;
  /** Competidores precargados en el formulario */
  competidoresDefault: string[];
  /**
   * Enfoque de marketing para los prompts
   * (qué tipo de contenido/objetivos priorizar).
   */
  enfoqueMarketing: string;
  /** Color de acento en la UI (header / botones) */
  accentColor: string;
}
