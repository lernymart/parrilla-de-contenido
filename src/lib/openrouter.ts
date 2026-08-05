import { OPENROUTER_MODEL, buildBrandSystemPrompt } from "../../config/brand-context";

/**
 * Cliente OpenRouter (API compatible OpenAI).
 * Solo usar desde API routes / server — nunca desde el cliente.
 */

async function callOpenRouter(params: {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  temperature?: number;
  json?: boolean;
}): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error(
      "Falta OPENROUTER_API_KEY en .env.local. Pídesela al equipo técnico."
    );
  }

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
    console.error("OpenRouter error:", res.status, detail);
    throw new Error(
      "No pudimos conectar con la IA. Revisa la clave de OpenRouter o intenta de nuevo en unos minutos."
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) {
    throw new Error("La IA no devolvió contenido. Intenta de nuevo.");
  }
  return raw;
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
