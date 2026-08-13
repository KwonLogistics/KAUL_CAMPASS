"use client";

/**
 * ⚠️ 소유: 순범.
 *
 * 붙여넣기 → 파싱 → 확인 카드 → 캘린더에 넣기.
 * 지금은 껍데기다. 파싱 연결(/api/parse-order)과 확인 카드는 순범이 이어서 채운다.
 *
 * 원칙 둘 — 지금부터 지킨다:
 *   1. 붙여넣기 한 번으로 끝난다. 입력 단계를 늘리지 않는다.
 *   2. 못 읽은 항목은 비워두고 "미기재"라고 쓴다. 상식으로 메우지 않는다.
 */

import { useState } from "react";

export default function ExternalOrderSheet({ onClose }: { onClose: () => void }) {
  const [raw, setRaw] = useState("");

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[480px] flex-col justify-end bg-black/40">
      <div className="rounded-t-2xl bg-white p-5 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-gray-900">외부 오더 등록</h2>
          <button onClick={onClose} className="text-[22px] leading-none text-gray-400">
            ×
          </button>
        </div>

        <p className="mb-2 text-[13px] text-gray-500">
          밴드·카톡·문자에서 받은 오더를 그대로 붙여넣으세요.
        </p>

        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={5}
          placeholder="화성 상차 08시, 원주 ○○물류센터 하차. 5톤 카고. 당상당착. 34만."
          className="w-full resize-none rounded-lg border border-gray-200 p-3 text-[14px] leading-relaxed outline-none focus:border-[#3b5bdb]"
        />

        <div className="mt-3 flex gap-2">
          <button className="flex-1 rounded-md border border-gray-200 py-3 text-[14px] font-bold text-gray-700">
            📷 캡처 불러오기
          </button>
          <button
            disabled={!raw.trim()}
            className="flex-1 rounded-md bg-[#3b5bdb] py-3 text-[14px] font-bold text-white disabled:bg-gray-200 disabled:text-gray-400"
          >
            읽어오기
          </button>
        </div>

        {/* TODO(순범): 파싱 결과 확인 카드 — 못 읽은 항목은 "미기재" 배지, 근거 구절 같이 표시 */}
      </div>
    </div>
  );
}
