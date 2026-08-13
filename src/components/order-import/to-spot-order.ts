/**
 * ⚠️ 소유: 순범. 파싱 결과(ParsedOrderDraft) → 화면이 확인·수정하는 폼 → SpotOrder.
 *
 * 왜 중간에 폼을 두나: LLM 이 읽은 값을 그대로 저장소에 넣으면, 틀렸을 때 기사가 고칠 방법이 없다.
 * 그리고 SpotOrder 는 카카오 오더와 같은 계약이라 LLM 이 알 수 없는 필드(정산 방식·거리)가 있다.
 *
 * ★ 여기서 SpotOrder 를 "전부" 채운다. 하나라도 비면 지수의 주간 보기·동의의 월간 보기·
 *   대기시간 엔진이 undefined 를 만난다. any 로 밀어 넣지 않는 이유가 이거다.
 */

import type {
  BodyType,
  DateBucket,
  LoadOption,
  ParsedCondition,
  SettleType,
  SpotOrder,
} from "@/lib/types";
import { COST } from "@/lib/engine/params";
import type { ParsedOrderDraft } from "@/lib/ai/parse-order-schema";

/** 하차 방식. 대기시간 엔진(L4)이 이 값으로 기본 체류시간을 고른다. */
export type HandlingKind = "지게차" | "수작업" | "미상";

export interface ExternalOrderForm {
  shipper: string;
  pickupSido: string;
  pickupSigungu: string;
  pickupDong: string;
  /** 번지·건물명 등. 예: "○○물류센터 3번 게이트" */
  pickupAddressDetail: string;
  pickupDateISO: string;
  pickupTime: string;
  /** true 면 원문에 시간이 없었거나 못 읽어서 기본값(09:00)을 채운 것 — 실제 시간이 아니다. */
  pickupTimeGuessed: boolean;
  dropoffSido: string;
  dropoffSigungu: string;
  dropoffDong: string;
  dropoffAddressDetail: string;
  dropoffDateISO: string;
  dropoffTime: string;
  /** true 면 원문에 시간이 없어서 상차+2시간으로 채운 것 — 실제 시간이 아니다. */
  dropoffTimeGuessed: boolean;
  ton: string;
  body: BodyType;
  loadOption: LoadOption;
  fare: string;
  settle: SettleType;
  haulKm: string;
  handling: HandlingKind;
  conditions: ParsedCondition[];
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function safeTime(v: string | null | undefined, fallback: string): string {
  return v && HHMM.test(v) ? v : fallback;
}

function safeDate(v: string | null | undefined, fallback: string): string {
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : fallback;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function addMinutes(hhmm: string, delta: number): string {
  const total = (toMinutes(hhmm) + delta) % (24 * 60);
  const h = Math.floor(total / 60);
  return `${String(h).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function daysBetween(fromISO: string, toISO: string): number {
  const ms = Date.parse(`${toISO}T00:00:00`) - Date.parse(`${fromISO}T00:00:00`);
  return Math.round(ms / 86_400_000);
}

/** 조회일 기준 상대 버킷. 카카오 오더와 같은 규칙으로 매긴다. */
export function bucketOf(dateISO: string, todayISO: string): DateBucket {
  const d = daysBetween(todayISO, dateISO);
  if (d <= 0) return "D+0";
  if (d === 1) return "D+1";
  return "D+2+";
}

/** 상차 → 하차 소요(분). 날짜를 넘겨도 맞게 나온다. */
export function durationMinutes(form: ExternalOrderForm): number {
  const start = Date.parse(`${form.pickupDateISO}T${form.pickupTime}:00`);
  const end = Date.parse(`${form.dropoffDateISO}T${form.dropoffTime}:00`);
  const diff = Math.round((end - start) / 60_000);
  // 하차가 상차보다 이르면(입력 실수) 최소 30분으로 막는다. 음수가 엔진에 들어가면 시급이 뒤집힌다.
  return diff > 0 ? diff : 30;
}

/** 거리 입력이 없을 때만 쓰는 추정. 화면에 "추정"이라고 쓴다. */
export function estimateHaulKm(minutes: number): number {
  return Math.max(1, Math.round((minutes / 60) * COST.avgSpeedKmh));
}

export function draftToForm(draft: ParsedOrderDraft, todayISO: string): ExternalOrderForm {
  const pickupDateISO = safeDate(draft.pickup?.dateISO, todayISO);
  const pickupTime = safeTime(draft.pickup?.time, "09:00");
  // 원문에 없어서 기본값으로 채운 건지 기록해 둔다 — 화면에서 "확인 필요"로 표시하지 않으면
  // 09:00 이 마치 사진에서 읽어낸 실제 시간처럼 보인다.
  const pickupTimeGuessed = !(draft.pickup?.time && HHMM.test(draft.pickup.time));
  const dropoffDateISO = safeDate(draft.dropoff?.dateISO, pickupDateISO);
  // 하차 시각을 못 읽었으면 상차 +2시간. 캘린더에 자리를 잡으려면 끝 시각이 반드시 있어야 한다.
  const dropoffTime = safeTime(draft.dropoff?.time, addMinutes(pickupTime, 120));
  const dropoffTimeGuessed = !(draft.dropoff?.time && HHMM.test(draft.dropoff.time));

  const handling: HandlingKind = draft.dropoff?.forklift
    ? "지게차"
    : draft.dropoff?.manual
      ? "수작업"
      : "미상";

  const form: ExternalOrderForm = {
    shipper: draft.shipper ?? "",
    pickupSido: draft.pickup?.sido ?? "",
    pickupSigungu: draft.pickup?.sigungu ?? "",
    pickupDong: draft.pickup?.dong ?? "",
    pickupAddressDetail: draft.pickup?.addressDetail ?? "",
    pickupDateISO,
    pickupTime,
    pickupTimeGuessed,
    dropoffSido: draft.dropoff?.sido ?? "",
    dropoffSigungu: draft.dropoff?.sigungu ?? "",
    dropoffDong: draft.dropoff?.dong ?? "",
    dropoffAddressDetail: draft.dropoff?.addressDetail ?? "",
    dropoffDateISO,
    dropoffTime,
    dropoffTimeGuessed,
    ton: draft.vehicle?.ton != null ? String(draft.vehicle.ton) : "",
    body: draft.vehicle?.body ?? "카고",
    loadOption: draft.loadOption ?? "독차",
    fare: draft.fare?.total != null ? String(draft.fare.total) : "",
    settle: "인수증",
    haulKm: "",
    handling,
    conditions: Array.isArray(draft.conditions) ? draft.conditions : [],
  };

  form.haulKm = String(estimateHaulKm(durationMinutes(form)));
  return form;
}

function newId(): string {
  // Math.random 으로 6자리를 뽑으면 충돌한다. 충돌하면 addOrder 의 중복 제거에 걸려
  // 등록이 조용히 무시된다 — 데모 중에 가장 설명하기 어려운 버그다.
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
  return `EXT-${uuid.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function formToSpotOrder(
  form: ExternalOrderForm,
  remarksRaw: string,
  todayISO: string,
): SpotOrder {
  const durationMin = durationMinutes(form);
  const haulKm = Number(form.haulKm) > 0 ? Number(form.haulKm) : estimateHaulKm(durationMin);
  const total = Number(form.fare) || 0;
  const ton = Number(form.ton) || 5;

  const forklift = form.handling === "지게차";
  const manual = form.handling === "수작업";

  return {
    id: newId(),
    source: "external",
    shipper: form.shipper.trim() || "외부 오더",
    pickup: {
      sido: form.pickupSido.trim(),
      sigungu: form.pickupSigungu.trim(),
      dong: form.pickupDong.trim(),
      addressDetail: form.pickupAddressDetail.trim() || undefined,
      date: bucketOf(form.pickupDateISO, todayISO),
      dateISO: form.pickupDateISO,
      time: form.pickupTime,
      manual,
      forklift,
    },
    dropoff: {
      sido: form.dropoffSido.trim(),
      sigungu: form.dropoffSigungu.trim(),
      dong: form.dropoffDong.trim(),
      addressDetail: form.dropoffAddressDetail.trim() || undefined,
      date: bucketOf(form.dropoffDateISO, todayISO),
      dateISO: form.dropoffDateISO,
      time: form.dropoffTime,
      manual,
      forklift,
    },
    vehicle: { ton, body: form.body },
    loadOption: form.loadOption,
    // 외부 오더는 내 현재 위치를 모른다. 0 으로 두고 화면에서 "미산정"이라고 쓴다 —
    // 그럴듯한 숫자를 넣으면 시급 계산이 조용히 틀린다.
    distance: { toPickupKm: 0, haulKm },
    durationMin,
    // 외부 오더엔 추가운임 항목이 따로 없다. 전액을 기본운임으로 잡는다.
    fare: { base: total, extraManual: 0, total, settle: form.settle },
    remarksRaw,
    conditions: form.conditions,
    vehicleFit: { ok: true, reason: "" },
    postedAt: new Date().toISOString().slice(0, 19),
  };
}
