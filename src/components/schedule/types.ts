/**
 * ⚠️ 소유: 지수. src/components/schedule/ 전용 타입.
 *
 * SpotOrder(공통 계약, @/lib/types — 순범 소유)는 여기서 절대 다시 정의하지 않는다.
 * ScheduleItem은 SpotOrder를 참조(order)로만 들고, 오더 자체 정보는 중복 저장하지 않는다.
 *
 * ScheduleItem = 캘린더에 배치하기 위한 스케줄 정보 + 실제 운행 결과.
 * 계획(loading/driving/unloading Start·End)은 SpotOrder에서 파생 가능한 만큼만 채우고,
 * 모르는 값은 지어내지 않고 null로 둔다 (TEAM.md 규칙 3: "못 읽은 값은 비운다").
 */

import type { SpotOrder } from "@/lib/types";

export type ScheduleItemStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface ScheduleItem {
  id: string;
  /** SpotOrder.id와 동일. order를 못 찾을 때도 참조는 남기기 위해 따로 둔다 */
  orderId: string;
  order: SpotOrder;

  /** 상차일 기준 "YYYY-MM-DD". 캘린더가 이 값으로만 자리를 잡는다 */
  date: string;

  /** 계획 — "HH:mm". SpotOrder에서 파생 안 되는 값은 null */
  loadingStart: string | null;
  loadingEnd: string | null;
  drivingStart: string | null;
  drivingEnd: string | null;
  unloadingStart: string | null;
  unloadingEnd: string | null;

  status: ScheduleItemStatus;

  /** 실제 운행 결과 — 완료 전까지는 전부 null */
  actualLoadingWaitMin: number | null;
  actualUnloadingWaitMin: number | null;
  actualFuelCost: number | null;
  actualTollCost: number | null;
}
