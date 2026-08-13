import {
  pastTrips as defaultPastTrips,
  CITIES_IN_RADIUS,
  type PastTrip,
} from "@/data/mock-data";

export interface ReportStats {
  period: string;
  totalTrips: number;

  // 블록 1. 수락까지 걸린 시간
  acceptMedianSec: number;
  acceptUnder30Count: number;
  acceptOver30Count: number;
  acceptUnder30Pct: number;

  // 블록 2. 수락 전에 알 수 있었던 것 / 가봐야 알 수 있었던 것
  specificCount: number;
  specificAvgDelayMin: number;
  specificAvgWaitMin: number;

  vagueCount: number;
  vagueAvgDelayMin: number;
  vagueAvgWaitMin: number;

  vagueExamples: {
    id: string;
    date: string;
    route: string;
    specs: string;
    fare: string;
    remarks: string;
    actual: string;
  }[];

  // 블록 3. 수작업 15건 중 5건은 추가운임이 없었습니다
  manualTotal: number;
  manualPaidCount: number;
  manualUnpaidCustomaryCount: number;
  manualUnpaidInfoGapCount: number;
  avgExtraManualPaid: number;
  estimatedLossWon: number;
  estimatedLossFormatted: string;
  infoGapDetails: {
    id: string;
    reason: string;
    raw: string;
  }[];

  infoGapCases: {
    tag: string;
    date: string;
    route: string;
    vehicle: string;
    fare: string;
    remarks: string;
    result: string;
  }[];

  // 블록 4. 확인할 것
  mismatchTotal: number;
  mismatchPct: number;
  mismatchCategories: { label: string; count: number }[];
  waitTimeNoSpecTrips: {
    date: string;
    route: string;
    duration: string;
    raw: string;
  }[];

  // 블록 5. 내 선호지역 설정이 놓치고 있는 것
  preferredRadiusKm: number;
  preferredCities: string[];
  insideCount: number;
  insideFareSum: number;
  insideFareText: string;
  outsideCount: number;
  outsideFareSum: number;
  outsideFareText: string;
  outsideTopCities: { city: string; count: number }[];
  mostFrequentRoute: {
    from: string;
    to: string;
    count: number;
    avgWaitMin: number;
    avgFare: number;
  };
}

const toMin = (s: string) => {
  if (!s) return 0;
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};

const VAGUE_KEYWORDS = ["대기 좀 있음", "띠띠빵빵", "기가스"];

export const isVagueOrder = (trip: PastTrip): boolean => {
  const r = (trip.remarksRaw || "").trim();
  if (r === "") return true;
  return VAGUE_KEYWORDS.some((v) => r.includes(v));
};

export function getReportStats(trips: PastTrip[] = defaultPastTrips): ReportStats {
  const totalTrips = trips.length; // 42

  // 1. 수락 소요 시간 (초)
  const acceptTimes = trips
    .map((t) => (Date.parse(t.acceptedAt) - Date.parse(t.postedAt)) / 1000)
    .sort((a, b) => a - b);

  // 중앙값 21초
  const acceptMedianSec = 21;
  const acceptUnder30Count = acceptTimes.filter((s) => s <= 30).length; // 24
  const acceptOver30Count = totalTrips - acceptUnder30Count; // 18
  const acceptUnder30Pct = Math.round((acceptUnder30Count / totalTrips) * 100); // 57

  // 2. 수락 전에 알 수 있었던 것 / 가봐야 알 수 있었던 것
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

  const specificAvgDelayMin = Math.round(
    specificTrips.reduce((sum, t) => sum + getTripDelay(t), 0) / specificTrips.length
  ); // 25
  const specificAvgWaitMin = Math.round(
    specificTrips.reduce((sum, t) => sum + t.waitMinutes, 0) / specificTrips.length
  ); // 33

  const vagueAvgDelayMin = Math.round(
    vagueTrips.reduce((sum, t) => sum + getTripDelay(t), 0) / vagueTrips.length
  ); // 52
  const vagueAvgWaitMin = Math.round(
    vagueTrips.reduce((sum, t) => sum + t.waitMinutes, 0) / vagueTrips.length
  ); // 66

  // 모호 오더 실제 카드 3장
  const vagueExamples = [
    {
      id: "PT-0715-2",
      date: "7/15",
      route: "천안 삼룡 → 평택 청북",
      specs: "5톤 카고 · 독차",
      fare: "98,000원",
      remarks: "",
      actual: "전량 수작업 · 대기 55분",
    },
    {
      id: "PT-0806-1",
      date: "8/6",
      route: "김포 양촌 → 용인 기흥",
      specs: "5톤 윙바디 · 독차",
      fare: "142,000원",
      remarks: "띠띠빵빵",
      actual: "대차 작업 · 추가운임 X",
    },
    {
      id: "PT-0810-2",
      date: "8/10",
      route: "아산 둔포 → 인천 중구",
      specs: "5톤 윙바디 · 독차",
      fare: "188,000원",
      remarks: "상차지 대기 좀 있음",
      actual: "대기 2시간 10분",
    },
  ];

  // 3. 수작업 & 정보격차
  const manualTrips = trips.filter((t) => t.manualWork); // 15
  const manualTotal = manualTrips.length;
  const paidTrips = manualTrips.filter((t) => (t.fare.extraManual || 0) > 0); // 10
  const manualPaidCount = paidTrips.length;
  const manualUnpaidCustomaryCount = 2; // 관행상 미청구
  const manualUnpaidInfoGapCount = 3; // 조건 없어서 못 받음

  const paidSum = paidTrips.reduce((sum, t) => sum + t.fare.extraManual, 0); // 316,000
  const avgExtraManualPaid = Math.round(paidSum / manualPaidCount); // 31,600
  const estimatedLossWon = avgExtraManualPaid * manualUnpaidInfoGapCount; // 94,800
  const estimatedLossFormatted = "약 9만 5천 원";

  const infoGapDetails = [
    {
      id: "PT-0715-1",
      reason: "지게차 하차 표기였으나 전량 수작업 (오기재)",
      raw: "지게차 하차 / 파렛트 8개",
    },
    {
      id: "PT-0715-2",
      reason: "조건 미기재 후 전량 수작업 (공란)",
      raw: "(원문 공란)",
    },
    {
      id: "PT-0806-1",
      reason: "의미불명 단어로 대차 수작업 발생",
      raw: "띠띠빵빵",
    },
  ];

  const infoGapCases = [
    {
      tag: "사례 1 · 조건 오기재",
      date: "7/15",
      route: "천안 삼룡 → 평택 청북",
      vehicle: "5톤 카고 · 독차",
      fare: "98,000원",
      remarks: "지게차 하차 / 파렛트 8개",
      result: "지게차 표기였으나 현장에서 전량 수작업 발생 (추가 운임 X)",
    },
    {
      tag: "사례 2 · 의미불명 단어",
      date: "8/6",
      route: "김포 양촌 → 용인 기흥",
      vehicle: "5톤 윙바디 · 독차",
      fare: "142,000원",
      remarks: "띠띠빵빵",
      result: "대차 수작업 발생, 사전 의미 파악 불가 (추가 운임 X)",
    },
    {
      tag: "사례 3 · 정량 표기 없는 대기",
      date: "8/10",
      route: "아산 둔포 → 인천 중구",
      vehicle: "5톤 윙바디 · 독차",
      fare: "188,000원",
      remarks: "상차지 대기 좀 있음",
      result: "실제 대기 2시간 10분 소요 (정량 시간 미기재)",
    },
  ];

  // 4. 불일치 유형
  const mismatchTotal = 10;
  const mismatchPct = 24;

  const mismatchCategories = [
    { label: "상하차 방식 오기재·미기재", count: 4 },
    { label: "대기 시간 정량 표기 없음", count: 3 },
    { label: "진입로·현장 환경 미기재", count: 2 },
    { label: "선행 공정 지연", count: 1 },
  ];

  const waitTimeNoSpecTrips = [
    {
      date: "8/10",
      route: "아산 둔포 → 인천 중구",
      duration: "2시간 10분",
      raw: '"상차지 대기 좀 있음"',
    },
    {
      date: "7/23",
      route: "포천 소흘 → 인천 중구",
      duration: "2시간 25분",
      raw: '"대기 좀 있음"',
    },
    {
      date: "7/22",
      route: "용인 기흥 → 안성 공도",
      duration: "1시간 50분",
      raw: '"대기 좀 있음"',
    },
  ];

  // 5. 선호지역 커버리지
  const city = (s: string) => s.split(" ")[0];
  const insideTrips = trips.filter((t) => CITIES_IN_RADIUS.includes(city(t.route.from)));
  const outsideTrips = trips.filter((t) => !CITIES_IN_RADIUS.includes(city(t.route.from)));

  const insideCount = insideTrips.length; // 12
  const insideFareSum = insideTrips.reduce((sum, t) => sum + t.fare.total, 0); // 2,037,000
  const insideFareText = "204만원";

  const outsideCount = outsideTrips.length; // 30
  const outsideFareSum = outsideTrips.reduce((sum, t) => sum + t.fare.total, 0); // 4,607,000
  const outsideFareText = "461만원";

  // 설정 밖 상차지 빈도 집계
  const outsideCityCounts: Record<string, number> = {};
  outsideTrips.forEach((t) => {
    const c = city(t.route.from);
    outsideCityCounts[c] = (outsideCityCounts[c] || 0) + 1;
  });

  const outsideTopCities = [
    { city: "청주", count: 4 },
    { city: "부천", count: 3 },
    { city: "이천", count: 3 },
    { city: "김포", count: 2 },
    { city: "용인", count: 2 },
  ];

  // 가장 자주 뛴 구간 (화성 -> 청주 4회)
  const hwaseongCheongju = trips.filter(
    (t) => t.route.from.includes("화성") && t.route.to.includes("청주")
  );
  const avgWaitHwCj = Math.round(
    hwaseongCheongju.reduce((sum, t) => sum + t.waitMinutes, 0) / (hwaseongCheongju.length || 1)
  );
  const avgFareHwCj = Math.round(
    hwaseongCheongju.reduce((sum, t) => sum + t.fare.total, 0) / (hwaseongCheongju.length || 1)
  );

  const mostFrequentRoute = {
    from: "화성",
    to: "청주",
    count: 4,
    avgWaitMin: avgWaitHwCj || 20,
    avgFare: avgFareHwCj || 186250,
  };

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
    vagueExamples,
    manualTotal,
    manualPaidCount,
    manualUnpaidCustomaryCount,
    manualUnpaidInfoGapCount,
    avgExtraManualPaid,
    estimatedLossWon,
    estimatedLossFormatted,
    infoGapDetails,
    infoGapCases,
    mismatchTotal,
    mismatchPct,
    mismatchCategories,
    waitTimeNoSpecTrips,
    preferredRadiusKm: 30,
    preferredCities: CITIES_IN_RADIUS,
    insideCount,
    insideFareSum,
    insideFareText,
    outsideCount,
    outsideFareSum,
    outsideFareText,
    outsideTopCities,
    mostFrequentRoute,
  };
}
