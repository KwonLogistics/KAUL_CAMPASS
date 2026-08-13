/**
 * ⚠️ 소유: 순범.  ★ 세 사람이 만나는 접점 ② ★
 *
 * 「업무 외 대기시간 + 실질 시급」 표기는 이 컴포넌트 하나만 쓴다.
 *   - 순범: 화물 정보 탭 오더 카드
 *   - 지수: 스케줄 탭 「AI 오더 추천」 카드
 *
 * 지수는 <CallMetrics order={order} /> 한 줄만 넣는다. 계산도 문구도 여기가 만든다.
 * 카드마다 따로 숫자를 그리면 두 화면의 값이 갈라지고, 그 순간 심사에서 무너진다.
 */

import type { SpotOrder } from "@/lib/types";
import { computeEconomics } from "@/lib/engine/economics";
import { waitLabel } from "@/lib/engine/wait-time";

export default function CallMetrics({
  order,
  compact = false,
}: {
  order: SpotOrder;
  /** 카드가 좁을 때(추천 카드 등) 한 줄로 접는다 */
  compact?: boolean;
}) {
  const e = computeEconomics(order);
  const wait = waitLabel(e.wait);

  if (compact) {
    return (
      <div className="text-[12px] text-gray-600 flex items-center gap-1.5">
        <span className="font-bold text-[#3b5bdb]">
          실질 시급 {e.hourlyWage.toLocaleString()}원
        </span>
        <span className="text-gray-300">·</span>
        <span>업무 외 대기 {wait}</span>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-lg bg-[#f4f7ff] px-3 py-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[12px] font-medium text-gray-600">실질 시급</span>
        <span className="text-[15px] font-extrabold text-[#3b5bdb]">
          {e.hourlyWage.toLocaleString()}원
        </span>
      </div>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="text-[12px] font-medium text-gray-600">
          업무 외 대기시간
        </span>
        <span className="text-[13px] font-bold text-gray-800">{wait}</span>
      </div>
      {/* 표본 수 또는 "기록 없음"을 반드시 같이 쓴다. 숫자만 쓰면 근거가 아니다. */}
      <p className="mt-1 text-[11px] leading-tight text-gray-500">
        {e.wait.basis}
      </p>
    </div>
  );
}
