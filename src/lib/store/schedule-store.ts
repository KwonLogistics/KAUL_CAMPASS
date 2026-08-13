/**
 * ⚠️ 소유: 순범 (리드). 동의·지수는 읽기/호출만. 이 파일을 직접 고치지 않는다.
 *
 * 세 사람이 만나는 접점 ① —
 *   순범: 「외부 오더 등록」이 파싱 결과를 addOrder() 로 밀어넣는다.
 *   지수: 스케줄 탭 주간 보기가 ofDate() / ofWeek() 로 읽는다.
 *   동의: 월간 보기가 countByDate() 로 읽는다.
 *
 * 주간과 월간이 각자 배열을 들고 있으면 외부 등록한 오더가 한쪽에만 뜬다.
 * 저장소는 여기 하나다.
 */

import type { SpotOrder } from "@/lib/types";

/** 캘린더에 실제로 꽂힌 한 건. 목록에 떠 있기만 한 오더(SpotOrder)와 구분한다. */
export interface ScheduledOrder {
  order: SpotOrder;
  /** "YYYY-MM-DD" — 상차일 기준. 캘린더가 이 값으로만 자리를 잡는다. */
  dateISO: string;
  /** 어디서 들어왔나. 외부 등록 건은 화면에서 따로 표시한다. */
  via: "kakao" | "external";
  addedAt: string;
}

export const SCHEDULE_STORAGE_KEY = "kt.schedule.v1";

export function addOrder(
  prev: ScheduledOrder[],
  next: ScheduledOrder,
): ScheduledOrder[] {
  // 같은 오더를 두 번 넣지 않는다
  if (prev.some((s) => s.order.id === next.order.id)) return prev;
  return [...prev, next].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
}

export function removeOrder(
  prev: ScheduledOrder[],
  orderId: string,
): ScheduledOrder[] {
  return prev.filter((s) => s.order.id !== orderId);
}

/** 지수 — 하루치 */
export function ofDate(all: ScheduledOrder[], dateISO: string): ScheduledOrder[] {
  return all.filter((s) => s.dateISO === dateISO);
}

/** 지수 — 주간 보기. startISO 부터 7일. */
export function ofWeek(all: ScheduledOrder[], startISO: string): ScheduledOrder[] {
  const start = new Date(startISO);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return all.filter((s) => {
    const d = new Date(s.dateISO);
    return d >= start && d < end;
  });
}

/** 동의 — 월간 보기. 날짜별 건수만 필요할 때. */
export function countByDate(all: ScheduledOrder[]): Record<string, number> {
  return all.reduce<Record<string, number>>((acc, s) => {
    acc[s.dateISO] = (acc[s.dateISO] ?? 0) + 1;
    return acc;
  }, {});
}
