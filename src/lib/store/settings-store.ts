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
  // 오더 축 — 어떤 오더를 목록에 볼까
  preferPickup: "",
  preferDropoff: "",
  // 하루 축 — 내 하루가 어디서 시작해서 어디서 끝나나
  dayStart: "",
  dayEnd: "",
  targetFinish: "20:00",
};

export const SETTINGS_STORAGE_KEY = "kt.daySettings.v1";

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
