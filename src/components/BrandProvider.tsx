"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BRAND_LIST,
  DEFAULT_BRAND_ID,
  getBrand,
  type BrandConfig,
  type BrandId,
} from "../../config/brand-context";

const STORAGE_KEY = "parrilla_brand_id";

interface BrandContextValue {
  brandId: BrandId;
  brand: BrandConfig;
  brands: BrandConfig[];
  setBrandId: (id: BrandId) => void;
}

const BrandCtx = createContext<BrandContextValue | null>(null);

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brandId, setBrandIdState] = useState<BrandId>(DEFAULT_BRAND_ID);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "lernymart" || saved === "intercert") {
        setBrandIdState(saved);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const setBrandId = useCallback((id: BrandId) => {
    setBrandIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      brandId,
      brand: getBrand(brandId),
      brands: BRAND_LIST,
      setBrandId,
    }),
    [brandId, setBrandId]
  );

  // Evita flash de marca incorrecta al hidratar
  if (!ready) {
    return (
      <BrandCtx.Provider value={value}>
        <div className="min-h-screen bg-slate-50" />
      </BrandCtx.Provider>
    );
  }

  return <BrandCtx.Provider value={value}>{children}</BrandCtx.Provider>;
}

export function useBrand() {
  const ctx = useContext(BrandCtx);
  if (!ctx) {
    throw new Error("useBrand debe usarse dentro de BrandProvider");
  }
  return ctx;
}
