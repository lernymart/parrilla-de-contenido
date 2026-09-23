import { z } from "zod";
import type { FormParametros } from "@/types/parrilla";

/** Validación del formulario con mensajes claros para marketing. */

const distribucionSchema = z.object({
  video_persona: z.number().min(0).max(100),
  video_ia: z.number().min(0).max(100),
  diseno_estatico: z.number().min(0).max(100),
});

export const formParametrosSchema = z
  .object({
    brandId: z.enum(["lernymart", "intercert"]).default("lernymart"),
    fechaDesde: z.string().min(1, "Elige la fecha de inicio."),
    fechaHasta: z.string().min(1, "Elige la fecha de fin."),
    marcaObjetivoMes: z.string().max(200).optional(),
    distribucion: distribucionSchema,
    formatos: z
      .array(z.enum(["reel_short", "carrusel", "imagen_estatica", "story"]))
      .min(1, "Selecciona al menos un formato."),
    redes: z
      .array(
        z.enum([
          "instagram",
          "tiktok",
          "facebook",
          "youtube_shorts",
          "linkedin",
        ])
      )
      .min(1, "Selecciona al menos una red social."),
    competidores: z
      .array(z.string().min(1))
      .min(1, "Agrega al menos un competidor para analizar."),
    pilaresIaDecide: z.boolean(),
    pilaresManual: z.array(z.string().min(1)).optional(),
  })
  .superRefine((data, ctx) => {
    const sum =
      data.distribucion.video_persona +
      data.distribucion.video_ia +
      data.distribucion.diseno_estatico;
    if (Math.abs(sum - 100) > 0.5) {
      ctx.addIssue({
        code: "custom",
        message: "Los porcentajes de tipo de producción deben sumar 100%.",
        path: ["distribucion"],
      });
    }
    if (data.fechaDesde > data.fechaHasta) {
      ctx.addIssue({
        code: "custom",
        message: "La fecha de inicio no puede ser posterior a la de fin.",
        path: ["fechaDesde"],
      });
    }
    if (!data.pilaresIaDecide) {
      const manual = (data.pilaresManual || []).filter((p) => p.trim());
      if (manual.length < 2) {
        ctx.addIssue({
          code: "custom",
          message:
            "Escribe al menos 2 pilares, o marca la opción para que la IA los decida.",
          path: ["pilaresManual"],
        });
      }
    }
  });

export function validateFormParametros(input: unknown): {
  ok: true;
  data: FormParametros;
} | { ok: false; error: string } {
  const parsed = formParametrosSchema.safeParse(input);
  if (!parsed.success) {
    const msg =
      parsed.error.issues[0]?.message ||
      "Revisa el formulario: hay datos incompletos o incorrectos.";
    return { ok: false, error: msg };
  }
  return { ok: true, data: parsed.data as FormParametros };
}

/** Lista de fechas YYYY-MM-DD inclusivas. */
export function enumerateDates(desde: string, hasta: string): string[] {
  const out: string[] = [];
  const start = new Date(desde + "T12:00:00");
  const end = new Date(hasta + "T12:00:00");
  const cur = new Date(start);
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export function countDays(desde: string, hasta: string): number {
  return enumerateDates(desde, hasta).length;
}
