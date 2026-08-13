"use client";

/**
 * ⚠️ 소유: 순범. 시간 분해 — 카드의 두 숫자가 어디서 나왔는지 펼쳐서 보여준다.
 *
 *   실질시간 = 운전 + 업무 외 대기시간
 *   실질 시급 = 순이익 ÷ 실질시간
 *
 * 카드는 결론만 보여주고, 여기서 근거를 연다. 기사가 우리 숫자를 믿으려면
 * 「어느 하차지 몇 건」과 「원가를 뭘로 뺐는지」가 같은 화면에 있어야 한다.
 */

import { useState } from "react";
import type { SpotOrder } from "@/lib/types";
import { computeEconomics, estimateDeadheadKm } from "@/lib/engine/economics";
import { formatMinutes, waitRangeLabel } from "@/lib/engine/wait-time";
import { COST, COST_FOOTNOTE, FIXED_COST_NOTE } from "@/lib/engine/params";

function Row({
  label,
  value,
  sub,
  strong = false,
}: {
  label: string;
  value: string;
  sub?: string | null;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between py-2">
      <div className="pr-3">
        <span
          className={`text-[14px] ${strong ? "font-extrabold text-gray-900" : "font-medium text-gray-700"}`}
        >
          {label}
        </span>
        {sub && (
          <p className="mt-0.5 text-[11px] leading-snug text-gray-500">{sub}</p>
        )}
      </div>
      <span
        className={`shrink-0 ${strong ? "text-[15px] font-extrabold text-gray-900" : "text-[14px] font-bold text-gray-800"}`}
      >
        {value}
      </span>
    </div>
  );
}

export default function TimeBreakdown({ order }: { order: SpotOrder }) {
  // 복귀 공차는 기본으로 넣지 않는다. 기사가 "복귀 못 잡을 것 같다"를 켤 때만 계산에 들어간다.
  const [deadhead, setDeadhead] = useState(false);
  const deadheadKm = deadhead ? estimateDeadheadKm(order) : 0;
  const e = computeEconomics(order, { deadheadKm });
  const range = waitRangeLabel(e.wait);

  const hours = (h: number) => `${h.toFixed(1)}h`;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-1 text-[15px] font-extrabold text-gray-900">시간 분해</h3>

      <div className="divide-y divide-gray-100">
        <Row
          label="운전"
          value={hours(e.driveHours)}
          sub={`${order.distance.haulKm}km · 오더에 적힌 소요시간 ${formatMinutes(order.durationMin)}`}
        />
        <Row
          label="업무 외 대기시간"
          value={hours(e.stayHours)}
          sub={[e.wait.basis, range].filter(Boolean).join(" · ")}
        />
        {deadhead && (
          <Row
            label="복귀 공차"
            value={hours(e.deadheadHours)}
            sub={`${deadheadKm}km · 평균 ${COST.avgSpeedKmh}km/h 환산`}
          />
        )}
        <Row label="실질시간" value={hours(e.effectiveHours)} strong />
      </div>

      <div className="mt-3 divide-y divide-gray-100 border-t border-gray-200 pt-2">
        <Row label="등록 운임" value={`${e.fare.toLocaleString()}원`} />
        <Row
          label="연료비"
          value={`-${e.fuelCost.toLocaleString()}원`}
          sub={`${order.distance.haulKm + deadheadKm}km ÷ ${COST.kmPerLiter}km/L × ${COST.dieselWonPerLiter.toLocaleString()}원`}
        />
        <Row
          label="톨비"
          value={`-${e.tollCost.toLocaleString()}원`}
          sub={`${COST.tollBase}원 + ${order.distance.haulKm}km × ${COST.tollWonPerKm}원`}
        />
        <Row label="순이익" value={`${e.netProfit.toLocaleString()}원`} strong />
      </div>

      <div className="mt-3 rounded-lg bg-[#f4f7ff] px-3 py-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-bold text-gray-700">실질 시급</span>
          <span className="text-[20px] font-extrabold text-[#3b5bdb]">
            {e.hourlyWage.toLocaleString()}원
          </span>
        </div>
        <p className="mt-1 text-[11px] text-gray-500">
          순이익 {e.netProfit.toLocaleString()}원 ÷ 실질시간{" "}
          {hours(e.effectiveHours)} · 원/km {e.wonPerKm.toLocaleString()}원
        </p>
      </div>

      {/* 복귀 공차 토글 — 우리가 단정하지 않고 기사가 켠다 */}
      <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 px-3 py-2.5">
        <input
          type="checkbox"
          checked={deadhead}
          onChange={(ev) => setDeadhead(ev.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-[#3b5bdb]"
        />
        <span className="text-[13px] leading-snug text-gray-700">
          복귀 못 잡을 것 같다
          <span className="mt-0.5 block text-[11px] text-gray-500">
            켜면 편도 공차 {estimateDeadheadKm(order)}km가 연료비와 실질시간에
            들어갑니다
          </span>
        </span>
      </label>

      <div className="mt-3 space-y-1 border-t border-gray-100 pt-3">
        <p className="text-[10px] leading-snug text-gray-400">{COST_FOOTNOTE}</p>
        <p className="text-[10px] leading-snug text-gray-400">{FIXED_COST_NOTE}</p>
        <p className="text-[10px] leading-snug text-gray-400">
          업무 외 대기시간은 도착부터 출발까지입니다. 대기와 상하차를 나누지
          않습니다 — GPS 입·출차 기록이 그 둘을 구분하지 않기 때문입니다. 운임이
          지급되지 않는 시간이라는 뜻이지, 일이 아니라는 뜻이 아닙니다.
        </p>
      </div>
    </div>
  );
}
