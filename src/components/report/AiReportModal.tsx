"use client";

/**
 * ⚠️ 소유: 동의.  ★ 세 사람이 만나는 접점 ③ ★
 *
 * AI 리포트 전부. 이 폴더(src/components/report/) 전체가 동의 것이다.
 *
 * ── 순범과 만나는 지점 한 곳 ──
 * 「이 노선을 내 운행 구간으로 설정하기」를 누르면
 *     applyRecommendedRoute({ start, end })
 * 를 호출한다. 그러면 순범의 「선호 지역 설정」 화면의 운행 출발지·복귀지 두 칸이 바뀌고,
 * 화물 정보 목록이 그 자리에서 다시 정렬된다.
 * 설정 화면 파일을 직접 고치지 않는다. 이 호출 하나면 된다.
 *
 * 지켜야 할 것:
 *   - 비교는 보고서에 실린 값(BENCHMARK)과 본인 과거 데이터로만. 상위 몇 % 같은 합성 순위는 안 만든다.
 *   - 우리가 산출한 값은 전부 중앙값이다. "평균"이라고 쓰지 않는다.
 *   - 생체 데이터가 없으므로 피로도 점수는 만들지 않는다.
 */

import { useAppState } from "@/lib/store/AppStateProvider";
import { useRouter } from "next/navigation";

export default function AiReportModal({ onClose }: { onClose: () => void }) {
  const { applyRecommendedRoute } = useAppState();
  const router = useRouter();

  // TODO(동의): /api/report 호출 → 과거 운행 집계 기반 운행 구간 추천
  const recommended = { start: "", end: "" };

  const apply = () => {
    applyRecommendedRoute(recommended);
    onClose();
    router.push("/cargo"); // 설정이 반영된 목록을 그 자리에서 보게 한다
  };

  return (
    <div className="fixed inset-0 z-50 mx-auto max-w-[480px] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[17px] font-bold text-gray-900">AI 운행 리포트</h2>
        <button onClick={onClose} className="text-[22px] leading-none text-gray-400">
          ×
        </button>
      </div>
      <p className="text-[13px] text-gray-500">AI 리포트는 동의가 구현 중</p>
      <button
        onClick={apply}
        className="mt-4 w-full rounded-md bg-[#3b5bdb] py-3 text-[14px] font-bold text-white"
      >
        이 노선을 내 운행 구간으로 설정하기
      </button>
    </div>
  );
}
