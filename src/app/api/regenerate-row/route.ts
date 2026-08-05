import { NextRequest, NextResponse } from "next/server";
import { regenerateSingleRow } from "@/lib/pipeline";
import type {
  ApiErrorResponse,
  FilaParrilla,
  FormParametros,
  InvestigacionCompetencia,
  PilarContenido,
} from "@/types/parrilla";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      parametros,
      investigacion,
      pilares,
      filaActual,
      filasVecinas,
    } = body as {
      parametros?: FormParametros;
      investigacion?: InvestigacionCompetencia;
      pilares?: PilarContenido[];
      filaActual?: FilaParrilla;
      filasVecinas?: FilaParrilla[];
    };

    if (!parametros || !investigacion || !pilares || !filaActual) {
      return NextResponse.json(
        {
          ok: false,
          error: "Faltan datos para regenerar la fila.",
        } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    let nueva: FilaParrilla;
    try {
      nueva = await regenerateSingleRow({
        form: parametros,
        investigacion,
        pilares,
        filaActual,
        filasVecinas: filasVecinas || [],
      });
    } catch (err) {
      console.error("regenerate row:", err);
      return NextResponse.json(
        {
          ok: false,
          error:
            err instanceof Error
              ? err.message
              : "No se pudo regenerar la fila. Intenta de nuevo.",
        } satisfies ApiErrorResponse,
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, fila: nueva });
  } catch (err) {
    console.error("POST /api/regenerate-row:", err);
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Error al regenerar. Intenta de nuevo.",
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
