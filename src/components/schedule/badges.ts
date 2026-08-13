/**
 * ⚠️ 소유: 지수. SpotOrder → 카드용 배지 문자열.
 *
 * SpotOrder에 실제로 있는 값에서만 배지를 만든다 — 데이터에 없는 조건은 지어내지 않는다.
 * SpotOrder/mock-data는 여기서 읽기만 한다.
 */

import type { SpotOrder } from "@/lib/types";

/** 1순위: 상단 메타 배지 — 오더 출처 · 차량 요건 · 적재 형태 (전부 SpotOrder에 항상 존재) */
export function getMetaBadges(order: SpotOrder): string[] {
  return [
    order.source === "external" ? "외부 오더" : "카카오 T",
    `${order.vehicle.ton}톤 ${order.vehicle.body}`,
    order.loadOption,
  ];
}

function formatWon(amount: number): string {
  return `${amount.toLocaleString()}원`;
}

const DATE_BUCKET_LABEL: Partial<Record<string, string>> = {
  "D+1": "익일 하차",
  "D+2+": "D+2 이상 하차",
};

/**
 * 3순위: 작업 조건 스티커.
 * 지게차/수작업 여부(Waypoint) → 하차일 버킷 → 정산방식+운임 → conditions(상하차방식 제외, 이미 위에서 다룸) 순.
 */
export function getConditionBadges(order: SpotOrder): string[] {
  const badges: string[] = [];

  const forkliftSides = [
    order.pickup.forklift ? "상차" : null,
    order.dropoff.forklift ? "하차" : null,
  ].filter((v): v is string => v !== null);
  const manualSides = [
    order.pickup.manual ? "상차" : null,
    order.dropoff.manual ? "하차" : null,
  ].filter((v): v is string => v !== null);

  if (forkliftSides.length === 2) badges.push("지게차 상하차");
  else if (forkliftSides.length === 1) badges.push(`지게차 ${forkliftSides[0]}`);
  else if (manualSides.length === 2) badges.push("수작업 상하차");
  else if (manualSides.length === 1) badges.push(`수작업 ${manualSides[0]}`);
  else badges.push("수작업 없음");

  const dateLabel = DATE_BUCKET_LABEL[order.dropoff.date];
  if (dateLabel) badges.push(dateLabel);

  badges.push(`${order.fare.settle} ${formatWon(order.fare.total)}`);

  order.conditions
    .filter((c) => c.type !== "상하차방식")
    .forEach((c) => badges.push(c.value));

  return badges;
}
