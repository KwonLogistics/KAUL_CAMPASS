export interface AutoDispatchOptions {
  pickupDate: string; // e.g. "2026-08-14"
  pickupTime?: string; // e.g. "14:00"
  dropoffDate?: string; // e.g. "2026-08-14"
  dropoffTime?: string; // e.g. "17:00"
  pickupRegion: string; // e.g. "인천 남동구"
  dropoffRegion: string; // e.g. "충북 청주"
  ton?: string; // e.g. "5톤"
  body?: string; // e.g. "카고"
  fare?: number; // e.g. 250000
  item?: string; // e.g. "자동차부품"
  distanceKm?: number; // e.g. 120
}

/**
 * AI 추천 스케줄(빈 칸 채우기) 시, 팀원이 UI에서 버튼을 눌렀을 때
 * 실제 화물 오더(외부 오더/카카오 오더)처럼 보이는 텍스트를 생성해주는 로직.
 * 이 텍스트를 ExternalOrderSheet의 raw 텍스트로 넘기거나,
 * 곧바로 parse-order API에 태워서 자동 배차를 시뮬레이션 할 수 있습니다.
 */
export function generateAutoDispatchText(options: AutoDispatchOptions): string {
  const {
    pickupDate,
    pickupTime = "시간협의",
    dropoffDate = pickupDate,
    dropoffTime = "당일착",
    pickupRegion,
    dropoffRegion,
    ton = "5톤",
    body = "카고/윙바디",
    fare = Math.floor((options.distanceKm || 100) * 1500 / 10000) * 10000 + 50000,
    item = "일반공산품",
  } = options;

  // 날짜 포맷팅 (YYYY-MM-DD -> M/D)
  const pDateParts = pickupDate.split("-");
  const pMonthDay = pDateParts.length === 3 ? `${parseInt(pDateParts[1])}/${parseInt(pDateParts[2])}` : pickupDate;
  
  const dDateParts = dropoffDate.split("-");
  const dMonthDay = dDateParts.length === 3 ? `${parseInt(dDateParts[1])}/${parseInt(dDateParts[2])}` : dropoffDate;

  // 실제 밴드나 화물망에 올라오는 전형적인 오더 양식 텍스트 생성
  const text = `
[카카오 T 트럭커 - AI 맞춤 자동배차 추천]
상차: ${pMonthDay} ${pickupTime} | ${pickupRegion}
하차: ${dMonthDay} ${dropoffTime} | ${dropoffRegion}
차량: ${ton} ${body}
품목: ${item}
운임: ${fare.toLocaleString()}원 (수수료 포함/빠른지급)
결제: 도착지불
특이사항: 
- AI가 기사님의 스케줄 빈 공간에 맞춰 자동 생성한 추천 오더입니다.
- 상하차지 지게차 작업 가능
- 연락처: 010-0000-0000 (배차 담당자)
  `.trim();

  return text;
}
