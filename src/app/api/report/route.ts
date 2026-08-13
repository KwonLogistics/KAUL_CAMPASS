/**
 * ⚠️ 소유: 동의. AI 리포트 — 과거 운행 집계 → 운행 구간(루틴) 추천.
 *
 * 입력은 기사 본인의 과거 운행 기록뿐이다. 남의 데이터가 들어가지 않는다.
 * 그래서 "본인 과거와만 비교한다"가 구조적으로 지켜진다.
 *
 * 출력에 넣지 않는 것:
 *   - 상위 몇 % 같은 순위 (합성 순위는 근거가 없다)
 *   - 피로도 점수 (생체 데이터가 없다)
 *   - AI가 만든 숫자 (숫자는 전부 엔진 산출값을 그대로 옮긴다)
 */

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  // TODO(동의): 과거 운행 집계 → Gemini 추천 문장 → 숫자 검증 후 반환
  return NextResponse.json({ ok: false, todo: "report", received: !!body });
}
