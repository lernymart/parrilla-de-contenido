"use client";

const STEPS = [
  "Investigando competencia…",
  "Definiendo pilares…",
  "Armando la parrilla día a día…",
  "Preparando el resumen ejecutivo…",
];

export function LoadingState({ tip }: { tip?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <span
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#FFC847]"
            aria-hidden
          />
          <div>
            <p className="font-semibold text-slate-900">Generando tu parrilla</p>
            <p className="text-sm text-slate-500">
              Esto puede tardar 1–2 minutos. No cierres esta ventana.
            </p>
          </div>
        </div>
        <ul className="space-y-2 text-sm text-slate-600">
          {STEPS.map((s) => (
            <li key={s} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFC847]" />
              {s}
            </li>
          ))}
        </ul>
        {tip ? (
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            {tip}
          </p>
        ) : null}
      </div>
    </div>
  );
}
