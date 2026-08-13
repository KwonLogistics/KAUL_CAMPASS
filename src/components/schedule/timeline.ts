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
import { DEMO_NOW_DATE_ISO, DEMO_NOW_TIME } from "./convert";

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

/** 90분 이상 gap인지 — 다른 판정 없이 순수 시간 조건만 본다 */
export function isGapLongEnough(block: RestBlock): boolean {
  return block.endMin - block.startMin >= 90;
}

/**
 * rest 블록에 "AI 스마트 경로 추천" CTA를 띄워도 되는지 판정한다.
 * DEMO_NOW_DATE_ISO/DEMO_NOW_TIME(convert.ts, 데모 기준시각)을 그대로 재사용한다 — new Date() 안 씀.
 *
 *   - gap이 90분 미만이면 무조건 제외
 *   - 그 날짜의 ScheduleItem이 하나라도 있는데 전부 completed면 "운행 기록 확인용" 화면으로 보고 제외
 *   - 조회 날짜가 데모 기준일보다 과거면 제외
 *   - 조회 날짜가 데모 기준일보다 미래면 나머지 조건 없이 포함
 *   - 조회 날짜가 데모 기준일과 같으면(오늘), gap의 종료시점이 현재 기준시각보다 이후일 때만 포함
 *     (이미 끝난 과거 gap 제외 — 부분적으로 지금과 겹치거나 완전히 미래인 gap은 포함)
 */
export function isRecommendationEligible(
  dateISO: string,
  block: RestBlock,
  dayItems: ScheduleItem[],
): boolean {
  if (!isGapLongEnough(block)) return false;

  const dayAllCompleted = dayItems.length > 0 && dayItems.every((item) => item.status === "completed");
  if (dayAllCompleted) return false;

  if (dateISO < DEMO_NOW_DATE_ISO) return false;
  if (dateISO > DEMO_NOW_DATE_ISO) return true;

  const nowMin = toMinutes(DEMO_NOW_TIME);
  return block.endMin > nowMin;
}

/**
 * 그날 첫 일정 이전 / 마지막 일정 이후 여백을 "AI 스마트 경로 추천" CTA 후보로 넘긴다.
 * buildDayTimeline()은 이 두 구간을 일부러 안 채운다(00:00→첫 일정, 마지막 일정→24:00) —
 * 그 원칙은 그대로 두고, 추천이 가능한 경우에만 별도로 rest 블록을 만들어 덧붙인다.
 *
 * 경계 기준(오늘/다른 날짜 다르게):
 *   - 오늘(DEMO_NOW_DATE_ISO)이면 앞쪽 경계는 자정이 아니라 데모 기준시각(DEMO_NOW_TIME)부터
 *     — 이미 지난 새벽 시간을 추천 대상으로 보여줄 이유가 없다.
 *   - 그 외 날짜(미래)는 하루 전체(00:00~24:00) 기준.
 * 각 구간은 isRecommendationEligible을 그대로 통과해야만(90분 이상 등) 포함된다 —
 * 조건 미달이면 아예 만들지 않는다(빈 구간을 억지로 "휴식"으로 채우지 않는다는 기존 원칙 유지).
 */
export function getEdgeRestBlocks(
  dateISO: string,
  tripBlocks: Array<{ startMin: number; endMin: number }>,
  dayItems: ScheduleItem[],
): RestBlock[] {
  if (tripBlocks.length === 0) return [];

  const dayLowerBound = dateISO === DEMO_NOW_DATE_ISO ? toMinutes(DEMO_NOW_TIME) : 0;
  const dayUpperBound = 24 * 60;

  const firstStart = Math.min(...tripBlocks.map((b) => b.startMin));
  const lastEnd = Math.max(...tripBlocks.map((b) => b.endMin));

  const blocks: RestBlock[] = [];

  if (firstStart > dayLowerBound) {
    const leading: RestBlock = { kind: "rest", startMin: dayLowerBound, endMin: firstStart };
    if (isRecommendationEligible(dateISO, leading, dayItems)) blocks.push(leading);
  }

  if (lastEnd < dayUpperBound) {
    const trailing: RestBlock = { kind: "rest", startMin: lastEnd, endMin: dayUpperBound };
    if (isRecommendationEligible(dateISO, trailing, dayItems)) blocks.push(trailing);
  }

  return blocks;
}
