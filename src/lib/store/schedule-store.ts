/**
 * ⚠️ 소유: 순범 (리드). 동의·지수는 읽기/추출만 하고 파일을 직접 고치지 않는다.
 *
 * 세 사람이 만나는 접점 —
 *   순범: 외부 오더 등록이 파싱 결과를 addOrder() 로 밀어넣는다.
 *   지수: 스케줄 주간 보기가 ofDate() / ofWeek() 로 읽는다.
 *   동의: 월간 보기가 countByDate() 로 읽는다.
 *
 * 주간·월간을 각자 배열로 들고 있으면, 새 등록 시 오더가 한쪽에만 뜬다.
 * 저장소를 여기 하나로 통일한다.
 */

import type { SpotOrder } from "@/lib/types";

/** 정산 및 피드백 관련 데이터 구조 */
export interface SettlementData {
  /** 정산(입금) 완료 여부 */
  isCompleted: boolean;
  /** 상하차 작업 내용이 사전에 고지된 내용과 일치했는지 여부 */
  workMatched: boolean;
  /** 이 화주의 오더를 다시 보지 않음 (관심 없음) */
  notInterested: boolean;
  /** 카카오: 신고 내용 / 외부: 기사 개인 화주 메모 */
  memo: string;
}

/** 캘린더에 실제로 꽂힌 내 운송 목록. 출처(via)로 카카오 오더와 외부 오더를 구분한다. */
export interface ScheduledOrder {
  order: SpotOrder;
  /** "YYYY-MM-DD" 상하차일 기준. 캘린더는 이 값으로만 렌더링한다. */
  dateISO: string;
  /** 어디서 들어왔나. 스케줄 목록 카드 화면에서 로고 표시용. */
  via: "kakao" | "external";
  addedAt: string;
  /** 정산 및 피드백 상태 (옵션) */
  settlement?: SettlementData;
}

export const SCHEDULE_STORAGE_KEY = "kt.schedule.v1";

export function addOrder(
  prev: ScheduledOrder[],
  next: ScheduledOrder,
): ScheduledOrder[] {
  // 같은 아이디 오더가 이미 있으면 무시
  if (prev.some((s) => s.order.id === next.order.id)) return prev;
  return [...prev, next].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
}

export function updateOrder(
  prev: ScheduledOrder[],
  orderId: string,
  patch: Partial<ScheduledOrder>,
): ScheduledOrder[] {
  return prev.map((s) => (s.order.id === orderId ? { ...s, ...patch } : s));
}

export function removeOrder(
  prev: ScheduledOrder[],
  orderId: string,
): ScheduledOrder[] {
  return prev.filter((s) => s.order.id !== orderId);
}

/** 지수의 일별 스케줄 */
export function ofDate(all: ScheduledOrder[], dateISO: string): ScheduledOrder[] {
  return all.filter((s) => s.dateISO === dateISO);
}

/** 지수의 주간 보기. startISO 부터 7일 */
export function ofWeek(all: ScheduledOrder[], startISO: string): ScheduledOrder[] {
  const start = new Date(startISO);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return all.filter((s) => {
    const d = new Date(s.dateISO);
    return d >= start && d < end;
  });
}

/** 동의의 월간 보기. 날짜별 건수만 리턴 */
export function countByDate(all: ScheduledOrder[]): Record<string, number> {
  return all.reduce<Record<string, number>>((acc, s) => {
    acc[s.dateISO] = (acc[s.dateISO] ?? 0) + 1;
    return acc;
  }, {});
}
