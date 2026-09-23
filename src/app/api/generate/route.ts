import { NextRequest, NextResponse } from "next/server";
import { validateFormParametros, countDays } from "@/lib/validators";
import { runFullPipeline } from "@/lib/pipeline";
import type {
  ApiErrorResponse,
  GenerateResponse,
  ParrillaGenerada,
} from "@/types/parrilla";

export const maxDuration = 300;

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = validateFormParametros(body);
    if (!validated.ok) {
      return NextResponse.json(
        { ok: false, error: validated.error } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    const params = validated.data;
    const dias = countDays(params.fechaDesde, params.fechaHasta);
    if (dias > 62) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El rango no puede superar 62 días. Elige un mes o un periodo más corto.",
        } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    let result;
    try {
      result = await runFullPipeline(params);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Falló la generación. Intenta de nuevo.";
      console.error("Pipeline error:", err);
      return NextResponse.json(
        {
          ok: false,
          error: message,
          paso: "generacion",
        } satisfies ApiErrorResponse,
        { status: 502 }
      );
    }

    const titulo = params.marcaObjetivoMes?.trim()
      ? params.marcaObjetivoMes.trim()
      : `Parrilla ${params.fechaDesde} → ${params.fechaHasta}`;

    const parrilla: ParrillaGenerada = {
      id: uid(),
      titulo,
      fecha_desde: params.fechaDesde,
      fecha_hasta: params.fechaHasta,
      parametros: params,
      investigacion_competencia: result.investigacion,
      pilares: result.pilares,
      filas: result.filas,
      resumen_ejecutivo: result.resumen,
      parcial: result.parcial,
      aviso: result.aviso,
    };

    return NextResponse.json({
      ok: true,
      parrilla,
    } satisfies GenerateResponse);
  } catch (err) {
    console.error("POST /api/generate:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Ocurrió un error inesperado. Intenta de nuevo.";
    return NextResponse.json(
      { ok: false, error: message } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
