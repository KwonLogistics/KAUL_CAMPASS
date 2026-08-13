"use client";

/**
 * ⚠️ 소유: 순범 (리드). 동의·지수는 useAppState() 훅만 쓴다. 이 파일을 직접 고치지 않는다.
 *
 * 세 사람의 화면이 같은 값을 보게 만드는 단 하나의 지점.
 * 새 전역 상태가 필요하면 각자 Context 를 만들지 말고 순범에게 말한다.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { DaySettings } from "@/lib/types";
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  applyRoute,
} from "./settings-store";
import {
  SCHEDULE_STORAGE_KEY,
  addOrder,
  removeOrder,
  type ScheduledOrder,
} from "./schedule-store";

interface AppState {
  /* ── 하루 설정 ── */
  settings: DaySettings;
  /** 순범 — 선호 지역 설정 화면 */
  updateSettings: (patch: Partial<DaySettings>) => void;
  /** 동의 — AI 리포트 [이 노선을 내 운행 구간으로 설정하기] */
  applyRecommendedRoute: (route: { start: string; end: string }) => void;

  /* ── 캘린더에 꽂힌 오더 ── */
  scheduled: ScheduledOrder[];
  /** 순범 — 외부 오더 등록 */
  addScheduled: (item: ScheduledOrder) => void;
  removeScheduled: (orderId: string) => void;

  /** localStorage 복원 전에는 false. 서버/클라 렌더 불일치를 막는다. */
  hydrated: boolean;
}

const Ctx = createContext<AppState | null>(null);

function loadSettings(): DaySettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const s = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : DEFAULT_SETTINGS;
  } catch {
    // 저장값이 깨졌으면 기본값으로 간다. 데모 중에 흰 화면이 뜨는 게 최악이다.
    return DEFAULT_SETTINGS;
  }
}

function loadScheduled(): ScheduledOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const q = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    return q ? JSON.parse(q) : [];
  } catch {
    return [];
  }
}

/**
 * "클라이언트에 마운트됐는가"를 useSyncExternalStore로 구한다.
 * 이펙트에서 setState를 직접 부르는 대신 이 훅을 쓴다 — 서버는 항상 false,
 * 클라이언트는 마운트 직후 true로 정확히 한 번 갈아탄다. React 자체가 이 전환을 책임진다.
 */
function subscribeNoop() {
  return () => {};
}
function getClientSnapshot() {
  return true;
}
function getServerSnapshot() {
  return false;
}
function useHydrated(): boolean {
  return useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  // 렌더 중에 읽는다 — 이 Provider 는 값을 DOM으로 직접 그리지 않고, 소비자는 전부
  // hydrated 가 true 인 뒤에만 값을 쓴다. 그래서 서버/클라 첫 렌더의 마크업이 갈리지 않는다.
  const [settings, setSettings] = useState<DaySettings>(loadSettings);
  const [scheduled, setScheduled] = useState<ScheduledOrder[]>(loadScheduled);
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(scheduled));
  }, [scheduled, hydrated]);

  const value = useMemo<AppState>(
    () => ({
      settings,
      updateSettings: (patch) => setSettings((prev) => ({ ...prev, ...patch })),
      applyRecommendedRoute: (route) =>
        setSettings((prev) => applyRoute(prev, route)),
      scheduled,
      addScheduled: (item) => setScheduled((prev) => addOrder(prev, item)),
      removeScheduled: (id) => setScheduled((prev) => removeOrder(prev, id)),
      hydrated,
    }),
    [settings, scheduled, hydrated],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppState 는 AppStateProvider 안에서만 쓴다");
  return v;
}
