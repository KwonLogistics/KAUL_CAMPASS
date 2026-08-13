"use client";

import React, { useState } from "react";
import {
  pastTrips,
  fixedSchedules,
  TODAY_ISO,
  HOLIDAYS,
  CALENDAR_2026_08,
  type PastTrip,
  type FixedSchedule,
} from "@/data/mock-data";
import { useAppState } from "@/lib/store/AppStateProvider";
import { type ScheduledOrder } from "@/lib/store/schedule-store";

interface DayData {
  dateISO: string;
  dayNumber: number;
  month: number;
  weekdayLabel: string;
  isPast: boolean;
  isToday: boolean;
  isFuture: boolean;
  tripsCount: number;
  hasMismatch: boolean;
  trips: PastTrip[];
  fixedList: FixedSchedule[];
  externalList: ScheduledOrder[];
}

interface MonthlyCalendarProps {
  onOpenReport: () => void;
}

export default function MonthlyCalendar({ onOpenReport }: MonthlyCalendarProps) {
  const { scheduled, hydrated } = useAppState();
  const externalOrders = hydrated ? scheduled : [];

  const [filterPeriod, setFilterPeriod] = useState<"past30" | "thisMonth">("past30");
  const [selectedDateISO, setSelectedDateISO] = useState<string>(TODAY_ISO);

  // 1. 롤링 5주 날짜 배열 생성 (2026-07-13 월요일 ~ 2026-08-16 일요일, 총 35일)
  const calendarDays: DayData[] = [];
  const startDate = new Date(2026, 6, 13); // 2026-07-13

  for (let i = 0; i < 35; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);

    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dateISO = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const isToday = dateISO === TODAY_ISO;
    const isPast = dateISO < TODAY_ISO;
    const isFuture = dateISO > TODAY_ISO;

    const weekdayIndex = d.getDay(); // 0=일 ... 6=토
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const weekdayLabel = weekdays[weekdayIndex];

    let dayTrips: PastTrip[] = [];
    let dayFixed: FixedSchedule[] = [];
    const dayExternal = externalOrders.filter((s) => s.dateISO === dateISO);
    let tripsCount = 0;
    let hasMismatch = false;

    if (isPast) {
      // 과거: pastTrips + 외부 등록 오더
      dayTrips = pastTrips.filter((t) => t.dateISO === dateISO);
      tripsCount = dayTrips.length + dayExternal.length;
      hasMismatch = dayTrips.some((t) => t.conditionMismatch);
    } else {
      // 오늘 및 미래: fixedSchedules 전개 (공휴일 제외) + 외부 등록 오더
      if (!HOLIDAYS.includes(dateISO)) {
        dayFixed = fixedSchedules.filter((fs) => fs.weekdays.includes(weekdayIndex));
      }
      tripsCount = dayFixed.length + dayExternal.length;
      hasMismatch = false;
    }

    calendarDays.push({
      dateISO,
      dayNumber: day,
      month,
      weekdayLabel,
      isPast,
      isToday,
      isFuture,
      tripsCount,
      hasMismatch,
      trips: dayTrips,
      fixedList: dayFixed,
      externalList: dayExternal,
    });
  }

  // 2. 상단 요약 계산 (pastTrips 기준)
  // 지난 30일 vs 이번 달 (8월)
  const targetPastTrips =
    filterPeriod === "past30"
      ? pastTrips
      : pastTrips.filter((t) => t.dateISO.startsWith("2026-08"));

  const summaryCount = targetPastTrips.length;
  const summaryFare = targetPastTrips.reduce((sum, t) => sum + t.fare.total, 0);
  const summaryMismatch = targetPastTrips.filter((t) => t.conditionMismatch).length;

  // 3. 선택된 날짜 데이터 찾기
  const selectedDay = calendarDays.find((d) => d.dateISO === selectedDateISO) || calendarDays[0];

  // 시간 포맷팅 헬퍼 (대기시간 등)
  const formatWaitTime = (waitMin: number) => {
    if (waitMin >= 60) {
      const h = Math.floor(waitMin / 60);
      const m = waitMin % 60;
      return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
    }
    return `${waitMin}분`;
  };

  return (
    <div className="flex flex-col flex-1 bg-[#f8f9fa] pb-24 overflow-y-auto">
      {/* 1. 상단 뷰 토글 (지난 30일 / 이번 달) */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <div className="flex bg-gray-100 p-0.5 rounded-lg">
          <button
            onClick={() => setFilterPeriod("past30")}
            className={`px-3 py-1 text-[12px] font-bold rounded-md transition-colors cursor-pointer ${
              filterPeriod === "past30"
                ? "bg-white text-gray-900 shadow-2xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            지난 30일
          </button>
          <button
            onClick={() => setFilterPeriod("thisMonth")}
            className={`px-3 py-1 text-[12px] font-bold rounded-md transition-colors cursor-pointer ${
              filterPeriod === "thisMonth"
                ? "bg-white text-gray-900 shadow-2xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            이번 달
          </button>
        </div>

        <div className="text-[12px] text-gray-500 font-medium">
          {filterPeriod === "past30" ? "2026.07.14 ~ 08.12" : "2026년 8월"}
        </div>
      </div>

      {/* 2. 상단 요약 카드 3개 (같은 크기 3등분) */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="grid grid-cols-3 gap-2">
          {/* 카드 1: 운행 */}
          <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200/70">
            <div className="text-[17px] font-extrabold text-gray-900 tabular-nums">
              {summaryCount}건
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 font-medium">운행</div>
          </div>

          {/* 카드 2: 운임 합계 */}
          <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200/70">
            <div className="text-[16px] font-extrabold text-gray-900 tabular-nums tracking-tight">
              {summaryFare.toLocaleString()}원
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 font-medium">운임 합계</div>
          </div>

          {/* 카드 3: 오더와 달랐던 현장 (핵심) */}
          <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200/70">
            <div className="text-[17px] font-extrabold text-gray-900 tabular-nums">
              {summaryMismatch}건
            </div>
            <div className="text-[11px] text-gray-600 mt-0.5 font-medium truncate">
              오더와 달랐던 현장
            </div>
          </div>
        </div>
      </div>

      {/* 3. 롤링 5주 캘린더 그리드 */}
      <div className="bg-white px-3 py-3 border-b border-gray-200 shadow-2xs">
        {/* 요일 헤더 (월 ~ 일) */}
        <div className="grid grid-cols-7 text-center mb-2">
          {["월", "화", "수", "목", "금", "토", "일"].map((d, idx) => (
            <div
              key={idx}
              className={`text-[12px] font-bold ${
                idx === 5 ? "text-blue-500" : idx === 6 ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* 35칸 캘린더 셀 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const isSelected = day.dateISO === selectedDateISO;
            const isOutMonth = filterPeriod === "thisMonth" && day.month !== 8;

            // 셀 배경색 구분: 과거 vs 미래/오늘
            let bgClass = "bg-white hover:bg-gray-50";
            if (!day.isPast) {
              bgClass = "bg-[#f8faff] hover:bg-[#eff4ff]";
            }
            if (isOutMonth) {
              bgClass = "bg-gray-50/40 hover:bg-gray-50/80";
            }

            return (
              <button
                key={day.dateISO}
                onClick={() => setSelectedDateISO(day.dateISO)}
                className={`flex flex-col items-center justify-between py-1.5 px-0.5 min-h-[58px] rounded-lg transition-all border cursor-pointer ${bgClass} ${
                  isOutMonth ? "opacity-30 hover:opacity-75" : "opacity-100"
                } ${
                  isSelected
                    ? "border-[#3b5bdb] ring-2 ring-[#3b5bdb]/20 shadow-2xs"
                    : day.isToday
                    ? "border-blue-300"
                    : "border-transparent"
                }`}
              >
                {/* 1) 날짜 */}
                <span
                  className={`text-[12px] tabular-nums font-bold leading-none ${
                    isOutMonth
                      ? "text-gray-400"
                      : day.isToday
                      ? "text-[#3b5bdb]"
                      : isSelected
                      ? "text-gray-900"
                      : "text-gray-700"
                  }`}
                >
                  {day.dayNumber === 1 || day.dateISO === "2026-07-13"
                    ? `${day.month}/${day.dayNumber}`
                    : day.dayNumber}
                </span>

                {/* 2) 운행 건수 도트 (최대 2개) */}
                <div className="flex gap-1 items-center justify-center h-3 my-0.5">
                  {day.tripsCount > 0 &&
                    Array.from({ length: Math.min(day.tripsCount, 2) }).map((_, dIdx) => (
                      <span
                        key={dIdx}
                        className={`w-1.5 h-1.5 rounded-full ${
                          isOutMonth
                            ? "bg-gray-400"
                            : day.isPast
                            ? "bg-gray-700"
                            : "bg-[#3b5bdb]"
                        }`}
                      />
                    ))}
                </div>

                {/* 3) 조건 표식 (빈 사각형 ▫) */}
                <div className="h-3 flex items-center justify-center">
                  {day.hasMismatch ? (
                    <span
                      className={`w-2.5 h-2.5 border rounded-[1px] ${
                        isOutMonth ? "border-gray-400 bg-gray-100" : "border-gray-600 bg-white"
                      }`}
                      title="조건 불일치 발생"
                    />
                  ) : (
                    <span className="w-2.5 h-2.5" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 미래 영역 안내 라벨 */}
        <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-gray-100 text-[11px] text-gray-500 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 border border-gray-600 rounded-[1px] bg-white inline-block"></span>
            <span>오더와 현장 불일치</span>
          </div>
          <span>8/13 이후: 예정된 일정만 표시됩니다</span>
        </div>
      </div>

      {/* 4. 하단 시트 — 선택된 날짜 상세 내역 */}
      <div className="px-4 py-4 space-y-3">
        <div className="flex justify-between items-baseline">
          <h3 className="text-[15px] font-bold text-gray-900">
            {selectedDay.month}월 {selectedDay.dayNumber}일 ({selectedDay.weekdayLabel}) ·{" "}
            {selectedDay.tripsCount}건
          </h3>
          {selectedDay.isToday && (
            <span className="text-[11px] font-bold text-[#3b5bdb] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              오늘
            </span>
          )}
        </div>

        {/* 과거 실적 상세 카드 */}
        {selectedDay.isPast && selectedDay.trips.length > 0 && (
          <div className="space-y-2.5">
            {selectedDay.trips.map((trip) => (
              <div
                key={trip.id}
                className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-gray-600 font-mono">
                        {trip.plannedPickup}
                      </span>
                      <span className="text-[13px] font-bold text-gray-900">
                        {trip.route.from} ➔ {trip.route.to}
                      </span>
                    </div>
                    <div className="text-[12px] text-gray-500 mt-0.5">
                      {trip.vehicle.ton}톤 {trip.vehicle.body} · {trip.fare.total.toLocaleString()}원
                    </div>
                  </div>
                </div>

                <div className="text-[12px] text-gray-600 pt-1 border-t border-gray-100 flex items-center justify-between">
                  <span>대기 {formatWaitTime(trip.waitMinutes)}</span>
                  {trip.manualWork && (
                    <span className="text-gray-500 font-medium text-[11px]">
                      {trip.fare.extraManual > 0 ? "수작업 추가운임 지급" : "수작업"}
                    </span>
                  )}
                </div>

                {/* 불일치 건 오더 원문 노출 */}
                {trip.conditionMismatch && (
                  <div className="bg-gray-50 border border-gray-200/80 rounded-lg p-2 text-[12px] space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500">
                      <span className="w-2 h-2 border border-gray-600 rounded-[1px] bg-white"></span>
                      <span>오더 원문</span>
                    </div>
                    <div className="text-gray-800 font-medium pl-3">
                      {trip.remarksRaw ? `"${trip.remarksRaw}"` : "(원문 공란)"}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 오늘 및 미래 고정 스케줄 카드 */}
        {!selectedDay.isPast && selectedDay.fixedList.length > 0 && (
          <div className="space-y-2.5">
            {selectedDay.fixedList.map((fs) => (
              <div
                key={fs.id}
                className="bg-white border border-blue-200 rounded-xl p-3.5 shadow-2xs space-y-1.5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[#1e40af] font-mono">
                        {fs.pickupTime}
                      </span>
                      <span className="text-[13px] font-bold text-gray-900">
                        {fs.route.from} ➔ {fs.route.to} ({fs.shipper})
                      </span>
                    </div>
                    <div className="text-[12px] text-gray-600 mt-0.5">
                      {fs.vehicle.ton}톤 {fs.vehicle.body} · 독차 · {fs.fare.toLocaleString()}원
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                  {fs.remarksRaw}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 외부 등록 오더 카드 (스케줄 추가로 등록된 건) */}
        {selectedDay.externalList.length > 0 && (
          <div className="space-y-2.5">
            {selectedDay.externalList.map((item) => {
              const o = item.order;
              return (
                <div
                  key={o.id}
                  className="bg-white border border-purple-200 rounded-xl p-3.5 shadow-2xs space-y-1.5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded">
                          외부 오더
                        </span>
                        <span className="text-[11px] font-bold text-purple-700 font-mono">
                          {o.pickup.time} - {o.dropoff.time}
                        </span>
                      </div>
                      <div className="text-[13px] font-bold text-gray-900 mt-1">
                        {o.pickup.sido} {o.pickup.sigungu} ➔ {o.dropoff.sido} {o.dropoff.sigungu}
                      </div>
                      <div className="text-[12px] text-gray-600 mt-0.5">
                        {o.vehicle.ton}톤 {o.vehicle.body} · {o.loadOption} · {o.fare.total.toLocaleString()}원
                      </div>
                    </div>
                  </div>
                  {o.remarksRaw && (
                    <div className="text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                      {o.remarksRaw}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 운행 일정이 없는 경우 */}
        {selectedDay.tripsCount === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-400 text-[13px] font-medium">
            운행 내역이 없습니다
          </div>
        )}
      </div>

      {/* 하단 캡션 */}
      <div className="px-4 py-2 text-center text-[11px] text-gray-400">
        본 화면의 수치는 합성 데이터 기준입니다
      </div>
    </div>
  );
}
