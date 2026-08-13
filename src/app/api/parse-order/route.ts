/**
 * ⚠️ 소유: 순범. 외부 오더 파싱 — 텍스트/이미지 → 오더 구조 + 조건.
 *
 * 이미지든 텍스트든 파서는 하나다. Gemini 가 멀티모달이라 이미지를 별도 OCR 단계로
 * 분리하지 않고 같은 스키마로 한 번에 받는다. 대신 remarksRaw 에 "읽어낸 원문"을
 * 그대로 담게 해서, 잘못 나왔을 때 OCR 이 틀렸는지 해석이 틀렸는지 화면에서 눈으로 가린다.
 *
 * 이 라우트는 인증이 없다. 배포 URL 을 아는 사람은 누구나 우리 키로 Gemini 를 호출할 수 있다 —
 * 해커톤 데모라 열어 두지만, 그래서 아래 두 가지는 반드시 건다:
 *   1. 요청 본문 크기 상한 (이미지 base64 가 무제한으로 들어오면 그대로 비용이다)
 *   2. 업스트림 에러 원문을 클라이언트로 넘기지 않는다 (내부 정보 노출)
 */

import { NextResponse } from "next/server";
import { callGemini, GeminiUnavailable } from "@/lib/ai/client";
import {
  PARSE_SCHEMA,
  buildParseSystemPrompt,
  type ParsedOrderDraft,
} from "@/lib/ai/parse-order-schema";
import { TODAY_ISO } from "@/data/mock-data";

/** 이미지 base64 포함. 5톤 트럭 기사 폰 사진 한 장이 base64 로 대략 3~5MB 다. */
const MAX_BODY_BYTES = 6 * 1024 * 1024;

const MOCK_DRAFT: ParsedOrderDraft = {
  shipper: "대성정밀",
  pickup: {
    sido: "경기", sigungu: "화성시", dong: "향남읍", addressDetail: "대성정밀 3번 게이트",
    dateExpr: "당상", dateISO: TODAY_ISO, time: "14:00",
    manual: false, forklift: true,
  },
  dropoff: {
    sido: "충북", sigungu: "청주시", dong: "오송읍", addressDetail: null,
    dateExpr: "당착", dateISO: TODAY_ISO, time: "17:00",
    manual: false, forklift: true,
  },
  vehicle: { ton: 5, body: "윙바디" },
  loadOption: "독차",
  fare: { total: 190000 },
  remarksRaw: "화성 향남 14시 상차, 청주 오송 17시 하차. 5톤 윙바디 독차. 당상당착. 19만. 지게차 상하차, 파렛트 12개.",
  conditions: [
    { type: "상하차방식", value: "지게차 상하차", evidence: "지게차 상하차", status: "명시" },
    { type: "적재형태", value: "파렛트 12개", evidence: "파렛트 12개", status: "명시" },
  ],
};

export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: "사진 용량이 너무 큽니다. 더 작게 잘라서 올려주세요." },
      { status: 413 },
    );
  }

  let body: { mock?: boolean; text?: string; imageBase64?: string };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { mock, text, imageBase64 } = body;

  if (!mock && !text?.trim() && !imageBase64) {
    return NextResponse.json(
      { ok: false, error: "붙여넣은 내용이 없습니다." },
      { status: 400 },
    );
  }

  // 목업 모드 — 네트워크가 죽어도 시연이 굴러가야 한다. 결과에 mocked 플래그를 같이 내려서
  // 화면이 "AI 가 읽은 것"인지 "미리 넣어둔 것"인지 반드시 구분해 표시하도록 한다.
  if (mock) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ ok: true, mocked: true, order: MOCK_DRAFT });
  }

  const parts = [];
  if (imageBase64) {
    const mimeType = imageBase64.match(/^data:(image\/[a-z+]+);base64,/i)?.[1];
    if (!mimeType) {
      return NextResponse.json(
        { ok: false, error: "이미지 형식을 읽을 수 없습니다." },
        { status: 400 },
      );
    }
    parts.push({
      inlineData: { mimeType, data: imageBase64.slice(imageBase64.indexOf(",") + 1) },
    });
    parts.push({ text: "이 이미지에 있는 화물 오더를 읽어 구조화하세요. remarksRaw 에는 이미지에서 읽어낸 문장을 그대로 옮기세요." });
  }
  if (text?.trim()) {
    parts.push({ text: `다음 오더 텍스트를 파싱하세요:\n${text.trim()}` });
  }

  try {
    const order = await callGemini<ParsedOrderDraft>({
      system: buildParseSystemPrompt(TODAY_ISO),
      parts,
      schema: PARSE_SCHEMA,
      temperature: 0.1,
    });
    return NextResponse.json({ ok: true, mocked: false, order });
  } catch (error) {
    // 상세는 서버 로그에만. Gemini 응답 본문에는 우리 프로젝트 정보가 섞여 나올 수 있다.
    console.error("[parse-order]", error);
    const message =
      error instanceof GeminiUnavailable
        ? "AI 인식에 실패했습니다. 다시 시도하거나 목업 모드로 진행하세요."
        : "오더를 읽는 중 문제가 발생했습니다.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
