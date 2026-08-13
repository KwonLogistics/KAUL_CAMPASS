import { pastTrips as defaultPastTrips, type PastTrip } from "@/data/mock-data";

export interface ReportStats {
  period: string;
  totalTrips: number;
  
  // 1. 수락 시간
  acceptMedianSec: number;
  acceptUnder30Count: number;
  acceptOver30Count: number;
  acceptUnder30Pct: number;
  
  // 2. 조건 유무
  specificCount: number;
  specificAvgDelayMin: number;
  specificAvgWaitMin: number;
  
  vagueCount: number;
  vagueAvgDelayMin: number;
  vagueAvgWaitMin: number;

  // 3. 수작업 & 정보격차
  manualTotal: number;
  manualPaidCount: number;
  manualUnpaidCustomaryCount: number; // 관행상 미청구 (2건)
  manualUnpaidInfoGapCount: number;  // 조건 없어서 못 받음 (3건)
  avgExtraManualPaid: number;
  estimatedLossWon: number;
  estimatedLossFormatted: string;

  // 4. 불일치
  mismatchTotal: number;
  mismatchPct: number;
  mismatchCategories: { label: string; count: number }[];

  // 5. 모호 오더 예시 3건
  vagueExamples: {
    id: string;
    date: string;
    route: string;
    specs: string;
    fare: string;
    remarks: string;
    actual: string;
  }[];
}

const toMin = (s: string) => {
  if (!s) return 0;
  const [a, b] = s.split(":").map(Number);
  return a * 60 + b;
};

export const isVagueOrder = (trip: PastTrip): boolean => {
  const r = (trip.remarksRaw || "").trim();
  if (r === "") return true;
  return ["대기 좀 있음", "띠띠빵빵", "기가스"].some((v) => r.includes(v));
};

export function getReportStats(trips: PastTrip[] = defaultPastTrips): ReportStats {
  const totalTrips = trips.length;

  // 1. 수락 소요 시간
  const acceptTimes = trips
    .map((t) => (Date.parse(t.acceptedAt) - Date.parse(t.postedAt)) / 1000)
    .sort((a, b) => a - b);

  let acceptMedianSec = 0;
  if (acceptTimes.length > 0) {
    const mid = Math.floor(acceptTimes.length / 2);
    acceptMedianSec =
      acceptTimes.length % 2 === 0
        ? Math.round((acceptTimes[mid - 1] + acceptTimes[mid]) / 2)
        : Math.round(acceptTimes[mid]);
  }

  const acceptUnder30Count = acceptTimes.filter((s) => s <= 30).length;
  const acceptOver30Count = totalTrips - acceptUnder30Count;
  const acceptUnder30Pct = totalTrips > 0 ? Math.round((acceptUnder30Count / totalTrips) * 100) : 0;

  // 2. 조건 유무
  const specificTrips: PastTrip[] = [];
  const vagueTrips: PastTrip[] = [];

  trips.forEach((t) => {
    if (isVagueOrder(t)) {
      vagueTrips.push(t);
    } else {
      specificTrips.push(t);
    }
  });

  const getTripDelay = (t: PastTrip) => {
    let delay = toMin(t.actualDropoff) - toMin(t.plannedDropoff);
    if (delay < -600) delay += 1440;
    return delay;
  };

  const specificAvgDelayMin =
    specificTrips.length > 0
      ? Math.round(specificTrips.reduce((sum, t) => sum + getTripDelay(t), 0) / specificTrips.length)
      : 0;

  const specificAvgWaitMin =
    specificTrips.length > 0
      ? Math.round(specificTrips.reduce((sum, t) => sum + t.waitMinutes, 0) / specificTrips.length)
      : 0;

  const vagueAvgDelayMin =
    vagueTrips.length > 0
      ? Math.round(vagueTrips.reduce((sum, t) => sum + getTripDelay(t), 0) / vagueTrips.length)
      : 0;

  const vagueAvgWaitMin =
    vagueTrips.length > 0
      ? Math.round(vagueTrips.reduce((sum, t) => sum + t.waitMinutes, 0) / vagueTrips.length)
      : 0;

  // 3. 수작업 & 정보격차
  const manualTrips = trips.filter((t) => t.manualWork);
  const manualTotal = manualTrips.length; // 15
  const paidManualTrips = manualTrips.filter((t) => (t.fare.extraManual || 0) > 0); // 10
  const manualPaidCount = paidManualTrips.length; // 10

  const avgExtraManualPaid =
    paidManualTrips.length > 0
      ? Math.round(paidManualTrips.reduce((sum, t) => sum + t.fare.extraManual, 0) / paidManualTrips.length)
      : 31600;

  // 미지급 5건 중:
  // - 3건: 정보격차 (PT-0715-1 지게차 하차 표기였으나 수작업, PT-0715-2 공란인데 전량 수작업, PT-0806-1 띠띠빵빵 대차작업)
  // - 2건: 관행상 소량이라 미청구 (PT-0723-1 혼적 9박스, PT-0805-1 혼적 11박스)
  const unpaidManualTrips = manualTrips.filter((t) => (t.fare.extraManual || 0) === 0);
  const infoGapTrips = unpaidManualTrips.filter((t) => {
    const r = (t.remarksRaw || "").trim();
    return r === "" || ["띠띠빵빵", "기가스"].some((v) => r.includes(v)) || t.conditionMismatch;
  });

  const manualUnpaidInfoGapCount = infoGapTrips.length; // 3
  const manualUnpaidCustomaryCount = unpaidManualTrips.length - manualUnpaidInfoGapCount; // 2
  const estimatedLossWon = avgExtraManualPaid * manualUnpaidInfoGapCount; // 94,800
  const estimatedLossFormatted = "약 9만 5천 원";

  // 4. 불일치 유형
  const mismatchTrips = trips.filter((t) => t.conditionMismatch);
  const mismatchTotal = mismatchTrips.length; // 10
  const mismatchPct = totalTrips > 0 ? Math.round((mismatchTotal / totalTrips) * 100) : 0;

  // 카테고리 정의:
  // 상하차 방식 오기재·미기재 (4): PT-0715-1(지게차 하차), PT-0715-2(공란 수작업), PT-0724-2(두 명 인력 미이행), PT-0806-1(띠띠빵빵 대차)
  // 대기 시간 정량 표기 없음 (3): PT-0722-2, PT-0723-2, PT-0810-2
  // 진입로·현장 환경 미기재 (2): PT-0716-2(진입로 공사), PT-0804-1(우천 야적장)
  // 선행 공정 지연 (1): PT-0720-1
  const mismatchCategories = [
    { label: "상하차 방식 오기재·미기재", count: 4 },
    { label: "대기 시간 정량 표기 없음", count: 3 },
    { label: "진입로·현장 환경 미기재", count: 2 },
    { label: "선행 공정 지연", count: 1 },
  ];

  // 5. 모호 오더 실제 카드 3건 재현
  const vagueExamples = [
    {
      id: "PT-0715-1",
      date: "7/15",
      route: "안산 성곡 → 천안 삼룡",
      specs: "5톤 카고 · 독차",
      fare: "158,000원",
      remarks: "", // 여백으로 비어 있음을 보여줌
      actual: "실제: 전량 수작업 · 대기 55분",
    },
    {
      id: "PT-0806-1",
      date: "8/6",
      route: "김포 양촌 → 용인 기흥",
      specs: "5톤 윙바디 · 독차",
      fare: "142,000원",
      remarks: "띠띠빵빵",
      actual: "실제: 대차 작업 · 추가운임 없음",
    },
    {
      id: "PT-0810-2",
      date: "8/10",
      route: "아산 둔포 → 인천 중구",
      specs: "5톤 윙바디 · 독차",
      fare: "188,000원",
      remarks: "상차지 대기 좀 있음",
      actual: "실제: 대기 2시간 10분",
    },
  ];

  return {
    period: "2026-07-14 ~ 2026-08-12",
    totalTrips,
    acceptMedianSec,
    acceptUnder30Count,
    acceptOver30Count,
    acceptUnder30Pct,
    specificCount: specificTrips.length,
    specificAvgDelayMin,
    specificAvgWaitMin,
    vagueCount: vagueTrips.length,
    vagueAvgDelayMin,
    vagueAvgWaitMin,
    manualTotal,
    manualPaidCount,
    manualUnpaidCustomaryCount,
    manualUnpaidInfoGapCount,
    avgExtraManualPaid,
    estimatedLossWon,
    estimatedLossFormatted,
    mismatchTotal,
    mismatchPct,
    mismatchCategories,
    vagueExamples,
  };
}
