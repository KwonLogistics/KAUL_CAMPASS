"use client";

/**
 * ⚠️ 소유: 순범. 오더 전체 정보창.
 *
 * ★ 원래 앱의 상세 화면을 그대로 둔다 — 경로 / 물품정보 / 운임 / 업체정보 순서,
 *   표 모양, 하단 「닫기 · 수락」까지. 기사가 이미 외운 화면을 우리가 바꾸지 않는다.
 * ★ 화주 요구사항(remarksRaw)은 파싱하지 않고 원문 그대로 물품정보 칸에 넣는다.
 *   조건 태그는 여기서 쓰지 않는다.
 * ★ 우리가 더한 것은 「실대기 시간 · 실질임금」 하나뿐이고, 그건 더보기 안에 있다.
 */

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { spotOrders, dayTagOf, CALENDAR_2026_08 } from "@/data/mock-data";
import type { SpotOrder, Waypoint } from "@/lib/types";
import OrderAnalysis from "@/components/common/OrderAnalysis";
import { useAppState } from "@/lib/store/AppStateProvider";

/** 상하차 안내 문구 — 원문을 다시 파싱하지 않고 Waypoint의 불리언에서만 만든다. */
function handlingNote(w: Waypoint, kind: "상차" | "하차"): string | null {
  if (w.manual) return `함께 ${kind}+운반해 주셔야 합니다.`;
  if (w.forklift) return `지게차 ${kind}입니다.`;
  return null;
}

function Stop({
  w,
  order,
  isPickup,
}: {
  w: Waypoint;
  order: SpotOrder;
  isPickup: boolean;
}) {
  const note = handlingNote(w, isPickup ? "상차" : "하차");
  const weekday = CALENDAR_2026_08[w.dateISO];

  return (
    <div className="relative pl-6 pb-5 last:pb-0">
      {/* 점 + 점선 연결 */}
      <span
        className={`absolute left-0 top-[5px] h-3.5 w-3.5 rounded-full ${
          isPickup ? "border-2 border-gray-400 bg-white" : "bg-[#7048e8]"
        }`}
      />
      {isPickup && (
        <span className="absolute bottom-0 left-[6px] top-[22px] w-px border-l border-dashed border-gray-300" />
      )}

      <h2 className="text-[17px] font-extrabold leading-tight text-gray-900">
        {w.sido} {w.sigungu} {w.dong}
      </h2>
      {w.addressDetail && (
        <p className="mt-0.5 text-[13px] text-gray-500">{w.addressDetail}</p>
      )}

      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {w.manual && (
          <span className="rounded bg-gray-400 px-1.5 py-0.5 text-[11px] font-bold text-white">
            수
          </span>
        )}
        {w.date !== "D+0" && weekday && (
          <span className="rounded bg-gray-400 px-1.5 py-0.5 text-[11px] font-bold text-white">
            {weekday}
          </span>
        )}
        <span
          className={`rounded px-1.5 py-0.5 text-[11px] font-bold text-white ${
            isPickup ? "bg-[#e03131]" : "bg-[#3b5bdb]"
          }`}
        >
          {dayTagOf(w, isPickup)}
        </span>
        <span className="ml-0.5 text-[13px] font-medium text-gray-600">
          {w.time}
        </span>
      </div>

      {(note || isPickup) && (
        <div className="mt-2 rounded bg-[#f4f4f6] px-3 py-2.5 text-[13px] leading-relaxed text-gray-700">
          {note && <p>{note}</p>}
          {isPickup && <p className="text-gray-500">{order.shipper}</p>}
        </div>
      )}
    </div>
  );
}

/** 표 한 줄 — 라벨 칸(연파랑) + 값 칸 */
function TableRow({
  label,
  children,
  last = false,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`flex ${last ? "" : "border-b border-gray-200"}`}>
      <div className="w-[84px] shrink-0 border-r border-gray-200 bg-[#f4f7ff] px-3 py-3 text-[13px] font-bold text-gray-700">
        {label}
      </div>
      <div className="min-w-0 flex-1 px-3 py-3 text-[13px] leading-relaxed text-gray-800">
        {children}
      </div>
    </div>
  );
}

export default function OrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  // 외부 등록 오더는 spotOrders(정적 목업)에 없다 — localStorage 저장소에서도 찾는다.
  const { scheduled, hydrated } = useAppState();
  const order =
    spotOrders.find((o) => o.id === id) ?? scheduled.find((s) => s.order.id === id)?.order;
  if (!order) {
    // localStorage 복원 전(hydrated=false)에는 외부 오더가 아직 안 보일 뿐이다 — 진짜 404 로 단정하지 않는다.
    if (!hydrated) return null;
    notFound();
  }

  const perKm =
    order.distance.haulKm > 0
      ? Math.round(order.fare.total / order.distance.haulKm)
      : 0;

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f4f6] pb-[80px]">
      <div className="sticky top-0 z-20 flex items-center justify-between bg-white px-4 py-3.5">
        <Link href="/cargo" className="text-gray-800">
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </Link>
        <span className="text-[15px] font-bold text-gray-800">지도 보기</span>
      </div>

      {/* 경로 */}
      <div className="bg-white px-5 pb-5">
        <div className="flex items-center gap-2 py-3 text-[13px] text-gray-600">
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[12px] font-bold text-gray-700">
            편도
          </span>
          <span>상차지까지 {order.distance.toPickupKm}km</span>
          <span className="text-gray-300">|</span>
          <span>운송거리 {order.distance.haulKm}km</span>
        </div>

        <div className="mt-1">
          <Stop w={order.pickup} order={order} isPickup />
          <Stop w={order.dropoff} order={order} isPickup={false} />
        </div>
      </div>

      {/* 물품정보 — 화주 요구사항은 원문 그대로 */}
      <div className="mt-3 px-4">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <TableRow label="물품정보">
            {order.remarksRaw || <span className="text-gray-400">-</span>}
          </TableRow>
          <TableRow label="혼적여부">{order.loadOption}</TableRow>
          <TableRow label="요구차종" last>
            {order.vehicle.ton}톤 {order.vehicle.body}
          </TableRow>
        </div>

        {!order.vehicleFit.ok && (
          <p className="mt-2 rounded bg-gray-100 px-3 py-2 text-[12px] leading-snug text-gray-600">
            ⚠ {order.vehicleFit.reason}
          </p>
        )}
      </div>

      {/* 운임 */}
      <div className="mt-3 px-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <span className="rounded bg-[#f4f7ff] px-1.5 py-0.5 text-[12px] font-bold text-[#3b5bdb]">
              {order.fare.settle}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-[15px] font-extrabold text-gray-900">
              업체와 정산할 금액
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

          <div className="mt-3 flex items-baseline justify-between border-t border-gray-200 pt-3">
            <span className="text-[15px] font-extrabold text-gray-900">
              총 수입
            </span>
            <div className="text-right">
              <span className="text-[20px] font-extrabold text-gray-900">
                {order.fare.total.toLocaleString()}원
              </span>
              <p className="text-[13px] text-gray-500">
                1km당 <span className="font-bold">{perKm.toLocaleString()}원</span>
              </p>
            </div>
          </div>

          <p className="mt-2.5 text-[10px] leading-snug text-gray-400">
            앱에 등록된 운임입니다. 현장에서 협의로 달라질 수 있어 실제 지급액과
            다를 수 있습니다.
          </p>
        </div>
      </div>

      {/* ★ 우리가 더한 것 — 접혀 있다가 더보기로 열린다 */}
      <div className="mt-3 px-4">
        <OrderAnalysis order={order} />
      </div>

      {/* 업체정보 */}
      <div className="mt-3 mb-6 px-4">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <TableRow label="업체정보">
            <div className="flex items-center justify-between gap-2">
              <span>{order.shipper}</span>
              <button
                type="button"
                className="shrink-0 rounded border border-gray-300 px-2 py-1 text-[12px] font-medium text-gray-600"
              >
                신고하기
              </button>
            </div>
          </TableRow>
          <TableRow label="정산방식" last>
            {order.fare.settle}
          </TableRow>
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
