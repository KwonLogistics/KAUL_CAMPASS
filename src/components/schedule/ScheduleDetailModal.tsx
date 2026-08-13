"use client";

/**
 * ⚠️ 소유: 지수. 스케줄 카드 클릭 시 원본(SpotOrder/PastTrip/FixedSchedule) 전체 정보를 보여주는 상세 시트.
 *
 * 여기서 보여주는 값은 전부 원본에 실제로 있는 필드다 — 지어내지 않는다.
 * 세 원본은 필드 모양이 서로 달라서 orderKind별로 섹션을 나눠 그린다.
 * 값이 없으면(예: conditions 빈 배열, FixedSchedule의 postedAt 없음) 그 섹션 자체를 숨긴다.
 */

import { conditionStatusLabels, conditionTypeLabels } from "@/data/mock-data";
import type { SpotOrder, PastTrip, FixedSchedule } from "@/lib/types";
import { getConditionBadges, getFareTotal, getHaulKm, getMetaBadges, getRouteLabel } from "./badges";
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
  const metaBadges = getMetaBadges(item);
  const conditionBadges = getConditionBadges(item);
  const routeLabel = getRouteLabel(item);
  const fareTotal = getFareTotal(item);
  const haulKm = getHaulKm(item);

  const spotOrder = item.orderKind === "spot" ? (item.order as SpotOrder) : null;
  const pastTrip = item.orderKind === "past" ? (item.order as PastTrip) : null;
  const fixedSchedule = item.orderKind === "fixed" ? (item.order as FixedSchedule) : null;

  return (
    <div className="fixed inset-0 z-[60] mx-auto flex max-w-[480px] flex-col justify-end bg-black/40">
      <div className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 pb-10">
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

        {/* 경로 · 시간 — orderKind별로 모양이 다르다 */}
        <div className="mb-4 rounded-lg border border-gray-100 bg-[#fafafa] p-3">
          {spotOrder && (
            <>
              <div>
                <span className="text-[11px] font-bold text-gray-400">상차</span>
                <p className="text-[14px] font-bold text-gray-900">
                  {spotOrder.pickup.sido} {spotOrder.pickup.sigungu} {spotOrder.pickup.dong}
                </p>
                <p className="text-[12px] text-gray-500">
                  {spotOrder.pickup.dateISO} {spotOrder.pickup.time}
                </p>
              </div>
              <div className="my-2 border-t border-dashed border-gray-200" />
              <div>
                <span className="text-[11px] font-bold text-gray-400">하차</span>
                <p className="text-[14px] font-bold text-gray-900">
                  {spotOrder.dropoff.sido} {spotOrder.dropoff.sigungu} {spotOrder.dropoff.dong}
                </p>
                <p className="text-[12px] text-gray-500">
                  {spotOrder.dropoff.dateISO} {spotOrder.dropoff.time}
                </p>
              </div>
            </>
          )}

          {pastTrip && (
            <>
              <p className="text-[14px] font-bold text-gray-900">{routeLabel}</p>
              <p className="mt-1 text-[12px] text-gray-500">
                {pastTrip.dateISO} 계획 {pastTrip.plannedPickup} → {pastTrip.plannedDropoff}
              </p>
              <p className="text-[12px] text-gray-500">
                실제 하차 {pastTrip.actualDropoff}
                {pastTrip.actualDropoff !== pastTrip.plannedDropoff && (
                  <span className="ml-1 font-bold text-red-400">(계획과 다름)</span>
                )}
              </p>
            </>
          )}

          {fixedSchedule && (
            <>
              <p className="text-[14px] font-bold text-gray-900">{routeLabel}</p>
              <p className="mt-1 text-[12px] text-gray-500">
                {fixedSchedule.pattern} · {fixedSchedule.pickupTime} → {fixedSchedule.dropoffTime}
              </p>
              <p className="text-[12px] text-gray-400">
                유효기간 {fixedSchedule.validFrom} ~ {fixedSchedule.validUntil}
              </p>
            </>
          )}
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

        {/* 조건 근거 (원문 대조) — SpotOrder만 conditions를 갖고 있다 */}
        {spotOrder && spotOrder.conditions.length > 0 && (
          <div className="mb-4">
            <p className="mb-1.5 text-[12px] font-bold text-gray-400">조건 근거</p>
            <div className="flex flex-col gap-2">
              {spotOrder.conditions.map((c, idx) => (
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

        {/* 현장 상황 — PastTrip이고 오더 조건과 실제가 달랐던 경우만 */}
        {pastTrip && pastTrip.conditionMismatch && pastTrip.mismatchDetail && (
          <div className="mb-4">
            <p className="mb-1.5 text-[12px] font-bold text-gray-400">현장 상황</p>
            <p className="rounded-lg bg-red-50 p-2.5 text-[13px] leading-relaxed text-red-500">
              {pastTrip.mismatchDetail}
            </p>
          </div>
        )}

        {/* 화주 원문 */}
        {item.order.remarksRaw && (
          <div className="mb-4">
            <p className="mb-1.5 text-[12px] font-bold text-gray-400">화주 원문</p>
            <p className="rounded-lg bg-gray-50 p-2.5 text-[13px] leading-relaxed text-gray-700">
              {item.order.remarksRaw}
            </p>
          </div>
        )}

        {/* 운임 · 거리 · 소요시간 */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-100 p-3">
            <p className="text-[11px] font-bold text-gray-400">운임</p>
            <p className="text-[15px] font-extrabold text-gray-900">{formatWon(fareTotal)}</p>
            {(spotOrder || pastTrip) && (
              <p className="text-[11px] text-gray-400">
                {(spotOrder ?? pastTrip)!.fare.settle}
                {(spotOrder ?? pastTrip)!.fare.extraManual > 0 &&
                  ` · 수작업비 ${formatWon((spotOrder ?? pastTrip)!.fare.extraManual)} 포함`}
              </p>
            )}
          </div>
          <div className="rounded-lg border border-gray-100 p-3">
            <p className="text-[11px] font-bold text-gray-400">거리{spotOrder ? " · 소요" : ""}</p>
            <p className="text-[15px] font-extrabold text-gray-900">{haulKm}km</p>
            {spotOrder && (
              <p className="text-[11px] text-gray-400">
                공차 {spotOrder.distance.toPickupKm}km · {spotOrder.durationMin}분
              </p>
            )}
          </div>
        </div>

        {/* 차량 적합성 — SpotOrder만 vehicleFit을 갖고 있다 */}
        {spotOrder && !spotOrder.vehicleFit.ok && (
          <div className="mb-4 rounded-lg bg-red-50 p-3">
            <p className="text-[12px] font-bold text-red-500">차량 요건 미달</p>
            <p className="text-[12px] text-red-400">{spotOrder.vehicleFit.reason}</p>
          </div>
        )}

        {/* 화주 · 등록 시각 — FixedSchedule은 postedAt이 없다(등록이 아니라 상시 계약) */}
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span>화주: {item.order.shipper}</span>
          {(spotOrder || pastTrip) && <span>등록 {(spotOrder ?? pastTrip)!.postedAt}</span>}
        </div>
      </div>
    </div>
  );
}
