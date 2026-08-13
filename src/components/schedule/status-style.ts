/**
 * ⚠️ 소유: 지수. ScheduleItemStatus → 배지/테두리 색상 클래스.
 *
 * 주간 캘린더(ScheduleTab)와 리스트 보기가 이 파일 하나를 같이 쓴다.
 * 월간 캘린더(동의 소유, components/calendar/)도 같은 상태면 같은 색이 나오도록
 * 여기서 가져다 쓸 수 있게 export해둔다 — 색을 화면마다 따로 정의하지 않는다.
 *
 * 카드 배경은 강한 색으로 채우지 않는다. 배지 배경/글자색과 카드 border만으로 구분한다.
 */

import type { ScheduleItemStatus } from "./types";

export const STATUS_LABEL: Record<ScheduleItemStatus, string> = {
  scheduled: "예정",
  in_progress: "진행 중",
  completed: "완료",
  cancelled: "취소",
};

interface StatusStyle {
  /** 배지 배경 + 글자색 */
  badge: string;
  /** 카드 좌측 border 색 */
  border: string;
  /** 카드 좌측 border 두께 */
  borderWidth: string;
  /** 카드 상단 시간 라벨 글자색 */
  title: string;
  /** 카드 전체에 두르는 은은한 강조 링 (없으면 빈 문자열) */
  ring: string;
  /** 배지 안 펄스 점 색 (없으면 null → 점 자체를 안 그림) */
  pulseDot: string | null;
}

export const STATUS_STYLE: Record<ScheduleItemStatus, StatusStyle> = {
  // 완료 — 회색 계열. 가장 차분하게.
  completed: {
    badge: "bg-gray-100 text-gray-600",
    border: "border-gray-300",
    borderWidth: "border-l-[4px]",
    title: "text-gray-500",
    ring: "",
    pulseDot: null,
  },
  // 진행 중 — 파란색 계열. 가장 눈에 띄게.
  in_progress: {
    badge: "bg-blue-100 text-blue-700",
    border: "border-[#3b5bdb]",
    borderWidth: "border-l-[6px]",
    title: "text-[#3b5bdb]",
    ring: "ring-1 ring-[#3b5bdb]/30",
    pulseDot: "bg-[#3b5bdb]",
  },
  // 예정 — 보라색 계열. 진행 중보다는 덜 강조하되 완료와는 확실히 구분.
  scheduled: {
    badge: "bg-purple-100 text-purple-700",
    border: "border-purple-200",
    borderWidth: "border-l-[4px]",
    title: "text-purple-600",
    ring: "",
    pulseDot: null,
  },
  // 취소 — 지금 데이터엔 없지만 타입 완결성을 위해 중립 회색으로.
  cancelled: {
    badge: "bg-gray-100 text-gray-400",
    border: "border-gray-200",
    borderWidth: "border-l-[4px]",
    title: "text-gray-400",
    ring: "",
    pulseDot: null,
  },
};
