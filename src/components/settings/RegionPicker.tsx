"use client";

/**
 * ⚠️ 소유: 순범. 지역 선택 — 원래 앱의 「상차지 설정」 화면을 그대로 쓴다.
 *
 *   시도 한 줄씩 → 펼치면 3열 시군구 표 → 고르면 시도 줄 오른쪽에 파랗게 뜬다.
 *   아래는 「초기화 · 저장하기」. 저장을 누르기 전까지는 아무것도 바뀌지 않는다(draft).
 *
 * ★ 화면이 네 군데(상차지·하차지·출발지·복귀점)라 컴포넌트는 하나만 둔다.
 *   다른 건 두 가지뿐이다 — 여러 개 고를 수 있는가(mode), 그리고 강조색(tone).
 *   출발지·복귀점은 「점」이라 하나만 고른다. 상하차지는 원래 앱처럼 여러 개 고른다.
 */

import { useState } from "react";
import {
  REGION_GROUPS,
  ALL_SUFFIX,
  regionLabel,
  sidoOf,
} from "@/data/regions";

export default function RegionPicker({
  title,
  mode,
  value,
  tone = "#3b5bdb",
  onClose,
  onSave,
}: {
  title: string;
  mode: "single" | "multi";
  /** 저장돼 있는 라벨들. single 이면 0~1개. */
  value: string[];
  tone?: string;
  onClose: () => void;
  onSave: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState<string[]>(value);
  const [openSido, setOpenSido] = useState<string | null>(
    value.length > 0 ? sidoOf(value[0]) : null,
  );

  const dirty =
    draft.length !== value.length || draft.some((d, i) => d !== value[i]);

  const toggle = (label: string) => {
    setDraft((prev) => {
      if (mode === "single") return prev[0] === label ? [] : [label];
      return prev.includes(label)
        ? prev.filter((x) => x !== label)
        : [...prev, label];
    });
  };

  /** 시도 줄 오른쪽 요약. 두 개 넘게 고르면 "고양시 외 2" */
  const summaryOf = (sido: string): string | null => {
    const mine = draft.filter((d) => sidoOf(d) === sido);
    if (mine.length === 0) return null;
    const first = mine[0].slice(sido.length + 1);
    return mine.length === 1 ? first : `${first} 외 ${mine.length - 1}`;
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-center bg-black/20">
      <div className="flex h-full w-full max-w-[480px] flex-col bg-white">
        {/* Header */}
        <div className="flex shrink-0 items-center border-b border-gray-100 px-4 py-4">
          <button onClick={onClose} className="mr-4 text-gray-800">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>
          {mode === "single" && (
            <span
              className="ml-2 rounded px-1.5 py-0.5 text-[11px] font-extrabold text-white"
              style={{ backgroundColor: tone }}
            >
              한 곳
            </span>
          )}
        </div>

        {/* 시도 목록 */}
        <div className="flex-1 overflow-y-auto">
          {REGION_GROUPS.map((g) => {
            const expanded = openSido === g.sido;
            const summary = summaryOf(g.sido);
            const cells = [ALL_SUFFIX, ...g.sigungu];

            return (
              <div key={g.sido} className="border-b border-gray-100">
                <button
                  onClick={() => setOpenSido(expanded ? null : g.sido)}
                  className="flex w-full items-center justify-between px-5 py-4"
                >
                  <span
                    className={`text-[17px] ${expanded ? "font-extrabold text-gray-900" : "font-medium text-gray-800"}`}
                  >
                    {g.sido}
                  </span>
                  <span className="flex items-center gap-2">
                    {summary && (
                      <span
                        className="text-[16px] font-bold"
                        style={{ color: tone }}
                      >
                        {summary}
                      </span>
                    )}
                    <svg
                      className={`h-5 w-5 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>

                {expanded && (
                  <div className="bg-[#f4f4f6] px-4 py-4">
                    <div className="grid grid-cols-3 border-l border-t border-gray-200 bg-white">
                      {cells.map((s) => {
                        const label = regionLabel(g.sido, s);
                        const on = draft.includes(label);
                        return (
                          <button
                            key={s}
                            onClick={() => toggle(label)}
                            className="border-b border-r border-gray-200 px-2.5 py-3.5 text-left text-[14px]"
                            style={
                              on
                                ? { color: tone, backgroundColor: `${tone}14`, fontWeight: 700 }
                                : { color: "#374151" }
                            }
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div className="h-4" />
        </div>

        {/* 초기화 · 저장하기 */}
        <div className="flex shrink-0 gap-2 border-t border-gray-200 bg-white p-3">
          <button
            onClick={() => setDraft([])}
            className="w-[100px] rounded-md border border-gray-200 bg-white py-3 text-[15px] font-bold text-gray-800"
          >
            초기화
          </button>
          <button
            disabled={!dirty}
            onClick={() => onSave(draft)}
            className="flex-1 rounded-md py-3 text-[16px] font-bold text-white disabled:bg-[#dce3fb] disabled:text-white/70"
            style={dirty ? { backgroundColor: tone } : undefined}
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}
