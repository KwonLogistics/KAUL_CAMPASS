/**
 * ⚠️ 소유: 순범. 순이익 · 실질시간 · 실질 시급.
 *
 *   업무 외 대기시간 = 대기 + 상하차            (도착 → 출발. 운임이 지급되지 않는 시간)
 *   실질시간        = 운전 + 업무 외 대기시간
 *   실질 시급       = 순이익 ÷ 실질시간
 *
 * ★ 운전시간은 오더의 durationMin을 그대로 쓴다.
 *   haulKm ÷ 평균속도로 환산하지 않는다 — durationMin은 휴게·정체를 포함한 실제 소요시간이고
 *   validate-mock의 R5가 물리 상한으로 이미 검증하고 있다. 우리가 만든 값이 아니다.
 *   평균속도 파라미터는 소요시간이 없는 구간(복귀 공차)에만 쓴다.
 *
 * 화면에서 이 계산을 다시 하지 않는다. 컴포넌트는 결과만 받아 쓴다.
 */

import type { Economics, SpotOrder } from "@/lib/types";
import { COST } from "./params";
import { estimateWait } from "./wait-time";

export interface EconomicsOptions {
  /**
   * 기사가 「복귀 못 잡을 것 같다」를 켰을 때만 편도 공차가 계산에 들어간다.
   * 기본은 꺼짐 — 복귀 물량이 있는지 없는지를 우리가 단정하지 않는다.
   */
  deadheadKm?: number;
  /** 기사가 프로필에 넣은 연비가 있으면 기본 파라미터를 덮는다. */
  kmPerLiter?: number | null;
}

export function computeEconomics(
  order: SpotOrder,
  opts: EconomicsOptions = {},
): Economics {
  const wait = estimateWait(order);
  const deadheadKm = opts.deadheadKm ?? 0;
  const kmPerLiter = opts.kmPerLiter || COST.kmPerLiter;
  const haulKm = order.distance.haulKm;

  // 등록 운임. 실제 지급액과 다를 수 있어 화면에는 "등록 운임"으로 쓴다.
  const fare = order.fare.total;

  const fuelCost = ((haulKm + deadheadKm) / kmPerLiter) * COST.dieselWonPerLiter;
  const tollCost = COST.tollBase + haulKm * COST.tollWonPerKm;
  const netProfit = fare - fuelCost - tollCost;

  const driveHours = order.durationMin / 60;
  const stayHours = wait.minutes / 60;
  const deadheadHours = deadheadKm / COST.avgSpeedKmh;
  const effectiveHours = driveHours + stayHours + deadheadHours;

  return {
    fare,
    fuelCost: Math.round(fuelCost),
    tollCost: Math.round(tollCost),
    netProfit: Math.round(netProfit),
    driveHours,
    stayHours,
    deadheadHours,
    deadheadKm,
    effectiveHours,
    hourlyWage: effectiveHours > 0 ? Math.round(netProfit / effectiveHours) : 0,
    wonPerKm: haulKm > 0 ? Math.round(netProfit / haulKm) : 0,
    wait,
  };
}

/**
 * 복귀 공차 거리 추정 — 「복귀 못 잡을 것 같다」 토글이 켜졌을 때만 쓴다.
 * 하차지에서 기사 거점까지의 거리를 모르므로, 적재거리를 상한으로 보수적으로 잡는다.
 * 실제 거리 API가 붙으면 여기만 교체한다.
 */
export function estimateDeadheadKm(order: SpotOrder): number {
  return Math.round(order.distance.haulKm * 0.6);
}
