import { pastTrips as defaultPastTrips, type PastTrip } from "@/data/mock-data";

export interface AcceptanceMetrics {
  totalCount: number;
  medianSeconds: number;
  within30sCount: number;
  within30sRate: number;
}

export interface OrderClarityMetrics {
  specificCount: number;
  avgSpecificDelayMin: number;
  avgSpecificWaitMin: number;
  vagueCount: number;
  avgVagueDelayMin: number;
  avgVagueWaitMin: number;
}

export interface InfoGapMetrics {
  manualTotalCount: number;
  unpaidManualCount: number;
  infoGapUnpaidCount: number;
  avgPaidExtraManual: number;
  calculatedLossAmount: number;
}

export interface MismatchCategoryItem {
  type: string;
  count: number;
  examples: string[];
}

export interface MismatchMetrics {
  totalMismatches: number;
  totalTrips: number;
  mismatchRate: number;
  categories: MismatchCategoryItem[];
}

export interface ReportMetrics {
  period: string;
  target: string;
  acceptance: AcceptanceMetrics;
  clarity: OrderClarityMetrics;
  infoGap: InfoGapMetrics;
  mismatch: MismatchMetrics;
}

export function isVagueOrder(trip: PastTrip): boolean {
  const raw = (trip.remarksRaw || "").trim();
  if (raw === "") return true;
  if (raw.includes("띠띠빵빵") || raw.includes("기가스")) return true;
  if (raw.includes("대기 좀 있음") || raw.includes("상차지 대기 좀 있음")) return true;
  if (raw.includes("내려주고 오시면 됩니다")) return true;
  return false;
}

function getDelayMinutes(planned: string, actual: string): number {
  if (!planned || !actual) return 0;
  const [ph, pm] = planned.split(":").map(Number);
  const [ah, am] = actual.split(":").map(Number);
  const plannedMin = ph * 60 + pm;
  const actualMin = ah * 60 + am;
  let diff = actualMin - plannedMin;
  if (diff < -720) diff += 1440;
  if (diff > 720) diff -= 1440;
  return diff;
}

export function calculateReportMetrics(trips: PastTrip[] = defaultPastTrips): ReportMetrics {
  const total = trips.length;

  // 1. 수락 소요 시간
  const acceptSecondsList = trips
    .map((t) => {
      const p = new Date(t.postedAt).getTime();
      const a = new Date(t.acceptedAt).getTime();
      return (a - p) / 1000;
    })
    .sort((a, b) => a - b);

  let medianSeconds = 0;
  if (acceptSecondsList.length > 0) {
    const mid = Math.floor(acceptSecondsList.length / 2);
    medianSeconds =
      acceptSecondsList.length % 2 === 0
        ? Math.round((acceptSecondsList[mid - 1] + acceptSecondsList[mid]) / 2)
        : Math.round(acceptSecondsList[mid]);
  }

  const within30sCount = acceptSecondsList.filter((s) => s <= 30).length;
  const within30sRate = total > 0 ? Math.round((within30sCount / total) * 100) : 0;

  // 2. 명시 vs 모호 오더 대비
  const specificTrips = trips.filter((t) => !isVagueOrder(t));
  const vagueTrips = trips.filter((t) => isVagueOrder(t));

  const avgSpecificDelayMin =
    specificTrips.length > 0
      ? Math.round(
          specificTrips.reduce(
            (acc, t) => acc + getDelayMinutes(t.plannedDropoff, t.actualDropoff),
            0
          ) / specificTrips.length
        )
      : 0;

  const avgSpecificWaitMin =
    specificTrips.length > 0
      ? Math.round(
          specificTrips.reduce((acc, t) => acc + t.waitMinutes, 0) /
            specificTrips.length
        )
      : 0;

  const avgVagueDelayMin =
    vagueTrips.length > 0
      ? Math.round(
          vagueTrips.reduce(
            (acc, t) => acc + getDelayMinutes(t.plannedDropoff, t.actualDropoff),
            0
          ) / vagueTrips.length
        )
      : 0;

  const avgVagueWaitMin =
    vagueTrips.length > 0
      ? Math.round(
          vagueTrips.reduce((acc, t) => acc + t.waitMinutes, 0) /
            vagueTrips.length
        )
      : 0;

  // 3. 현장 수작업과 정보 격차
  const manualTrips = trips.filter((t) => t.manualWork);
  const unpaidManualTrips = manualTrips.filter((t) => (t.fare.extraManual || 0) === 0);
  const infoGapUnpaidTrips = unpaidManualTrips.filter(
    (t) => isVagueOrder(t) || t.conditionMismatch
  );

  const paidManualTrips = trips.filter((t) => (t.fare.extraManual || 0) > 0);
  const avgPaidExtraManual =
    paidManualTrips.length > 0
      ? Math.round(
          paidManualTrips.reduce((acc, t) => acc + t.fare.extraManual, 0) /
            paidManualTrips.length
        )
      : 0;

  const calculatedLossAmount = avgPaidExtraManual * infoGapUnpaidTrips.length;

  // 4. 불일치 체크리스트
  const mismatchTrips = trips.filter((t) => t.conditionMismatch);
  const categoriesMap: Record<string, string[]> = {
    "지게차/인력 조건 미이행 및 수작업 요구": [],
    "정량 표기 없는 대기 시간 초과 (1~2시간 이상)": [],
    "우천/공사 등 진입로 및 현장 환경 미기재": [],
    "선행 공정 지연으로 상차 시각 지연": [],
  };

  mismatchTrips.forEach((t) => {
    const detail = t.mismatchDetail || "";
    if (
      detail.includes("지게차") ||
      detail.includes("수작업") ||
      detail.includes("두 명") ||
      detail.includes("띠띠빵빵")
    ) {
      categoriesMap["지게차/인력 조건 미이행 및 수작업 요구"].push(detail);
    } else if (detail.includes("대기")) {
      categoriesMap["정량 표기 없는 대기 시간 초과 (1~2시간 이상)"].push(detail);
    } else if (
      detail.includes("우천") ||
      detail.includes("진입로") ||
      detail.includes("야적장")
    ) {
      categoriesMap["우천/공사 등 진입로 및 현장 환경 미기재"].push(detail);
    } else {
      categoriesMap["선행 공정 지연으로 상차 시각 지연"].push(detail);
    }
  });

  const categories: MismatchCategoryItem[] = Object.entries(categoriesMap)
    .map(([type, examples]) => ({
      type,
      count: examples.length,
      examples,
    }))
    .filter((c) => c.count > 0);

  const mismatchRate =
    total > 0 ? Math.round((mismatchTrips.length / total) * 100) : 0;

  return {
    period: "2026-07-14 ~ 2026-08-12",
    target: "기사 본인 운행 기록",
    acceptance: {
      totalCount: total,
      medianSeconds,
      within30sCount,
      within30sRate,
    },
    clarity: {
      specificCount: specificTrips.length,
      avgSpecificDelayMin,
      avgSpecificWaitMin,
      vagueCount: vagueTrips.length,
      avgVagueDelayMin,
      avgVagueWaitMin,
    },
    infoGap: {
      manualTotalCount: manualTrips.length,
      unpaidManualCount: unpaidManualTrips.length,
      infoGapUnpaidCount: infoGapUnpaidTrips.length,
      avgPaidExtraManual,
      calculatedLossAmount,
    },
    mismatch: {
      totalMismatches: mismatchTrips.length,
      totalTrips: total,
      mismatchRate,
      categories,
    },
  };
}
