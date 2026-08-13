"use client";

/**
 * ⚠️ 소유: 지수.  (이 껍데기는 순범이 접점을 고정하려고 먼저 깔았다. 지금부터는 지수 파일이다.)
 *
 * 스케줄 탭. 주간 보기가 기본이고, 여기서 하루를 열면 24h 타임라인으로 들어간다.
 *
 * ── 이 파일에서 남의 영역 두 곳 ──
 *   <ExternalOrderButton />  순범. 내부를 열어보지 않는다. 위치만 옮겨도 된다.
 *   <MonthView />            동의. 월간 탭을 눌렀을 때만 렌더한다.
 * 둘 다 import 한 줄로 끝난다. 안쪽 코드를 이 파일로 끌어오지 않는다.
 *
 * 오더 목록은 useAppState().scheduled 하나에서만 읽는다 (src/lib/store/schedule-store.ts).
 * 여기서 별도 useState 로 오더 배열을 들면 외부 등록 건이 안 뜬다.
 */

import { useState } from "react";
import ExternalOrderButton from "@/components/order-import/ExternalOrderButton";
import MonthView from "@/components/calendar/MonthView";
import WeekView from "@/components/schedule/WeekView";

type ViewMode = "week" | "month";

export default function SchedulePage() {
  const [mode, setMode] = useState<ViewMode>("week");

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f4f6] pb-[80px]">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-white px-4 py-3.5 border-b border-gray-100">
        <h1 className="text-[18px] font-bold text-gray-900">스케줄</h1>
        <ExternalOrderButton />
      </header>

      <div className="flex gap-1 bg-white px-4 pb-3">
        {(["week", "month"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-md px-4 py-1.5 text-[13px] font-bold ${
              mode === m
                ? "bg-[#3b5bdb] text-white"
                : "border border-gray-200 bg-white text-gray-600"
            }`}
          >
            {m === "week" ? "주간" : "월간"}
          </button>
        ))}
      </div>

      {mode === "week" ? <WeekView /> : <MonthView />}
    </div>
  );
}
