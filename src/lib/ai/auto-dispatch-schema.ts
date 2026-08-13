import { SIDO_ENUM } from "./parse-order-schema";

export const AUTO_DISPATCH_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    pickupSido: { type: "string", enum: ["전체", ...SIDO_ENUM] },
    pickupSigungu: { type: "string" },
    pickupRadius: { type: "string", enum: ["지역기준", "내위치 기준"] },
    dropoffSido: { type: "string", enum: ["전체", ...SIDO_ENUM] },
    dropoffSigungu: { type: "string" },
    minFare: { type: "string" },
    pickupDate: { type: "string", enum: ["전체", "당일", "내일", "모레이후"] },
    dropoffDate: { type: "string", enum: ["전체", "당일", "내일", "모레이후"] },
    fareType: { type: "string", enum: ["전체", "선착불", "인수증", "카드"] },
    loadOption: { type: "string", enum: ["전체", "독차", "혼적"] },
    bodyType: { type: "string", enum: ["전체", "카고", "윙바디", "탑차", "호루", "냉동", "냉장"] },
    ton: { type: "string", enum: ["전체", "1톤", "1.4톤", "2.5톤", "3.5톤", "5톤", "11톤", "25톤"] },
  },
  required: [
    "pickupSido", "pickupSigungu", "pickupRadius",
    "dropoffSido", "dropoffSigungu", "minFare",
    "pickupDate", "dropoffDate", "fareType",
    "loadOption", "bodyType", "ton"
  ],
};

export interface AutoDispatchContext {
  currentTime: string;
  currentLocation: string;
  dayStart: string; // 선호 출발지
  dayEnd: string; // 선호 복귀점
}

export function buildAutoDispatchSystemPrompt(ctx: AutoDispatchContext): string {
  return `당신은 화물 기사들의 오더 검색 조건을 설정해주는 AI 비서입니다.
사용자가 자연어로 배차 조건을 입력하면, 아래의 기사님 현재 상황을 바탕으로 의도를 파악하여 정해진 설정 스키마에 맞는 JSON으로 반환하세요.

[기사님 현재 상황]
- 현재 시간: ${ctx.currentTime}
- 현재 위치: ${ctx.currentLocation}
- 선호 출발지(차고지): ${ctx.dayStart || "미설정"}
- 선호 복귀점(퇴근지): ${ctx.dayEnd || "미설정"}

규칙:
1. 사용자가 "퇴근", "집", "복귀" 등을 언급하면 하차지를 '선호 복귀점'으로 설정하세요.
2. 사용자가 "가까운", "여기서", "내 주변" 등을 언급하면 상차지를 '현재 위치'로 설정하세요.
3. 명시되지 않은 조건은 "전체" 또는 기본값으로 설정하세요.
4. 최소운임이 언급된 경우 "XXX원" 형태로 포맷팅하세요 (예: 250000 -> "250,000원"). 언급이 없다면 "최소운임" 텍스트를 유지하세요.
5. 구/군이 언급되지 않으면 "전체"를 넣으세요.
6. "오늘", "내일" 등 시간에 관련된 모호한 단어는 '현재 시간'을 기준으로 "당일", "내일", "모레이후" 중 적절한 값으로 변환하세요.
7. 내 위치가 필요하다고 판단되면 지역기준을 "내위치 기준"으로, 아니면 "지역기준"을 넣으세요.
`;
}
