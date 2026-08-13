/**
 * ⚠️ 소유: 순범. 순이익 · 실질시간 · 실질 시급.
 *
 *   업무 외 대기시간 = 대기 + 상하차        (도착 → 출발)
 *   실질시간        = 운전 + 업무 외 대기시간
 *   실질 시급       = 순이익 ÷ 실질시간
 *
 * 화면에서 이 계산을 다시 하지 않는다. 컴포넌트는 결과만 받아 쓴다.
 */

import type { Economics, SpotOrder } from "@/lib/types";
import { COST } from "./params";
import { estimateWait } from "./wait-time";

export interface EconomicsOptions {
  /** 기사가 「복귀 못 잡을 것 같다」를 켰을 때만 편도 공차가 계산에 들어간다. 기본은 꺼짐. */
  deadheadKm?: number;
  /** 프로필에 기사가 직접 넣은 연비가 있으면 기본 파라미터를 덮는다. */
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

  const fare = order.fare.total;
  const fuelCost = ((haulKm + deadheadKm) / kmPerLiter) * COST.dieselWonPerLiter;
  const tollCost = COST.tollBase + haulKm * COST.tollWonPerKm;
  const netProfit = fare - fuelCost - tollCost;

  const driveHours = haulKm / COST.avgSpeedKmh;
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
