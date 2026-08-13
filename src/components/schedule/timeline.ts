/**
 * ⚠️ 소유: 지수. 하루치 ScheduleItem[] → 겹치지 않는 타임라인 블록으로 배치.
 *
 * spotOrders는 "후보 오더 풀"이라 같은 시간대에 여러 건이 겹친다 — 트럭 한 대가
 * 동시에 두 콜을 뛸 수 없으므로, 화면에는 겹치지 않는 하루 일정(체인) 하나만 그린다
 * (활동 선택 문제 그리디: 끝나는 시간 순 정렬 → 겹치지 않는 것만 채택 → 건수 최대화).
 *
 * 트립 사이에 뜨는 "휴식 및 공차 이동"은 실제 오더가 아니라 화면에서 계산한
 * 파생 구간이다. mock-data / SpotOrder / store에는 아무것도 추가하지 않는다.
 */

import type { ScheduleItem } from "./types";

interface TimedItem {
  item: ScheduleItem;
  startMin: number;
  /** 하루(0~1440) 안에서의 종료 — 익일 하차 건은 1440(자정)으로 클리핑 */
  endMin: number;
}

export interface TripBlock {
  kind: "trip";
  item: ScheduleItem;
  startMin: number;
  endMin: number;
}

export interface RestBlock {
  kind: "rest";
  startMin: number;
  endMin: number;
}

export type TimelineBlock = TripBlock | RestBlock;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toTimedItem(item: ScheduleItem): TimedItem | null {
  if (!item.loadingStart || !item.unloadingStart) return null;
  const startMin = toMinutes(item.loadingStart);
  const rawEndMin = toMinutes(item.unloadingStart);
  // 하차 시각(시계 기준)이 상차 시각보다 이르면 자정을 넘긴 것 — order 모양과 무관하게
  // loadingStart/unloadingStart만으로 판단한다(SpotOrder/PastTrip/FixedSchedule 공통).
  const isOvernight = rawEndMin < startMin;
  const endMin = isOvernight ? 24 * 60 : rawEndMin;
  return { item, startMin, endMin };
}

/**
 * 겹치는 후보 중 겹치지 않는 하루 체인만 뽑는다.
 * 여러 후보가 겹칠 땐 더 일찍 끝나는 쪽을 남겨서 건수를 최대화한다.
 */
function selectNonOverlappingDay(items: ScheduleItem[]): TimedItem[] {
  const timed = items
    .map(toTimedItem)
    .filter((t): t is TimedItem => t !== null)
    .sort((a, b) => a.endMin - b.endMin);

  const picked: TimedItem[] = [];
  let lastEnd = -1;
  for (const t of timed) {
    if (t.startMin >= lastEnd) {
      picked.push(t);
      lastEnd = t.endMin;
    }
  }

  return picked.sort((a, b) => a.startMin - b.startMin);
}

/** 선택된 체인 사이 공백에 "휴식 및 공차 이동" 블록을 끼워 넣는다. 00:00→첫 일정, 마지막 일정→24:00은 채우지 않는다. */
export function buildDayTimeline(items: ScheduleItem[]): TimelineBlock[] {
  const chain = selectNonOverlappingDay(items);
  const blocks: TimelineBlock[] = [];

  chain.forEach((t, idx) => {
    if (idx > 0) {
      const prevEnd = chain[idx - 1].endMin;
      if (t.startMin > prevEnd) {
        blocks.push({ kind: "rest", startMin: prevEnd, endMin: t.startMin });
      }
    }
    blocks.push({ kind: "trip", item: t.item, startMin: t.startMin, endMin: t.endMin });
  });

  return blocks;
}
