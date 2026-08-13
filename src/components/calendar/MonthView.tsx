"use client";

/**
 * ⚠️ 소유: 동의. 월간 보기.
 *
 * 이 폴더(src/components/calendar/) 전체가 동의 것이다.
 * 지수의 주간 보기와 같은 저장소를 읽는다 — countByDate(scheduled) 로 날짜별 건수를 뽑는다.
 * 여기서 오더 배열을 따로 들면 두 화면의 숫자가 갈라진다.
 *
 * 채울 것:
 *   - 월 그리드 · 날짜별 건수/운임 요약
 *   - 날짜를 누르면 지수의 주간/일간 보기로 넘긴다
 *   - AI 리포트 진입점 (src/components/report/)
 */

import { useAppState } from "@/lib/store/AppStateProvider";
import { countByDate } from "@/lib/store/schedule-store";

export default function MonthView() {
  const { scheduled, hydrated } = useAppState();
  if (!hydrated) return null;

  const byDate = countByDate(scheduled);

  return (
    <div className="flex-1 px-4 py-5">
      <p className="text-[13px] text-gray-500">
        월간 보기는 동의가 구현 중 — 현재 {Object.keys(byDate).length}일에 오더가 있음
      </p>
    </div>
  );
}
