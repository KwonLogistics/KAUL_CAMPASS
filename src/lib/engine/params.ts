/**
 * 화면에 뜨는 모든 금액·시간 수치는 여기 있는 상수에서만 나온다.
 * 컴포넌트 안에 숫자를 직접 박지 않는다. 심사에서 "그 값 어디서 나왔습니까"를 한 번에 답하기 위해서다.
 */

export const COST = {
  /** 고속도로 90 제한 + 상하차지 진입 시내 주행 혼합 */
  avgSpeedKmh: 55,

  /** 5톤 카고 기준. 기사가 프로필에 연비를 넣으면 그 값이 이걸 이긴다. */
  kmPerLiter: 5.0,

  /**
   * 실효 경유가 = 시장가 약 1,848원 − 유류세 연동 유가보조금 345.54원.
   * 보조금을 안 빼면 유류비를 23% 과대계상한다.
   * 유가연동보조금(약 104원)은 일부러 안 뺐다 — 반영하면 순이익이 더 늘어나는 방향이라 보수적이다.
   */
  dieselWonPerLiter: 1500,

  /** 5톤 카고 = 고속도로 3종 */
  tollBase: 900,
  tollWonPerKm: 47.0,
} as const;

/** 화면 각주에 그대로 쓰는 문장. 파라미터를 바꾸면 이 문장도 같이 바뀌어야 한다. */
export const COST_FOOTNOTE =
  `평균속도 ${COST.avgSpeedKmh}km/h · 연비 ${COST.kmPerLiter}km/L · ` +
  `실효 경유가 ${COST.dieselWonPerLiter.toLocaleString()}원/L(유가보조금 345.54원 차감) · ` +
  `톨비 ${COST.tollBase}원 + ${COST.tollWonPerKm}원/km`;

export const FIXED_COST_NOTE =
  "지입료·보험·감가 같은 고정비는 빼지 않았습니다. 어느 오더를 잡아도 똑같이 나가는 비용이라 " +
  "오더끼리 비교할 때 판단을 바꾸지 못합니다. 대신 바뀌는 것으로 나눴습니다 — 시간.";

/**
 * GPS 이력이 아예 없을 때만 쓰는 최종 폴백(L4).
 * 대기를 포함한 값이므로 순수 작업 시간보다 크다.
 * 이 값을 쓸 때는 화면에 반드시 "기록 없음"이라고 쓴다.
 */
export const DEFAULT_STAY_MINUTES = {
  지게차: 48,
  호이스트: 72,
  수작업: 150,
  미상: 90,
} as const;

/** 계층별 최소 표본. 못 채우면 다음 층으로 내려간다. */
export const MIN_SAMPLES = {
  L1: 2,
  "L1.5": 3,
  L2: 3,
  L3: 5,
} as const;

/**
 * 화물자동차 운수사업법 시행규칙 제21조 (2020-10-08 시행).
 * 휴게 없이 2시간 연속운전 시 15분 이상 휴게.
 * 예외 조항으로 1시간까지 연장 가능하나 그 경우 30분 이상 휴게.
 */
export const REST_RULE = {
  continuousLimitMin: 120,
  restMin: 15,
  extendedLimitMin: 180,
  extendedRestMin: 30,
  source: "화물자동차 운수사업법 시행규칙 제21조",
} as const;

/**
 * 지표 비교에 쓰는 외부 보고서 값. 출처를 화면에 같이 쓴다.
 * 시급은 여기 넣지 않는다 — 매출 기준인지 순이익 기준인지 확인되지 않아 축이 다를 수 있다.
 */
export const BENCHMARK = [
  {
    key: "tripsPerDay",
    label: "일 운행 회차",
    value: 1.7,
    unit: "회",
    source: "한국교통연구원 「화물운송시장 동향 2025 연간보고서」",
  },
  {
    key: "kmPerDay",
    label: "일 주행거리",
    value: 304.1,
    unit: "km",
    source: "한국교통연구원 「화물운송시장 동향 2025 연간보고서」",
  },
  {
    key: "waitHours",
    label: "상하차 대기",
    value: 5.5,
    unit: "시간",
    source: "스피드플로우·헬로티",
  },
] as const;
