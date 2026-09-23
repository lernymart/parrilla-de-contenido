import { OPENROUTER_MODEL, buildBrandSystemPrompt } from "../../config/brand-context";

/**
 * Cliente OpenRouter (API compatible OpenAI).
 * Solo usar desde API routes / server — nunca desde el cliente.
 *
 * Soporta clave principal + respaldo:
 * - OPENROUTER_API_KEY
 * - OPENROUTER_API_KEY_2
 * Si la primera falla por cuota/auth/límite, reintenta con la segunda.
 */

function getOpenRouterKeys(): string[] {
  const keys = [
    process.env.OPENROUTER_API_KEY,
    process.env.OPENROUTER_API_KEY_2,
  ]
    .map((k) => k?.trim())
    .filter((k): k is string => Boolean(k));

  return Array.from(new Set(keys));
}

function isRetryableStatus(status: number): boolean {
  return (
    status === 401 ||
    status === 403 ||
    status === 402 ||
    status === 429 ||
    status >= 500
  );
}

async function callOpenRouterWithKey(
  key: string,
  params: {
    messages: { role: "system" | "user" | "assistant"; content: string }[];
    temperature?: number;
    json?: boolean;
  }
): Promise<
  { ok: true; content: string } | { ok: false; status: number; detail: string }
> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "LernyMart Parrilla Contenido",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      temperature: params.temperature ?? 0.7,
      messages: params.messages,
      ...(params.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { ok: false, status: res.status, detail };
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) {
    return { ok: false, status: 502, detail: "empty_content" };
  }
  return { ok: true, content: raw };
}

async function callOpenRouter(params: {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  temperature?: number;
  json?: boolean;
}): Promise<string> {
  const keys = getOpenRouterKeys();
  if (keys.length === 0) {
    throw new Error(
      "Falta OPENROUTER_API_KEY en .env.local (opcional: OPENROUTER_API_KEY_2 de respaldo)."
    );
  }

  let lastError = "No pudimos conectar con la IA.";

  for (let i = 0; i < keys.length; i++) {
    const keyLabel = i === 0 ? "principal" : "respaldo";
    const result = await callOpenRouterWithKey(keys[i], params);

    if (result.ok) {
      if (i > 0) {
        console.warn(`OpenRouter: OK con clave de ${keyLabel}.`);
      }
      return result.content;
    }

    console.error(
      `OpenRouter error (clave ${keyLabel}):`,
      result.status,
      result.detail
    );
    lastError =
      result.status === 402
        ? "Se agotaron los créditos de OpenRouter."
        : result.status === 429
          ? "OpenRouter está limitando las peticiones (rate limit)."
          : "No pudimos conectar con la IA. Revisa las claves de OpenRouter.";

    const hasNext = i < keys.length - 1;
    if (!hasNext || !isRetryableStatus(result.status)) {
      break;
    }
    console.warn(
      `OpenRouter: reintentando con clave de respaldo tras error ${result.status}…`
    );
  }

  throw new Error(lastError);
}

export async function chatJson<T>(params: {
  userPrompt: string;
  systemExtra?: string;
  temperature?: number;
}): Promise<T> {
  const system = [buildBrandSystemPrompt(), params.systemExtra]
    .filter(Boolean)
    .join("\n\n");

  const raw = await callOpenRouter({
    temperature: params.temperature,
    json: true,
    messages: [
      { role: "system", content: system },
      { role: "user", content: params.userPrompt },
    ],
  });

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(
      "La IA devolvió un formato inválido. Intenta generar de nuevo."
    );
  }
}
