/**
 * Punto de entrada de configuración de marca.
 * Las marcas viven en config/brands/ (lernymart, intercert, …).
 * Reexporta la API usada por la app.
 */

export {
  BRANDS,
  BRAND_LIST,
  DEFAULT_BRAND_ID,
  getBrand,
  isBrandId,
  buildBrandSystemPrompt,
  OPENROUTER_MODEL,
  FORMATOS_DISPONIBLES,
  REDES_DISPONIBLES,
  TIPOS_PRODUCCION,
  COMPETIDORES_DEFAULT,
  LERNYMART_BRAND,
  INTERCERT_BRAND,
} from "./brands";

export type { BrandConfig, BrandId } from "./brands";
