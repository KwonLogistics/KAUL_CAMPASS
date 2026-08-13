/**
 * ⚠️ 소유: 지수. src/components/schedule/ 전용 타입.
 *
 * SpotOrder/PastTrip(공통 계약, @/lib/types — 순범 소유)는 여기서 절대 다시 정의하지 않는다.
 * ScheduleItem은 원본을 참조(order)로만 들고, 오더 자체 정보는 중복 저장하지 않는다.
 *
 * order는 SpotOrder(스팟 후보) · PastTrip(지난 운행 기록) · FixedSchedule(고정 반복 계약)
 * 셋 중 하나다. 셋 다 필드 모양이 서로 달라서(예: PastTrip엔 pickup/dropoff Waypoint가 없고
 * FixedSchedule은 fare가 객체가 아니라 숫자다) 억지로 한 모양에 맞춰 값을 지어내는 대신,
 * orderKind로 구분해서 원본을 그대로 들고 있는다.
 *
 * ScheduleItem = 캘린더에 배치하기 위한 스케줄 정보 + 실제 운행 결과.
 * 계획(loading/driving/unloading Start·End)은 원본에서 파생 가능한 만큼만 채우고,
 * 모르는 값은 지어내지 않고 null로 둔다 (TEAM.md 규칙 3: "못 읽은 값은 비운다").
 */

import type { SpotOrder, PastTrip, FixedSchedule } from "@/lib/types";

export type ScheduleItemStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface ScheduleItem {
  id: string;
  /** SpotOrder.id/PastTrip.id/FixedSchedule.id와 동일(고정 스케줄은 발생일이 붙어 id 자체는 달라짐). order를 못 찾을 때도 참조는 남기기 위해 따로 둔다 */
  orderId: string;
  order: SpotOrder | PastTrip | FixedSchedule;
  /** order가 셋 중 뭔지 — 화면에서 매번 필드 존재 여부로 추측하지 않도록 명시 */
  orderKind: "spot" | "past" | "fixed";

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
