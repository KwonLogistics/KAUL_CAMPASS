/**
 * 정합성 검사 v2 — 피드백 반영본
 *  변경점
 *   R3  날짜 계수(택배없는날/연휴/적체일) 도입 + 허용오차 축소
 *   R5  하한은 오타 검출용으로만 느슨하게, 상한은 물리 한계로 조임 (단측 검사)
 *   R9  dateISO 그룹화 폐기 → 절대 시각 1차원 정렬 교차 검증
 *   R12 HOLIDAYS / PARCEL_FREE_DAY 상수를 실제 검사에 연동
 */
import {
  spotOrders,
  pastTrips,
  driverProfile,
  HOLIDAYS,
  PARCEL_FREE_DAY,
  CALENDAR_2026_08,
} from "./mock-data";

export type Issue = { rule: string; id: string; detail: string };

export function validateMockData() {
  const issues: Issue[] = [];
  const warns: Issue[] = [];
  const fail = (r: string, i: string, d: string) =>
    issues.push({ rule: r, id: i, detail: d });
  const warn = (r: string, i: string, d: string) =>
    warns.push({ rule: r, id: i, detail: d });
  const toMin = (s: string) => {
    const [a, b] = s.split(":").map(Number);
    return a * 60 + b;
  };

  // ── R1 / R2 (변경 없음) ─────────────────────────────
  for (const o of spotOrders) {
    if (o.dropoff.dateISO < o.pickup.dateISO) fail("R1", o.id, `하차일<상차일`);
    if (
      o.pickup.dateISO === o.dropoff.dateISO &&
      toMin(o.dropoff.time) <= toMin(o.pickup.time)
    )
      fail("R2", o.id, `동일 일자에 하차 ≤ 상차`);
  }

  // ── R3: 날짜 계수 도입 + 허용오차 ±15% → ±10% ────────
  const dateFactor = (iso: string) => {
    if (iso === PARCEL_FREE_DAY) return 0.92; // 택배 간선 차량 유입 → 공급 과잉
    if (HOLIDAYS.includes(iso)) return 1.05; // 공휴일 운행 할증
    if (iso === "2026-08-18") return 1.08; // 연휴 후 적체
    return 1.0;
  };
  const band5t = (km: number): [number, number] => {
    if (km < 40) return [88000, 125000];
    if (km < 80) return [105000, 170000];
    if (km < 130) return [150000, 215000];
    if (km < 200) return [190000, 255000];
    if (km < 300) return [255000, 325000];
    return [285000, 370000];
  };
  const tonMul = (t: number) => (t >= 11 ? 1.75 : t >= 8 ? 1.3 : 1.0);
  for (const o of spotOrders) {
    const [lo, hi] = band5t(o.distance.haulKm);
    const m = tonMul(o.vehicle.ton) * dateFactor(o.pickup.dateISO);
    const min = Math.round(lo * m * 0.9);
    const max = Math.round(hi * m * 1.1);
    if (o.fare.base < min || o.fare.base > max)
      fail(
        "R3",
        o.id,
        `${o.vehicle.ton}t ${o.distance.haulKm}km ${o.pickup.dateISO} 기본운임 ${o.fare.base.toLocaleString()} — 기대 ${min.toLocaleString()}~${max.toLocaleString()}`
      );
    if (o.fare.base + o.fare.extraManual !== o.fare.total)
      fail("R3", o.id, `total 불일치`);
  }

  // ── R4 (변경 없음) ─────────────────────────────────
  for (const o of spotOrders) {
    if (!["카고", "윙바디"].includes(o.vehicle.body))
      fail("R4", o.id, `차종 ${o.vehicle.body}`);
    if (![5, 8, 11].includes(o.vehicle.ton))
      fail("R4", o.id, `톤급 ${o.vehicle.ton}`);
  }

  // ── R5: 단측 검사. 상한=물리 한계, 하한=오타 검출용 ────
  //  durationMin은 휴게·정체를 포함하므로 '느린 것'은 오류가 아니다.
  //  '빠른 것'만 물리적으로 불가능하다.
  const SPEED_MAX = (km: number) =>
    km < 50 ? 52 : km < 150 ? 78 : km < 300 ? 85 : 88;
  const SPEED_MIN_TYPO = 8; // 이 아래는 입력 실수로 간주
  for (const o of spotOrders) {
    const kmh = o.distance.haulKm / (o.durationMin / 60);
    if (kmh > SPEED_MAX(o.distance.haulKm))
      fail(
        "R5",
        o.id,
        `평균 ${kmh.toFixed(1)}km/h — 물리 상한 ${SPEED_MAX(o.distance.haulKm)} 초과`
      );
    if (kmh < SPEED_MIN_TYPO)
      fail("R5", o.id, `평균 ${kmh.toFixed(1)}km/h — 입력 오류 의심`);
    if (kmh < 25 && o.distance.haulKm >= 80)
      warn(
        "R5",
        o.id,
        `평균 ${kmh.toFixed(1)}km/h — 장거리 대비 과도한 저속(정체/휴게 가정 확인)`
      );
  }

  // ── R6~R8 (변경 없음) ───────────────────────────────
  const DEMO_NOW = "12:00";
  for (const o of spotOrders)
    if (o.pickup.date === "D+0" && toMin(o.pickup.time) <= toMin(DEMO_NOW))
      fail("R6", o.id, `당일 상차 ${o.pickup.time} ≤ 기준시각`);
  for (const t of pastTrips) {
    if (Date.parse(t.acceptedAt) <= Date.parse(t.postedAt))
      fail("R7", t.id, `acceptedAt ≤ postedAt`);
    const am =
      new Date(t.acceptedAt).getHours() * 60 +
      new Date(t.acceptedAt).getMinutes();
    if (am >= toMin(t.plannedPickup)) fail("R8", t.id, `수락이 상차 예정 이후`);
  }

  // ── R9: 절대 시각 1차원 교차 검증 ──────────────────────
  const abs = (dateISO: string, hhmm: string, addDay = 0) =>
    Date.parse(`${dateISO}T${hhmm}:00`) + addDay * 86400000;
  type Span = { id: string; start: number; end: number };
  const spans: Span[] = pastTrips
    .map((t) => {
      const s = abs(t.dateISO, t.plannedPickup);
      // 하차 시각이 상차보다 이르면 익일 하차로 해석
      const crossesDay = toMin(t.actualDropoff) < toMin(t.plannedPickup);
      const e = abs(t.dateISO, t.actualDropoff, crossesDay ? 1 : 0);
      return { id: t.id, start: s, end: e };
    })
    .sort((a, b) => a.start - b.start);
  for (let i = 1; i < spans.length; i++) {
    const prev = spans[i - 1],
      cur = spans[i];
    if (cur.start < prev.end) {
      fail(
        "R9",
        cur.id,
        `직전 ${prev.id} 종료(${new Date(prev.end).toISOString().slice(0, 16)}) 전에 상차 시작(${new Date(cur.start).toISOString().slice(0, 16)})`
      );
    } else {
      const gapMin = (cur.start - prev.end) / 60000;
      if (gapMin < 30)
        warn(
          "R9",
          cur.id,
          `직전 ${prev.id} 종료 후 ${gapMin}분 만에 상차 — 공차 이동 시간 부족`
        );
    }
  }

  // ── R10 / R11 (변경 없음) ───────────────────────────
  for (const o of spotOrders) {
    for (const c of o.conditions) {
      if (!c.evidence) fail("R10", o.id, `evidence 없음: ${c.value}`);
      else if (!o.remarksRaw.includes(c.evidence))
        fail("R10", o.id, `evidence 미존재: "${c.evidence}"`);
    }
    if (o.remarksRaw.trim() === "" && o.conditions.length > 0)
      fail("R10", o.id, `공란인데 조건 존재`);
    const tonOk = o.vehicle.ton <= driverProfile.vehicle.ton;
    if (!tonOk && o.vehicleFit.ok) fail("R11", o.id, `요건 미달인데 적합 표시`);
    if (!o.vehicleFit.ok && !o.vehicleFit.reason)
      fail("R11", o.id, `미달 사유 공란`);
  }

  // ── R12: 달력·휴일 상수를 실제 검사에 연동 ────────────
  for (const o of spotOrders) {
    for (const iso of [o.pickup.dateISO, o.dropoff.dateISO]) {
      if (!CALENDAR_2026_08[iso]) fail("R12", o.id, `달력 상수에 없는 날짜: ${iso}`);
    }
    if (
      HOLIDAYS.includes(o.pickup.dateISO) &&
      !/공휴일|연휴|새벽|야간|야상/.test(o.remarksRaw)
    )
      warn("R12", o.id, `공휴일(${o.pickup.dateISO}) 상차인데 원문에 관련 언급 없음`);
    if (
      o.pickup.dateISO === PARCEL_FREE_DAY &&
      o.fare.base > band5t(o.distance.haulKm)[1] * tonMul(o.vehicle.ton)
    )
      warn("R12", o.id, `택배없는날 오더인데 운임이 평시 상단 이상`);
  }

  return { issues, warns, spanCount: spans.length };
}

// 직접 실행 시 검사 결과 출력
if (typeof require !== "undefined" && require.main === module) {
  const result = validateMockData();
  console.log("=== v2 검사 ===");
  console.log(
    result.issues.length === 0
      ? "오류 없음"
      : `오류 ${result.issues.length}건`
  );
  result.issues.forEach((i) => console.log(` [${i.rule}] ${i.id} — ${i.detail}`));
  console.log(`\n경고 ${result.warns.length}건`);
  result.warns.forEach((i) => console.log(` [${i.rule}] ${i.id} — ${i.detail}`));
  console.log(
    `\nR9 검사 범위: 인접쌍 ${result.spanCount - 1}건 전수 (v1은 13건만)`
  );
}
