"use client";

/**
 * ⚠️ 소유: 지수. 스케줄 탭 주간 보기 + 하루 타임라인.
 *
 * 이 폴더(src/components/schedule/) 전체가 지수 것이다. 순범·동의는 안 건드린다.
 *
 * 채울 것:
 *   - 주 7일 · 하루씩 열면 24h 타임라인
 *   - 블록 탭 → 시간 분해 (운전 / 업무 외 대기 / 실질시간)
 *   - 정렬 토글: 운임순 ↔ 실질 시급순  ← 순서가 눈앞에서 뒤집히는 게 데모의 핵심 3초
 *   - 빈 칸 탭 → 그 칸에 들어가는 오더 전부 (빼지 않는다. 순서만 바꾼다)
 *   - AI 오더 추천 카드 → 카드 안 숫자는 <CallMetrics order={...} compact /> 로 찍는다
 *
 * 데이터는 useAppState().scheduled 에서만 읽는다.
 * 금액·시간은 computeEconomics() 결과를 받아 쓴다. 화면에서 계산하지 않는다.
 */

import { useAppState } from "@/lib/store/AppStateProvider";

export default function WeekView() {
  const { scheduled, hydrated } = useAppState();

  if (!hydrated) return null;

  return (
    <div className="flex-1 px-4 py-5">
      {scheduled.length === 0 ? (
        <div className="flex h-[50vh] flex-col items-center justify-center text-center">
          <p className="text-[15px] font-bold text-gray-800">
            이번 주에 잡힌 오더가 없습니다
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">
            화물 정보에서 잡거나, 다른 앱에서 받은 오더를
            <br />
            상단 「외부 오더 등록」으로 넣어보세요
          </p>
        </div>
      ) : (
        <p className="text-[13px] text-gray-500">
          {scheduled.length}건 — 주간 보기는 지수가 구현 중
        </p>
      )}
    </div>
  );
}
