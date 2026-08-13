"use client";

/**
 * ⚠️ 소유: 순범. 화물 정보 탭.
 *
 * 클론 UI를 그대로 두고, 기존 정렬 4개에 우리 축 2개를 더한다.
 *   최신순 · 가까운 순 · 운송거리 짧은 순 · 금액 높은 순   ← 앱에 원래 있던 것
 *   실질 시급 높은 순 · 대기 시간 짧은 순                  ← 우리가 더한 것
 *
 * 목록에서 오더를 빼지 않는다. 순서만 바꾸고, 왜 그 순서인지 한 줄로 쓴다.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { spotOrders, isOvernightLoad, CALENDAR_2026_08 } from "@/data/mock-data";
import type { SpotOrder } from "@/lib/types";
import { computeEconomics } from "@/lib/engine/economics";
import { estimateWait } from "@/lib/engine/wait-time";
import CallMetrics from "@/components/common/CallMetrics";

type SortKey =
  | "latest"
  | "near"
  | "haul"
  | "fare"
  | "wage"
  | "wait";

const SORT_LABEL: Record<SortKey, string> = {
  latest: "최신순",
  near: "가까운 순",
  haul: "운송거리 짧은 순",
  fare: "금액 높은 순",
  wage: "실질 시급 높은 순",
  wait: "대기 시간 짧은 순",
};

/** 우리가 더한 축에만 근거를 쓴다. 앱에 원래 있던 정렬은 설명이 필요 없다. */
const SORT_NOTE: Partial<Record<SortKey, string>> = {
  wage: "순이익 ÷ 실질시간이 높은 순입니다. 실질시간에는 운임이 지급되지 않는 대기·상하차가 들어갑니다.",
  wait: "업무 외 대기시간이 짧은 순입니다. 기사님의 과거 운행 기록에서 뽑은 중앙값이고, 기록이 없으면 없다고 씁니다.",
};

const OUR_AXES: SortKey[] = ["wage", "wait"];

/**
 * 화물 정보 탭은 카카오 오더 풀이다. 외부 앱 오더는 여기 뜨지 않는다.
 * 외부 오더는 스케줄 탭의 「외부 오더 등록」으로 들어와 캘린더에만 꽂힌다 —
 * 그게 우리가 하려는 것이고, 이 목록에 섞으면 두 경로의 구분이 사라진다.
 */
const kakaoOrders = spotOrders.filter((o) => o.source === "kakao");

function sortOrders(list: SpotOrder[], key: SortKey): SpotOrder[] {
  const arr = [...list];
  switch (key) {
    case "latest":
      return arr.sort((a, b) => b.postedAt.localeCompare(a.postedAt));
    case "near":
      return arr.sort((a, b) => a.distance.toPickupKm - b.distance.toPickupKm);
    case "haul":
      return arr.sort((a, b) => a.distance.haulKm - b.distance.haulKm);
    case "fare":
      return arr.sort((a, b) => b.fare.total - a.fare.total);
    case "wage":
      return arr.sort(
        (a, b) => computeEconomics(b).hourlyWage - computeEconomics(a).hourlyWage,
      );
    case "wait":
      // 기록이 없는 건(L4)은 뒤로 보낸다 — 짧아 보이는 게 실제로 짧은 게 아니다.
      return arr.sort((a, b) => {
        const wa = estimateWait(a);
        const wb = estimateWait(b);
        if (wa.unknown !== wb.unknown) return wa.unknown ? 1 : -1;
        return wa.minutes - wb.minutes;
      });
  }
}

function getDayTag(dateBucket: "D+0" | "D+1" | "D+2+", dateISO: string, isPickup: boolean) {
  if (dateBucket === "D+0") return isPickup ? "당상" : "당착";
  if (dateBucket === "D+1") return isPickup ? "내상" : "내착";
  
  const day = CALENDAR_2026_08[dateISO] || "";
  if (day === "월") return isPickup ? "월상" : "월착";
  
  return isPickup ? "상차" : "하차";
}

/** 배지는 저장하지 않고 날짜·조건에서 파생한다. */
function badgesOf(order: SpotOrder): string[] {
  const out = [];
  
  // 선호지역 또는 맞춤노선 태그. 여기서는 거리가 30km 이내인 경우 예시로 추가합니다.
  if (order.distance.toPickupKm <= 30) out.push("선호지역");

  if (isOvernightLoad(order)) out.push("야상");
  if (order.dropoff.forklift) out.push("지게차");
  if (order.dropoff.manual) out.push("수작업");
  if (order.loadOption === "혼적") out.push("혼적");
  return out;
}

export default function CargoInfo() {
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>("latest");

  const orders = useMemo(() => sortOrders(kakaoOrders, sort), [sort]);
  const note = SORT_NOTE[sort];

  return (
    <div className="flex flex-col absolute inset-0 pb-[60px] bg-[#f4f4f6]">
      {/* Header */}
      <div className="shrink-0 bg-[#3b5bdb] text-white flex justify-between items-center px-4 py-3 z-20">
        <h1 className="text-lg font-bold">화물 정보</h1>
        <div className="flex items-center bg-white/20 px-3 py-1 rounded-full border border-white/30 cursor-pointer">
          <span className="text-sm font-medium mr-2">오더추천 ON</span>
          <div className="w-8 h-4 bg-white rounded-full flex items-center p-0.5">
            <div className="w-3 h-3 bg-[#3b5bdb] rounded-full transform translate-x-4 transition-transform"></div>
          </div>
        </div>
      </div>

      {/* Sub Header (Filters) */}
      <div className="shrink-0 bg-white flex items-center px-4 py-3 border-b border-gray-200 z-10">
        <div
          className="flex items-center text-gray-700 font-medium text-[15px] cursor-pointer relative mr-auto"
          onClick={() => setSortOpen(!sortOpen)}
        >
          <span className="mr-1 text-gray-400 font-bold">↓↑</span> {SORT_LABEL[sort]}
          {sortOpen && (
            <div className="absolute top-8 left-0 bg-white border border-gray-200 shadow-xl rounded-md w-52 py-2 z-30">
              {(Object.keys(SORT_LABEL) as SortKey[]).map((key, idx) => (
                <div key={key}>
                  {/* 앱에 원래 있던 4개와 우리가 더한 2개 사이에 선을 긋는다 */}
                  {idx === 4 && <div className="my-1.5 border-t border-gray-100" />}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSort(key);
                      setSortOpen(false);
                    }}
                    className={`px-4 py-2.5 text-sm flex justify-between items-center hover:bg-gray-50 ${
                      sort === key ? "text-[#3b5bdb] font-bold" : "text-gray-700"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {SORT_LABEL[key]}
                      {OUR_AXES.includes(key) && (
                        <span className="bg-[#f4f7ff] text-[#3b5bdb] text-[9px] px-1 py-0.5 rounded font-bold border border-[#d6e2ff]">
                          NEW
                        </span>
                      )}
                    </span>
                    {sort === key && <span className="text-xs">✓</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Link href="/settings/search" className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"></path></svg>
            검색설정
          </Link>
          <Link href="/settings/location" className="flex items-center px-3 py-1.5 border border-[#d6e2ff] text-[#3b5bdb] rounded text-xs font-bold bg-[#f4f7ff] hover:bg-[#e9efff] transition-colors">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            선호지역
          </Link>
        </div>
      </div>

      {/* 우리가 더한 정렬을 골랐을 때만 근거 한 줄 */}
      {note && (
        <div className="shrink-0 bg-[#f4f7ff] border-b border-[#d6e2ff] px-5 py-2.5">
          <p className="text-[11px] leading-snug text-[#3b5bdb]">{note}</p>
        </div>
      )}

      {/* Banner */}
      <div className="shrink-0 bg-[#eef2ff] px-5 py-5 flex justify-between items-center relative overflow-hidden">
        <div className="z-10">
          <p className="text-gray-800 font-bold text-base leading-snug">화물기사 자격을 등록하면<br/>오더를 수행할 수 있어요</p>
          <p className="text-[#3b5bdb] font-semibold text-sm mt-2 flex items-center cursor-pointer">
            서류 제출하러 가기 <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </p>
        </div>
        <div className="absolute right-[-5px] bottom-[-5px] text-7xl opacity-90 drop-shadow-sm">🗂️</div>
      </div>

      {/* Order List */}
      <div className="flex-1 overflow-y-auto bg-white pb-[60px]">
        <div className="flex flex-col">
        {orders.map((order) => (
          <Link href={`/cargo/${order.id}`} key={order.id} className="block border-t-[6px] border-gray-100 px-5 py-5 relative cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
              {badgesOf(order).map((b) => (
                <span key={b} className="text-[11px] px-1.5 py-0.5 rounded font-bold border bg-[#f4f7ff] text-[#3b5bdb] border-[#d6e2ff]">{b}</span>
              ))}
              <span className="text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-medium">{order.distance.toPickupKm}km 주변</span>
            </div>

            <div className="flex flex-col gap-1 mt-3">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full border-[1.5px] border-gray-400 mr-2 bg-transparent"></div>
                <span className="font-bold text-gray-900 text-base">{order.pickup.sido} {order.pickup.sigungu} {order.pickup.dong}</span>
                {order.pickup.date !== "D+0" && CALENDAR_2026_08[order.pickup.dateISO] && (
                  <span className="ml-2 bg-gray-400 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                    {CALENDAR_2026_08[order.pickup.dateISO]}
                  </span>
                )}
                <span className="ml-1 bg-[#e03131] text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                  {getDayTag(order.pickup.date, order.pickup.dateISO, true)}
                </span>
                <span className="ml-1 text-[13px] text-gray-500 font-medium">{order.pickup.time}</span>
              </div>

              <div className="flex flex-col ml-[3px] my-1">
                <div className="w-[1.5px] h-1.5 bg-gray-300 mb-1"></div>
                <div className="w-[1.5px] h-1.5 bg-gray-300"></div>
              </div>

              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-[#3b5bdb] mr-2"></div>
                <span className="font-bold text-gray-900 text-base">{order.dropoff.sido} {order.dropoff.sigungu} {order.dropoff.dong}</span>
                <span className="ml-1 bg-[#3b5bdb] text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                  {getDayTag(order.dropoff.date, order.dropoff.dateISO, false)}
                </span>
                <span className="ml-1 text-[13px] text-gray-500 font-medium">{order.dropoff.time}</span>
              </div>
            </div>

            <div className="mt-4 text-[14px]">
              <span className="font-bold text-gray-900">{order.loadOption}</span>
              <span className="text-gray-300 mx-1.5 font-bold">·</span>
              <span className="font-bold text-gray-900">{order.vehicle.ton}톤</span>
              <span className="text-gray-300 mx-1.5 font-bold">·</span>
              <span className="font-bold text-gray-900">{order.vehicle.body}</span>
              {order.remarksRaw && <span className="text-gray-600 ml-1.5">{order.remarksRaw}</span>}
            </div>

            {/* 요건 미달이어도 빼지 않는다. 회색으로 두고 사유를 쓴다 */}
            {!order.vehicleFit.ok && (
              <p className="mt-2 rounded bg-gray-100 px-2 py-1.5 text-[11px] leading-snug text-gray-500">
                ⚠ {order.vehicleFit.reason}
              </p>
            )}

            {/* ★ 실질 시급 + 업무 외 대기시간 */}
            <CallMetrics order={order} />

            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <div className="text-[13px] text-[#3b5bdb] font-medium">
                {order.fare.settle}
              </div>
              <div className="text-right">
                <span className="text-[11px] text-gray-400 mr-1">등록 운임</span>
                <span className="text-[22px] font-extrabold text-gray-900">{order.fare.total.toLocaleString()}</span>
              </div>
            </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Floating Button */}
      <div className="absolute bottom-[20px] w-full max-w-[480px] px-5 flex justify-center z-30 pointer-events-none">
        <button className="pointer-events-auto bg-[#f4f7ff]/95 backdrop-blur-sm border border-[#3b5bdb] text-[#3b5bdb] shadow-lg rounded-full py-3.5 px-8 font-bold text-[15px] flex items-center justify-center transition-transform hover:scale-105">
          자동배차 예약하고 오더 선점하기
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>
    </div>
  );
}
