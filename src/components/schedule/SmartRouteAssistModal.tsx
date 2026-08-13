"use client";

/**
 * ⚠️ 소유: 지수. "✨ AI 스마트 경로 추천 받기" 클릭 시 뜨는 스마트 경로 어시스트 모달.
 *
 * 이번 단계는 "AI 맞춤형 즉시 추천" 영역까지만 — 하단 "직접 자동 배차 조건 생성하기"는
 * 다음 단계에서 붙인다. 「이 오더 수락하기」는 UI만 있고 실제 배차/스케줄 반영은 하지 않는다.
 *
 * 추천 후보는 spotOrders(기존 목업 후보 풀, 다른 팀원 소유 — 여기서 읽기만 한다)에서
 * gap 시간 안에 상차~하차가 온전히 들어가는 것만 최대 2건 뽑는다.
 * 이동시간·거리처럼 데이터에 없는 값은 절대 지어내지 않는다 — 그래서 카드엔
 * 출발지→도착지 / 차량·운송조건 태그 / 운임만 보여준다("N분 이동" 같은 문구 없음).
 */

import { spotOrders } from "@/data/mock-data";
import { convertSpotOrderToScheduleItem } from "./convert";
import { getMetaBadges, getConditionBadges, getRouteLabel, getFareTotal } from "./badges";
import type { ScheduleItem } from "./types";
import { useState } from "react";
import type { SpotOrder } from "@/lib/types";
import { useAppState } from "@/lib/store/AppStateProvider";

export interface GapWindow {
  dateISO: string;
  startMin: number;
  endMin: number;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatGapLabel(gap: GapWindow): string {
  const gapMin = gap.endMin - gap.startMin;
  return gapMin >= 60
    ? `${Math.floor(gapMin / 60)}시간${gapMin % 60 > 0 ? ` ${gapMin % 60}분` : ""}`
    : `${gapMin}분`;
}

/** gap 시간 안에 상차~하차가 온전히 들어가는(같은 날짜, 오버나잇 제외) spotOrders 최대 2건 */
function findCandidates(gap: GapWindow): ScheduleItem[] {
  return spotOrders
    .filter((order) => {
      if (order.pickup.dateISO !== gap.dateISO) return false;
      if (order.dropoff.dateISO !== order.pickup.dateISO) return false; // 오버나잇 제외
      const pickupMin = toMinutes(order.pickup.time);
      const dropoffMin = toMinutes(order.dropoff.time);
      return pickupMin >= gap.startMin && dropoffMin <= gap.endMin;
    })
    .sort((a, b) => a.pickup.time.localeCompare(b.pickup.time))
    .slice(0, 2)
    .map((order) => convertSpotOrderToScheduleItem(order));
}

export default function SmartRouteAssistModal({
  gap,
  onClose,
  onRegisterMock,
}: {
  gap: GapWindow;
  onClose: () => void;
  onRegisterMock?: (order: SpotOrder) => void;
}) {
  const candidates = findCandidates(gap);
  
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOrder, setGeneratedOrder] = useState<SpotOrder | null>(null);
  const { settings } = useAppState();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    
    try {
      const res = await fetch("/api/auto-dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt, 
          mock: false,
          context: {
            currentTime: new Date().toLocaleString("ko-KR", { hour12: false }),
            currentLocation: "현재 위치(GPS)", 
            dayStart: settings.dayStart || "",
            dayEnd: settings.dayEnd || "",
          }
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const condition = data.condition;
        
        // 꽉 차지 않고 적당히 여유 있는 시간 배정 (최대 2시간짜리 오더로 가정)
        let pickupMin = gap.startMin + 20;
        let dropoffMin = pickupMin + 120;
        
        // 만약 갭이 2시간보다 작으면 갭에 맞춤
        if (dropoffMin > gap.endMin) {
          dropoffMin = gap.endMin;
          pickupMin = gap.startMin;
        }

        const randomTons = [1, 1.4, 2.5, 3.5, 5, 11, 25];
        const randomBodies = ["카고", "윙바디", "탑차", "호루", "냉동", "냉장"];
        
        const resolvedTon = (condition.ton && condition.ton !== "전체") 
          ? parseFloat(condition.ton) 
          : randomTons[Math.floor(Math.random() * randomTons.length)];
          
        const resolvedBody = (condition.bodyType && condition.bodyType !== "전체")
          ? condition.bodyType
          : randomBodies[Math.floor(Math.random() * randomBodies.length)];

        const mockOrder: SpotOrder = {
          id: `auto-${Date.now()}`,
          source: "카카오T",
          shipper: "자동배차(AI)",
          pickup: {
            sido: condition.pickupSido && condition.pickupSido !== "전체" ? condition.pickupSido : "경기",
            sigungu: condition.pickupSigungu && condition.pickupSigungu !== "전체" ? condition.pickupSigungu : "용인시",
            dong: "",
            addressDetail: "AI 맞춤 생성",
            dateExpr: "당일",
            dateISO: gap.dateISO,
            time: toHHMM(pickupMin),
            manual: false,
            forklift: true
          },
          dropoff: {
            sido: condition.dropoffSido && condition.dropoffSido !== "전체" ? condition.dropoffSido : "부산",
            sigungu: condition.dropoffSigungu && condition.dropoffSigungu !== "전체" ? condition.dropoffSigungu : "",
            dong: "",
            addressDetail: "",
            dateExpr: "당일",
            dateISO: gap.dateISO,
            time: toHHMM(dropoffMin),
            manual: false,
            forklift: false
          },
          vehicle: { 
            ton: resolvedTon, 
            body: resolvedBody 
          },
          loadOption: condition.loadOption && condition.loadOption !== "전체" ? condition.loadOption : "독차",
          distance: { toPickupKm: 15, haulKm: 250 },
          durationMin: dropoffMin - pickupMin,
          fare: {
            base: 300000,
            extraManual: 0,
            total: 300000,
            settle: condition.fareType && condition.fareType !== "전체" ? condition.fareType : "선착불"
          },
          remarksRaw: "도착 30분 전 미리 연락 부탁드립니다. 안전 운행하세요!",
          conditions: [],
          vehicleFit: { ok: true, reason: "" },
          postedAt: "방금"
        };
        setGeneratedOrder(mockOrder);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] mx-auto flex max-w-[480px] flex-col justify-end bg-black/40">
      <div className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 pb-10">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-[17px] font-bold text-gray-900">
            <span>✨</span> 스마트 경로 어시스트
          </h2>
          <button onClick={onClose} className="text-[22px] leading-none text-gray-400 cursor-pointer">
            ×
          </button>
        </div>
        <p className="mb-5 text-[13px] text-gray-500">
          공백 시간({formatGapLabel(gap)})에 딱 맞는 오더를 제안합니다.
        </p>

        <p className="mb-2 text-[13px] font-bold text-gray-500">AI 맞춤형 즉시 추천</p>

        {candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-gray-100 bg-gray-50 py-10">
            <p className="text-[13px] font-bold text-gray-500">이 시간에 맞는 추천 오더가 없어요</p>
            <p className="text-[12px] text-gray-400">다른 시간대를 확인해보세요</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {candidates.map((item, idx) => {
              const tags = [...getMetaBadges(item), ...getConditionBadges(item)];
              const visibleTags = tags.slice(0, 5);
              const extraCount = tags.length - visibleTags.length;

              return (
                <div key={item.id} className="rounded-lg border border-[#d6e2ff] p-3.5">
                  <span className="mb-2 inline-block rounded bg-[#f4f7ff] px-2 py-0.5 text-[11px] font-bold text-[#3b5bdb]">
                    추천 {idx + 1}
                  </span>
                  <p className="mb-1.5 text-[15px] font-bold leading-tight text-gray-900">
                    {getRouteLabel(item)}
                  </p>
                  <div className="mb-3 flex flex-wrap gap-1">
                    {visibleTags.map((b, bi) => (
                      <span
                        key={`${b}-${bi}`}
                        className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600"
                      >
                        {b}
                      </span>
                    ))}
                    {extraCount > 0 && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-400">
                        +{extraCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[16px] font-extrabold text-gray-900">
                      {getFareTotal(item).toLocaleString()}원
                    </span>
                    <button
                      type="button"
                      className="rounded-md bg-[#3b5bdb] px-3.5 py-2 text-[12px] font-bold text-white cursor-pointer hover:bg-[#324ec7]"
                    >
                      이 오더 수락하기
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 직접 자동 배차 조건 생성하기 */}
        <div className="mt-6 border-t border-gray-100 pt-5">
          <p className="mb-2 text-[13px] font-bold text-[#3b5bdb]">✨ AI 스마트 배차 조건 직접 생성</p>
          
          <div className="relative mb-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="예: 부산으로 가는 5톤 윙바디 오더 잡아줘"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-[13px] focus:outline-none focus:border-[#3b5bdb]"
              disabled={isGenerating || !!generatedOrder}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGenerate();
              }}
            />
            <button 
              onClick={() => alert("음성 인식 기능은 준비 중입니다.")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#3b5bdb] transition-colors"
              title="음성으로 조건 입력하기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
            </button>
          </div>

          {!generatedOrder ? (
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full rounded-md bg-gray-900 py-3 text-[14px] font-bold text-white disabled:bg-gray-300 transition-colors"
            >
              {isGenerating ? "조건 분석 중..." : "배차 조건 알아서 채우기"}
            </button>
          ) : (
            <div className="rounded-lg border border-[#3b5bdb] bg-[#f4f7ff] p-4 animate-in fade-in zoom-in-95 duration-200">
              <p className="text-[13px] font-bold text-[#3b5bdb] mb-3">이 조건으로 배차받을까요?</p>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[14px] font-bold text-gray-900">{generatedOrder.pickup.sido} {generatedOrder.pickup.sigungu}</span>
                <span className="text-gray-400 text-sm">➔</span>
                <span className="text-[14px] font-bold text-gray-900">{generatedOrder.dropoff.sido}</span>
              </div>
              <div className="flex gap-2 text-[12px] text-gray-600 mb-3">
                <span className="rounded bg-white border border-gray-200 px-1.5 py-0.5">{generatedOrder.pickup.time} ~ {generatedOrder.dropoff.time}</span>
                <span className="rounded bg-white border border-gray-200 px-1.5 py-0.5">{generatedOrder.vehicle.ton}톤 {generatedOrder.vehicle.body}</span>
                <span className="rounded bg-white border border-gray-200 px-1.5 py-0.5 font-bold text-[#f05c2a]">{generatedOrder.fare.total.toLocaleString()}원</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setGeneratedOrder(null);
                    setPrompt("");
                  }}
                  className="flex-1 rounded-md bg-white border border-gray-300 py-2.5 text-[13px] font-bold text-gray-700 hover:bg-gray-50"
                >
                  다시 입력
                </button>
                <button
                  onClick={() => {
                    if (onRegisterMock) onRegisterMock(generatedOrder);
                  }}
                  className="flex-1 rounded-md bg-[#3b5bdb] py-2.5 text-[13px] font-bold text-white hover:bg-blue-700"
                >
                  확인
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
