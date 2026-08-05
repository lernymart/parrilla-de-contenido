"use client";

import { useState } from "react";
import type { FilaParrilla } from "@/types/parrilla";
import {
  FORMATOS_DISPONIBLES,
  TIPOS_PRODUCCION,
} from "../../config/brand-context";

const COLS: { key: keyof FilaParrilla; label: string; wide?: boolean }[] = [
  { key: "fecha", label: "Fecha" },
  { key: "pilar", label: "Pilar" },
  { key: "formato", label: "Formato" },
  { key: "tipoProduccion", label: "Producción" },
  { key: "plataformas", label: "Plataformas" },
  { key: "hook", label: "Hook", wide: true },
  { key: "idea", label: "Idea", wide: true },
  { key: "copySugerido", label: "Copy", wide: true },
  { key: "objetivoPost", label: "Objetivo" },
  { key: "notasProduccion", label: "Notas prod." },
];

interface EditableGridProps {
  filas: FilaParrilla[];
  onChange: (filas: FilaParrilla[]) => void;
  onRegenerateRow: (filaId: string) => Promise<void>;
  regeneratingId?: string | null;
  disabled?: boolean;
}

export function EditableGrid({
  filas,
  onChange,
  onRegenerateRow,
  regeneratingId,
  disabled,
}: EditableGridProps) {
  const [busyId, setBusyId] = useState<string | null>(null);

  function updateCell(id: string, key: keyof FilaParrilla, value: string) {
    onChange(
      filas.map((f) => {
        if (f.id !== id) return f;
        if (key === "plataformas") {
          return {
            ...f,
            plataformas: value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          };
        }
        return { ...f, [key]: value };
      })
    );
  }

  async function handleRegen(id: string) {
    setBusyId(id);
    try {
      await onRegenerateRow(id);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-[1400px] w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            {COLS.map((c) => (
              <th key={c.key} className="px-3 py-3 font-semibold whitespace-nowrap">
                {c.label}
              </th>
            ))}
            <th className="px-3 py-3 font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => {
            const loading =
              busyId === fila.id || regeneratingId === fila.id;
            return (
              <tr
                key={fila.id}
                className="border-b border-slate-100 align-top hover:bg-slate-50/60"
              >
                {COLS.map((c) => {
                  const isSelectFormato = c.key === "formato";
                  const isSelectProd = c.key === "tipoProduccion";
                  const raw =
                    c.key === "plataformas"
                      ? (fila.plataformas || []).join(", ")
                      : String(fila[c.key] ?? "");

                  return (
                    <td
                      key={c.key}
                      className={`px-2 py-2 ${c.wide ? "min-w-[200px]" : "min-w-[110px]"}`}
                    >
                      {c.key === "fecha" ? (
                        <span className="block px-1 py-1.5 font-medium tabular-nums text-slate-800">
                          {fila.fecha}
                        </span>
                      ) : isSelectFormato ? (
                        <select
                          disabled={disabled || loading}
                          value={fila.formato}
                          onChange={(e) =>
                            updateCell(fila.id, "formato", e.target.value)
                          }
                          className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm"
                        >
                          {FORMATOS_DISPONIBLES.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      ) : isSelectProd ? (
                        <select
                          disabled={disabled || loading}
                          value={fila.tipoProduccion}
                          onChange={(e) =>
                            updateCell(fila.id, "tipoProduccion", e.target.value)
                          }
                          className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm"
                        >
                          {TIPOS_PRODUCCION.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <textarea
                          disabled={disabled || loading}
                          rows={c.wide ? 3 : 2}
                          value={raw}
                          onChange={(e) =>
                            updateCell(fila.id, c.key, e.target.value)
                          }
                          className="w-full resize-y rounded border border-transparent bg-transparent px-1 py-1.5 text-sm text-slate-800 focus:border-slate-300 focus:bg-white focus:outline-none"
                        />
                      )}
                    </td>
                  );
                })}
                <td className="px-2 py-2 whitespace-nowrap">
                  <button
                    type="button"
                    disabled={disabled || loading}
                    onClick={() => handleRegen(fila.id)}
                    className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    {loading ? "…" : "Regenerar"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
