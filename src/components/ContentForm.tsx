"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FORMATOS_DISPONIBLES,
  REDES_DISPONIBLES,
  TIPOS_PRODUCCION,
} from "../../config/brand-context";
import { useBrand } from "@/components/BrandProvider";
import type {
  DistribucionProduccion,
  FormatoId,
  FormParametros,
  RedId,
} from "@/types/parrilla";
import { countDays } from "@/lib/validators";

const DEFAULT_DIST: DistribucionProduccion = {
  video_persona: 40,
  video_ia: 30,
  diseno_estatico: 30,
};

function redistribute(
  current: DistribucionProduccion,
  key: keyof DistribucionProduccion,
  value: number
): DistribucionProduccion {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const others = (Object.keys(current) as (keyof DistribucionProduccion)[]).filter(
    (k) => k !== key
  );
  const rest = 100 - clamped;
  const otherSum = others.reduce((s, k) => s + current[k], 0);

  const next: DistribucionProduccion = { ...current, [key]: clamped };

  if (otherSum === 0) {
    const each = Math.floor(rest / others.length);
    others.forEach((k, i) => {
      next[k] = i === others.length - 1 ? rest - each * (others.length - 1) : each;
    });
  } else {
    let allocated = 0;
    others.forEach((k, i) => {
      if (i === others.length - 1) {
        next[k] = rest - allocated;
      } else {
        const share = Math.round((current[k] / otherSum) * rest);
        next[k] = share;
        allocated += share;
      }
    });
  }
  return next;
}

export interface ContentFormProps {
  initial?: Partial<FormParametros>;
  onSubmit: (data: FormParametros) => void;
  submitting?: boolean;
}

export function ContentForm({ initial, onSubmit, submitting }: ContentFormProps) {
  const { brand, brandId } = useBrand();

  const [fechaDesde, setFechaDesde] = useState(initial?.fechaDesde || "");
  const [fechaHasta, setFechaHasta] = useState(initial?.fechaHasta || "");
  const [marcaObjetivoMes, setMarcaObjetivoMes] = useState(
    initial?.marcaObjetivoMes || ""
  );
  const [distribucion, setDistribucion] = useState<DistribucionProduccion>(
    initial?.distribucion || DEFAULT_DIST
  );
  const [formatos, setFormatos] = useState<FormatoId[]>(
    initial?.formatos || ["reel_short", "carrusel", "imagen_estatica", "story"]
  );
  const [redes, setRedes] = useState<RedId[]>(
    initial?.redes ||
      (REDES_DISPONIBLES.filter((r) => r.default).map((r) => r.id) as RedId[])
  );
  const [competidores, setCompetidores] = useState<string[]>(
    initial?.competidores || [...brand.competidoresDefault]
  );
  const [chipInput, setChipInput] = useState("");
  const [pilaresIaDecide, setPilaresIaDecide] = useState(
    initial?.pilaresIaDecide ?? true
  );
  const [pilaresTexto, setPilaresTexto] = useState(
    (initial?.pilaresManual || []).join("\n")
  );
  const [error, setError] = useState<string | null>(null);

  // Al cambiar de empresa, precarga sus competidores por defecto
  useEffect(() => {
    if (initial?.brandId && initial.brandId === brandId && initial.competidores) {
      return;
    }
    setCompetidores([...brand.competidoresDefault]);
    setError(null);
  }, [brandId, brand.competidoresDefault, initial?.brandId, initial?.competidores]);

  const dias = useMemo(() => {
    if (!fechaDesde || !fechaHasta || fechaDesde > fechaHasta) return 0;
    return countDays(fechaDesde, fechaHasta);
  }, [fechaDesde, fechaHasta]);

  const suma = distribucion.video_persona + distribucion.video_ia + distribucion.diseno_estatico;

  function toggleFormato(id: FormatoId) {
    setFormatos((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleRed(id: RedId) {
    setRedes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function addCompetidor() {
    const name = chipInput.trim();
    if (!name) return;
    if (competidores.some((c) => c.toLowerCase() === name.toLowerCase())) {
      setChipInput("");
      return;
    }
    setCompetidores((prev) => [...prev, name]);
    setChipInput("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fechaDesde || !fechaHasta) {
      setError("Elige el rango de fechas (desde y hasta).");
      return;
    }
    if (fechaDesde > fechaHasta) {
      setError("La fecha de inicio no puede ser posterior a la de fin.");
      return;
    }
    if (Math.abs(suma - 100) > 0.5) {
      setError("Los porcentajes de tipo de producción deben sumar 100%.");
      return;
    }
    if (formatos.length === 0) {
      setError("Selecciona al menos un formato.");
      return;
    }
    if (redes.length === 0) {
      setError("Selecciona al menos una red social.");
      return;
    }
    if (competidores.length === 0) {
      setError("Agrega al menos un competidor para analizar.");
      return;
    }

    const pilaresManual = pilaresTexto
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (!pilaresIaDecide && pilaresManual.length < 2) {
      setError(
        "Escribe al menos 2 pilares (uno por línea), o deja que la IA los decida."
      );
      return;
    }

    onSubmit({
      brandId,
      fechaDesde,
      fechaHasta,
      marcaObjetivoMes: marcaObjetivoMes.trim() || undefined,
      distribucion,
      formatos,
      redes,
      competidores,
      pilaresIaDecide,
      pilaresManual: pilaresIaDecide ? undefined : pilaresManual,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Fechas */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">Rango de fechas</h2>
        <p className="mt-1 text-sm text-slate-500">
          La parrilla tendrá un post por cada día del rango.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Desde</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Hasta</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </label>
        </div>
        {dias > 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            Serán <strong>{dias}</strong> día{dias === 1 ? "" : "s"} de contenido.
          </p>
        ) : null}
      </section>

      {/* Objetivo */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">
          Objetivo del mes{" "}
          <span className="font-normal text-slate-400">(opcional)</span>
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Ej.: lanzamiento de webinar, fin de mes, campaña de afiliados.
        </p>
        <input
          type="text"
          maxLength={200}
          value={marcaObjetivoMes}
          onChange={(e) => setMarcaObjetivoMes(e.target.value)}
          placeholder="Escribe un objetivo corto…"
          className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
      </section>

      {/* Distribución producción */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">
            Tipo de producción
          </h2>
          <span
            className={`text-sm font-medium ${
              suma === 100 ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            Suma: {suma}%
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Mueve los controles. Al cambiar uno, los otros se ajustan para sumar 100%.
        </p>
        <div className="mt-4 space-y-5">
          {TIPOS_PRODUCCION.map((t) => (
            <label key={t.id} className="block">
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-slate-700">{t.label}</span>
                <span className="tabular-nums text-slate-600">
                  {distribucion[t.id as keyof DistribucionProduccion]}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={distribucion[t.id as keyof DistribucionProduccion]}
                onChange={(e) =>
                  setDistribucion(
                    redistribute(
                      distribucion,
                      t.id as keyof DistribucionProduccion,
                      Number(e.target.value)
                    )
                  )
                }
                className="w-full accent-[#FFC847]"
              />
            </label>
          ))}
        </div>
      </section>

      {/* Formatos */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">Formatos</h2>
        <p className="mt-1 text-sm text-slate-500">Elige uno o varios.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {FORMATOS_DISPONIBLES.map((f) => {
            const on = formatos.includes(f.id as FormatoId);
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => toggleFormato(f.id as FormatoId)}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  on
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Redes */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">Redes sociales</h2>
        <p className="mt-1 text-sm text-slate-500">
          Por defecto están todas; quita las que no uses este mes.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {REDES_DISPONIBLES.map((r) => {
            const on = redes.includes(r.id as RedId);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggleRed(r.id as RedId)}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  on
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Competidores */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">
          Competidores a analizar
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Este paso es obligatorio: siempre investigamos competencia antes de
          armar la parrilla. Puedes quitar o agregar nombres.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {competidores.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-sm text-slate-800"
            >
              {c}
              <button
                type="button"
                aria-label={`Quitar ${c}`}
                onClick={() =>
                  setCompetidores((prev) => prev.filter((x) => x !== c))
                }
                className="ml-1 rounded-full px-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={chipInput}
            onChange={(e) => setChipInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCompetidor();
              }
            }}
            placeholder="Agregar competidor…"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
          <button
            type="button"
            onClick={addCompetidor}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Agregar
          </button>
        </div>
      </section>

      {/* Pilares */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">
          Pilares de contenido
        </h2>
        <label className="mt-4 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={pilaresIaDecide}
            onChange={(e) => setPilaresIaDecide(e.target.checked)}
            className="mt-1 accent-[#FFC847]"
          />
          <span>
            <span className="block text-sm font-medium text-slate-800">
              Dejar que la IA decida los pilares
            </span>
            <span className="text-sm text-slate-500">
              Recomendado si aún no tienes pilares definidos para el mes.
            </span>
          </span>
        </label>
        {!pilaresIaDecide ? (
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">
              Tus pilares (uno por línea)
            </label>
            <textarea
              rows={4}
              value={pilaresTexto}
              onChange={(e) => setPilaresTexto(e.target.value)}
              placeholder={"Ejemplo:\nEducación práctica\nPrueba social\nOfertas"}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        ) : null}
      </section>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-slate-900 px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg"
      >
        {submitting ? "Generando…" : "Generar parrilla de contenido"}
      </button>
    </form>
  );
}
