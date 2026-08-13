"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import AiReportModal from "@/components/report/AiReportModal";
import MonthlyCalendar from "@/components/MonthlyCalendar";
import ExternalOrderSheet from "./order-import/ExternalOrderSheet";
import { useAppState } from "@/lib/store/AppStateProvider";
import { scheduleItems } from "./schedule/mock-schedule";
import { convertSpotOrderToScheduleItem } from "./schedule/convert";
import { buildDayTimeline } from "./schedule/timeline";
import { getMetaBadges, getConditionBadges, getRouteLabel, getFareTotal } from "./schedule/badges";
import ScheduleDetailModal from "./schedule/ScheduleDetailModal";
import type { ScheduleItem } from "./schedule/types";
import { STATUS_LABEL, STATUS_STYLE } from "./schedule/status-style";

export default function ScheduleTab() {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
  const [calendarMode, setCalendarMode] = useState<"weekly" | "monthly">("weekly");
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showExternal, setShowExternal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);

  const [selectedDate, setSelectedDate] = useState<number>(13);
  const weekDays = ["월", "화", "수", "목", "금", "토", "일"];
  const weekDates = [10, 11, 12, 13, 14, 15, 16];

  // 순범: schedule-store.ts(실제 등록된 외부 오더)를 지수의 scheduleItems 파이프라인에 합류시킨다.
  // mock-schedule.ts 주석이 이 자리를 비워뒀다 — "지금은 그 저장소가 비어 있어서 안 씀".
  // convertSpotOrderToScheduleItem은 source로 카카오/외부를 안 가리므로 그대로 재사용한다.
  const { scheduled, hydrated } = useAppState();
  const externalItems = useMemo(
    () => (hydrated ? scheduled.map((s) => convertSpotOrderToScheduleItem(s.order)) : []),
    [scheduled, hydrated],
  );
  const allItems = useMemo(() => [...scheduleItems, ...externalItems], [externalItems]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const HOUR_HEIGHT = 80;

  // selectedDate(일자 숫자) → "YYYY-MM-DD". 기존 요일 선택 UI는 8월 고정
  const selectedDateISO = `2026-08-${selectedDate.toString().padStart(2, "0")}`;

  const currentDaySchedules = allItems.filter((item) => item.date === selectedDateISO);

  // 겹치는 후보 오더 중 겹치지 않는 하루 체인만 뽑고, 그 사이 공백에 휴식/공차 블록을 끼워 넣는다
  const dayBlocks = buildDayTimeline(currentDaySchedules);
  const tripBlocks = dayBlocks.filter((b) => b.kind === "trip");

  // 해당 날짜의 첫 업무 1시간 전 ~ 마지막 업무 1~2시간 후까지만 시간축을 가변으로 생성
  const hasTrips = tripBlocks.length > 0;
  const earliestHour = hasTrips
    ? Math.min(...tripBlocks.map((b) => Math.floor(b.startMin / 60)))
    : 8;
  const latestHour = hasTrips
    ? Math.max(...tripBlocks.map((b) => Math.ceil(b.endMin / 60)))
    : 18;

  // 시작시각(첫 업무 1시간 전, 최소 0시), 종료시각(마지막 업무 1시간 후, 최소 startHour+4, 최대 24시)
  const timelineStartHour = Math.max(earliestHour - 1, 0);
  const timelineEndHour = Math.min(Math.max(latestHour + 1, timelineStartHour + 4), 24);

  const displayedHours = Array.from(
    { length: timelineEndHour - timelineStartHour },
    (_, i) => timelineStartHour + i
  );
  const totalTimelineHeight = displayedHours.length * HOUR_HEIGHT;

  // 날짜 변경 시 상단으로 스무스하게 초기화
  useEffect(() => {
    if (viewMode === "calendar" && calendarMode === "weekly" && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedDate, viewMode, calendarMode, tripBlocks]);

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] relative pb-[60px]">
      {/* Header Bar */}
      <div className="bg-white px-4 py-3 flex justify-between items-center border-b border-gray-100 sticky top-0 z-20">
        <h1 className="text-lg font-bold text-gray-900">내 운송 (스케줄)</h1>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            className={`px-3 py-1.5 text-[13px] font-bold rounded-md transition-colors cursor-pointer ${
              viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
            }`}
            onClick={() => setViewMode("list")}
          >
            리스트 보기
          </button>
          <button
            className={`px-3 py-1.5 text-[13px] font-bold rounded-md transition-colors cursor-pointer ${
              viewMode === "calendar" ? "bg-[#3b5bdb] text-white shadow-sm" : "text-gray-400"
            }`}
            onClick={() => setViewMode("calendar")}
          >
            달력 보기
          </button>
        </div>
      </div>

      {viewMode === "list" ? (
        /* List View Mode — 전체 scheduleItems(+외부 등록)를 시간순으로 표시 */
        <div className="flex flex-col flex-1 min-h-[70vh]">
          <div className="flex justify-end items-center px-4 py-3 bg-white border-b border-gray-100">
            <div className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-[#3b5bdb] rounded border-gray-300 focus:ring-[#3b5bdb]"
                defaultChecked
              />
              <span className="ml-2 text-sm text-gray-600">하차지연 오더 숨기기</span>
            </div>
          </div>

          {allItems.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
                !
              </div>
              <p className="text-xl font-bold text-gray-900">운송 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="flex-1 divide-y divide-gray-100 overflow-y-auto bg-white">
              {allItems.map((item) => {
                const metaBadges = getMetaBadges(item);
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="flex flex-col gap-1 px-4 py-3 cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-gray-400">
                        {item.date} {item.loadingStart ?? "미기재"}
                      </span>
                      {metaBadges.map((b) => (
                        <span
                          key={b}
                          className="rounded bg-[#f4f7ff] px-1.5 py-0.5 text-[10px] font-bold text-[#3b5bdb]"
                        >
                          {b}
                        </span>
                      ))}
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          STATUS_STYLE[item.status].badge
                        }`}
                      >
                        {STATUS_LABEL[item.status]}
                      </span>
                    </div>
                    <span className="text-[14px] font-bold text-gray-900 truncate">
                      {getRouteLabel(item)}
                    </span>
                    <span className="text-[13px] font-bold text-gray-700">
                      {getFareTotal(item).toLocaleString()}원
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : calendarMode === "monthly" ? (
        /* 30일 모아보기 (월간 롤링 5주 캘린더) */
        <div className="flex flex-col flex-1 h-[calc(100vh-120px)]">
          {/* 달력 전환 헤더 */}
          <div className="bg-white px-4 py-2.5 border-b border-gray-100 flex justify-between items-center">
            <span className="font-bold text-gray-900 text-[15px]">30일 모아보기</span>
            <button
              className="text-[11px] font-bold text-[#3b5bdb] bg-[#f4f7ff] px-2.5 py-1.5 rounded border border-[#d6e2ff] cursor-pointer hover:bg-[#eaf0ff]"
              onClick={() => setCalendarMode("weekly")}
            >
              주간으로 보기
            </button>
          </div>

          <MonthlyCalendar onOpenReport={() => setShowReportModal(true)} />
        </div>
      ) : (
        /* 주간 캘린더 모드 */
        <div className="flex flex-col flex-1 h-[calc(100vh-180px)]">
          {/* Calendar Header */}
          <div className="bg-white px-4 py-3 border-b border-gray-100 z-10 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-gray-900 text-[16px]">2026년 8월</span>
              <button
                className="text-[11px] font-bold text-[#3b5bdb] bg-[#f4f7ff] px-2.5 py-1.5 rounded border border-[#d6e2ff] cursor-pointer hover:bg-[#eaf0ff]"
                onClick={() => setCalendarMode("monthly")}
              >
                30일 모아보기
              </button>
            </div>

            <div className="flex justify-between mt-2">
              {weekDays.map((day, idx) => {
                const date = weekDates[idx];
                const isSelected = selectedDate === date;
                const isToday = date === 13;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(date)}
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <span
                      className={`text-[12px] mb-1.5 font-bold ${
                        isSelected ? "text-[#3b5bdb]" : "text-gray-400"
                      }`}
                    >
                      {day}
                    </span>
                    <div
                      className={`w-8 h-8 flex items-center justify-center rounded-full text-[14px] font-bold ${
                        isSelected
                          ? "bg-[#3b5bdb] text-white shadow-md"
                          : isToday
                          ? "border border-[#3b5bdb] text-[#3b5bdb]"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {date}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Area (Scrollable) */}
          <div ref={scrollContainerRef} className="flex-1 bg-white relative overflow-y-auto">
            <div className="flex relative" style={{ height: `${totalTimelineHeight}px` }}>
              {/* Time Column */}
              <div className="w-[60px] border-r border-gray-100 flex flex-col pt-2 bg-[#fdfdfd]">
                {displayedHours.map((hour) => (
                  <div
                    key={hour}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    className="flex items-start justify-center text-[11px] text-gray-400 font-bold"
                  >
                    {hour.toString().padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {/* Event Column */}
              <div className="flex-1 relative pt-2">
                {/* Grid Lines */}
                {displayedHours.map((hour) => (
                  <div
                    key={hour}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    className="border-b border-gray-100 w-full relative"
                  >
                    {/* Half hour dashed line */}
                    <div className="absolute top-1/2 w-full border-b border-dashed border-gray-100"></div>
                  </div>
                ))}

                {/* 겹치지 않는 하루 체인만 렌더링 — 트립 블록 / 휴식·공차 블록 */}
                {dayBlocks.map((block) => {
                  const topOffset =
                    ((block.startMin - timelineStartHour * 60) / 60) * HOUR_HEIGHT + 8;
                  const height = Math.max(
                    ((block.endMin - block.startMin) / 60) * HOUR_HEIGHT - 2,
                    0
                  );

                  if (block.kind === "rest") {
                    const gapMin = block.endMin - block.startMin;
                    const gapLabel =
                      gapMin >= 60
                        ? `${Math.floor(gapMin / 60)}시간${gapMin % 60 > 0 ? ` ${gapMin % 60}분` : ""}`
                        : `${gapMin}분`;
                    return (
                      <div
                        key={`rest-${block.startMin}`}
                        className="absolute left-3 right-4 flex flex-col items-center justify-center overflow-hidden rounded-r-md border-l-[4px] border-dashed border-gray-300 bg-[#fafafa] z-0"
                        style={{ top: `${topOffset}px`, height: `${height}px` }}
                      >
                        {height >= 28 ? (
                          <>
                            <span className="text-[11px] font-bold text-gray-400">
                              휴식 및 공차 이동
                            </span>
                            <span className="text-[10px] text-gray-300">{gapLabel}</span>
                          </>
                        ) : height >= 14 ? (
                          <span className="text-[9px] font-bold text-gray-400">
                            휴식 · {gapLabel}
                          </span>
                        ) : null}
                      </div>
                    );
                  }

                  const item = block.item;
                  const isExternal = "source" in item.order && item.order.source === "external";
                  const style = STATUS_STYLE[item.status];
                  const bgColor = isExternal ? "bg-[#f8f9fa]" : "bg-[#eef2ff]";

                  const metaBadges = getMetaBadges(item);
                  const conditionBadges = getConditionBadges(item);
                  const visibleConditions = conditionBadges.slice(0, 4);
                  const extraCount = conditionBadges.length - visibleConditions.length;

                  const showConditions = height >= 100;
                  const showMeta = height >= 60;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`absolute left-3 right-4 ${bgColor} ${style.borderWidth} ${style.border} rounded-r-md p-2.5 shadow-sm flex flex-col overflow-hidden cursor-pointer transition-colors hover:shadow-md z-10 ${style.ring}`}
                      style={{ top: `${topOffset}px`, height: `${height}px` }}
                    >
                      {/* 우측 상단 상태 배지 */}
                      <span
                        className={`absolute top-1.5 right-1.5 flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold ${style.badge}`}
                      >
                        {style.pulseDot && (
                          <span
                            className={`h-1.5 w-1.5 rounded-full animate-pulse ${style.pulseDot}`}
                          />
                        )}
                        {STATUS_LABEL[item.status]}
                      </span>

                      <span className={`text-[10px] font-bold ${style.title} mb-1 pr-12`}>
                        {item.loadingStart} - {item.unloadingStart}
                      </span>

                      {/* 1순위: 상단 메타 배지 */}
                      {showMeta && (
                        <div className="mb-1 flex flex-wrap gap-1">
                          {metaBadges.map((b) => (
                            <span
                              key={b}
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                isExternal
                                  ? "bg-gray-200 text-gray-500"
                                  : "bg-[#e4eaff] text-[#3b5bdb]"
                              }`}
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 2순위: 운행 경로 */}
                      <span className="text-[14px] font-extrabold text-gray-900 leading-tight truncate">
                        {getRouteLabel(item)}
                      </span>

                      {/* 3순위: 작업 조건 스티커 */}
                      {showConditions && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {visibleConditions.map((b, idx) => (
                            <span
                              key={`${b}-${idx}`}
                              className="rounded bg-white/70 px-1.5 py-0.5 text-[9px] font-bold text-gray-600 border border-gray-200"
                            >
                              {b}
                            </span>
                          ))}
                          {extraCount > 0 && (
                            <span className="rounded bg-white/70 px-1.5 py-0.5 text-[9px] font-bold text-gray-400 border border-gray-200">
                              +{extraCount}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {tripBlocks.length === 0 && (
                  <div className="absolute inset-0 flex justify-center items-center pointer-events-none mt-20">
                    <span className="text-gray-300 font-bold text-sm bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                      예정된 스케줄이 없습니다
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Buttons (Fixed to the screen) */}
      <div className="fixed bottom-[80px] w-full max-w-[480px] px-4 flex justify-between z-30 pointer-events-none">
        {/* 운행 리포트 버튼 (왼쪽 하단 고정) */}
        <button
          onClick={() => setShowReportModal(true)}
          className="pointer-events-auto bg-[#3b5bdb] hover:bg-[#324ec7] text-white shadow-lg rounded-full py-3.5 px-6 font-bold text-[14px] flex items-center justify-center transition-transform hover:scale-105 border border-[#3b5bdb] cursor-pointer"
        >
          운행 리포트
        </button>

        {/* 외부 스케줄 추가 버튼 (오른쪽 하단 고정) */}
        <button
          onClick={() => setShowExternal(true)}
          className="pointer-events-auto bg-white text-gray-800 shadow-lg rounded-full py-3.5 px-5 font-bold text-[14px] flex items-center justify-center transition-transform hover:scale-105 border border-gray-200 cursor-pointer"
        >
          + 외부 스케줄 추가
        </button>
      </div>

      {/* 운행 리포트 모달 */}
      {showReportModal && <AiReportModal onClose={() => setShowReportModal(false)} />}

      {/* 스케줄 카드 상세 시트 */}
      {selectedItem && (
        <ScheduleDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      {/* 외부 오더 등록 시트 */}
      {showExternal && (
        <ExternalOrderSheet
          onClose={() => setShowExternal(false)}
          onRegistered={(dateISO) => {
            // 주간 보기는 아직 8월 10~16일 한 주만 보여준다(팀 스케줄 탭 자체의 현재 범위) —
            // 그 범위 밖 날짜는 리스트 보기로 보내야 등록한 오더가 실제로 눈에 보인다.
            const day = Number(dateISO.slice(8, 10));
            if (dateISO.startsWith("2026-08") && day >= 10 && day <= 16) {
              setViewMode("calendar");
              setCalendarMode("weekly");
              setSelectedDate(day);
            } else {
              setViewMode("list");
            }
          }}
        />
      )}
    </div>
  );
}
