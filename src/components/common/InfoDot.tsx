"use client";

/**
 * ⚠️ 소유: 순범. 동그라미 안의 i / ! — 눌러야 설명이 열리는 점.
 *
 * 설명을 본문에 깔지 않기 위해 있는 컴포넌트다. 근거를 없애는 게 아니라
 * 한 번 눌러서 여는 것 — 카드가 설명 문장으로 덮이면 정작 숫자와 선택지가 안 보인다.
 * 색은 열렸을 때만 채운다. 안 열렸으면 회색 — 화면의 주인공이 되면 안 된다.
 */

export default function InfoDot({
  open,
  onClick,
  label,
  glyph = "i",
  tone = "#3b5bdb",
}: {
  open: boolean;
  onClick: () => void;
  /** 스크린리더용. "무엇에 대한 설명인지"를 쓴다. */
  label: string;
  glyph?: "i" | "!";
  /** 열렸을 때 채울 색. 섹션 색과 맞춘다. */
  tone?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={open}
      onClick={onClick}
      className="ml-1 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[11px] font-bold leading-none transition-colors"
      style={
        open
          ? { borderColor: tone, backgroundColor: tone, color: "#fff" }
          : { borderColor: "#d1d5db", backgroundColor: "#fff", color: "#9ca3af" }
      }
    >
      {glyph}
    </button>
  );
}
