/**
 * ⚠️ 소유: 순범. 외부 오더 파싱 — 텍스트/이미지 → 오더 구조 + 조건.
 *
 * 이미지는 먼저 원문 텍스트로만 옮기고(P1), 그 텍스트를 구조로 바꾼다(P2).
 * 합치면 틀렸을 때 OCR 오류인지 해석 오류인지 말할 수 없다. 나누면 원문을 화면에 띄워
 * 기사가 눈으로 확인할 수 있다. 그리고 텍스트 붙여넣기는 P2로 바로 들어간다 — 파서는 하나다.
 */

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  // TODO(순범): P1(이미지→원문) · P2(원문→구조+조건) 연결, evidence 부분문자열 검증
  return NextResponse.json({ ok: false, todo: "parse-order", received: !!body });
}
