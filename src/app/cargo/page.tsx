"use client";

/**
 * ⚠️ 소유: 순범. 화물 정보 탭.
 *
 * ★ 정렬 토글이 이 화면의 핵심이다.
 *   운임순과 실질 시급순에서 목록 순서가 눈앞에서 뒤집힌다.
 *   가장 비싼 오더가 시급으로는 꼴찌일 수 있다는 걸, 잡기 전에 보여준다.
 *
 * 우리는 오더를 고르지 않는다. 목록에서 빼지도 않는다. 순서만 바꾸고, 왜 그 순서인지 쓴다.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { spotOrders } from "@/data/mock-data";
import { computeEconomics } from "@/lib/engine/economics";
import OrderCard from "@/components/cargo/OrderCard";

type SortKey = "fare" | "wage";

const SORT_LABEL: Record<SortKey, string> = {
  fare: "운임순",
  wage: "실질 시급순",
};

const SORT_NOTE: Record<SortKey, string> = {
  fare: "등록 운임이 높은 순입니다. 운임은 일에 쓰는 시간을 말해주지 않습니다.",
  wage: "순이익 ÷ 실질시간이 높은 순입니다. 실질시간에는 무급인 대기·상하차가 들어갑니다.",
};

export default function CargoInfo() {
  const [sort, setSort] = useState<SortKey>("fare");

  const orders = useMemo(() => {
    const withEconomics = spotOrders.map((o) => ({
      order: o,
      economics: computeEconomics(o),
    }));
    return withEconomics.sort((a, b) =>
      sort === "fare"
        ? b.order.fare.total - a.order.fare.total
        : b.economics.hourlyWage - a.economics.hourlyWage,
    );
  }, [sort]);

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f4f6] pb-[80px]">
      {/* 헤더 */}
      <div className="sticky top-0 z-20 flex items-center justify-between bg-[#3b5bdb] px-4 py-3 text-white">
        <h1 className="text-lg font-bold">화물 정보</h1>
        <Link
          href="/settings/location"
          className="rounded-full border border-white/30 bg-white/20 px-3 py-1 text-sm font-medium"
        >
          선호 지역
        </Link>
      </div>

      {/* ★ 정렬 토글 */}
      <div className="sticky top-[52px] z-10 border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex gap-1.5">
          {(["fare", "wage"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={`flex-1 rounded-md py-2 text-[14px] font-bold transition-colors ${
                sort === k
                  ? "bg-[#3b5bdb] text-white"
                  : "border border-gray-200 bg-white text-gray-600"
              }`}
            >
              {SORT_LABEL[k]}
            </button>
          ))}
        </div>
        {/* 왜 이 순서인지 쓴다 */}
        <p className="mt-2 text-[11px] leading-snug text-gray-500">
          {SORT_NOTE[sort]}
        </p>
      </div>

      <div className="flex items-center justify-between px-5 py-2.5 text-[12px] text-gray-500">
        <span>{orders.length}건</span>
        <span>조건에 안 맞는 오더도 빼지 않고 전부 보여드립니다</span>
      </div>

      {/* 목록 */}
      <div className="flex flex-col bg-white">
        {orders.map(({ order }) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
