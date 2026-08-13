"use client";

/**
 * ⚠️ 소유: 지수. 스케줄 카드 클릭 시 SpotOrder 전체 정보를 보여주는 상세 시트.
 *
 * 여기서 보여주는 값은 전부 SpotOrder에 실제로 있는 필드다 — 지어내지 않는다.
 * 값이 없으면(예: conditions 빈 배열) 그 섹션 자체를 숨긴다.
 */

import { conditionStatusLabels, conditionTypeLabels } from "@/data/mock-data";
import { getConditionBadges, getMetaBadges } from "./badges";
import type { ScheduleItem } from "./types";

function formatWon(amount: number): string {
  return `${amount.toLocaleString()}원`;
}

export default function ScheduleDetailModal({
  item,
  onClose,
}: {
  item: ScheduleItem;
  onClose: () => void;
}) {
  const { order } = item;
  const metaBadges = getMetaBadges(order);
  const conditionBadges = getConditionBadges(order);

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[480px] flex-col justify-end bg-black/40">
      <div className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-gray-900">운행 상세</h2>
          <button onClick={onClose} className="text-[22px] leading-none text-gray-400">
            ×
          </button>
        </div>

        {/* 메타 배지 */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {metaBadges.map((b) => (
            <span
              key={b}
              className="rounded bg-[#f4f7ff] px-2 py-1 text-[11px] font-bold text-[#3b5bdb]"
            >
              {b}
            </span>
          ))}
        </div>

        {/* 경로 */}
        <div className="mb-4 rounded-lg border border-gray-100 bg-[#fafafa] p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <span className="text-[11px] font-bold text-gray-400">상차</span>
              <p className="text-[14px] font-bold text-gray-900">
                {order.pickup.sido} {order.pickup.sigungu} {order.pickup.dong}
              </p>
              <p className="text-[12px] text-gray-500">
                {order.pickup.dateISO} {order.pickup.time}
              </p>
            </div>
          </div>
          <div className="my-2 border-t border-dashed border-gray-200" />
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <span className="text-[11px] font-bold text-gray-400">하차</span>
              <p className="text-[14px] font-bold text-gray-900">
                {order.dropoff.sido} {order.dropoff.sigungu} {order.dropoff.dong}
              </p>
              <p className="text-[12px] text-gray-500">
                {order.dropoff.dateISO} {order.dropoff.time}
              </p>
            </div>
          </div>
        </div>

        {/* 작업 조건 스티커 (전체) */}
        {conditionBadges.length > 0 && (
          <div className="mb-4">
            <p className="mb-1.5 text-[12px] font-bold text-gray-400">작업 조건</p>
            <div className="flex flex-wrap gap-1.5">
              {conditionBadges.map((b, idx) => (
                <span
                  key={`${b}-${idx}`}
                  className="rounded bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-600"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 조건 근거 (원문 대조) */}
        {order.conditions.length > 0 && (
          <div className="mb-4">
            <p className="mb-1.5 text-[12px] font-bold text-gray-400">조건 근거</p>
            <div className="flex flex-col gap-2">
              {order.conditions.map((c, idx) => (
                <div key={idx} className="rounded-lg border border-gray-100 p-2.5">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">
                      {conditionTypeLabels[c.type]}
                    </span>
                    <span className="text-[13px] font-bold text-gray-900">{c.value}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {conditionStatusLabels[c.status]} · &ldquo;{c.evidence}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 화주 원문 */}
        {order.remarksRaw && (
          <div className="mb-4">
            <p className="mb-1.5 text-[12px] font-bold text-gray-400">화주 원문</p>
            <p className="rounded-lg bg-gray-50 p-2.5 text-[13px] leading-relaxed text-gray-700">
              {order.remarksRaw}
            </p>
          </div>
        )}

        {/* 운임 · 거리 · 소요시간 */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-100 p-3">
            <p className="text-[11px] font-bold text-gray-400">운임</p>
            <p className="text-[15px] font-extrabold text-gray-900">
              {formatWon(order.fare.total)}
            </p>
            <p className="text-[11px] text-gray-400">
              {order.fare.settle}
              {order.fare.extraManual > 0 && ` · 수작업비 ${formatWon(order.fare.extraManual)} 포함`}
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 p-3">
            <p className="text-[11px] font-bold text-gray-400">거리 · 소요</p>
            <p className="text-[15px] font-extrabold text-gray-900">
              {order.distance.haulKm}km
            </p>
            <p className="text-[11px] text-gray-400">
              공차 {order.distance.toPickupKm}km · {order.durationMin}분
            </p>
          </div>
        </div>

        {/* 차량 적합성 */}
        {!order.vehicleFit.ok && (
          <div className="mb-4 rounded-lg bg-red-50 p-3">
            <p className="text-[12px] font-bold text-red-500">차량 요건 미달</p>
            <p className="text-[12px] text-red-400">{order.vehicleFit.reason}</p>
          </div>
        )}

        {/* 화주 · 등록 시각 */}
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span>화주: {order.shipper}</span>
          <span>등록 {order.postedAt}</span>
        </div>
      </div>
    </div>
  );
}
