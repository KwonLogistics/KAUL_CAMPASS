/**
 * ⚠️ 소유: 지수. FixedSchedule(반복 템플릿) → 지금 화면이 보여주는 주간 범위의 ScheduleItem[].
 *
 * FixedSchedule은 "매주 화·목" 같은 템플릿이라 그 자체론 캘린더에 못 꽂는다.
 * validFrom~validUntil·weekdays로 실제 발생일을 걸러낸 뒤에만 ScheduleItem으로 만든다.
 * 화면에 안 쓰는 미래까지 미리 다 만들면 리스트만 무한정 길어지므로,
 * ScheduleTab.tsx가 보여주는 주(2026-08-10~08-16)만 생성한다.
 */

import { fixedSchedules, CALENDAR_2026_08 } from "@/data/mock-data";
import { convertFixedScheduleToScheduleItem } from "./convert";
import type { ScheduleItem } from "./types";

const VISIBLE_WEEK_DATES = [
  "2026-08-10",
  "2026-08-11",
  "2026-08-12",
  "2026-08-13",
  "2026-08-14",
  "2026-08-15",
  "2026-08-16",
];

/** 요일 라벨 → weekdays 배열의 숫자(0=일 ... 6=토). CALENDAR_2026_08(원본 상수)에서 그대로 가져온다. */
const WEEKDAY_INDEX: Record<string, number> = {
  일: 0,
  월: 1,
  화: 2,
  수: 3,
  목: 4,
  금: 5,
  토: 6,
};

function weekdayOf(dateISO: string): number | null {
  const label = CALENDAR_2026_08[dateISO];
  return label ? WEEKDAY_INDEX[label] : null;
}

export const fixedScheduleItems: ScheduleItem[] = fixedSchedules.flatMap((schedule) =>
  VISIBLE_WEEK_DATES.filter((dateISO) => {
    const weekday = weekdayOf(dateISO);
    return (
      weekday !== null &&
      schedule.weekdays.includes(weekday) &&
      dateISO >= schedule.validFrom &&
      dateISO <= schedule.validUntil
    );
  }).map((dateISO) => convertFixedScheduleToScheduleItem(schedule, dateISO)),
);
