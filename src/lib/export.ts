import * as XLSX from "xlsx";
import type { FilaParrilla } from "@/types/parrilla";

const FORMATO_LABEL: Record<string, string> = {
  reel_short: "Reel / Short",
  carrusel: "Carrusel",
  imagen_estatica: "Imagen estática",
  story: "Story",
};

const PRODUCCION_LABEL: Record<string, string> = {
  video_persona: "Video con persona real",
  video_ia: "Video IA (Google Flow)",
  diseno_estatico: "Diseño estático",
};

function rowsToAoA(filas: FilaParrilla[]): string[][] {
  const header = [
    "Fecha",
    "Pilar",
    "Formato",
    "Tipo de producción",
    "Plataformas",
    "Hook",
    "Idea / descripción",
    "Copy sugerido",
    "Objetivo del post",
    "Notas de producción",
  ];

  const body = filas.map((f) => [
    f.fecha,
    f.pilar,
    FORMATO_LABEL[f.formato] || String(f.formato),
    PRODUCCION_LABEL[f.tipoProduccion] || String(f.tipoProduccion),
    (f.plataformas || []).join(", "),
    f.hook,
    f.idea,
    f.copySugerido,
    f.objetivoPost,
    f.notasProduccion,
  ]);

  return [header, ...body];
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Exporta la tabla a CSV (UTF-8 con BOM para Excel en español). */
export function exportCsv(filas: FilaParrilla[], filename: string) {
  const aoa = rowsToAoA(filas);
  const csv = aoa
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? "").replace(/"/g, '""');
          return `"${s}"`;
        })
        .join(",")
    )
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  downloadBlob(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

/** Exporta la tabla a Excel (.xlsx). */
export function exportExcel(filas: FilaParrilla[], filename: string) {
  const aoa = rowsToAoA(filas);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Parrilla");
  const name = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, name);
}
