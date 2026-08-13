/**
 * ⚠️ 소유: 순범. 업무 외 대기시간 = 대기 + 상하차 (도착 → 출발).
 *
 * ★ 폴백 키는 「하차지」가 아니라 「화주 + 지점」이다.
 *   목업이 이걸 증명한다 — 과거 우진로지스 2건은 인천 중구가 *하차지*인데,
 *   새 오더 SO-0818-04는 같은 우진로지스 인천 중구가 *상차지*다.
 *   하차지로만 묶으면 이 연결이 끊기고, 데모의 핵심 장면이 사라진다.
 *   그래서 오더의 상차지·하차지 양쪽을, 과거 운행의 출발지·도착지 양쪽과 대조한다.
 *
 * ★ 값은 「운행 단위」로 들어와서 「운행 단위」로 나간다.
 *   PastTrip.waitMinutes는 그 운행 전체의 대기 시간이지 지점별로 쪼개져 있지 않다.
 *   GPS가 주는 건 입차/출차 시각뿐이라 원래 쪼갤 수 없다(SPEC §3.3).
 *   그래서 상차지 몫과 하차지 몫을 따로 추정해 더하지 않는다 — 더하면 이중 계상이다.
 *   지점이 걸리면 그 지점을 "거친 운행"의 대기 중앙값을 그대로 쓴다.
 */

import type { PastTrip, SpotOrder, WaitEstimate, Waypoint } from "@/lib/types";
import { pastTrips } from "@/data/mock-data";
import { DEFAULT_STAY_MINUTES, MIN_SAMPLES, DISTANCE_BANDS } from "./params";

type HandlingGuess = "지게차" | "수작업" | "미상";

/**
 * 상하차 방식. Waypoint의 forklift/manual 불리언이 이미 데이터에 있으므로
 * 조건 텍스트를 다시 파싱하지 않는다. 둘 다 false면 근거가 없는 것이고 "미상"이다.
 */
export function handlingOf(order: SpotOrder): HandlingGuess {
  const w = order.dropoff;
  if (w.forklift) return "지게차";
  if (w.manual) return "수작업";
  return "미상";
}

/* ────────────────────────────────────────────────────────────────
   지점 매칭
   ──────────────────────────────────────────────────────────────── */

/**
 * PastTrip.route는 "화성 향남"·"인천 중구"·"송파 문정"처럼 사람이 부르는 두 토막이다.
 * 광역시는 "시도 구", 도는 "시군 읍면동", 서울은 "구 동" — 형식이 일정하지 않다.
 * 그래서 형식을 맞추려 들지 않고, Waypoint에서 뽑은 토큰 집합에
 * route의 두 토막이 전부 들어 있는지로 판정한다.
 */
const ADMIN_SUFFIX = /(특별자치시|특별자치도|광역시|특별시|시|군|구|읍|면|동)$/;

function core(s: string): string {
  return s.replace(ADMIN_SUFFIX, "");
}

function waypointTokens(w: Waypoint): string[] {
  return [core(w.sido), core(w.sigungu), core(w.dong)].filter(Boolean);
}

/** 한쪽이 다른 쪽의 앞부분이면 같은 곳으로 본다 — "심곡"과 "심곡본"이 갈리지 않게. */
function tokenHit(routeToken: string, tokens: string[]): boolean {
  return tokens.some((t) => t.startsWith(routeToken) || routeToken.startsWith(t));
}

function matchesSite(routeStr: string, w: Waypoint): boolean {
  const tokens = waypointTokens(w);
  const parts = routeStr.split(/\s+/).map(core).filter(Boolean);
  if (parts.length === 0) return false;
  return parts.every((p) => tokenHit(p, tokens));
}

/** 과거 운행이 이 지점을 거쳤나 — 상차든 하차든 상관없다. */
function tripTouchesSite(t: PastTrip, w: Waypoint): boolean {
  return matchesSite(t.route.from, w) || matchesSite(t.route.to, w);
}

/** 과거 운행이 이 시·군·구를 거쳤나 (지점까지 안 맞아도 됨) */
function tripTouchesSigungu(t: PastTrip, w: Waypoint): boolean {
  const c = core(w.sigungu);
  return [t.route.from, t.route.to].some((r) =>
    r.split(/\s+/).map(core).some((p) => p.startsWith(c) || c.startsWith(p)),
  );
}

function distanceBand(km: number): number {
  return DISTANCE_BANDS.findIndex((b) => km < b);
}

/* ────────────────────────────────────────────────────────────────
   집계
   ──────────────────────────────────────────────────────────────── */

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function summarize(
  trips: PastTrip[],
  level: WaitEstimate["level"],
  basis: string,
): WaitEstimate {
  const mins = trips.map((t) => t.waitMinutes);
  return {
    minutes: Math.round(median(mins)),
    level,
    sampleCount: trips.length,
    rangeMin: Math.min(...mins),
    rangeMax: Math.max(...mins),
    basis,
    unknown: false,
  };
}

/**
 * 계층 폴백. 위에서부터 표본이 차는 층을 쓴다.
 *
 * ⚠️ SPEC의 L1.5는 「하차지 유형」(대형물류센터/일반창고/공장/…)이지만
 *    mock-data.ts에 지점 유형 필드가 없다. 지어내지 않고 「같은 지점, 화주 무관」으로 대체했다.
 *    유형 필드가 데이터에 들어오면 그 층을 원래 정의로 되돌린다.
 */
export function estimateWait(order: SpotOrder): WaitEstimate {
  // 오더의 두 지점 중 기록이 잡히는 쪽을 쓴다. 대기는 상차지에서도 하차지에서도 난다.
  const sites: Array<{ w: Waypoint; label: string }> = [
    { w: order.dropoff, label: "하차지" },
    { w: order.pickup, label: "상차지" },
  ];

  // ── L1 · 같은 화주 + 같은 지점 ──
  for (const { w, label } of sites) {
    const hit = pastTrips.filter(
      (t) => t.shipper === order.shipper && tripTouchesSite(t, w),
    );
    if (hit.length >= MIN_SAMPLES.L1) {
      return summarize(hit, "L1", `이 화주 이 ${label} 최근 ${hit.length}건 중앙값`);
    }
  }

  // ── L1.5 · 같은 지점 (화주 무관) ──
  for (const { w, label } of sites) {
    const hit = pastTrips.filter((t) => tripTouchesSite(t, w));
    if (hit.length >= MIN_SAMPLES["L1.5"]) {
      return summarize(hit, "L1.5", `이 ${label} 최근 ${hit.length}건 중앙값 (화주 무관)`);
    }
  }

  // ── L2 · 같은 시·군·구 + 같은 톤급 ──
  for (const { w, label } of sites) {
    const hit = pastTrips.filter(
      (t) => t.vehicle.ton === order.vehicle.ton && tripTouchesSigungu(t, w),
    );
    if (hit.length >= MIN_SAMPLES.L2) {
      return summarize(
        hit,
        "L2",
        `${label} ${w.sigungu} · ${order.vehicle.ton}톤 ${hit.length}건 중앙값`,
      );
    }
  }

  // ── L3 · 같은 거리대 + 같은 톤급 ──
  const band = distanceBand(order.distance.haulKm);
  const byBand = pastTrips.filter(
    (t) =>
      t.vehicle.ton === order.vehicle.ton &&
      distanceBand(t.distance.haulKm) === band,
  );
  if (byBand.length >= MIN_SAMPLES.L3) {
    return summarize(
      byBand,
      "L3",
      `비슷한 거리대(${order.distance.haulKm}km) · ${order.vehicle.ton}톤 ${byBand.length}건 중앙값`,
    );
  }

  // ── L4 · 기록 없음. 상하차 방식별 기본값 ──
  //    조용히 쓰지 않는다. 화면에 "기록 없음"이라고 쓴다.
  const handling = handlingOf(order);
  return {
    minutes: DEFAULT_STAY_MINUTES[handling],
    level: "L4",
    sampleCount: 0,
    rangeMin: null,
    rangeMax: null,
    basis:
      handling === "미상"
        ? "내 기록 없음 · 상하차 방식 미기재 — 전체 기본값"
        : `내 기록 없음 · ${handling} 건 기본값`,
    unknown: true,
  };
}

/* ────────────────────────────────────────────────────────────────
   표기 — 화면이 숫자만 쓰지 못하게 여기서 근거를 붙여 내보낸다
   ──────────────────────────────────────────────────────────────── */

/** 90 → "1시간 30분", 45 → "45분" */
export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

/** 카드 한 줄용. "2시간 18분 (2건)" · 기록이 없으면 "(기록 없음)" */
export function waitLabel(w: WaitEstimate): string {
  const t = formatMinutes(w.minutes);
  return w.unknown ? `${t} · 기록 없음` : `${t} (${w.sampleCount}건)`;
}

/** 상세용 범위 문구. 표본이 1건이면 범위를 쓰지 않는다. */
export function waitRangeLabel(w: WaitEstimate): string | null {
  if (w.unknown || w.rangeMin === null || w.rangeMax === null) return null;
  if (w.rangeMin === w.rangeMax) return null;
  return `범위 ${formatMinutes(w.rangeMin)}~${formatMinutes(w.rangeMax)}`;
}
