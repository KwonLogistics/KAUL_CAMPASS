import { NextResponse } from "next/server";
import { callGemini, GeminiUnavailable } from "@/lib/ai/client";
import { AUTO_DISPATCH_SCHEMA, buildAutoDispatchSystemPrompt } from "@/lib/ai/auto-dispatch-schema";

export async function POST(req: Request) {
  let body: { 
    prompt?: string; 
    mock?: boolean;
    context?: {
      currentTime: string;
      currentLocation: string;
      dayStart: string;
      dayEnd: string;
    };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { prompt, mock, context } = body;

  if (mock) {
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({
      ok: true,
      condition: {
        pickupSido: "경기",
        pickupSigungu: "용인시",
        pickupRadius: "시/군/구내",
        dropoffSido: "부산",
        dropoffSigungu: "전체",
        minFare: "300,000원",
        pickupDate: "내일",
        dropoffDate: "모레이후",
        fareType: "선착불",
        loadOption: "독차",
        bodyType: "윙바디",
        ton: "5톤",
      },
    });
  }

  if (!prompt?.trim()) {
    return NextResponse.json(
      { ok: false, error: "명령이 비어 있습니다." },
      { status: 400 }
    );
  }

  try {
    const ctx = context || {
      currentTime: new Date().toLocaleString(),
      currentLocation: "미상",
      dayStart: "",
      dayEnd: "",
    };

    const condition = await callGemini({
      system: buildAutoDispatchSystemPrompt(ctx),
      parts: [{ text: `다음 텍스트를 분석해서 조건을 설정해주세요: ${prompt}` }],
      schema: AUTO_DISPATCH_SCHEMA,
      temperature: 0.1,
    });
    return NextResponse.json({ ok: true, condition });
  } catch (error) {
    console.error("[auto-dispatch-ai]", error);
    const message =
      error instanceof GeminiUnavailable
        ? "AI 인식에 실패했습니다. 다시 시도하거나 목업 모드로 진행하세요."
        : "조건 분석 중 문제가 발생했습니다.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
