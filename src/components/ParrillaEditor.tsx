"use client";

import { useCallback, useState } from "react";
import { EditableGrid } from "@/components/EditableGrid";
import { ExecutiveSummary } from "@/components/ExecutiveSummary";
import { ExportButtons } from "@/components/ExportButtons";
import type { FilaParrilla, ParrillaGenerada } from "@/types/parrilla";

interface Props {
  initial: ParrillaGenerada;
  onNueva: () => void;
}

export function ParrillaEditor({ initial, onNueva }: Props) {
  const [parrilla, setParrilla] = useState(initial);
  const [filas, setFilas] = useState<FilaParrilla[]>(initial.filas);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleFilasChange = useCallback((next: FilaParrilla[]) => {
    setFilas(next);
    setDownloaded(false);
  }, []);

  async function regenerateRow(filaId: string) {
    setError(null);
    setMessage(null);
    setRegenerating(true);
    try {
      const idx = filas.findIndex((f) => f.id === filaId);
      if (idx < 0) {
        setError("No encontramos esa fila.");
        return;
      }
      const filaActual = filas[idx];
      const filasVecinas = filas.filter(
        (_, i) => Math.abs(i - idx) <= 2 && i !== idx
      );

      const res = await fetch("/api/regenerate-row", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parametros: parrilla.parametros,
          investigacion: parrilla.investigacion_competencia,
          pilares: parrilla.pilares,
          filaActual,
          filasVecinas,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "No se pudo regenerar la fila.");
        return;
      }
      const next = [...filas];
      next[idx] = data.fila;
      setFilas(next);
      setParrilla((p) => ({ ...p, filas: next }));
      setDownloaded(false);
      setMessage("Fila regenerada. Recuerda descargar de nuevo si ya habías exportado.");
    } catch {
      setError("No se pudo regenerar la fila. Intenta de nuevo.");
    } finally {
      setRegenerating(false);
    }
  }

  const filenameBase = `parrilla-${parrilla.fecha_desde}_${parrilla.fecha_hasta}`;

  return (
    <div className="space-y-6">
      {parrilla.parcial || parrilla.aviso ? (
        <div
          role="alert"
          className="rounded-xl border border-orange-300 bg-orange-50 px-4 py-4 text-sm text-orange-950"
        >
          <p className="font-semibold">Resultado incompleto</p>
          <p className="mt-1">
            {parrilla.aviso ||
              "La generación no terminó todos los días. Descarga lo que hay y regenera los faltantes."}
          </p>
        </div>
      ) : null}

      <div
        role="alert"
        className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-950"
      >
        <p className="font-semibold">Descarga recomendada</p>
        <p className="mt-1">
          Esta parrilla no se guarda en ningún servidor. Si cierras o recargas
          la página, <strong>no la volverás a ver</strong>. Descárgala en CSV o
          Excel antes de salir.
        </p>
        {!downloaded ? (
          <p className="mt-2 text-amber-800">
            Aún no has descargado el archivo en esta sesión.
          </p>
        ) : (
          <p className="mt-2 text-emerald-800">
            Listo: ya descargaste al menos una vez. Si editas algo, vuelve a
            exportar.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {parrilla.titulo || "Parrilla de contenido"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {parrilla.fecha_desde} → {parrilla.fecha_hasta} ·{" "}
            {filas.length} piezas
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportButtons
            filas={filas}
            filenameBase={filenameBase}
            onExported={() => {
              setDownloaded(true);
              setMessage("Archivo descargado. Guárdalo en tu carpeta de trabajo.");
            }}
          />
          <button
            type="button"
            onClick={onNueva}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Crear otra parrilla
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <ExecutiveSummary
        resumen={parrilla.resumen_ejecutivo}
        investigacion={parrilla.investigacion_competencia}
        pilares={parrilla.pilares}
      />

      <div>
        <h2 className="mb-2 text-base font-semibold text-slate-900">
          Parrilla editable
        </h2>
        <p className="mb-3 text-sm text-slate-500">
          Puedes corregir cualquier celda antes de descargar. Usa
          &quot;Regenerar&quot; para pedir una nueva idea solo de ese día.
        </p>
        <EditableGrid
          filas={filas}
          onChange={handleFilasChange}
          onRegenerateRow={regenerateRow}
          disabled={regenerating}
        />
      </div>
    </div>
  );
}
