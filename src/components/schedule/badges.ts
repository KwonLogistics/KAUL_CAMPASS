/**
 * ⚠️ 소유: 지수. ScheduleItem(SpotOrder/PastTrip/FixedSchedule) → 화면 표시용 값.
 *
 * 원본에 실제로 있는 값에서만 뽑는다 — 없는 값은 지어내지 않는다.
 * SpotOrder/PastTrip/FixedSchedule/mock-data는 여기서 읽기만 한다.
 */

import type { SpotOrder, PastTrip, FixedSchedule } from "@/lib/types";
import type { ScheduleItem } from "./types";

function formatWon(amount: number): string {
  return `${amount.toLocaleString()}원`;
}

/** 출발지 → 도착지. SpotOrder는 Waypoint(sido+sigungu), PastTrip/FixedSchedule은 route 문자열. */
export function getRouteLabel(item: ScheduleItem): string {
  if (item.orderKind === "spot") {
    const o = item.order as SpotOrder;
    return `${o.pickup.sido} ${o.pickup.sigungu} → ${o.dropoff.sido} ${o.dropoff.sigungu}`;
  }
  const o = item.order as PastTrip | FixedSchedule;
  return `${o.route.from} → ${o.route.to}`;
}

/** 운임 총액. FixedSchedule만 fare가 객체가 아니라 숫자라 따로 분기한다. */
export function getFareTotal(item: ScheduleItem): number {
  if (item.orderKind === "fixed") return (item.order as FixedSchedule).fare;
  return (item.order as SpotOrder | PastTrip).fare.total;
}

/** 실차 거리(km). SpotOrder/PastTrip은 distance.haulKm, FixedSchedule은 haulKm이 최상위 필드. */
export function getHaulKm(item: ScheduleItem): number {
  if (item.orderKind === "fixed") return (item.order as FixedSchedule).haulKm;
  return (item.order as SpotOrder | PastTrip).distance.haulKm;
}

/** 1순위: 상단 메타 배지 — 오더 출처 · 차량 요건 · (SpotOrder면) 적재 형태 */
export function getMetaBadges(item: ScheduleItem): string[] {
  if (item.orderKind === "spot") {
    const o = item.order as SpotOrder;
    return [
      o.source === "external" ? "외부 오더" : "카카오 T",
      `${o.vehicle.ton}톤 ${o.vehicle.body}`,
      o.loadOption,
    ];
  }
  if (item.orderKind === "past") {
    const o = item.order as PastTrip;
    return [
      o.source === "external" ? "외부 오더" : "카카오 T",
      `${o.vehicle.ton}톤 ${o.vehicle.body}`,
      "지난 운행",
    ];
  }
  // fixed — 출처 개념이 없다(고정 계약이라 카카오/외부 어느 쪽도 아님). 지어내지 않고 뺀다.
  const o = item.order as FixedSchedule;
  return [`${o.vehicle.ton}톤 ${o.vehicle.body}`, "고정 스케줄"];
}

const DATE_BUCKET_LABEL: Partial<Record<string, string>> = {
  "D+1": "익일 하차",
  "D+2+": "D+2 이상 하차",
};

function getSpotOrderConditionBadges(order: SpotOrder): string[] {
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

function getPastTripConditionBadges(trip: PastTrip): string[] {
  const badges: string[] = [];

  badges.push(trip.manualWork ? "수작업 발생" : "수작업 없음");
  if (trip.conditionMismatch) badges.push("현장 조건 불일치");
  badges.push(`${trip.fare.settle} ${formatWon(trip.fare.total)}`);
  if (trip.waitMinutes > 0) badges.push(`실제 대기 ${trip.waitMinutes}분`);

  return badges;
}

function getFixedScheduleConditionBadges(schedule: FixedSchedule): string[] {
  return [schedule.pattern, formatWon(schedule.fare)];
}

/** 3순위: 작업 조건 스티커. orderKind별로 원본에 있는 값만 뽑는다. */
export function getConditionBadges(item: ScheduleItem): string[] {
  if (item.orderKind === "spot") return getSpotOrderConditionBadges(item.order as SpotOrder);
  if (item.orderKind === "past") return getPastTripConditionBadges(item.order as PastTrip);
  return getFixedScheduleConditionBadges(item.order as FixedSchedule);
}
