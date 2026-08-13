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

/**
 * 기본 모델 = flash-lite. 해커톤에서 필요한 건 최고 품질이 아니라
 * "심사 중에 429 안 뜨고 즉시 응답"이다 — 무료 티어 기준 RPM·RPD가 가장 넉넉하고
 * 지연이 가장 짧은 계열이다. 멀티모달(이미지)·responseSchema 모두 지원한다.
 * 사진 OCR 정확도가 아쉬우면 .env.local 에서 GEMINI_MODEL=gemini-3.6-flash 로만 바꾼다.
 */
const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";
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

  // 키는 쿼리스트링(?key=)이 아니라 헤더로 보낸다 — URL 은 프록시·액세스 로그·에러 메시지에
  // 그대로 남는다. 같은 엔드포인트, 인증 방식만 다르다.
  const res = await fetch(`${ENDPOINT}/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
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
  // parts[0] 을 그냥 집지 않는다 — 3.x 계열은 사고 과정(thought) 파트를 앞에 끼워 넣을 수 있다.
  // 실제 응답은 thought 가 아닌 첫 text 파트다.
  const parts: Array<{ text?: string; thought?: boolean }> =
    data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.find((p) => !p.thought && typeof p.text === "string")?.text;
  if (!text) throw new GeminiUnavailable("빈 응답");

  try {
    return JSON.parse(text) as T;
  } catch {
    // responseSchema 를 걸었는데도 JSON 이 아니면 모델이 잘린 것이다(대개 토큰 상한).
    throw new GeminiUnavailable("JSON 파싱 실패");
  }
}
