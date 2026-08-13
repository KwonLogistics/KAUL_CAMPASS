/**
 * ⚠️ 소유: 지수. SpotOrder/PastTrip/FixedSchedule → ScheduleItem 변환.
 *
 * 목표: 기존 목업 데이터 세 종류 → ScheduleItem → 기존 /schedule 타임라인/리스트.
 * 원본은 여기서 읽기만 한다 — 절대 수정하지 않는다.
 */

import type { SpotOrder, PastTrip, FixedSchedule } from "@/lib/types";
import type { ScheduleItem, ScheduleItemStatus } from "./types";

/**
 * 데모 기준 시점 — 고정값. 실제 시계를 읽지 않는다.
 * 이 값을 기준으로 오늘(D+0) 스케줄만 상차/하차 시각과 비교해 completed/in_progress를 가른다.
 */
export const DEMO_NOW_DATE_ISO = "2026-08-13";
export const DEMO_NOW_TIME = "10:00";

/**
 * 상차/하차 날짜·시간만으로 상태를 파생한다 — 임의 판단 없음. 세 컨버터가 전부 이걸 쓴다.
 *   - 상차일이 데모 기준일보다 미래 → scheduled
 *   - 상차일이 데모 기준일보다 과거 → completed (하차까지 이미 다 지난 날 — pastTrips가 전부 여기 해당)
 *   - 상차일 == 데모 기준일: 상차시간 > 기준시각 → scheduled
 *                            하차시간 <= 기준시각 → completed
 *                            그 사이(상차 <= 기준시각 < 하차) → in_progress
 */
function deriveStatusFromDateTime(
  pickupDateISO: string,
  pickupTime: string,
  dropoffDateISO: string,
  dropoffTime: string,
): ScheduleItemStatus {
  if (pickupDateISO > DEMO_NOW_DATE_ISO) return "scheduled";
  if (pickupDateISO < DEMO_NOW_DATE_ISO) return "completed";

  // 상차일 == 데모 기준일
  if (pickupTime > DEMO_NOW_TIME) return "scheduled";

  const dropoffPassed =
    dropoffDateISO < DEMO_NOW_DATE_ISO ||
    (dropoffDateISO === DEMO_NOW_DATE_ISO && dropoffTime <= DEMO_NOW_TIME);

  return dropoffPassed ? "completed" : "in_progress";
}

export function convertSpotOrderToScheduleItem(
  order: SpotOrder,
  overrides?: Partial<ScheduleItem>,
): ScheduleItem {
  return {
    id: order.id,
    orderId: order.id,
    order,
    orderKind: "spot",

    date: order.pickup.dateISO,

    loadingStart: order.pickup.time,
    loadingEnd: null,
    drivingStart: null,
    drivingEnd: null,
    unloadingStart: order.dropoff.time,
    unloadingEnd: null,

    status: deriveStatusFromDateTime(
      order.pickup.dateISO,
      order.pickup.time,
      order.dropoff.dateISO,
      order.dropoff.time,
    ),

    actualLoadingWaitMin: null,
    actualUnloadingWaitMin: null,
    actualFuelCost: null,
    actualTollCost: null,

    ...overrides,
  };
}

/**
 * PastTrip → ScheduleItem. pastTrips는 전부 데모 기준일(2026-08-13)보다 이전 날짜라
 * deriveStatusFromDateTime을 그대로 태워도 항상 completed로 나온다 — 하드코딩이 아니라
 * "지난 운행 기록"이라는 데이터셋의 정의 자체에서 자연히 나오는 결과다.
 *
 * plannedDropoff가 아니라 actualDropoff(실제 하차)를 unloadingStart로 쓴다 — 실제로 있었던 값이라서.
 * waitMinutes는 상차/하차 중 어느 쪽 대기인지 원본에 구분이 없어 actualLoadingWaitMin/
 * actualUnloadingWaitMin 어느 쪽에도 억지로 넣지 않는다 — 상세 화면에서 원본 값 그대로 보여준다.
 */
export function convertPastTripToScheduleItem(
  trip: PastTrip,
  overrides?: Partial<ScheduleItem>,
): ScheduleItem {
  return {
    id: trip.id,
    orderId: trip.id,
    order: trip,
    orderKind: "past",

    date: trip.dateISO,

    loadingStart: trip.plannedPickup,
    loadingEnd: null,
    drivingStart: null,
    drivingEnd: null,
    unloadingStart: trip.actualDropoff,
    unloadingEnd: null,

    status: deriveStatusFromDateTime(trip.dateISO, trip.plannedPickup, trip.dateISO, trip.actualDropoff),

    actualLoadingWaitMin: null,
    actualUnloadingWaitMin: null,
    actualFuelCost: null,
    actualTollCost: null,

    ...overrides,
  };
}

/**
 * FixedSchedule(반복 템플릿) → 특정 발생일 하나의 ScheduleItem.
 * FixedSchedule 자체엔 날짜가 없어서(weekdays로 매주 반복) 호출부(fixed-occurrences.ts)가
 * validFrom~validUntil·weekdays로 걸러낸 실제 발생일을 넘겨준다 — 여기서 날짜를 만들어내지 않는다.
 */
export function convertFixedScheduleToScheduleItem(
  schedule: FixedSchedule,
  occurrenceDateISO: string,
  overrides?: Partial<ScheduleItem>,
): ScheduleItem {
  return {
    id: `${schedule.id}-${occurrenceDateISO}`,
    orderId: schedule.id,
    order: schedule,
    orderKind: "fixed",

    date: occurrenceDateISO,

    loadingStart: schedule.pickupTime,
    loadingEnd: null,
    drivingStart: null,
    drivingEnd: null,
    unloadingStart: schedule.dropoffTime,
    unloadingEnd: null,

    status: deriveStatusFromDateTime(occurrenceDateISO, schedule.pickupTime, occurrenceDateISO, schedule.dropoffTime),

    actualLoadingWaitMin: null,
    actualUnloadingWaitMin: null,
    actualFuelCost: null,
    actualTollCost: null,

    ...overrides,
  };
}
