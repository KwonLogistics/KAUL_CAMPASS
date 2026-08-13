import type { AutoDispatchCondition } from "@/lib/types";
import type { AutoDispatchOptions } from "./generate-dispatch-text";

/**
 * AI 추천 기능 연동용 유틸리티.
 * 주어진 오더 정보(options)를 바탕으로, "원터치 배차 검색 설정"에 추가될 수 있는
 * 형태의 설정 객체(AutoDispatchCondition)를 생성하여 반환합니다.
 */
export function generateAutoDispatchCondition(
  options: AutoDispatchOptions
): AutoDispatchCondition {
  // 예: "인천 남동구" -> ["인천", "남동구"]
  const pRegion = options.pickupRegion.split(" ");
  const dRegion = options.dropoffRegion.split(" ");

  const fare = Math.floor((options.distanceKm || 100) * 1500 / 10000) * 10000 + 50000;

  return {
    id: `auto-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    enabled: true,
    pickupSido: pRegion[0] || "전체",
    pickupSigungu: pRegion[1] || "전체",
    pickupRadius: "시/군/구내",
    dropoffSido: dRegion[0] || "전체",
    dropoffSigungu: dRegion[1] || "전체",
    minFare: fare.toString(),
    pickupDate: options.pickupDate,
    dropoffDate: options.dropoffDate || options.pickupDate,
    fareType: "전체",
    loadOption: "전체",
    bodyType: options.body || "전체",
    ton: options.ton || "전체",
  };
}
