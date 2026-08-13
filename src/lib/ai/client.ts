/**
 * ⚠️ 소유: 순범. Gemini 호출 래퍼 — 순범(오더 파싱)과 동의(리포트)가 같이 쓴다.
 *
 * 각자 fetch 를 따로 짜지 않는다. 모델명·에러 처리·JSON 스키마 강제를 한 곳에서 바꾸기 위해서다.
 *
 * 쓰는 쪽:
 *   const json = await callGemini({ system, user, schema });
 *
 * 스키마는 프롬프트가 아니라 responseSchema 로 넘어간다.
 * Gemini 는 OpenAPI 3.0 subset 이라 {"type":["string","null"]} 이 안 먹는다.
 * → {"type":"string","nullable":true} 로 쓴다.
 */

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

export interface CallOptions {
  system: string;
  parts: GeminiPart[];
  schema: Record<string, unknown>;
  /** 추출·변환은 0.1, 문장 생성은 비워둔다 */
  temperature?: number;
}

export class GeminiUnavailable extends Error {}

export async function callGemini<T>(opts: CallOptions): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    // 호출부가 잡아서 준비된 폴백으로 떨어뜨린다. 데모 중에 화면이 죽으면 안 된다.
    throw new GeminiUnavailable("GEMINI_API_KEY 없음");
  }

  const res = await fetch(`${ENDPOINT}/${MODEL}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: [{ role: "user", parts: opts.parts }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: opts.schema,
        ...(opts.temperature !== undefined
          ? { temperature: opts.temperature }
          : {}),
      },
    }),
  });

  if (!res.ok) {
    throw new GeminiUnavailable(`Gemini ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new GeminiUnavailable("빈 응답");
  return JSON.parse(text) as T;
}
