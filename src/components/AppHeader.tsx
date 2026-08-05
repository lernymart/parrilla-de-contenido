"use client";

export function AppHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-black"
            style={{ backgroundColor: "#FFC847" }}
            aria-hidden
          >
            ↑
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">LernyMart</p>
            <p className="text-xs text-slate-500">Parrilla de contenido</p>
          </div>
        </div>
      </div>
    </header>
  );
}
