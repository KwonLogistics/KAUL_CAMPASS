"use client";

/**
 * ⚠️ 소유: 순범. 오더 상세의 「더보기」 — 우리가 더한 두 가지만 들어간다.
 *
 *   실대기 시간 = 도착 → 출발. 운임이 지급되지 않는 시간.
 *   실질임금   = 순이익 ÷ 실질시간(운전 + 실대기)
 *
 * ★ 접혀 있는 게 기본이다. 상세 화면은 원래 앱과 같은 순서·같은 모양으로 두고,
 *   우리 화면은 기사가 버튼을 눌렀을 때만 열린다.
 * ★ 예측 이유는 본문에 깔지 않고 ⓘ 안에 넣는다. 카드가 근거 문장으로 덮이면
 *   정작 숫자가 안 보인다 — 근거는 없애는 게 아니라 한 번 눌러서 여는 것이다.
 */

import { useState } from "react";
import type { FallbackLevel, SpotOrder } from "@/lib/types";
import { computeEconomics } from "@/lib/engine/economics";
import { formatMinutes, waitRangeLabel } from "@/lib/engine/wait-time";
import { COST, COST_FOOTNOTE, FIXED_COST_NOTE } from "@/lib/engine/params";
import InfoDot from "@/components/common/InfoDot";

/** 어느 층에서 나온 추정인지 한 문장으로. 화면에 그대로 쓴다. */
const LEVEL_NOTE: Record<FallbackLevel, string> = {
  L1: "같은 화주 · 같은 지점 기록이 있어 그대로 썼습니다.",
  "L1.5": "같은 지점 기록을 화주 구분 없이 모았습니다.",
  L2: "지점 기록이 모자라 같은 시·군·구 · 같은 톤급까지 넓혔습니다.",
  L3: "지역 기록이 모자라 비슷한 거리대 · 같은 톤급까지 넓혔습니다.",
  L4: "기사님 기록에서 맞는 건을 찾지 못해 상하차 방식별 기본값을 썼습니다.",
};

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
          className={`text-[13px] ${strong ? "font-extrabold text-gray-900" : "font-medium text-gray-700"}`}
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

export default function OrderAnalysis({ order }: { order: SpotOrder }) {
  const [open, setOpen] = useState(false);
  const [waitInfo, setWaitInfo] = useState(false);
  const [wageInfo, setWageInfo] = useState(false);

  const e = computeEconomics(order);
  const range = waitRangeLabel(e.wait);
  const hours = (h: number) => `${h.toFixed(1)}h`;

  return (
    <div>
      {/* 더보기 — 접혀 있는 게 기본. 눈에 띄어야 하므로 파란 채움 + 전폭 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl border border-[#3b5bdb] bg-[#f4f7ff] px-4 py-3.5 shadow-[0_2px_8px_rgba(59,91,219,0.12)] transition-colors active:bg-[#e9efff]"
      >
        <span className="flex items-center gap-2">
          <span className="rounded bg-[#3b5bdb] px-1.5 py-0.5 text-[10px] font-extrabold text-white">
            NEW
          </span>
          <span className="text-[15px] font-extrabold text-[#3b5bdb]">
            실대기 시간 · 실질임금 더보기
          </span>
        </span>
        <svg
          className={`h-5 w-5 shrink-0 text-[#3b5bdb] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {!open && (
        <p className="mt-1.5 px-1 text-[11px] leading-snug text-gray-500">
          이 오더를 잡았을 때 운임이 지급되지 않는 시간과, 그 시간까지 넣고 나눈
          시급을 보여드립니다.
        </p>
      )}

      {open && (
        <div className="mt-2 rounded-xl border border-[#d6e2ff] bg-white p-4">
          {/* ── 실대기 시간 ── */}
          <div className="rounded-lg bg-[#f8f9fa] px-3 py-3">
            <div className="flex items-baseline justify-between">
              <span className="flex items-center text-[13px] font-bold text-gray-700">
                실대기 시간
                <InfoDot
                  open={waitInfo}
                  onClick={() => setWaitInfo((v) => !v)}
                  label="실대기 시간 예측 이유"
                />
              </span>
              <span
                className={`text-[20px] font-extrabold ${
                  e.wait.unknown ? "text-gray-400" : "text-gray-900"
                }`}
              >
                {formatMinutes(e.wait.minutes)}
                {!e.wait.unknown && (
                  <span className="ml-1 text-[12px] font-medium text-gray-500">
                    ({e.wait.sampleCount}건)
                  </span>
                )}
              </span>
            </div>

            {waitInfo && (
              <div className="mt-2.5 space-y-1 border-t border-gray-200 pt-2.5">
                <p className="text-[12px] font-medium leading-snug text-gray-700">
                  {e.wait.basis}
                  {range && ` · ${range}`}
                </p>
                <p className="text-[11px] leading-snug text-gray-500">
                  {LEVEL_NOTE[e.wait.level]}
                </p>
                <p className="text-[11px] leading-snug text-gray-500">
                  도착부터 출발까지의 시간입니다. 대기와 상하차를 나누지 않습니다
                  — GPS 입·출차 기록이 그 둘을 구분하지 않기 때문입니다. 운임이
                  지급되지 않는 시간이라는 뜻이지, 일이 아니라는 뜻이 아닙니다.
                </p>
              </div>
            )}
          </div>

          {/* ── 실질임금 ── */}
          <div className="mt-2 rounded-lg bg-[#f4f7ff] px-3 py-3">
            <div className="flex items-baseline justify-between">
              <span className="flex items-center text-[13px] font-bold text-gray-700">
                실질임금
                <InfoDot
                  open={wageInfo}
                  onClick={() => setWageInfo((v) => !v)}
                  label="실질임금 계산 이유"
                />
              </span>
              <span className="text-[22px] font-extrabold text-[#3b5bdb]">
                {e.hourlyWage.toLocaleString()}원
                <span className="ml-0.5 text-[13px] font-bold">/시간</span>
              </span>
            </div>

            {wageInfo && (
              <div className="mt-2.5 space-y-1 border-t border-[#d6e2ff] pt-2.5">
                <p className="text-[12px] font-medium leading-snug text-gray-700">
                  순이익 {e.netProfit.toLocaleString()}원 ÷ 실질시간{" "}
                  {hours(e.effectiveHours)} · 원/km{" "}
                  {e.wonPerKm.toLocaleString()}원
                </p>
                <p className="text-[11px] leading-snug text-gray-500">
                  {COST_FOOTNOTE}
                </p>
                <p className="text-[11px] leading-snug text-gray-500">
                  {FIXED_COST_NOTE}
                </p>
              </div>
            )}
          </div>

          {/* ── 두 숫자가 어디서 나왔나 ── */}
          <div className="mt-3 divide-y divide-gray-100 border-t border-gray-200 pt-1">
            <Row
              label="운전"
              value={hours(e.driveHours)}
              sub={`${order.distance.haulKm}km · 오더에 적힌 소요시간 ${formatMinutes(order.durationMin)}`}
            />
            <Row
              label="실대기 시간"
              value={hours(e.stayHours)}
              sub={e.wait.basis}
            />
            <Row label="실질시간" value={hours(e.effectiveHours)} strong />
          </div>

          <div className="mt-2 divide-y divide-gray-100 border-t border-gray-200 pt-1">
            <Row label="등록 운임" value={`${e.fare.toLocaleString()}원`} />
            <Row
              label="연료비"
              value={`-${e.fuelCost.toLocaleString()}원`}
              sub={`${order.distance.haulKm}km ÷ ${COST.kmPerLiter}km/L × ${COST.dieselWonPerLiter.toLocaleString()}원`}
            />
            <Row
              label="톨비"
              value={`-${e.tollCost.toLocaleString()}원`}
              sub={`${COST.tollBase}원 + ${order.distance.haulKm}km × ${COST.tollWonPerKm}원`}
            />
            <Row
              label="순이익"
              value={`${e.netProfit.toLocaleString()}원`}
              strong
            />
          </div>
        </div>
      )}
    </div>
  );
}
