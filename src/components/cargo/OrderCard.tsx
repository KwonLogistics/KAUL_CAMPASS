/**
 * ⚠️ 소유: 순범. 화물 정보 탭 오더 카드.
 *
 * 요건 미달 오더도 목록에서 빼지 않는다 — 회색 처리하고 사유를 쓴다.
 * 빼면 기사가 "왜 안 보이지"를 알 수 없고, 그건 우리가 판단을 대신한 것이다.
 */

import Link from "next/link";
import type { SpotOrder } from "@/lib/types";
import { renderDateBadge, isOvernightLoad } from "@/data/mock-data";
import CallMetrics from "@/components/common/CallMetrics";

/** 배지는 저장하지 않고 조건·날짜에서 파생한다. */
function badgesOf(order: SpotOrder): string[] {
  const out: string[] = [renderDateBadge(order)];
  if (isOvernightLoad(order)) out.push("야상");
  if (order.dropoff.forklift) out.push("지게차");
  if (order.dropoff.manual) out.push("수작업");
  if (order.loadOption === "혼적") out.push("혼적");
  return out;
}

export default function OrderCard({ order }: { order: SpotOrder }) {
  const fit = order.vehicleFit.ok;

  return (
    <Link
      href={`/cargo/${order.id}`}
      className={`block border-t-[6px] border-gray-100 px-5 py-4 transition-colors hover:bg-gray-50 ${
        fit ? "" : "bg-gray-50/60"
      }`}
    >
      {/* 태그 */}
      <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
        {badgesOf(order).map((b) => (
          <span
            key={b}
            className="rounded border border-[#d6e2ff] bg-[#f4f7ff] px-1.5 py-0.5 text-[11px] font-bold text-[#3b5bdb]"
          >
            {b}
          </span>
        ))}
        {order.source === "external" && (
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-bold text-gray-500">
            외부
          </span>
        )}
      </div>

      {/* 경로 */}
      <div className={`flex flex-col gap-1 ${fit ? "" : "opacity-60"}`}>
        <div className="flex items-center">
          <div className="mr-2 h-2 w-2 shrink-0 rounded-full border-[1.5px] border-gray-400" />
          <span className="text-[15px] font-bold text-gray-900">
            {order.pickup.sido} {order.pickup.sigungu} {order.pickup.dong}
          </span>
          <span className="ml-2 text-[13px] font-medium text-gray-500">
            {order.pickup.time}
          </span>
        </div>
        <div className="my-0.5 ml-[3px] flex flex-col gap-1">
          <div className="h-1.5 w-[1.5px] bg-gray-300" />
          <div className="h-1.5 w-[1.5px] bg-gray-300" />
        </div>
        <div className="flex items-center">
          <div className="mr-2 h-2 w-2 shrink-0 rounded-full bg-[#3b5bdb]" />
          <span className="text-[15px] font-bold text-gray-900">
            {order.dropoff.sido} {order.dropoff.sigungu} {order.dropoff.dong}
          </span>
          <span className="ml-2 text-[13px] font-medium text-gray-500">
            {order.dropoff.time}
          </span>
        </div>
      </div>

      {/* 차량·화주 */}
      <div className="mt-3 text-[13px]">
        <span className="font-bold text-gray-900">
          {order.loadOption} · {order.vehicle.ton}톤 · {order.vehicle.body}
        </span>
        <span className="mx-1.5 font-bold text-gray-300">·</span>
        <span className="text-gray-600">{order.distance.haulKm}km</span>
        <span className="mx-1.5 font-bold text-gray-300">·</span>
        <span className="text-gray-600">{order.shipper}</span>
      </div>

      {/* 원문 — 다듬지 않고 그대로 */}
      {order.remarksRaw && (
        <p className="mt-1.5 truncate text-[13px] text-gray-600">
          {order.remarksRaw}
        </p>
      )}

      {/* 요건 미달이면 빼는 대신 사유를 쓴다 */}
      {!fit && (
        <p className="mt-2 rounded bg-gray-100 px-2 py-1.5 text-[11px] leading-snug text-gray-500">
          ⚠ {order.vehicleFit.reason}
        </p>
      )}

      {/* ★ 실질 시급 + 업무 외 대기시간 */}
      <CallMetrics order={order} />

      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-[13px] font-medium text-[#3b5bdb]">
          {order.fare.settle}
        </span>
        <div className="text-right">
          <span className="text-[11px] text-gray-400">등록 운임 </span>
          <span className="text-[20px] font-extrabold text-gray-900">
            {order.fare.total.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
