"use client";

/**
 * ⚠️ 소유: 순범.  ★ 세 사람이 만나는 접점 ① ★
 *
 * 「외부 오더 등록」 — 다른 앱에서 받은 오더를 텍스트/사진으로 넣어 캘린더에 꽂는다.
 *
 * 지수는 스케줄 탭 헤더에 <ExternalOrderButton /> 한 줄만 넣는다.
 * 버튼도 시트도 파싱도 전부 이 폴더(src/components/order-import/) 안에서 끝난다 —
 * 지수의 스케줄 화면 파일에는 이 기능 코드가 한 줄도 안 들어간다.
 *
 * 등록된 결과는 useAppState().addScheduled() 로 공유 저장소에 들어가므로
 * 지수의 주간 보기와 동의의 월간 보기에 자동으로 같이 뜬다.
 */

import { useState } from "react";
import ExternalOrderSheet from "./ExternalOrderSheet";

export default function ExternalOrderButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-md border border-[#3b5bdb] bg-[#f4f7ff] px-3 py-1.5 text-[13px] font-bold text-[#3b5bdb]"
      >
        <span className="text-[15px] leading-none">＋</span>
        외부 오더 등록
      </button>
      {open && <ExternalOrderSheet onClose={() => setOpen(false)} />}
    </>
  );
}
