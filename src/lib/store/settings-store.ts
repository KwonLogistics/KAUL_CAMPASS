/**
 * ⚠️ 소유: 순범 (리드). 동의·지수는 읽기/호출만. 이 파일을 직접 고치지 않는다.
 *
 * 세 사람이 만나는 접점 ③ —
 *   순범: 화물 정보 탭 「선호 지역 설정」 화면이 이 값을 읽고 쓴다.
 *   동의: AI 리포트의 [이 노선을 내 운행 구간으로 설정하기] 가 applyRoute() 를 호출한다.
 *   지수: 스케줄 탭이 dayStart / dayEnd / targetFinish 를 읽어 하루의 처음과 끝을 잡는다.
 *
 * 각자 자기 화면에 별도 useState 를 두면 값이 갈라진다. 반드시 여기 하나만 쓴다.
 */

import type { DaySettings } from "@/lib/types";

export const DEFAULT_SETTINGS: DaySettings = {
  // 오더 축 — 어떤 오더를 목록에 볼까 (지역 라벨 배열)
  preferPickup: [],
  preferDropoff: [],
  // 하루 축 — 내 하루가 어디서 시작해서 어디서 끝나나 (지점 하나씩)
  dayStart: "",
  dayEnd: "",
  targetFinish: "20:00",
};

export const SETTINGS_STORAGE_KEY = "kt.daySettings.v1";

/**
 * localStorage 에서 읽은 값을 타입에 맞춘다.
 * 선호 상하차지가 문자열 한 칸이던 시절의 저장값이 남아 있을 수 있다 —
 * 그대로 들여보내면 화면이 .map 에서 죽는다. 데모 중에 흰 화면이 뜨는 게 최악이다.
 */
export function normalizeSettings(raw: unknown): DaySettings {
  const r = (raw ?? {}) as Record<string, unknown>;
  const list = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
    return typeof v === "string" && v ? [v] : [];
  };
  const text = (v: unknown, fallback: string): string =>
    typeof v === "string" ? v : fallback;

  return {
    preferPickup: list(r.preferPickup),
    preferDropoff: list(r.preferDropoff),
    dayStart: text(r.dayStart, DEFAULT_SETTINGS.dayStart),
    dayEnd: text(r.dayEnd, DEFAULT_SETTINGS.dayEnd),
    targetFinish: text(r.targetFinish, DEFAULT_SETTINGS.targetFinish),
  };
}

/** 동의의 AI 리포트가 호출하는 유일한 진입점. 하루 축 두 칸만 덮어쓴다. */
export function applyRoute(
  prev: DaySettings,
  route: { start: string; end: string },
): DaySettings {
  return { ...prev, dayStart: route.start, dayEnd: route.end };
}

/** 하루 축이 아직 안 채워졌는지. 스케줄 첫 진입 온보딩을 띄울지 판단하는 데 쓴다. */
export function needsOnboarding(s: DaySettings): boolean {
  return !s.dayStart || !s.dayEnd;
}
