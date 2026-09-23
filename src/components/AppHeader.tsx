"use client";

import { useBrand } from "@/components/BrandProvider";
import type { BrandId } from "@/types/parrilla";

export function AppHeader() {
  const { brand, brands, brandId, setBrandId } = useBrand();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: brand.accentColor }}
            aria-hidden
          >
            {brand.id === "lernymart" ? "↑" : "ISO"}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{brand.nombre}</p>
            <p className="text-xs text-slate-500">{brand.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-slate-500 sm:inline">Empresa</span>
          <div
            className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1"
            role="group"
            aria-label="Cambiar empresa"
          >
            {brands.map((b) => {
              const active = b.id === brandId;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBrandId(b.id as BrandId)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                    active
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {b.nombre}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
