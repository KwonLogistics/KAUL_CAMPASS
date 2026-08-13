/**
 * 공통 계약.
 *
 * 엔티티(오더·과거운행·고정스케줄·조건)는 `src/data/mock-data.ts`가 단일 출처다.
 * 여기서 다시 정의하지 않고 그대로 재수출한다 — 두 스키마가 갈라지면 파싱 결과가
 * 화면에서 깨진다. 엔진 산출물(대기시간 추정·시급 계산 결과)과 앱 상태 타입만 이 파일이 定義한다.
 *
 * 바꾸려면 리드(순범)에게 말한다. 혼자 고치지 않는다.
 */

export type {
  DateBucket,
  BodyType,
  LoadOption,
  SettleType,
  OrderSource,
  ConditionStatus,
  ConditionType,
  ParsedCondition,
  Waypoint,
  SpotOrder,
  PastTrip,
  FixedSchedule,
} from "@/data/mock-data";

/* ────────────────────────────────────────────────────────────────
   엔진 산출물 — 대기시간 추정 · 순이익 · 실질 시급
   ──────────────────────────────────────────────────────────────── */

/** 대기 추정이 어느 층에서 나왔는지. 화면에 그대로 쓴다. */
export type FallbackLevel = "L1" | "L1.5" | "L2" | "L3" | "L4";

export interface WaitEstimate {
  /** 중앙값(분) */
  minutes: number;
  level: FallbackLevel;
  /** 표본 수. 이걸 안 쓰면 그냥 숫자고, 쓰면 근거다. */
  sampleCount: number;
  rangeMin: number | null;
  rangeMax: number | null;
  /** 화면에 그대로 출력할 근거 한 줄. "이 하차지 최근 12건 중앙값" 등 */
  basis: string;
  /** L4(전체 기본값) 여부. true 면 화면에 "기록 없음"이라고 쓴다. */
  unknown: boolean;
}

export interface Economics {
  fare: number;
  fuelCost: number;
  tollCost: number;
  netProfit: number;
  /** 적재거리 ÷ 평균속도 (시간) */
  driveHours: number;
  /** 업무 외 대기시간 (시간). SPEC상 「체류」와 같은 값. */
  stayHours: number;
  /** 「복귀 못 잡을 것 같다」 토글 ON일 때만 0보다 크다 */
  deadheadHours: number;
  deadheadKm: number;
  /** 운전 + 업무 외 대기 (+ 토글 시 공차) */
  effectiveHours: number;
  /** 순이익 ÷ 실질시간 */
  hourlyWage: number;
  wonPerKm: number;
  wait: WaitEstimate;
}

/* ────────────────────────────────────────────────────────────────
   타임라인 · 피로도
   ──────────────────────────────────────────────────────────────── */

export interface DaySummary {
  dateISO: string;
  /** 첫 상차 ~ 마지막 하차 (분). 대기 포함. */
  boundMinutes: number;
  firstStartMin: number | null;
  lastEndMin: number | null;
  driveHours: number;
  stayHours: number;
  netProfit: number;
  hourlyWage: number;
  /** 귀가 예상 시각 "HH:mm" */
  homeArrival: string | null;
  restWarnings: RestWarning[];
}

/**
 * 화물자동차 운수사업법 시행규칙 제21조 — 2시간 연속운전 시 15분 이상 휴게.
 * 판정이 아니라 알림이다. "법 위반입니다"라고 쓰지 않는다.
 */
export interface RestWarning {
  startMin: number;
  endMin: number;
  continuousMinutes: number;
  /** 2시간 넘김 = 15분, 3시간 넘김 = 30분 */
  requiredRest: 15 | 30;
  message: string;
}

/* ────────────────────────────────────────────────────────────────
   하루 설정 — 접점 ③ (순범 소유 store가 읽고 쓴다)
   ──────────────────────────────────────────────────────────────── */

export interface DaySettings {
  /**
   * 오더 축 — 어떤 오더를 목록에 볼까.
   * 지역 라벨 배열이다("서울 전체" · "경기 남 화성시"). 원래 앱처럼 여러 곳을 고른다.
   */
  preferPickup: string[];
  preferDropoff: string[];
  /** 하루 축 — 내 하루가 어디서 시작해서 어디서 끝나나 */
  dayStart: string;
  dayEnd: string;
  /** "HH:mm" */
  targetFinish: string;
  autoDispatchConditions: AutoDispatchCondition[];
}

/* ────────────────────────────────────────────────────────────────
   배차 알림 조건 (P4 출력) — 순범
   ──────────────────────────────────────────────────────────────── */

export type LoadDateFilter = "당상" | "내상" | "월상";
export type UnloadDateFilter = "당착" | "내착" | "월착";

export interface DispatchRule {
  id: string;
  /** 기사가 실제로 말한 문장. 확인 화면에 그대로 띄운다. */
  utterance: string;
  originRegion: string | null;
  destRegion: string | null;
  afterTime: string | null;
  beforeTime: string | null;
  minFare: number | null;
  loadDate: LoadDateFilter[];
  unloadDate: UnloadDateFilter[];
  ton: number | null;
  exclude: string[];
  /** 발화가 아니라 스케줄 맥락에서 채워진 항목 */
  filledFromSchedule: string[];
  /** 해석하지 못한 구절. 지어내지 않고 그대로 남긴다. */
  unparsed: string[];
}

export type RuleState = "searching" | "hit" | "reserved";

/* ────────────────────────────────────────────────────────────────
   빈 칸 채우기 — 지수(스케줄)가 소비
   ──────────────────────────────────────────────────────────────── */

/** 9-1 출발/중간콜 vs 9-2 도착(귀가)콜. 찾는 기준도 문구도 다르다. */
export type AssistKind = "bridge" | "homebound";

export interface RankedOrder {
  order: import("@/data/mock-data").SpotOrder;
  economics: Economics;
  /** 왜 이 자리에 있는지. 템플릿으로 만든다 — AI가 쓰지 않는다. */
  reason: string;
  /** 조건에 안 맞아도 목록에서 빼지 않는다. 대신 이 플래그로 회색 처리한다. */
  overTarget: boolean;
}

export interface AutoDispatchCondition {
  id: string;
  enabled: boolean;
  pickupSido: string;
  pickupSigungu: string;
  pickupRadius: string;
  dropoffSido: string;
  dropoffSigungu: string;
  minFare: string;
  pickupDate: string;
  dropoffDate: string;
  fareType: string;
  loadOption: string;
  bodyType: string;
  ton: string;
}
