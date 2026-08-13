/**
 * MOVE-AI Challenge 2026 — KAUL 나침반
 * 데모용 목업 데이터
 *
 * 기준일: 2026-08-13 (목)
 *
 * ── 데이터 생성 근거 및 합성 가정 ─────────────────────────────
 * [사실]
 *  - 2026-08-14(금)은 '택배 없는 날'. 8/15(토) 광복절, 8/17(월) 대체공휴일.
 *    CJ대한통운·롯데·로젠·한진·우체국 집화/배송 중단.
 *    쿠팡 로켓배송·SSG 쓱배송·컬리 샛별배송은 정상 운영.
 *  - 화물정보망 이용률: 카고형 26.8% / 컨테이너·BCT·탱크로리·기타 트레일러 0%
 *    (한국교통연구원, 2017)  → 본 데이터는 카고·윙바디만 포함.
 *  - 수도권-대구권 5~8톤 카고 운임 309,400원 → 299,605원 하락
 *    (한국교통연구원, 「2024 화물자동차 운송·주선업체 조사보고서」, 표Ⅴ-9, p.61)
 *    → 운임 스케일의 앵커로 사용.
 *  - 주선업체 거래 중 단건(수시) 계약 54.1% (동 보고서, 표Ⅱ-10, p.17)
 *    → 나머지 45.9%가 장기계약 → fixedSchedules 존재의 근거.
 *  - 상차일자/하차일자는 타사 필터에서 각각 독립 항목
 *    (전체/당일/내일/모레이후). 배지는 두 필드의 조합에서 파생.
 *
 * [합성 가정 — 실측치 아님]
 *  - 8/13 물량 최다(택배사 마감 직전), 8/14 물량 중간이나 운임 하락
 *    (택배 간선 차량이 스팟 시장에 유입되어 공급 과잉), 8/18 적체 해소로 급증.
 *  - postedAt → acceptedAt 간격 분포.
 *  - 조건 원문의 유형별 비율(L1 25% / L2 35% / L3 25% / L4 10% / 공란 5%).
 *  - 톤급별 운임 배수(8톤 = 5톤×1.3, 11톤 = 5톤×1.75).
 *
 * [미확정 — 발표 인용 금지]
 *  - '월상'의 정확한 의미. 요일 기반 조합어(월상화착 등)는 사용하지 않음.
 *  - 야상의 업계 표준 정의. 본 데모에서는 "18시 이후 상차 + 익일 이후 하차"로 정의.
 *  - 화물차 2시간 연속운전 시 15분 휴게 규정의 근거 조문.
 *    → 별도 룰 대신 거리 구간별 평균속도 상한(R5)에 흡수.
 * ─────────────────────────────────────────────────────────────
 */

// ============================================================
// 1. 타입 정의
// ============================================================

export type DateBucket = "D+0" | "D+1" | "D+2+";
export type BodyType = "카고" | "윙바디";
export type LoadOption = "독차" | "혼적";
export type SettleType = "인수증" | "선착불" | "후불";
export type OrderSource = "kakao" | "external";

/** 조건 추출 상태. '미상'은 LLM이 해석하지 못한 경우 — 반드시 존재해야 함 */
export type ConditionStatus = "명시" | "추정" | "미상";

export type ConditionType =
  | "상하차방식"
  | "시간제약"
  | "취급요건"
  | "적재형태"
  | "장소특성"
  | "차량요건";

export interface ParsedCondition {
  type: ConditionType;
  value: string;
  /** remarksRaw 안의 근거 구절. LLM이 지어낸 것이 아님을 증명하는 필드 */
  evidence: string;
  status: ConditionStatus;
}

export interface Waypoint {
  sido: string;
  sigungu: string;
  dong: string;
  /** 조회일 기준 상대 버킷 */
  date: DateBucket;
  /** 절대 날짜 (YYYY-MM-DD) */
  dateISO: string;
  time: string; // "HH:mm"
  /** 수작업 여부 — 카카오T 트럭커의 '수' 배지에 해당 */
  manual: boolean;
  forklift: boolean;
}

export interface SpotOrder {
  id: string;
  source: OrderSource;
  shipper: string;
  pickup: Waypoint;
  dropoff: Waypoint;
  vehicle: { ton: number; body: BodyType };
  loadOption: LoadOption;
  distance: { toPickupKm: number; haulKm: number };
  /** 상차 → 하차 소요(분). 휴게시간 포함 */
  durationMin: number;
  fare: {
    base: number;
    extraManual: number;
    total: number;
    settle: SettleType;
  };
  /** LLM 입력 원문. 이 데이터셋의 1차 자산 */
  remarksRaw: string;
  /** remarksRaw를 파싱한 결과. 배지는 여기서 렌더링 */
  conditions: ParsedCondition[];
  /** 요건 미달 시 목록에서 삭제하지 않고 회색 처리 + 사유 표시 */
  vehicleFit: { ok: boolean; reason: string };
  /** 오더가 목록에 뜬 시각 */
  postedAt: string;
}

export interface PastTrip {
  id: string;
  source: OrderSource;
  shipper: string;
  dateISO: string;
  route: { from: string; to: string };
  vehicle: { ton: number; body: BodyType };
  distance: { haulKm: number };
  fare: { base: number; extraManual: number; total: number; settle: SettleType };
  remarksRaw: string;
  /** ★ 수락 시점 — postedAt과 짝으로 있어야 "몇 초 만에 수락"이 증명된다 */
  postedAt: string;
  acceptedAt: string;
  plannedPickup: string;
  plannedDropoff: string;
  actualDropoff: string;
  /** 기사 본인의 그날 대기 시간. 평균·표본이 아님 */
  waitMinutes: number;
  /**
   * 상하차 수작업 발생 여부. extraManual과 분리한 이유:
   * 수작업을 하고도 추가운임을 받지 못한 건이 실재하며,
   * 그게 정보 격차의 비용이기 때문이다.
   * 근거: 화물노동자 97명 중 41%가 상하차 작업을 요구받고 15%는 매번
   *      (사회공공연구원·공공운수노조, 2025)
   */
  manualWork: boolean;
  /** 오더에 적힌 조건과 현장이 달랐는지 */
  conditionMismatch: boolean;
  mismatchDetail: string;
}

export interface FixedSchedule {
  id: string;
  shipper: string;
  /** 반복 패턴 — 기사가 1회 등록하면 캘린더에 자동 반복 */
  pattern: string;
  weekdays: number[]; // 0=일 ... 6=토
  route: { from: string; to: string };
  vehicle: { ton: number; body: BodyType };
  pickupTime: string;
  dropoffTime: string;
  haulKm: number;
  fare: number;
  remarksRaw: string;
  validFrom: string;
  validUntil: string;
}

// ============================================================
// 2. 기준 상수 / 기사 프로필
// ============================================================

export const TODAY_ISO = "2026-08-13"; // 목요일

/** 8/13 기준 요일 매핑. 초안의 요일 오류를 막기 위해 상수로 고정 */
export const CALENDAR_2026_08: Record<string, string> = {
  "2026-08-10": "월",
  "2026-08-11": "화",
  "2026-08-12": "수",
  "2026-08-13": "목",
  "2026-08-14": "금", // 택배 없는 날
  "2026-08-15": "토", // 광복절
  "2026-08-16": "일",
  "2026-08-17": "월", // 대체공휴일
  "2026-08-18": "화",
  "2026-08-19": "수",
  "2026-08-20": "목",
  "2026-08-21": "금",
};

export const HOLIDAYS = ["2026-08-15", "2026-08-17"];
export const PARCEL_FREE_DAY = "2026-08-14";

export const driverProfile = {
  name: "기사",
  vehicle: { ton: 5, body: "윙바디" as BodyType },
  base: { sido: "경기", sigungu: "화성시", dong: "향남읍" },
  /** 콜바리 경험이 짧은 기사 — 조건 판단에 도움이 가장 필요한 층 */
  experienceMonths: 7,
};

// ============================================================
// 3. 배지 렌더링 — 문자열을 저장하지 않고 날짜 조합에서 파생
//    D+2 이후는 조어를 만들지 않고 날짜를 그대로 표기한다.
// ============================================================

export function renderDateBadge(o: {
  pickup: { date: DateBucket; dateISO: string };
  dropoff: { date: DateBucket; dateISO: string };
}): string {
  const p = o.pickup.date;
  const d = o.dropoff.date;
  if (p === "D+0" && d === "D+0") return "당상당착";
  if (p === "D+0" && d === "D+1") return "당상내착";
  if (p === "D+1" && d === "D+1") return "내상내착";
  const md = (iso: string) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
  return `${md(o.pickup.dateISO)} 상차 · ${md(o.dropoff.dateISO)} 하차`;
}

/**
 * 상·하차 배지("당상"·"내착"…). 목록 카드와 상세 화면이 같은 배지를 쓰도록
 * 화면마다 만들지 않고 여기서 날짜 버킷 + 달력으로 파생한다.
 */
export function dayTagOf(
  w: { date: DateBucket; dateISO: string },
  isPickup: boolean,
): string {
  if (w.date === "D+0") return isPickup ? "당상" : "당착";
  if (w.date === "D+1") return isPickup ? "내상" : "내착";
  if (CALENDAR_2026_08[w.dateISO] === "월") return isPickup ? "월상" : "월착";
  return isPickup ? "상차" : "하차";
}

/** 야상 판정 — 검증할 제약(R)이 아니라 계산되는 파생 플래그 */
export function isOvernightLoad(o: {
  pickup: { time: string; dateISO: string };
  dropoff: { dateISO: string };
}): boolean {
  return o.pickup.time >= "18:00" && o.dropoff.dateISO > o.pickup.dateISO;
}

// ============================================================
// 4. 스팟 오더 — 현재·근미래 선택 가능 목록 (D+0 ~ D+2+)
// ============================================================

export const spotOrders: SpotOrder[] = [
  // ── D+0 : 2026-08-13 (목) — 택배사 마감 직전, 물량 최다 ──────────
  {
    id: "SO-0813-01",
    source: "kakao",
    shipper: "대성정밀",
    pickup: { sido: "경기", sigungu: "화성시", dong: "향남읍", date: "D+0", dateISO: "2026-08-13", time: "14:00", manual: false, forklift: true },
    dropoff: { sido: "충북", sigungu: "청주시", dong: "오송읍", date: "D+0", dateISO: "2026-08-13", time: "16:20", manual: false, forklift: true },
    vehicle: { ton: 5, body: "윙바디" },
    loadOption: "독차",
    distance: { toPickupKm: 6.2, haulKm: 110 },
    durationMin: 140,
    fare: { base: 190000, extraManual: 0, total: 190000, settle: "인수증" },
    remarksRaw: "지게차 상하차 / 파렛트 12개",
    conditions: [
      { type: "상하차방식", value: "지게차 상차", evidence: "지게차 상하차", status: "명시" },
      { type: "상하차방식", value: "지게차 하차", evidence: "지게차 상하차", status: "명시" },
      { type: "적재형태", value: "파렛트 12개", evidence: "파렛트 12개", status: "명시" },
    ],
    vehicleFit: { ok: true, reason: "" },
    postedAt: "2026-08-13T09:41:02",
  },
  {
    id: "SO-0813-02",
    source: "kakao",
    shipper: "한빛산업자재",
    pickup: { sido: "경기", sigungu: "안산시", dong: "성곡동", date: "D+0", dateISO: "2026-08-13", time: "13:30", manual: false, forklift: true },
    dropoff: { sido: "충남", sigungu: "천안시", dong: "삼룡동", date: "D+0", dateISO: "2026-08-13", time: "15:10", manual: true, forklift: false },
    vehicle: { ton: 5, body: "카고" },
    loadOption: "독차",
    distance: { toPickupKm: 31.5, haulKm: 78 },
    durationMin: 100,
    fare: { base: 160000, extraManual: 35000, total: 195000, settle: "인수증" },
    remarksRaw: "박판타일(1200*2780) 6장 당2~3시착 보양필요",
    conditions: [
      { type: "적재형태", value: "박판타일 1200×2780 6장", evidence: "박판타일(1200*2780) 6장", status: "명시" },
      { type: "시간제약", value: "당일 14~15시 도착", evidence: "당2~3시착", status: "명시" },
      { type: "취급요건", value: "보양 필요 (파손 주의)", evidence: "보양필요", status: "명시" },
      { type: "상하차방식", value: "하차 수작업 추정", evidence: "보양필요", status: "추정" },
    ],
    vehicleFit: { ok: true, reason: "" },
    postedAt: "2026-08-13T10:02:55",
  },
  {
    id: "SO-0813-03",
    source: "kakao",
    shipper: "정진물류",
    pickup: { sido: "인천", sigungu: "남동구", dong: "고잔동", date: "D+0", dateISO: "2026-08-13", time: "15:00", manual: false, forklift: true },
    dropoff: { sido: "강원", sigungu: "원주시", dong: "문막읍", date: "D+0", dateISO: "2026-08-13", time: "17:30", manual: false, forklift: true },
    vehicle: { ton: 8, body: "윙바디" },
    loadOption: "독차",
    distance: { toPickupKm: 48.0, haulKm: 152 },
    durationMin: 150,
    fare: { base: 280000, extraManual: 0, total: 280000, settle: "인수증" },
    remarksRaw: "우천 시 윙바디만 가능, 카고 불가 / 파렛트 16개",
    conditions: [
      { type: "차량요건", value: "우천 시 윙바디 한정", evidence: "우천 시 윙바디만 가능, 카고 불가", status: "명시" },
      { type: "적재형태", value: "파렛트 16개", evidence: "파렛트 16개", status: "명시" },
    ],
    vehicleFit: { ok: false, reason: "요구 톤급 8톤 · 보유 차량 5톤 윙바디" },
    postedAt: "2026-08-13T10:15:31",
  },
  {
    id: "SO-0813-04",
    source: "kakao",
    shipper: "우성목재",
    pickup: { sido: "경기", sigungu: "일산동구", dong: "성석동", date: "D+0", dateISO: "2026-08-13", time: "13:00", manual: true, forklift: false },
    dropoff: { sido: "경기", sigungu: "부천시", dong: "심곡본동", date: "D+0", dateISO: "2026-08-13", time: "14:10", manual: true, forklift: false },
    vehicle: { ton: 5, body: "카고" },
    loadOption: "독차",
    distance: { toPickupKm: 62.4, haulKm: 28 },
    durationMin: 70,
    fare: { base: 95000, extraManual: 28000, total: 123000, settle: "인수증" },
    remarksRaw: "길이3600각재 / 더조은목재 / 윙 양쪽 개방 필요",
    conditions: [
      { type: "적재형태", value: "길이 3600mm 각재", evidence: "길이3600각재", status: "명시" },
      { type: "차량요건", value: "윙 양쪽 개방 가능 차량", evidence: "윙 양쪽 개방 필요", status: "명시" },
      { type: "상하차방식", value: "수작업", evidence: "윙 양쪽 개방 필요", status: "추정" },
    ],
    vehicleFit: { ok: false, reason: "차종 카고 요구 · 보유 차량 윙바디 (윙 양쪽 개방 조건은 충족하나 화주가 카고 지정)" },
    postedAt: "2026-08-13T11:20:08",
  },
  {
    id: "SO-0813-05",
    source: "kakao",
    shipper: "성문화학",
    pickup: { sido: "경기", sigungu: "평택시", dong: "포승읍", date: "D+0", dateISO: "2026-08-13", time: "15:30", manual: false, forklift: true },
    dropoff: { sido: "경기", sigungu: "이천시", dong: "부발읍", date: "D+0", dateISO: "2026-08-13", time: "17:20", manual: false, forklift: true },
    vehicle: { ton: 5, body: "윙바디" },
    loadOption: "독차",
    distance: { toPickupKm: 28.7, haulKm: 82 },
    durationMin: 110,
    fare: { base: 165000, extraManual: 0, total: 165000, settle: "선착불" },
    remarksRaw: "비 안 맞게 갑바 꼼꼼히 씌워주세요. 젖으면 반품됩니다",
    conditions: [
      { type: "취급요건", value: "갑바(방수포) 필수", evidence: "비 안 맞게 갑바 꼼꼼히 씌워주세요", status: "명시" },
      { type: "취급요건", value: "우수 접촉 시 반품 리스크", evidence: "젖으면 반품됩니다", status: "명시" },
    ],
    vehicleFit: { ok: true, reason: "" },
    postedAt: "2026-08-13T11:44:19",
  },
  {
    id: "SO-0813-06",
    source: "external",
    shipper: "(주)팔도로직스",
    pickup: { sido: "경기", sigungu: "여주시", dong: "대신면", date: "D+0", dateISO: "2026-08-13", time: "16:00", manual: false, forklift: true },
    dropoff: { sido: "전남", sigungu: "보성군", dong: "회천면", date: "D+1", dateISO: "2026-08-14", time: "09:30", manual: false, forklift: true },
    vehicle: { ton: 11, body: "윙바디" },
    loadOption: "독차",
    distance: { toPickupKm: 84.0, haulKm: 385 },
    durationMin: 360,
    fare: { base: 560000, extraManual: 0, total: 560000, settle: "인수증" },
    remarksRaw: "근거리2착 / 퇴비파렛트 / 매주금결제",
    conditions: [
      { type: "장소특성", value: "하차지 2곳", evidence: "근거리2착", status: "명시" },
      { type: "적재형태", value: "퇴비 파렛트", evidence: "퇴비파렛트", status: "명시" },
    ],
    vehicleFit: { ok: false, reason: "요구 톤급 11톤 · 보유 차량 5톤" },
    postedAt: "2026-08-13T10:46:00",
  },
  {
    id: "SO-0813-07",
    source: "kakao",
    shipper: "동양기전",
    pickup: { sido: "경기", sigungu: "시흥시", dong: "정왕동", date: "D+0", dateISO: "2026-08-13", time: "18:30", manual: false, forklift: true },
    dropoff: { sido: "경남", sigungu: "창원시", dong: "성산구", date: "D+1", dateISO: "2026-08-14", time: "07:00", manual: false, forklift: true },
    vehicle: { ton: 5, body: "윙바디" },
    loadOption: "독차",
    distance: { toPickupKm: 34.2, haulKm: 330 },
    durationMin: 320,
    fare: { base: 320000, extraManual: 0, total: 320000, settle: "인수증" },
    remarksRaw: "앞 공정 끝나고 상차, 대략 저녁 6시 반 이후 / 내일08시이전 하차, 그 전엔 문 안 엽니다",
    conditions: [
      { type: "시간제약", value: "선행 공정 종료 후 상차 (18:30 이후)", evidence: "앞 공정 끝나고 상차, 대략 저녁 6시 반 이후", status: "명시" },
      { type: "시간제약", value: "익일 08시 이전 하차", evidence: "내일08시이전 하차", status: "명시" },
      { type: "장소특성", value: "하차지 08시 이전만 개방", evidence: "그 전엔 문 안 엽니다", status: "명시" },
    ],
    vehicleFit: { ok: true, reason: "" },
    postedAt: "2026-08-13T11:58:47",
  },
  {
    id: "SO-0813-08",
    source: "kakao",
    shipper: "미래식품",
    pickup: { sido: "서울", sigungu: "송파구", dong: "문정동", date: "D+0", dateISO: "2026-08-13", time: "14:20", manual: true, forklift: false },
    dropoff: { sido: "경기", sigungu: "남양주시", dong: "다산동", date: "D+0", dateISO: "2026-08-13", time: "15:30", manual: true, forklift: false },
    vehicle: { ton: 5, body: "카고" },
    loadOption: "혼적",
    distance: { toPickupKm: 55.1, haulKm: 24 },
    durationMin: 70,
    fare: { base: 88000, extraManual: 42000, total: 130000, settle: "선착불" },
    remarksRaw: "까대기 있음, 두 명이서 내려주세요 / 3분의 1차지",
    conditions: [
      { type: "상하차방식", value: "수작업 (까대기)", evidence: "까대기 있음", status: "명시" },
      { type: "취급요건", value: "2인 작업 요구", evidence: "두 명이서 내려주세요", status: "명시" },
      { type: "적재형태", value: "적재함 1/3 사용", evidence: "3분의 1차지", status: "명시" },
    ],
    vehicleFit: { ok: true, reason: "" },
    postedAt: "2026-08-13T12:10:33",
  },
  {
    id: "SO-0813-09",
    source: "kakao",
    shipper: "한성유리",
    pickup: { sido: "경기", sigungu: "김포시", dong: "양촌읍", date: "D+0", dateISO: "2026-08-13", time: "15:40", manual: false, forklift: true },
    dropoff: { sido: "경기", sigungu: "용인시", dong: "기흥구", date: "D+0", dateISO: "2026-08-13", time: "17:50", manual: false, forklift: true },
    vehicle: { ton: 5, body: "윙바디" },
    loadOption: "독차",
    distance: { toPickupKm: 71.3, haulKm: 68 },
    durationMin: 130,
    fare: { base: 148000, extraManual: 0, total: 148000, settle: "인수증" },
    remarksRaw: "띠띠빵빵",
    conditions: [
      { type: "취급요건", value: "해석 불가", evidence: "띠띠빵빵", status: "미상" },
    ],
    vehicleFit: { ok: true, reason: "" },
    postedAt: "2026-08-13T12:33:14",
  },
  {
    id: "SO-0813-10",
    source: "kakao",
    shipper: "신흥금속",
    pickup: { sido: "인천", sigungu: "서구", dong: "석남동", date: "D+0", dateISO: "2026-08-13", time: "16:10", manual: false, forklift: true },
    dropoff: { sido: "경기", sigungu: "안양시", dong: "동안구", date: "D+0", dateISO: "2026-08-13", time: "17:20", manual: false, forklift: true },
    vehicle: { ton: 5, body: "카고" },
    loadOption: "독차",
    distance: { toPickupKm: 39.8, haulKm: 32 },
    durationMin: 70,
    fare: { base: 105000, extraManual: 0, total: 105000, settle: "인수증" },
    remarksRaw: "",
    conditions: [],
    vehicleFit: { ok: true, reason: "" },
    postedAt: "2026-08-13T12:48:02",
  },

  // ── D+1 : 2026-08-14 (금) — 택배 없는 날 ─────────────────────
  //  택배 간선이 멈추면서 그 차량들이 스팟 시장으로 유입 → 공급 과잉.
  //  물량은 8/13보다 적고, 운임은 낮으며, 수락 경쟁이 가장 치열하다.
  //  단 쿠팡·SSG·컬리 간선은 정상 운영되므로 해당 화주 오더는 유지.
  {
    id: "SO-0814-01",
    source: "kakao",
    shipper: "쿠팡 인천4센터",
    pickup: { sido: "인천", sigungu: "서구", dong: "원창동", date: "D+1", dateISO: "2026-08-14", time: "08:00", manual: false, forklift: true },
    dropoff: { sido: "경기", sigungu: "이천시", dong: "마장면", date: "D+1", dateISO: "2026-08-14", time: "10:40", manual: false, forklift: true },
    vehicle: { ton: 5, body: "윙바디" },
    loadOption: "독차",
    distance: { toPickupKm: 52.0, haulKm: 96 },
    durationMin: 160,
    fare: { base: 168000, extraManual: 0, total: 168000, settle: "인수증" },
    remarksRaw: "롤테이너 14개 / 지게차 상하차 / 게이트 인 시간 엄수",
    conditions: [
      { type: "적재형태", value: "롤테이너 14개", evidence: "롤테이너 14개", status: "명시" },
      { type: "상하차방식", value: "지게차 상하차", evidence: "지게차 상하차", status: "명시" },
      { type: "시간제약", value: "게이트 인 시각 엄수", evidence: "게이트 인 시간 엄수", status: "명시" },
    ],
    vehicleFit: { ok: true, reason: "" },
    postedAt: "2026-08-13T13:02:11",
  },
  {
    id: "SO-0814-02",
    source: "kakao",
    shipper: "대륙정공",
    pickup: { sido: "경기", sigungu: "화성시", dong: "동탄면", date: "D+1", dateISO: "2026-08-14", time: "09:30", manual: false, forklift: true },
    dropoff: { sido: "충남", sigungu: "아산시", dong: "둔포면", date: "D+1", dateISO: "2026-08-14", time: "10:50", manual: false, forklift: true },
    vehicle: { ton: 5, body: "윙바디" },
    loadOption: "독차",
    distance: { toPickupKm: 14.2, haulKm: 46 },
    durationMin: 80,
    fare: { base: 112000, extraManual: 0, total: 112000, settle: "인수증" },
    remarksRaw: "연휴 전 마지막 납품건입니다. 지연 불가",
    conditions: [
      { type: "시간제약", value: "연휴 전 당일 납품 필수 (지연 불가)", evidence: "연휴 전 마지막 납품건입니다. 지연 불가", status: "명시" },
    ],
    vehicleFit: { ok: true, reason: "" },
    postedAt: "2026-08-13T13:15:40",
  },
  {
    id: "SO-0814-03",
    source: "kakao",
    shipper: "삼호산업",
    pickup: { sido: "경기", sigungu: "안산시", dong: "원시동", date: "D+1", dateISO: "2026-08-14", time: "10:00", manual: true, forklift: false },
    dropoff: { sido: "경기", sigungu: "파주시", dong: "월롱면", date: "D+1", dateISO: "2026-08-14", time: "12:20", manual: true, forklift: false },
    vehicle: { ton: 5, body: "카고" },
    loadOption: "독차",
    distance: { toPickupKm: 26.4, haulKm: 82 },
    durationMin: 140,
    fare: { base: 152000, extraManual: 30000, total: 182000, settle: "선착불" },
    remarksRaw: "상차지 야적장입니다. 비 오면 진입 곤란해요 / 갑바 있으신 분",
    conditions: [
      { type: "장소특성", value: "상차지 야적장 — 우천 시 진입 곤란", evidence: "상차지 야적장입니다. 비 오면 진입 곤란해요", status: "명시" },
      { type: "취급요건", value: "갑바 보유 필요", evidence: "갑바 있으신 분", status: "명시" },
      { type: "상하차방식", value: "수작업 추정", evidence: "야적장", status: "추정" },
    ],
    vehicleFit: { ok: true, reason: "" },
    postedAt: "2026-08-13T13:31:58",
  },
  {
    id: "SO-0814-04",
    source: "kakao",
    shipper: "동방포장",
    pickup: { sido: "경기", sigungu: "군포시", dong: "부곡동", date: "D+1", dateISO: "2026-08-14", time: "11:00", manual: false, forklift: true },
    dropoff: { sido: "경기", sigungu: "포천시", dong: "소흘읍", date: "D+1", dateISO: "2026-08-14", time: "13:10", manual: false, forklift: true },
    vehicle: { ton: 5, body: "윙바디" },
    loadOption: "혼적",
    distance: { toPickupKm: 22.9, haulKm: 74 },
    durationMin: 130,
    fare: { base: 128000, extraManual: 0, total: 128000, settle: "인수증" },
    remarksRaw: "혼적_11박스 / 폭염 취급주의, 상차 후 지체 없이 출발 부탁드립니다",
    conditions: [
      { type: "적재형태", value: "혼적 11박스", evidence: "혼적_11박스", status: "명시" },
      { type: "취급요건", value: "고온 취약 화물 — 상차 후 즉시 출발", evidence: "폭염 취급주의, 상차 후 지체 없이 출발 부탁드립니다", status: "명시" },
    ],
    vehicleFit: { ok: true, reason: "" },
    postedAt: "2026-08-13T13:52:07",
  },
  {
    id: "SO-0814-05",
    source: "kakao",
    shipper: "컬리 김포물류센터",
    pickup: { sido: "경기", sigungu: "김포시", dong: "고촌읍", date: "D+1", dateISO: "2026-08-14", time: "19:30", manual: false, forklift: true },
    dropoff: { sido: "경기", sigungu: "용인시", dong: "처인구", date: "D+2+", dateISO: "2026-08-15", time: "05:30", manual: false, forklift: true },
    vehicle: { ton: 5, body: "윙바디" },
    loadOption: "독차",
    distance: { toPickupKm: 68.5, haulKm: 88 },
    durationMin: 120,
    fare: { base: 185000, extraManual: 0, total: 185000, settle: "인수증" },
    remarksRaw: "야간 상차 후 익일 새벽 하차 / 파렛트 10개 / 05:30 도크 배정",
    conditions: [
      { type: "시간제약", value: "야간 상차 (19:30)", evidence: "야간 상차 후 익일 새벽 하차", status: "명시" },
      { type: "시간제약", value: "익일 05:30 도크 배정", evidence: "05:30 도크 배정", status: "명시" },
      { type: "적재형태", value: "파렛트 10개", evidence: "파렛트 10개", status: "명시" },
    ],
    vehicleFit: { ok: true, reason: "" },
    postedAt: "2026-08-13T14:08:22",
  },
  {
    id: "SO-0814-06",
    source: "kakao",
    shipper: "청우기계",
    pickup: { sido: "경기", sigungu: "부천시", dong: "오정동", date: "D+1", dateISO: "2026-08-14", time: "08:30", manual: true, forklift: false },
    dropoff: { sido: "경남", sigungu: "하동군", dong: "화개면", date: "D+2+", dateISO: "2026-08-15", time: "08:00", manual: true, forklift: false },
    vehicle: { ton: 5, body: "카고" },
    loadOption: "혼적",
    distance: { toPickupKm: 44.0, haulKm: 340 },
    durationMin: 330,
    fare: { base: 285000, extraManual: 45000, total: 330000, settle: "선착불" },
    remarksRaw: ".박스(젤리) 50개정도 / 3분의 1차지 / 내일08시이후 하차",
    conditions: [
      { type: "적재형태", value: "박스(젤리) 약 50개", evidence: ".박스(젤리) 50개정도", status: "명시" },
      { type: "적재형태", value: "적재함 1/3 사용", evidence: "3분의 1차지", status: "명시" },
      { type: "시간제약", value: "익일 08시 이후 하차", evidence: "내일08시이후 하차", status: "명시" },
      { type: "상하차방식", value: "수작업", evidence: "박스(젤리) 50개정도", status: "추정" },
    ],
    vehicleFit: { ok: true, reason: "" },
    postedAt: "2026-08-13T14:22:49",
  },
  {
    id: "SO-0814-07",
    source: "kakao",
    shipper: "대한특수강",
    pickup: { sido: "경기", sigungu: "평택시", dong: "청북읍", date: "D+1", dateISO: "2026-08-14", time: "13:00", manual: false, forklift: true },
    dropoff: { sido: "경북", sigungu: "구미시", dong: "공단동", date: "D+1", dateISO: "2026-08-14", time: "17:40", manual: false, forklift: true },
    vehicle: { ton: 11, body: "카고" },
    loadOption: "독차",
    distance: { toPickupKm: 24.1, haulKm: 250 },
    durationMin: 280,
    fare: { base: 465000, extraManual: 0, total: 465000, settle: "인수증" },
    remarksRaw: "중량물 / 지게차 상차, 하차지 크레인 / 결박 철저",
    conditions: [
      { type: "상하차방식", value: "지게차 상차 · 크레인 하차", evidence: "지게차 상차, 하차지 크레인", status: "명시" },
      { type: "취급요건", value: "결박 철저", evidence: "결박 철저", status: "명시" },
    ],
    vehicleFit: { ok: false, reason: "요구 톤급 11톤 · 보유 차량 5톤" },
    postedAt: "2026-08-13T14:40:15",
  },
  {
    id: "SO-0814-08",
    source: "kakao",
    shipper: "성진전자",
    pickup: { sido: "경기", sigungu: "수원시", dong: "권선구", date: "D+1", dateISO: "2026-08-14", time: "14:30", manual: false, forklift: true },
    dropoff: { sido: "충북", sigungu: "진천군", dong: "덕산읍", date: "D+1", dateISO: "2026-08-14", time: "16:20", manual: false, forklift: true },
    vehicle: { ton: 5, body: "윙바디" },
    loadOption: "독차",
    distance: { toPickupKm: 18.6, haulKm: 92 },
    durationMin: 110,
    fare: { base: 158000, extraManual: 0, total: 158000, settle: "인수증" },
    remarksRaw: "기가스",
    conditions: [
      { type: "취급요건", value: "해석 불가", evidence: "기가스", status: "미상" },
    ],
    vehicleFit: { ok: true, reason: "" },
    postedAt: "2026-08-13T14:55:03",
  },
  {
    id: "SO-0814-09",
    source: "external",
    shipper: "SSG 김포NEO",
    pickup: { sido: "경기", sigungu: "김포시", dong: "고촌읍", date: "D+1", dateISO: "2026-08-14", time: "20:00", manual: false, forklift: true },
    dropoff: { sido: "인천", sigungu: "연수구", dong: "송도동", date: "D+2+", dateISO: "2026-08-15", time: "04:40", manual: false, forklift: true },
    vehicle: { ton: 5, body: "윙바디" },
    loadOption: "독차",
    distance: { toPickupKm: 68.5, haulKm: 52 },
    durationMin: 90,
    fare: { base: 142000, extraManual: 0, total: 142000, settle: "후불" },
    remarksRaw: "야상 / 새벽 하차 / 냉장 아님, 상온 화물입니다",
    conditions: [
      { type: "시간제약", value: "야간 상차 (20:00)", evidence: "야상", status: "명시" },
      { type: "시간제약", value: "익일 새벽 하차", evidence: "새벽 하차", status: "명시" },
      { type: "취급요건", value: "상온 화물 (냉장 불요)", evidence: "냉장 아님, 상온 화물입니다", status: "명시" },
    ],
    vehicleFit: { ok: true, reason: "" },
    postedAt: "2026-08-13T15:10:38",
  },
  {
    id: "SO-0814-10",
    source: "kakao",
    shipper: "명진테크",
    pickup: { sido: "경기", sigungu: "광주시", dong: "초월읍", date: "D+1", dateISO: "2026-08-14", time: "10:30", manual: false, forklift: true },
    dropoff: { sido: "경기", sigungu: "안성시", dong: "공도읍", date: "D+1", dateISO: "2026-08-14", time: "12:00", manual: false, forklift: true },
    vehicle: { ton: 5, body: "윙바디" },
    loadOption: "독차",
    distance: { toPickupKm: 57.8, haulKm: 58 },
    durationMin: 90,
    fare: { base: 118000, extraManual: 0, total: 118000, settle: "인수증" },
    remarksRaw: "하차지 협소, 5톤까지만 진입 가능 / 파렛트 6개",
    conditions: [
      { type: "장소특성", value: "하차지 협소 — 5톤 이하만 진입", evidence: "하차지 협소, 5톤까지만 진입 가능", status: "명시" },
      { type: "적재형태", value: "파렛트 6개", evidence: "파렛트 6개", status: "명시" },
    ],
    vehicleFit: { ok: true, reason: "" },
    postedAt: "2026-08-13T15:28:44",
  },

  // ── D+2+ : 2026-08-15 이후 ─────────────────────────────────
  //  8/15(토) 광복절 · 8/16(일) · 8/17(월) 대체공휴일 → 물량 최소.
  //  8/18(화) 연휴 후 적체 해소로 급증.
  //  타사 필터가 '모레이후'를 하나로 뭉친 것과 같이, 세분하지 않는다.
  {
    id: "SO-0815-01",
    source: "kakao",
    shipper: "미래식품",
    pickup: { sido: "경기", sigungu: "이천시", dong: "부발읍", date: "D+2+", dateISO: "2026-08-15", time: "06:00", manual: false, forklift: true },
    dropoff: { sido: "서울", sigungu: "강서구", dong: "외발산동", date: "D+2+", dateISO: "2026-08-15", time: "08:20", manual: false, forklift: true },
    vehicle: { ton: 5, body: "윙바디" },
    loadOption: "독차",
    distance: { toPickupKm: 76.0, haulKm: 78 },
    durationMin: 140,
    fare: { base: 172000, extraManual: 0, total: 172000, settle: "인수증" },
    remarksRaw: "공휴일 운행건 / 파렛트 8개 / 지게차 상하차",
    conditions: [
      { type: "시간제약", value: "공휴일 운행", evidence: "공휴일 운행건", status: "명시" },
      { type: "적재형태", value: "파렛트 8개", evidence: "파렛트 8개", status: "명시" },
      { type: "상하차방식", value: "지게차 상하차", evidence: "지게차 상하차", status: "명시" },
    ],
    vehicleFit: { ok: true, reason: "" },
    postedAt: "2026-08-13T15:44:12",
  },
  {
    id: "SO-0818-01",
    source: "kakao",
    shipper: "대성정밀",
    pickup: { sido: "경기", sigungu: "화성시", dong: "향남읍", date: "D+2+", dateISO: "2026-08-18", time: "08:00", manual: false, forklift: true },
    dropoff: { sido: "충북", sigungu: "청주시", dong: "오송읍", date: "D+2+", dateISO: "2026-08-18", time: "10:20", manual: false, forklift: true },
    vehicle: { ton: 5, body: "윙바디" },
    loadOption: "독차",
    distance: { toPickupKm: 6.2, haulKm: 110 },
    durationMin: 140,
    fare: { base: 205000, extraManual: 0, total: 205000, settle: "인수증" },
    remarksRaw: "연휴 적체분 / 파렛트 12개 / 지게차 상하차 / 오전 중 하차 필수",
    conditions: [
      { type: "적재형태", value: "파렛트 12개", evidence: "파렛트 12개", status: "명시" },
      { type: "상하차방식", value: "지게차 상하차", evidence: "지게차 상하차", status: "명시" },
      { type: "시간제약", value: "오전 중 하차 필수", evidence: "오전 중 하차 필수", status: "명시" },
    ],
    vehicleFit: { ok: true, reason: "" },
    postedAt: "2026-08-13T16:02:30",
  },
  {
    id: "SO-0818-02",
    source: "kakao",
    shipper: "한빛산업자재",
    pickup: { sido: "경기", sigungu: "안산시", dong: "성곡동", date: "D+2+", dateISO: "2026-08-18", time: "09:00", manual: true, forklift: false },
    dropoff: { sido: "충남", sigungu: "천안시", dong: "서북구", date: "D+2+", dateISO: "2026-08-18", time: "10:40", manual: true, forklift: false },
    vehicle: { ton: 5, body: "카고" },
    loadOption: "독차",
    distance: { toPickupKm: 31.5, haulKm: 74 },
    durationMin: 100,
    fare: { base: 165000, extraManual: 38000, total: 203000, settle: "인수증" },
    remarksRaw: "우천 시 상차 30분~1시간 지연 가능 / 까대기 / 인수증 필수",
    conditions: [
      { type: "시간제약", value: "우천 시 상차 30~60분 지연 가능", evidence: "우천 시 상차 30분~1시간 지연 가능", status: "명시" },
      { type: "상하차방식", value: "수작업 (까대기)", evidence: "까대기", status: "명시" },
    ],
    vehicleFit: { ok: true, reason: "" },
    postedAt: "2026-08-13T16:19:05",
  },
  {
    id: "SO-0818-03",
    source: "kakao",
    shipper: "성문화학",
    pickup: { sido: "경기", sigungu: "평택시", dong: "포승읍", date: "D+2+", dateISO: "2026-08-18", time: "13:00", manual: false, forklift: true },
    dropoff: { sido: "대구", sigungu: "달서구", dong: "월암동", date: "D+2+", dateISO: "2026-08-18", time: "17:50", manual: false, forklift: true },
    vehicle: { ton: 8, body: "윙바디" },
    loadOption: "독차",
    distance: { toPickupKm: 28.7, haulKm: 285 },
    durationMin: 290,
    fare: { base: 395000, extraManual: 0, total: 395000, settle: "인수증" },
    remarksRaw: "월말 마감건이라 지연 불가 / 파렛트 18개",
    conditions: [
      { type: "시간제약", value: "지연 불가 (월말 마감)", evidence: "월말 마감건이라 지연 불가", status: "명시" },
      { type: "적재형태", value: "파렛트 18개", evidence: "파렛트 18개", status: "명시" },
    ],
    vehicleFit: { ok: false, reason: "요구 톤급 8톤 · 보유 차량 5톤" },
    postedAt: "2026-08-13T16:35:41",
  },
  {
    id: "SO-0818-04",
    source: "kakao",
    shipper: "우진로지스",
    pickup: { sido: "인천", sigungu: "중구", dong: "신흥동", date: "D+2+", dateISO: "2026-08-18", time: "07:30", manual: false, forklift: true },
    dropoff: { sido: "경기", sigungu: "평택시", dong: "포승읍", date: "D+2+", dateISO: "2026-08-18", time: "09:10", manual: false, forklift: true },
    vehicle: { ton: 5, body: "윙바디" },
    loadOption: "독차",
    distance: { toPickupKm: 62.0, haulKm: 76 },
    durationMin: 100,
    fare: { base: 158000, extraManual: 0, total: 158000, settle: "선착불" },
    remarksRaw: "상차지 대기 좀 있음 / 파렛트 9개 / 인수증 3장 챙기고 바로 콜",
    conditions: [
      { type: "시간제약", value: "상차지 대기 발생 가능 (시간 미명시)", evidence: "상차지 대기 좀 있음", status: "명시" },
      { type: "적재형태", value: "파렛트 9개", evidence: "파렛트 9개", status: "명시" },
      { type: "취급요건", value: "해석 불가", evidence: "인수증 3장 챙기고 바로 콜", status: "미상" },
    ],
    vehicleFit: { ok: true, reason: "" },
    postedAt: "2026-08-13T16:51:17",
  },
];

// ============================================================
// 5. 과거 운행 기록 — 월간 캘린더용 (2026-07-14 ~ 08-12)
//    ★ postedAt / acceptedAt이 짝으로 있어야
//      "몇 초 만에 되돌릴 수 없는 수락"이 데이터로 증명된다.
// ============================================================

export const pastTrips: PastTrip[] = [
  { id: "PT-0714-1", source: "kakao", shipper: "대성정밀", dateISO: "2026-07-14", route: { from: "화성 향남", to: "청주 오송" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 110 }, fare: { base: 188000, extraManual: 0, total: 188000, settle: "인수증" }, remarksRaw: "지게차 상하차 / 파렛트 12개", postedAt: "2026-07-14T07:12:03", acceptedAt: "2026-07-14T07:12:19", plannedPickup: "09:00", plannedDropoff: "11:20", actualDropoff: "11:35", waitMinutes: 25, manualWork: false, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0714-2", source: "kakao", shipper: "신흥금속", dateISO: "2026-07-14", route: { from: "청주 오송", to: "안양 동안" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 118 }, fare: { base: 195000, extraManual: 0, total: 195000, settle: "인수증" }, remarksRaw: "파렛트 10개", postedAt: "2026-07-14T12:40:55", acceptedAt: "2026-07-14T12:52:11", plannedPickup: "14:00", plannedDropoff: "16:20", actualDropoff: "16:10", waitMinutes: 15, manualWork: false, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0715-1", source: "kakao", shipper: "한빛산업자재", dateISO: "2026-07-15", route: { from: "안산 성곡", to: "천안 삼룡" }, vehicle: { ton: 5, body: "카고" }, distance: { haulKm: 78 }, fare: { base: 158000, extraManual: 0, total: 158000, settle: "인수증" }, remarksRaw: "지게차 하차 / 파렛트 8개", postedAt: "2026-07-15T08:03:41", acceptedAt: "2026-07-15T08:03:52", plannedPickup: "10:00", plannedDropoff: "11:40", actualDropoff: "13:05", waitMinutes: 85, manualWork: true, conditionMismatch: true, mismatchDetail: "오더에 지게차 하차로 표기되었으나 실제로는 절반 이상 수작업. 추가운임 협의 없이 진행" },
  { id: "PT-0715-2", source: "kakao", shipper: "세일기업", dateISO: "2026-07-15", route: { from: "천안 삼룡", to: "평택 청북" }, vehicle: { ton: 5, body: "카고" }, distance: { haulKm: 42 }, fare: { base: 98000, extraManual: 0, total: 98000, settle: "인수증" }, remarksRaw: "", postedAt: "2026-07-15T13:20:11", acceptedAt: "2026-07-15T13:41:05", plannedPickup: "14:30", plannedDropoff: "15:50", actualDropoff: "17:10", waitMinutes: 55, manualWork: true, conditionMismatch: true, mismatchDetail: "비고란이 비어 있었으나 하차지에서 전량 수작업. 추가운임 없이 진행" },
  { id: "PT-0716-1", source: "kakao", shipper: "우성목재", dateISO: "2026-07-16", route: { from: "일산 성석", to: "부천 심곡" }, vehicle: { ton: 5, body: "카고" }, distance: { haulKm: 28 }, fare: { base: 92000, extraManual: 25000, total: 117000, settle: "인수증" }, remarksRaw: "길이3600각재 / 더조은목재", postedAt: "2026-07-16T09:22:14", acceptedAt: "2026-07-16T09:38:02", plannedPickup: "11:00", plannedDropoff: "12:10", actualDropoff: "12:20", waitMinutes: 20, manualWork: true, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0716-2", source: "external", shipper: "삼호산업", dateISO: "2026-07-16", route: { from: "부천 오정", to: "파주 월롱" }, vehicle: { ton: 5, body: "카고" }, distance: { haulKm: 46 }, fare: { base: 112000, extraManual: 0, total: 112000, settle: "선착불" }, remarksRaw: "야적장 상차", postedAt: "2026-07-16T13:50:08", acceptedAt: "2026-07-16T14:31:40", plannedPickup: "15:30", plannedDropoff: "16:40", actualDropoff: "17:55", waitMinutes: 70, manualWork: false, conditionMismatch: true, mismatchDetail: "야적장 진입로 공사로 우회. 오더에 기재 없음" },
  { id: "PT-0717-1", source: "kakao", shipper: "성문화학", dateISO: "2026-07-17", route: { from: "평택 포승", to: "이천 부발" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 82 }, fare: { base: 162000, extraManual: 0, total: 162000, settle: "선착불" }, remarksRaw: "갑바 필수", postedAt: "2026-07-17T07:45:30", acceptedAt: "2026-07-17T07:45:44", plannedPickup: "09:30", plannedDropoff: "11:20", actualDropoff: "11:15", waitMinutes: 10, manualWork: false, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0717-2", source: "kakao", shipper: "명진테크", dateISO: "2026-07-17", route: { from: "이천 부발", to: "안성 공도" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 54 }, fare: { base: 115000, extraManual: 0, total: 115000, settle: "인수증" }, remarksRaw: "", postedAt: "2026-07-17T12:15:02", acceptedAt: "2026-07-17T12:47:19", plannedPickup: "14:00", plannedDropoff: "15:20", actualDropoff: "15:30", waitMinutes: 30, manualWork: false, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0720-1", source: "kakao", shipper: "동양기전", dateISO: "2026-07-20", route: { from: "시흥 정왕", to: "창원 성산" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 330 }, fare: { base: 318000, extraManual: 0, total: 318000, settle: "인수증" }, remarksRaw: "앞 공정 끝나고 상차 / 내일08시이전 하차", postedAt: "2026-07-20T16:02:11", acceptedAt: "2026-07-20T16:02:23", plannedPickup: "18:30", plannedDropoff: "07:00", actualDropoff: "07:20", waitMinutes: 95, manualWork: false, conditionMismatch: true, mismatchDetail: "선행 공정 지연으로 상차가 19:50에 시작. 오더의 18:30 기준과 80분 차이" },
  { id: "PT-0721-1", source: "kakao", shipper: "청우기계", dateISO: "2026-07-21", route: { from: "부천 오정", to: "수원 권선" }, vehicle: { ton: 5, body: "카고" }, distance: { haulKm: 44 }, fare: { base: 108000, extraManual: 32000, total: 140000, settle: "선착불" }, remarksRaw: "까대기 있음", postedAt: "2026-07-21T08:30:44", acceptedAt: "2026-07-21T08:31:02", plannedPickup: "10:00", plannedDropoff: "11:10", actualDropoff: "12:40", waitMinutes: 55, manualWork: true, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0721-2", source: "kakao", shipper: "성진전자", dateISO: "2026-07-21", route: { from: "수원 권선", to: "진천 덕산" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 92 }, fare: { base: 155000, extraManual: 0, total: 155000, settle: "인수증" }, remarksRaw: "파렛트 7개", postedAt: "2026-07-21T13:40:19", acceptedAt: "2026-07-21T13:44:55", plannedPickup: "15:00", plannedDropoff: "16:50", actualDropoff: "16:45", waitMinutes: 15, manualWork: false, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0722-1", source: "kakao", shipper: "한성유리", dateISO: "2026-07-22", route: { from: "김포 양촌", to: "용인 기흥" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 68 }, fare: { base: 145000, extraManual: 0, total: 145000, settle: "인수증" }, remarksRaw: "파손주의 / 보양 필요", postedAt: "2026-07-22T09:05:33", acceptedAt: "2026-07-22T09:05:41", plannedPickup: "11:00", plannedDropoff: "13:10", actualDropoff: "13:00", waitMinutes: 20, manualWork: false, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0722-2", source: "kakao", shipper: "명진테크", dateISO: "2026-07-22", route: { from: "용인 기흥", to: "안성 공도" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 38 }, fare: { base: 95000, extraManual: 0, total: 95000, settle: "인수증" }, remarksRaw: "대기 좀 있음", postedAt: "2026-07-22T13:15:40", acceptedAt: "2026-07-22T13:52:18", plannedPickup: "14:30", plannedDropoff: "15:50", actualDropoff: "17:40", waitMinutes: 110, manualWork: false, conditionMismatch: true, mismatchDetail: "'대기 좀 있음'의 실제는 1시간 50분. 정량 표기 없어 사전 판단 불가" },
  { id: "PT-0723-1", source: "kakao", shipper: "동방포장", dateISO: "2026-07-23", route: { from: "군포 부곡", to: "포천 소흘" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 74 }, fare: { base: 125000, extraManual: 0, total: 125000, settle: "인수증" }, remarksRaw: "혼적_9박스", postedAt: "2026-07-23T10:20:07", acceptedAt: "2026-07-23T11:02:38", plannedPickup: "13:00", plannedDropoff: "15:10", actualDropoff: "15:25", waitMinutes: 35, manualWork: true, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0723-2", source: "external", shipper: "우진로지스", dateISO: "2026-07-23", route: { from: "포천 소흘", to: "인천 중구" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 96 }, fare: { base: 168000, extraManual: 0, total: 168000, settle: "후불" }, remarksRaw: "대기 좀 있음", postedAt: "2026-07-23T15:44:12", acceptedAt: "2026-07-23T16:20:50", plannedPickup: "17:30", plannedDropoff: "19:20", actualDropoff: "21:10", waitMinutes: 145, manualWork: false, conditionMismatch: true, mismatchDetail: "'대기 좀 있음'의 실제는 2시간 25분. 정량 표기 없어 사전 판단 불가했음" },
  { id: "PT-0724-1", source: "kakao", shipper: "대륙정공", dateISO: "2026-07-24", route: { from: "화성 동탄", to: "아산 둔포" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 46 }, fare: { base: 110000, extraManual: 0, total: 110000, settle: "인수증" }, remarksRaw: "파렛트 5개", postedAt: "2026-07-24T08:12:55", acceptedAt: "2026-07-24T08:13:07", plannedPickup: "09:30", plannedDropoff: "10:50", actualDropoff: "10:45", waitMinutes: 10, manualWork: false, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0724-2", source: "kakao", shipper: "미래식품", dateISO: "2026-07-24", route: { from: "아산 둔포", to: "송파 문정" }, vehicle: { ton: 5, body: "카고" }, distance: { haulKm: 98 }, fare: { base: 172000, extraManual: 40000, total: 212000, settle: "선착불" }, remarksRaw: "3분의 1차지 / 두 명이서 내려주세요", postedAt: "2026-07-24T12:33:41", acceptedAt: "2026-07-24T12:33:58", plannedPickup: "14:00", plannedDropoff: "16:10", actualDropoff: "17:30", waitMinutes: 40, manualWork: true, conditionMismatch: true, mismatchDetail: "하차지에 인력 1명만 있어 사실상 단독 수작업. 오더의 '두 명' 조건 미이행" },
  { id: "PT-0727-1", source: "kakao", shipper: "대성정밀", dateISO: "2026-07-27", route: { from: "화성 향남", to: "청주 오송" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 110 }, fare: { base: 185000, extraManual: 0, total: 185000, settle: "인수증" }, remarksRaw: "지게차 상하차 / 파렛트 12개", postedAt: "2026-07-27T07:10:22", acceptedAt: "2026-07-27T07:10:35", plannedPickup: "09:00", plannedDropoff: "11:20", actualDropoff: "11:25", waitMinutes: 20, manualWork: false, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0727-2", source: "kakao", shipper: "성진전자", dateISO: "2026-07-27", route: { from: "청주 오송", to: "진천 덕산" }, vehicle: { ton: 5, body: "카고" }, distance: { haulKm: 32 }, fare: { base: 92000, extraManual: 30000, total: 122000, settle: "선착불" }, remarksRaw: "까대기 / 파렛트 없이 손하차", postedAt: "2026-07-27T11:40:22", acceptedAt: "2026-07-27T11:40:39", plannedPickup: "13:00", plannedDropoff: "14:10", actualDropoff: "14:55", waitMinutes: 25, manualWork: true, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0728-1", source: "kakao", shipper: "신흥금속", dateISO: "2026-07-28", route: { from: "인천 석남", to: "안양 동안" }, vehicle: { ton: 5, body: "카고" }, distance: { haulKm: 32 }, fare: { base: 102000, extraManual: 0, total: 102000, settle: "인수증" }, remarksRaw: "", postedAt: "2026-07-28T09:41:18", acceptedAt: "2026-07-28T10:15:03", plannedPickup: "11:30", plannedDropoff: "12:40", actualDropoff: "12:35", waitMinutes: 15, manualWork: false, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0728-2", source: "kakao", shipper: "성문화학", dateISO: "2026-07-28", route: { from: "안양 동안", to: "평택 포승" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 64 }, fare: { base: 132000, extraManual: 0, total: 132000, settle: "선착불" }, remarksRaw: "갑바 꼼꼼히", postedAt: "2026-07-28T13:20:44", acceptedAt: "2026-07-28T13:26:11", plannedPickup: "15:00", plannedDropoff: "16:40", actualDropoff: "16:50", waitMinutes: 25, manualWork: false, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0729-1", source: "kakao", shipper: "쿠팡 인천4센터", dateISO: "2026-07-29", route: { from: "인천 원창", to: "이천 마장" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 96 }, fare: { base: 175000, extraManual: 0, total: 175000, settle: "인수증" }, remarksRaw: "롤테이너 14개 / 게이트 인 시간 엄수", postedAt: "2026-07-29T06:50:12", acceptedAt: "2026-07-29T06:50:21", plannedPickup: "08:00", plannedDropoff: "10:40", actualDropoff: "10:35", waitMinutes: 30, manualWork: false, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0729-2", source: "kakao", shipper: "한일유통", dateISO: "2026-07-29", route: { from: "이천 마장", to: "여주 가남" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 26 }, fare: { base: 90000, extraManual: 0, total: 90000, settle: "인수증" }, remarksRaw: "", postedAt: "2026-07-29T10:50:14", acceptedAt: "2026-07-29T11:26:03", plannedPickup: "12:00", plannedDropoff: "13:00", actualDropoff: "13:15", waitMinutes: 35, manualWork: false, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0730-1", source: "kakao", shipper: "명진테크", dateISO: "2026-07-30", route: { from: "광주 초월", to: "안성 공도" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 58 }, fare: { base: 116000, extraManual: 0, total: 116000, settle: "인수증" }, remarksRaw: "하차지 협소, 5톤까지만", postedAt: "2026-07-30T09:15:37", acceptedAt: "2026-07-30T09:16:04", plannedPickup: "10:30", plannedDropoff: "12:00", actualDropoff: "12:15", waitMinutes: 25, manualWork: false, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0730-2", source: "kakao", shipper: "한빛산업자재", dateISO: "2026-07-30", route: { from: "안성 공도", to: "천안 서북" }, vehicle: { ton: 5, body: "카고" }, distance: { haulKm: 38 }, fare: { base: 105000, extraManual: 30000, total: 135000, settle: "인수증" }, remarksRaw: "까대기 / 보양필요", postedAt: "2026-07-30T13:44:09", acceptedAt: "2026-07-30T13:52:38", plannedPickup: "15:00", plannedDropoff: "16:10", actualDropoff: "17:20", waitMinutes: 45, manualWork: true, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0731-1", source: "kakao", shipper: "대한특수강", dateISO: "2026-07-31", route: { from: "평택 청북", to: "구미 공단" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 250 }, fare: { base: 288000, extraManual: 0, total: 288000, settle: "인수증" }, remarksRaw: "결박 철저", postedAt: "2026-07-31T07:22:50", acceptedAt: "2026-07-31T07:23:11", plannedPickup: "09:00", plannedDropoff: "13:40", actualDropoff: "14:10", waitMinutes: 50, manualWork: false, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0731-2", source: "external", shipper: "영남로지스", dateISO: "2026-07-31", route: { from: "구미 공단", to: "대구 달서" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 45 }, fare: { base: 105000, extraManual: 0, total: 105000, settle: "후불" }, remarksRaw: "", postedAt: "2026-07-31T14:30:08", acceptedAt: "2026-07-31T15:02:47", plannedPickup: "16:00", plannedDropoff: "17:10", actualDropoff: "17:30", waitMinutes: 30, manualWork: false, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0803-1", source: "kakao", shipper: "대성정밀", dateISO: "2026-08-03", route: { from: "화성 향남", to: "청주 오송" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 110 }, fare: { base: 182000, extraManual: 0, total: 182000, settle: "인수증" }, remarksRaw: "지게차 상하차 / 파렛트 12개", postedAt: "2026-08-03T07:08:44", acceptedAt: "2026-08-03T07:08:56", plannedPickup: "09:00", plannedDropoff: "11:20", actualDropoff: "11:30", waitMinutes: 20, manualWork: false, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0803-2", source: "external", shipper: "정진물류", dateISO: "2026-08-03", route: { from: "청주 오송", to: "원주 문막" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 128 }, fare: { base: 198000, extraManual: 0, total: 198000, settle: "후불" }, remarksRaw: "우천 시 윙바디만", postedAt: "2026-08-03T12:50:03", acceptedAt: "2026-08-03T13:22:41", plannedPickup: "14:30", plannedDropoff: "16:40", actualDropoff: "16:55", waitMinutes: 30, manualWork: false, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0804-1", source: "kakao", shipper: "삼호산업", dateISO: "2026-08-04", route: { from: "안산 원시", to: "파주 월롱" }, vehicle: { ton: 5, body: "카고" }, distance: { haulKm: 82 }, fare: { base: 148000, extraManual: 28000, total: 176000, settle: "선착불" }, remarksRaw: "야적장 상차 / 갑바 있으신 분", postedAt: "2026-08-04T08:44:19", acceptedAt: "2026-08-04T08:44:33", plannedPickup: "10:00", plannedDropoff: "12:20", actualDropoff: "13:40", waitMinutes: 65, manualWork: true, conditionMismatch: true, mismatchDetail: "국지성 호우로 야적장 상차 1시간 20분 지연. 우천 시 진입 조건이 오더에 없었음" },
  { id: "PT-0804-2", source: "kakao", shipper: "동방포장", dateISO: "2026-08-04", route: { from: "파주 월롱", to: "고양 덕양" }, vehicle: { ton: 5, body: "카고" }, distance: { haulKm: 22 }, fare: { base: 88000, extraManual: 32000, total: 120000, settle: "선착불" }, remarksRaw: "수작업 하차 / 박스 60개 / 엘리베이터 없음", postedAt: "2026-08-04T13:50:33", acceptedAt: "2026-08-04T13:50:44", plannedPickup: "15:00", plannedDropoff: "15:55", actualDropoff: "17:20", waitMinutes: 20, manualWork: true, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0805-1", source: "kakao", shipper: "동방포장", dateISO: "2026-08-05", route: { from: "군포 부곡", to: "포천 소흘" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 74 }, fare: { base: 122000, extraManual: 0, total: 122000, settle: "인수증" }, remarksRaw: "혼적_11박스 / 폭염 취급주의", postedAt: "2026-08-05T09:30:55", acceptedAt: "2026-08-05T09:31:07", plannedPickup: "11:00", plannedDropoff: "13:10", actualDropoff: "13:05", waitMinutes: 15, manualWork: true, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0805-2", source: "kakao", shipper: "성진전자", dateISO: "2026-08-05", route: { from: "포천 소흘", to: "진천 덕산" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 142 }, fare: { base: 212000, extraManual: 0, total: 212000, settle: "인수증" }, remarksRaw: "파렛트 7개", postedAt: "2026-08-05T14:22:07", acceptedAt: "2026-08-05T14:22:19", plannedPickup: "15:30", plannedDropoff: "18:00", actualDropoff: "18:20", waitMinutes: 35, manualWork: false, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0806-1", source: "kakao", shipper: "한성유리", dateISO: "2026-08-06", route: { from: "김포 양촌", to: "용인 기흥" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 68 }, fare: { base: 142000, extraManual: 0, total: 142000, settle: "인수증" }, remarksRaw: "띠띠빵빵", postedAt: "2026-08-06T10:05:41", acceptedAt: "2026-08-06T10:38:22", plannedPickup: "12:00", plannedDropoff: "14:10", actualDropoff: "14:30", waitMinutes: 40, manualWork: true, conditionMismatch: true, mismatchDetail: "'띠띠빵빵' 의미를 몰라 문의 없이 수락. 현장에서 지게차 없이 대차로 옮기는 작업이었음. 추가운임 없음" },
  { id: "PT-0806-2", source: "kakao", shipper: "청우기계", dateISO: "2026-08-06", route: { from: "용인 기흥", to: "수원 권선" }, vehicle: { ton: 5, body: "카고" }, distance: { haulKm: 18 }, fare: { base: 90000, extraManual: 28000, total: 118000, settle: "인수증" }, remarksRaw: "내려주고 오시면 됩니다", postedAt: "2026-08-06T14:44:19", acceptedAt: "2026-08-06T14:44:31", plannedPickup: "16:00", plannedDropoff: "16:50", actualDropoff: "17:35", waitMinutes: 15, manualWork: true, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0807-1", source: "kakao", shipper: "청우기계", dateISO: "2026-08-07", route: { from: "부천 오정", to: "하동 화개" }, vehicle: { ton: 5, body: "카고" }, distance: { haulKm: 340 }, fare: { base: 292000, extraManual: 45000, total: 337000, settle: "선착불" }, remarksRaw: "3분의 1차지 / 내일08시이후 하차", postedAt: "2026-08-07T07:15:12", acceptedAt: "2026-08-07T07:15:28", plannedPickup: "08:30", plannedDropoff: "08:00", actualDropoff: "07:50", waitMinutes: 60, manualWork: true, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0810-1", source: "kakao", shipper: "대륙정공", dateISO: "2026-08-10", route: { from: "화성 동탄", to: "아산 둔포" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 46 }, fare: { base: 108000, extraManual: 0, total: 108000, settle: "인수증" }, remarksRaw: "파렛트 5개", postedAt: "2026-08-10T08:02:33", acceptedAt: "2026-08-10T08:02:44", plannedPickup: "09:30", plannedDropoff: "10:50", actualDropoff: "10:55", waitMinutes: 15, manualWork: false, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0810-2", source: "kakao", shipper: "우진로지스", dateISO: "2026-08-10", route: { from: "아산 둔포", to: "인천 중구" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 118 }, fare: { base: 188000, extraManual: 0, total: 188000, settle: "선착불" }, remarksRaw: "상차지 대기 좀 있음", postedAt: "2026-08-10T12:40:18", acceptedAt: "2026-08-10T13:05:52", plannedPickup: "14:00", plannedDropoff: "16:20", actualDropoff: "18:05", waitMinutes: 130, manualWork: false, conditionMismatch: true, mismatchDetail: "대기 2시간 10분. 7/23 같은 화주에서 동일 패턴 반복" },
  { id: "PT-0811-1", source: "kakao", shipper: "미래식품", dateISO: "2026-08-11", route: { from: "이천 부발", to: "강서 외발산" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 78 }, fare: { base: 168000, extraManual: 0, total: 168000, settle: "인수증" }, remarksRaw: "파렛트 8개 / 지게차 상하차", postedAt: "2026-08-11T06:44:07", acceptedAt: "2026-08-11T06:44:15", plannedPickup: "08:00", plannedDropoff: "10:20", actualDropoff: "10:15", waitMinutes: 20, manualWork: false, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0811-2", source: "kakao", shipper: "우성목재", dateISO: "2026-08-11", route: { from: "강서 외발산", to: "일산 성석" }, vehicle: { ton: 5, body: "카고" }, distance: { haulKm: 34 }, fare: { base: 98000, extraManual: 26000, total: 124000, settle: "인수증" }, remarksRaw: "각재 / 윙 양쪽 개방 필요", postedAt: "2026-08-11T12:10:44", acceptedAt: "2026-08-11T12:24:19", plannedPickup: "13:30", plannedDropoff: "14:40", actualDropoff: "15:10", waitMinutes: 30, manualWork: true, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0812-1", source: "kakao", shipper: "대성정밀", dateISO: "2026-08-12", route: { from: "화성 향남", to: "청주 오송" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 110 }, fare: { base: 190000, extraManual: 0, total: 190000, settle: "인수증" }, remarksRaw: "지게차 상하차 / 파렛트 12개 / 연휴 전 물량", postedAt: "2026-08-12T07:05:19", acceptedAt: "2026-08-12T07:05:27", plannedPickup: "09:00", plannedDropoff: "11:20", actualDropoff: "11:20", waitMinutes: 15, manualWork: false, conditionMismatch: false, mismatchDetail: "" },
  { id: "PT-0812-2", source: "kakao", shipper: "동양기전", dateISO: "2026-08-12", route: { from: "청주 오송", to: "시흥 정왕" }, vehicle: { ton: 5, body: "윙바디" }, distance: { haulKm: 122 }, fare: { base: 196000, extraManual: 0, total: 196000, settle: "인수증" }, remarksRaw: "파렛트 11개", postedAt: "2026-08-12T13:02:41", acceptedAt: "2026-08-12T13:03:02", plannedPickup: "14:30", plannedDropoff: "17:00", actualDropoff: "17:15", waitMinutes: 30, manualWork: false, conditionMismatch: false, mismatchDetail: "" },
];

// ============================================================
// 6. 고정 스케줄 — D+3 이후 캘린더는 이것으로만 채운다
//    근거: 주선업체 거래 중 단건(수시) 54.1% → 나머지 45.9%는 장기계약
//         (한국교통연구원, 2025, 표Ⅱ-10, p.17)
//    스팟 오더와 달리 1회 등록으로 지속 반복되므로 입력 유인이 성립한다.
// ============================================================

export const fixedSchedules: FixedSchedule[] = [
  {
    id: "FS-01",
    shipper: "대성정밀",
    pattern: "매주 월·수·금",
    weekdays: [1, 3, 5],
    route: { from: "경기 화성시 향남읍", to: "충북 청주시 오송읍" },
    vehicle: { ton: 5, body: "윙바디" },
    pickupTime: "09:00",
    dropoffTime: "11:20",
    haulKm: 110,
    fare: 190000,
    remarksRaw: "정기 납품 / 지게차 상하차 / 파렛트 12개",
    validFrom: "2026-03-02",
    validUntil: "2026-12-31",
  },
  {
    id: "FS-02",
    shipper: "대륙정공",
    pattern: "매주 화·목",
    weekdays: [2, 4],
    route: { from: "경기 화성시 동탄면", to: "충남 아산시 둔포면" },
    vehicle: { ton: 5, body: "윙바디" },
    pickupTime: "09:30",
    dropoffTime: "10:50",
    haulKm: 46,
    fare: 110000,
    remarksRaw: "정기 납품 / 파렛트 5개",
    validFrom: "2026-05-01",
    validUntil: "2026-12-31",
  },
  {
    id: "FS-03",
    shipper: "미래식품",
    pattern: "매주 토",
    weekdays: [6],
    route: { from: "경기 이천시 부발읍", to: "서울 강서구 외발산동" },
    vehicle: { ton: 5, body: "윙바디" },
    pickupTime: "06:00",
    dropoffTime: "08:20",
    haulKm: 78,
    fare: 172000,
    remarksRaw: "주말 정기 / 지게차 상하차 / 파렛트 8개",
    validFrom: "2026-06-06",
    validUntil: "2026-12-31",
  },
];

// ============================================================
// 7. 조건 유형 사전 — 배지 렌더링 및 필터용
// ============================================================

export const conditionTypeLabels: Record<ConditionType, string> = {
  상하차방식: "상하차",
  시간제약: "시간",
  취급요건: "취급",
  적재형태: "적재",
  장소특성: "장소",
  차량요건: "차량",
};

/** 파싱 상태별 표기. '미상'을 빈칸으로 두지 않는 것이 핵심 */
export const conditionStatusLabels: Record<ConditionStatus, string> = {
  명시: "화주 원문에 명시",
  추정: "원문에서 추정",
  미상: "해석 불가 — 원문 그대로 표시",
};

/** 선호지역 반경 30km 내 포함 시/군 목록 (기사 차고지: 화성 향남) */
export const CITIES_IN_RADIUS = ["화성", "안산", "평택", "수원", "오산", "안성"];

