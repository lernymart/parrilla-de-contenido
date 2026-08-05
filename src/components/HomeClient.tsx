"use client";

import { useState } from "react";
import { ContentForm } from "@/components/ContentForm";
import { LoadingState } from "@/components/LoadingState";
import { ParrillaEditor } from "@/components/ParrillaEditor";
import type { FormParametros, ParrillaGenerada } from "@/types/parrilla";

export function HomeClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parrilla, setParrilla] = useState<ParrillaGenerada | null>(null);
  const [lastParams, setLastParams] = useState<
    Partial<FormParametros> | undefined
  >();

  async function handleSubmit(data: FormParametros) {
    setLoading(true);
    setError(null);
    setLastParams(data);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "No se pudo generar la parrilla.");
        return;
      }
      setParrilla(json.parrilla);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(
        "Hubo un problema de conexión. Revisa tu internet e intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  if (parrilla) {
    return (
      <ParrillaEditor
        initial={parrilla}
        onNueva={() => {
          setParrilla(null);
          setError(null);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Generar parrilla de contenido
        </h1>
        <p className="mt-2 text-slate-600">
          Completa el formulario. La herramienta investigará a la competencia,
          armará el calendario día a día y te permitirá descargarlo. No se
          guarda en la nube: descarga el archivo al terminar.
        </p>
      </div>

      {loading ? (
        <LoadingState tip="Estamos buscando qué publica la competencia y luego armamos tu mes completo." />
      ) : null}

      {error ? (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <p className="font-medium">No se pudo generar la parrilla</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-50"
          >
            Cerrar y reintentar
          </button>
        </div>
      ) : null}

      <ContentForm
        initial={lastParams}
        onSubmit={handleSubmit}
        submitting={loading}
      />
    </div>
  );
}
