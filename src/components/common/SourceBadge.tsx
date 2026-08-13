/**
 * ⚠️ 소유: 순범. 오더 출처 배지 — 카카오 콜인지 외부 앱에서 들어온 콜인지.
 *
 * 화물 정보 탭에는 안 쓴다. 그 탭은 카카오 오더 풀이라 전부 카카오 건이고,
 * 전부 같은 배지가 붙으면 배지가 아니라 배경이 된다.
 *
 * 쓰는 곳은 두 출처가 섞이는 화면이다:
 *   - 지수: 스케줄 탭 카드 (카카오에서 잡은 건 + 외부 오더 등록으로 넣은 건이 한 줄에 같이 선다)
 *   - 동의: 월간 보기
 *
 * <SourceBadge source={order.source} /> 한 줄. 문구와 색은 여기가 정한다.
 * 화면마다 따로 그리면 같은 외부 건이 탭마다 다르게 보인다.
 */

import type { OrderSource } from "@/lib/types";

export default function SourceBadge({
  source,
  className = "",
}: {
  source: OrderSource;
  className?: string;
}) {
  const isExternal = source === "external";

  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
        isExternal
          ? "bg-gray-100 text-gray-500"
          : "bg-[#f4f7ff] text-[#3b5bdb]"
      } ${className}`}
    >
      {isExternal ? "외부" : "카카오"}
    </span>
  );
}
