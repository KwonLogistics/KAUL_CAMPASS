"use client";

import React from "react";
import type { SpotOrder } from "@/lib/types";

export default function AutoDispatchSuccessModal({
  order,
  onClose,
}: {
  order: SpotOrder;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-[#3b5bdb] px-5 py-4 text-white text-center">
          <div className="text-[24px] mb-1">🎉</div>
          <h2 className="text-lg font-bold">자동 배차 성공!</h2>
          <p className="text-white/80 text-[13px] mt-1">
            설정한 조건에 딱 맞는 오더를 스케줄에 등록했습니다.
          </p>
        </div>
        <div className="p-5">
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-3">
              <div className="font-bold text-gray-900">
                {order.pickup.sido} {order.pickup.sigungu}
              </div>
              <div className="text-gray-400">➔</div>
              <div className="font-bold text-gray-900">
                {order.dropoff.sido} {order.dropoff.sigungu || ""}
              </div>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[13px] text-gray-500">차량/옵션</span>
              <span className="text-[13px] font-bold text-gray-700">
                {order.vehicle.ton}톤 {order.vehicle.body} · {order.loadOption}
              </span>
            </div>
            <div className="flex justify-between items-center text-[#f05c2a]">
              <span className="text-[13px] font-bold">확정 운임</span>
              <span className="text-[16px] font-extrabold">
                {order.fare.total.toLocaleString()}원
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="mt-4 w-full rounded-md bg-[#3b5bdb] py-3 text-[14px] font-bold text-white hover:bg-blue-700 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
