"use client";

import { useState } from "react";
import type {
  InvestigacionCompetencia,
  ResumenEjecutivo,
  PilarContenido,
} from "@/types/parrilla";

interface Props {
  resumen: ResumenEjecutivo;
  investigacion: InvestigacionCompetencia;
  pilares: PilarContenido[];
}

export function ExecutiveSummary({ resumen, investigacion, pilares }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Resumen ejecutivo e investigación
          </h2>
          <p className="text-sm text-slate-500">
            Distribuciones, videos ancla, métricas y hallazgos de competencia
          </p>
        </div>
        <span className="text-slate-400">{open ? "▲" : "▼"}</span>
      </button>

      {open ? (
        <div className="space-y-6 border-t border-slate-100 px-5 py-5 text-sm">
          <div>
            <h3 className="font-semibold text-slate-800">Pilares usados</h3>
            <ul className="mt-2 list-inside list-disc text-slate-600">
              {pilares.map((p) => (
                <li key={p.nombre}>
                  <strong>{p.nombre}</strong> ({p.pesoPorcentaje}%):{" "}
                  {p.descripcion}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <DistBlock
              title="Por pilares"
              items={(resumen.distribucionPilares || []).map((d) => ({
                label: d.nombre,
                pct: d.porcentaje,
                n: d.cantidad,
              }))}
            />
            <DistBlock
              title="Por formatos"
              items={(resumen.distribucionFormatos || []).map((d) => ({
                label: d.formato,
                pct: d.porcentaje,
                n: d.cantidad,
              }))}
            />
            <DistBlock
              title="Por producción"
              items={(resumen.distribucionProduccion || []).map((d) => ({
                label: d.tipo,
                pct: d.porcentaje,
                n: d.cantidad,
              }))}
            />
          </div>

          <div>
            <h3 className="font-semibold text-slate-800">3 videos ancla</h3>
            <ul className="mt-2 space-y-3">
              {(resumen.videosAncla || []).map((v, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <p className="font-medium text-slate-900">{v.titulo}</p>
                  <p className="text-slate-600">{v.descripcion}</p>
                  <p className="mt-1 text-xs text-slate-500">Por qué: {v.porQue}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-800">Métricas sugeridas</h3>
            <ul className="mt-2 list-inside list-disc text-slate-600">
              {(resumen.metricasSugeridas || []).map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-800">
              Investigación de competencia
            </h3>
            <p className="mt-2 text-slate-600">{investigacion.resumenGeneral}</p>
            <div className="mt-3 space-y-3">
              {(investigacion.hallazgos || []).map((h) => (
                <div
                  key={h.competidor}
                  className="rounded-lg border border-slate-100 px-3 py-2"
                >
                  <p className="font-medium text-slate-900">{h.competidor}</p>
                  <p className="text-xs text-slate-500 mt-1">{h.notas}</p>
                  <p className="mt-2 text-xs text-slate-600">
                    <strong>Formatos:</strong>{" "}
                    {(h.formatosQueFuncionan || []).join(", ") || "—"}
                  </p>
                  <p className="text-xs text-slate-600">
                    <strong>Ganchos:</strong>{" "}
                    {(h.ganchosTipicos || []).join("; ") || "—"}
                  </p>
                  <p className="text-xs text-slate-600">
                    <strong>Patrones:</strong>{" "}
                    {(h.patronesRepetidos || []).join("; ") || "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DistBlock({
  title,
  items,
}: {
  title: string;
  items: { label: string; pct: number; n: number }[];
}) {
  return (
    <div>
      <h3 className="font-semibold text-slate-800">{title}</h3>
      <ul className="mt-2 space-y-1 text-slate-600">
        {items.map((i) => (
          <li key={i.label} className="flex justify-between gap-2">
            <span className="truncate">{i.label}</span>
            <span className="shrink-0 tabular-nums text-slate-500">
              {i.pct}% ({i.n})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
