"use client";

/**
 * ⚠️ 소유: 순범. 오더 전체 정보창.
 *
 * 카드가 보여준 두 숫자(실질 시급 · 업무 외 대기시간)의 근거를 여기서 전부 편다.
 * ★ 조건마다 원문 구절을 같이 보여준다 — 근거 구절이 있어야 기사가 우리 추정을 믿는다.
 *   해석 못 한 건 빈칸으로 두지 않고 "해석 불가 — 원문 그대로"라고 쓴다.
 */

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  spotOrders,
  conditionStatusLabels,
  conditionTypeLabels,
  renderDateBadge,
} from "@/data/mock-data";
import type { ConditionStatus } from "@/lib/types";
import TimeBreakdown from "@/components/common/TimeBreakdown";

const STATUS_STYLE: Record<ConditionStatus, string> = {
  명시: "bg-[#f4f7ff] text-[#3b5bdb] border-[#d6e2ff]",
  추정: "bg-[#fff7ed] text-[#c2620a] border-[#fed7aa]",
  미상: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function OrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const order = spotOrders.find((o) => o.id === id);
  if (!order) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f4f6] pb-[80px]">
      <div className="sticky top-0 z-20 flex items-center gap-3 bg-white px-4 py-3.5">
        <Link href="/cargo" className="text-gray-800">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <span className="text-[15px] font-bold text-gray-900">
          {renderDateBadge(order)}
        </span>
      </div>

      {/* 경로 */}
      <div className="bg-white px-5 py-5">
        <div className="mb-4 flex items-center gap-2 text-[13px] text-gray-600">
          <span className="rounded bg-gray-100 px-2 py-0.5 font-medium">
            {order.loadOption}
          </span>
          <span>
            {order.vehicle.ton}톤 {order.vehicle.body}
          </span>
          <span className="text-gray-300">|</span>
          <span>운송 {order.distance.haulKm}km</span>
          <span className="text-gray-300">|</span>
          <span>상차지까지 {order.distance.toPickupKm}km</span>
        </div>

        {[
          { w: order.pickup, kind: "상차", dot: "border-2 border-gray-400 bg-white" },
          { w: order.dropoff, kind: "하차", dot: "bg-[#3b5bdb]" },
        ].map(({ w, kind, dot }) => (
          <div key={kind} className="mb-5 flex last:mb-0">
            <div className={`mr-3 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ${dot}`} />
            <div className="flex-1">
              <h2 className="text-[17px] font-extrabold leading-tight text-gray-900">
                {w.sido} {w.sigungu} {w.dong}
              </h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded bg-[#3b5bdb] px-1.5 py-0.5 text-[11px] font-bold text-white">
                  {kind} {w.time}
                </span>
                {w.forklift && (
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-bold text-gray-600">
                    지게차
                  </span>
                )}
                {w.manual && (
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-bold text-gray-600">
                    수작업
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {!order.vehicleFit.ok && (
          <p className="mt-2 rounded bg-gray-100 px-3 py-2 text-[12px] leading-snug text-gray-600">
            ⚠ {order.vehicleFit.reason}
          </p>
        )}
      </div>

      {/* ★ 시간 분해 — 카드의 두 숫자가 어디서 나왔나 */}
      <div className="mt-3 px-4">
        <TimeBreakdown order={order} />
      </div>

      {/* 화주 요구사항 — 원문과 파싱 결과를 같이 */}
      <div className="mt-3 px-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-2 text-[15px] font-extrabold text-gray-900">
            화주 요구사항
          </h3>

          {order.remarksRaw ? (
            <p className="rounded bg-[#f8f9fa] px-3 py-2.5 text-[13px] leading-relaxed text-gray-700">
              {order.remarksRaw}
            </p>
          ) : (
            <p className="rounded bg-[#f8f9fa] px-3 py-2.5 text-[13px] text-gray-400">
              원문 비고 없음
            </p>
          )}

          <div className="mt-3 flex flex-col gap-2.5">
            {order.conditions.map((c, i) => (
              <div key={i} className="flex gap-2">
                <span
                  className={`h-fit shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold ${STATUS_STYLE[c.status]}`}
                >
                  {conditionTypeLabels[c.type]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-gray-900">{c.value}</p>
                  {/* ★ 근거 구절. 이 한 줄이 있어야 우리 추정을 믿는다 */}
                  <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
                    ← 원문 &ldquo;{c.evidence}&rdquo; · {conditionStatusLabels[c.status]}
                  </p>
                </div>
              </div>
            ))}
            {order.conditions.length === 0 && (
              <p className="text-[12px] text-gray-400">
                원문에서 뽑아낸 조건이 없습니다
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 운임 */}
      <div className="mt-3 mb-6 px-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[15px] font-extrabold text-gray-900">
              등록 운임
            </span>
            <span className="text-[20px] font-extrabold text-gray-900">
              {order.fare.total.toLocaleString()}원
            </span>
          </div>
          <div className="mt-2 flex justify-between text-[13px] text-gray-500">
            <span>기본운임</span>
            <span>{order.fare.base.toLocaleString()}원</span>
          </div>
          {order.fare.extraManual > 0 && (
            <div className="mt-1 flex justify-between text-[13px] text-gray-500">
              <span>추가운임(수작업)</span>
              <span>{order.fare.extraManual.toLocaleString()}원</span>
            </div>
          )}
          <p className="mt-2.5 text-[10px] leading-snug text-gray-400">
            앱에 등록된 운임입니다. 현장에서 협의로 달라질 수 있어 실제 지급액과
            다를 수 있습니다.
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 z-30 flex h-[65px] w-full max-w-[480px] shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Link
          href="/cargo"
          className="flex w-[30%] items-center justify-center bg-[#5c5c5c] text-[17px] font-bold text-white"
        >
          닫기
        </Link>
        <button
          disabled={!order.vehicleFit.ok}
          className="flex w-[70%] items-center justify-center bg-[#4068e8] text-[19px] font-bold text-white disabled:bg-gray-300"
        >
          {order.vehicleFit.ok
            ? `${order.fare.total.toLocaleString()}원 수락`
            : "요건 미달"}
        </button>
      </div>
    </div>
  );
}
