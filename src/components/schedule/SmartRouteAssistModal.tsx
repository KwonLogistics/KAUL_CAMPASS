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

export interface GapWindow {
  dateISO: string;
  startMin: number;
  endMin: number;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
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
}: {
  gap: GapWindow;
  onClose: () => void;
}) {
  const candidates = findCandidates(gap);

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

        {/* TODO(다음 단계): 직접 자동 배차 조건 생성하기 */}
      </div>
    </div>
  );
}
