/**
 * Investigación de competencia vía SerpAPI (Google Search).
 * Solo usar desde el servidor.
 *
 * Estrategia:
 * - Por cada competidor: 1 búsqueda enfocada en contenido en redes
 *   + 1 búsqueda de noticias/tendencias recientes.
 * - Se recogen títulos, snippets y links; el LLM los resume después.
 */

export interface SerpResultItem {
  title: string;
  link: string;
  snippet: string;
  source?: string;
}

export interface CompetitorSearchBundle {
  competidor: string;
  resultados: SerpResultItem[];
  queries: string[];
}

async function serpGoogleSearch(
  query: string,
  num = 8
): Promise<SerpResultItem[]> {
  const key = process.env.SERPAPI_API_KEY;
  if (!key) {
    throw new Error(
      "Falta SERPAPI_API_KEY en .env.local. Pídesela al equipo técnico."
    );
  }

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "es");
  url.searchParams.set("gl", "pe");
  url.searchParams.set("num", String(num));
  url.searchParams.set("api_key", key);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("SerpAPI error:", res.status, detail);
    throw new Error(
      "No pudimos buscar información de la competencia. Revisa SerpAPI o intenta de nuevo."
    );
  }

  const data = (await res.json()) as {
    organic_results?: {
      title?: string;
      link?: string;
      snippet?: string;
      source?: string;
    }[];
    error?: string;
  };

  if (data.error) {
    console.error("SerpAPI payload error:", data.error);
    throw new Error(
      "SerpAPI devolvió un error. Verifica la cuota o la clave e intenta de nuevo."
    );
  }

  return (data.organic_results || [])
    .filter((r) => r.title && r.link)
    .map((r) => ({
      title: r.title!,
      link: r.link!,
      snippet: r.snippet || "",
      source: r.source,
    }));
}

/** Construye queries útiles para contenido en redes de un competidor. */
function buildQueries(competidor: string): string[] {
  const year = new Date().getFullYear();
  return [
    `${competidor} Instagram Reels OR TikTok marketing contenido ${year}`,
    `${competidor} estrategia contenido redes sociales OR social media`,
  ];
}

/**
 * Busca evidencia reciente por cada competidor seleccionado.
 * Obligatoria antes de generar la parrilla.
 */
export async function investigateCompetitors(
  competidores: string[]
): Promise<CompetitorSearchBundle[]> {
  const unique = Array.from(
    new Set(competidores.map((c) => c.trim()).filter(Boolean))
  );
  if (unique.length === 0) {
    throw new Error("Debes indicar al menos un competidor para analizar.");
  }

  const bundles: CompetitorSearchBundle[] = [];

  for (const competidor of unique) {
    const queries = buildQueries(competidor);
    const resultados: SerpResultItem[] = [];

    for (const q of queries) {
      try {
        const items = await serpGoogleSearch(q, 6);
        resultados.push(...items);
      } catch (err) {
        // Si falla una query, intentamos la siguiente; si todas fallan, propagamos.
        console.warn(`SerpAPI falló para query: ${q}`, err);
        if (queries.indexOf(q) === queries.length - 1 && resultados.length === 0) {
          throw err;
        }
      }
    }

    // Deduplicar por link
    const seen = new Set<string>();
    const deduped = resultados.filter((r) => {
      if (seen.has(r.link)) return false;
      seen.add(r.link);
      return true;
    });

    bundles.push({ competidor, resultados: deduped.slice(0, 12), queries });
  }

  return bundles;
}

/** Texto compacto para pasar al LLM. */
export function formatSearchBundlesForLlm(
  bundles: CompetitorSearchBundle[]
): string {
  return bundles
    .map((b) => {
      const lines = b.resultados
        .map(
          (r, i) =>
            `  ${i + 1}. ${r.title}\n     ${r.snippet}\n     URL: ${r.link}`
        )
        .join("\n");
      return `### ${b.competidor}\nQueries: ${b.queries.join(" | ")}\n${lines || "  (sin resultados orgánicos)"}`;
    })
    .join("\n\n");
}
