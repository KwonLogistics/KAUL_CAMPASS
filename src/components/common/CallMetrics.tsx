/**
 * ⚠️ 소유: 순범.  ★ 세 사람이 만나는 접점 ② ★
 *
 * 「업무 외 대기시간 + 실질 시급」 표기는 이 컴포넌트 하나만 쓴다.
 *   - 순범: 화물 정보 탭 오더 카드
 *   - 지수: 스케줄 탭 「AI 오더 추천」 카드
 *
 * 지수는 <CallMetrics order={order} compact /> 한 줄만 넣는다. 계산도 문구도 여기가 만든다.
 * 카드마다 따로 숫자를 그리면 두 화면의 값이 갈라지고, 그 순간 심사에서 무너진다.
 *
 * ★ 표본 수를 숫자에서 떼어놓지 않는다.
 *   "1.4h"만 쓰면 우리가 만든 숫자로 보이고, "(18건)"을 붙이면 기사의 기록이 된다.
 *   기록이 없으면 없다고 쓴다 — 그 화면이 경쟁 앱에는 없다.
 */

import type { SpotOrder } from "@/lib/types";
import { computeEconomics } from "@/lib/engine/economics";
import { formatMinutes, waitLabel } from "@/lib/engine/wait-time";

export default function CallMetrics({
  order,
  compact = false,
}: {
  order: SpotOrder;
  /** 카드가 좁을 때(추천 카드 등) 한 줄로 접는다 */
  compact?: boolean;
}) {
  const e = computeEconomics(order);

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px]">
        <span className="font-bold text-[#3b5bdb]">
          실질 시급 {e.hourlyWage.toLocaleString()}원
        </span>
        <span className="text-gray-300">·</span>
        <span className="text-gray-600">업무 외 대기 {waitLabel(e.wait)}</span>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg bg-[#f4f7ff] px-3 py-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[12px] font-medium text-gray-600">실질 시급</span>
        <span className="text-[16px] font-extrabold text-[#3b5bdb]">
          {e.hourlyWage.toLocaleString()}원
        </span>
      </div>

      <div className="mt-1.5 flex items-baseline justify-between">
        <span className="text-[12px] font-medium text-gray-600">
          업무 외 대기시간
        </span>
        <span
          className={`text-[13px] font-bold ${
            e.wait.unknown ? "text-gray-400" : "text-gray-900"
          }`}
        >
          {formatMinutes(e.wait.minutes)}
          {!e.wait.unknown && (
            <span className="ml-1 font-medium text-gray-500">
              ({e.wait.sampleCount}건)
            </span>
          )}
        </span>
      </div>

      {/* 근거 한 줄 — 이게 없으면 위 두 숫자는 그냥 우리가 만든 값이다 */}
      <p className="mt-1.5 text-[11px] leading-tight text-gray-500">
        {e.wait.basis}
      </p>
    </div>
  );
}
