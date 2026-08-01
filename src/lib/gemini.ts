/* ============================================================
 * gemini.ts — client server-side untuk Gemini API.
 * API key TIDAK PERNAH dikirim ke client (hanya dipakai di route).
 * Model: gemini-3.6-flash (terverifikasi tersedia di akun)
 * ============================================================ */

const MODEL = "gemini-3.6-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export type GeminiMode = "topology" | "config" | "chat";

/* Temperature per mode (bahan §7) */
const TEMPERATURE: Record<GeminiMode, number> = {
  topology: 0.4,
  config: 0.2,
  chat: 0.7,
};

export class GeminiError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError("GEMINI_API_KEY belum dikonfigurasi di server.", 500);
  return key;
}

type GeminiPart = { text: string };

/**
 * Panggil generateContent dengan system prompt + history + user prompt.
 * - mode "topology"/"config" → responseMimeType application/json
 * - mode "chat" → text/plain
 */
export async function geminiGenerate(opts: {
  mode: GeminiMode;
  systemPrompt: string;
  userPrompt: string;
  /** Riwayat chat opsional: array [{role:'user'|'model', text}] */
  history?: { role: "user" | "model"; text: string }[];
  /** JSON structure tambahan untuk dimasukkan ke user prompt (mode config) */
  extra?: string;
}): Promise<{ text: string; json?: unknown }> {
  const { mode, systemPrompt, userPrompt, history = [], extra } = opts;
  const isJson = mode !== "chat";

  const contents: { role: string; parts: GeminiPart[] }[] = history.map((h) => ({
    role: h.role === "user" ? "user" : "model",
    parts: [{ text: h.text }],
  }));
  contents.push({ role: "user", parts: [{ text: userPrompt }] });

  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      temperature: TEMPERATURE[mode],
      ...(isJson ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (extra) {
    body.contents = [
      ...history.map((h) => ({ role: h.role === "user" ? "user" : "model", parts: [{ text: h.text }] })),
      { role: "user", parts: [{ text: `[CONTEXT TOPOLOGI]\n${extra}\n\n[TUGAS]\n${userPrompt}` }] },
    ];
  }

  const res = await fetch(`${API_BASE}/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey(),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new GeminiError(
      `Gemini API ${res.status}: ${errText.slice(0, 300)}`,
      res.status === 429 ? 429 : 502
    );
  }

  const data = await res.json();
  const rawText: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    data?.candidates?.[0]?.content?.parts?.map((p: GeminiPart) => p.text).join("") ??
    "";

  if (!rawText.trim()) {
    throw new GeminiError("Gemini mengembalikan respons kosong.", 502);
  }

  if (isJson) {
    let parsed: unknown;
    try {
      // Hapus code fence jika model bandel memakainya
      const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      throw new GeminiError(`Gemini mengembalikan JSON tidak valid: ${rawText.slice(0, 200)}`, 502);
    }
    return { text: rawText, json: parsed };
  }

  return { text: rawText };
}
