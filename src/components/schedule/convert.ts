/**
 * ⚠️ 소유: 지수. SpotOrder → ScheduleItem 변환.
 *
 * 목표: SpotOrder → ScheduleItem → 기존 /schedule 타임라인/리스트.
 * SpotOrder는 여기서 읽기만 한다 — 절대 수정하지 않는다.
 */

import type { SpotOrder } from "@/lib/types";
import type { ScheduleItem } from "./types";

export function convertSpotOrderToScheduleItem(
  order: SpotOrder,
  overrides?: Partial<ScheduleItem>,
): ScheduleItem {
  return {
    id: order.id,
    orderId: order.id,
    order,

    date: order.pickup.dateISO,

    loadingStart: order.pickup.time,
    loadingEnd: null,
    drivingStart: null,
    drivingEnd: null,
    unloadingStart: order.dropoff.time,
    unloadingEnd: null,

    status: "scheduled",

    actualLoadingWaitMin: null,
    actualUnloadingWaitMin: null,
    actualFuelCost: null,
    actualTollCost: null,

    ...overrides,
  };
}
