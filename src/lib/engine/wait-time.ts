/**
 * ⚠️ 소유: 순범. 업무 외 대기시간(대기 + 상하차) 추정.
 *
 * L1 — 같은 화주 + 같은 하차지에서 실측된 PastTrip.waitMinutes 중앙값.
 * L4 — 실측이 없을 때만 쓰는 상하차 방식별 기본값.
 *
 * mock-data.ts에는 화주+지점을 묶는 전용 키(siteKey)가 아직 없다 (SPEC §3.5.4의 미해결 항목).
 * 대신 PastTrip.route.to("청주 오송" 형식)와 SpotOrder.dropoff(시군구·동)를 정규화해 맞춘다.
 * L1.5~L3(하차지유형·시군구·거리대)은 route 문자열만으로는 신뢰도 있게 못 가른다 —
 * siteKey가 데이터에 들어오면 그 계층을 마저 채운다.
 */

import type { PastTrip, SpotOrder, WaitEstimate } from "@/lib/types";
import { pastTrips } from "@/data/mock-data";
import { DEFAULT_STAY_MINUTES, MIN_SAMPLES } from "./params";

type HandlingGuess = "지게차" | "수작업" | "미상";

/** Waypoint의 forklift/manual 불리언을 그대로 쓴다. 근거 없으면 "미상". */
export function handlingOf(order: SpotOrder): HandlingGuess {
  if (order.dropoff.forklift) return "지게차";
  if (order.dropoff.manual) return "수작업";
  return "미상";
}

/** "청주시" "오송읍" → "청주오송". PastTrip.route 문자열과 맞추기 위한 정규화. */
function normalizeSite(sigungu: string, dong: string): string {
  const strip = (s: string) =>
    s.replace(/(특별자치시|특별자치도|광역시|특별시|시|군|구|읍|면|동)$/, "");
  return `${strip(sigungu)}${strip(dong)}`;
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

export function estimateWait(order: SpotOrder): WaitEstimate {
  const siteKey = normalizeSite(order.dropoff.sigungu, order.dropoff.dong);
  const handling = handlingOf(order);

  // L1 — 같은 화주 + 같은 하차지 실측
  const sameSite = pastTrips.filter(
    (t) =>
      t.shipper === order.shipper &&
      normalizeSite(...splitRouteTo(t)) === siteKey,
  );

  if (sameSite.length >= MIN_SAMPLES.L1) {
    const minutes = median(sameSite.map((t) => t.waitMinutes));
    const range = sameSite.map((t) => t.waitMinutes);
    return {
      minutes,
      level: "L1",
      sampleCount: sameSite.length,
      rangeMin: Math.min(...range),
      rangeMax: Math.max(...range),
      basis: `이 화주 이 하차지 최근 ${sameSite.length}건 중앙값`,
      unknown: false,
    };
  }

  // L4 — 실측 없음. 상하차 방식별 기본값만 쓴다. 조용히 쓰지 않고 "기록 없음"이라 밝힌다.
  return {
    minutes: DEFAULT_STAY_MINUTES[handling],
    level: "L4",
    sampleCount: sameSite.length,
    rangeMin: null,
    rangeMax: null,
    basis:
      handling === "미상"
        ? "이 하차지 기록 없음 · 하차 방식 미기재 — 전체 기본값 적용"
        : `이 하차지 기록 없음 · ${handling} 건 기본값 적용`,
    unknown: true,
  };
}

/** route.to("청주 오송")를 [시군구조각, 동조각] 형태로 대략 쪼갠다. 공백 기준 2단어 가정. */
function splitRouteTo(t: PastTrip): [string, string] {
  const [a = "", b = ""] = t.route.to.split(" ");
  return [a, b];
}

/** 화면에 그대로 쓰는 한 줄. 표본 수를 빼먹지 않기 위해 여기서 만든다. */
export function waitLabel(w: WaitEstimate): string {
  const h = (w.minutes / 60).toFixed(1);
  if (w.unknown) return `${h}h · 기록 없음`;
  return `${h}h (${w.sampleCount}건)`;
}
