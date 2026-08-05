"use client";

import { exportCsv, exportExcel } from "@/lib/export";
import type { FilaParrilla } from "@/types/parrilla";

interface Props {
  filas: FilaParrilla[];
  filenameBase: string;
  onExported?: () => void;
}

export function ExportButtons({ filas, filenameBase, onExported }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => {
          exportCsv(filas, filenameBase);
          onExported?.();
        }}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
      >
        Exportar CSV
      </button>
      <button
        type="button"
        onClick={() => {
          exportExcel(filas, filenameBase);
          onExported?.();
        }}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
      >
        Exportar Excel
      </button>
    </div>
  );
}
