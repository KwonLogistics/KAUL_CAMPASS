"use client";

import React, { useState, useRef, useEffect } from 'react';
import AiReportModal from '@/components/report/AiReportModal';
import { scheduleItems } from './schedule/mock-schedule';
import { buildDayTimeline } from './schedule/timeline';
import { getMetaBadges, getConditionBadges, getRouteLabel, getFareTotal } from './schedule/badges';
import ScheduleDetailModal from './schedule/ScheduleDetailModal';
import type { ScheduleItem } from './schedule/types';
import { STATUS_LABEL, STATUS_STYLE } from './schedule/status-style';

export default function ScheduleTab() {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [calendarMode, setCalendarMode] = useState<'weekly' | 'monthly'>('weekly');
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);

  const [selectedDate, setSelectedDate] = useState<number>(13);
  const weekDays = ['월', '화', '수', '목', '금', '토', '일'];
  const weekDates = [10, 11, 12, 13, 14, 15, 16]; 

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const HOUR_HEIGHT = 80;

  // selectedDate(일자 숫자) → "YYYY-MM-DD". 기존 요일 선택 UI는 8월 고정이라 그대로 따른다.
  const selectedDateISO = `2026-08-${selectedDate.toString().padStart(2, '0')}`;

  const currentDaySchedules = scheduleItems.filter(item => item.date === selectedDateISO);

  // 겹치는 후보 오더 중 겹치지 않는 하루 체인만 뽑고, 그 사이 공백에 휴식/공차 블록을 끼워 넣는다
  const dayBlocks = buildDayTimeline(currentDaySchedules);
  const tripBlocks = dayBlocks.filter(b => b.kind === 'trip');

  // 가장 이른 스케줄 기준으로 자동 스크롤
  useEffect(() => {
    if (viewMode === 'calendar' && scrollContainerRef.current) {
      if (tripBlocks.length > 0) {
        const earliestHour = Math.min(...tripBlocks.map(b => Math.floor(b.startMin / 60)));
        const scrollTo = Math.max((earliestHour - 1) * HOUR_HEIGHT, 0);
        setTimeout(() => {
          scrollContainerRef.current?.scrollTo({ top: scrollTo, behavior: 'smooth' });
        }, 100);
      } else {
        setTimeout(() => {
          scrollContainerRef.current?.scrollTo({ top: 8 * HOUR_HEIGHT, behavior: 'smooth' });
        }, 100);
      }
    }
  }, [selectedDate, viewMode]);

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] relative pb-[60px]">
      {/* Header Toggle */}
      <div className="bg-white px-4 py-3 flex justify-between items-center border-b border-gray-100 sticky top-0 z-20">
        <h1 className="text-lg font-bold text-gray-900">내 운송 (스케줄)</h1>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            className={`px-3 py-1.5 text-[13px] font-bold rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
            onClick={() => setViewMode('list')}
          >
            리스트 보기
          </button>
          <button 
            className={`px-3 py-1.5 text-[13px] font-bold rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-[#3b5bdb] text-white shadow-sm' : 'text-gray-400'}`}
            onClick={() => setViewMode('calendar')}
          >
            달력 보기
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        /* List View Mode — 날짜 선택과 무관하게 전체 scheduleItems를 시간순으로 보여준다 */
        <div className="flex flex-col flex-1 min-h-[70vh]">
          <div className="flex justify-end items-center px-4 py-3 bg-white border-b border-gray-100">
            <div className="flex items-center cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-[#3b5bdb] rounded border-gray-300 focus:ring-[#3b5bdb]" defaultChecked />
              <span className="ml-2 text-sm text-gray-600">하차지연 오더 숨기기</span>
            </div>
          </div>

          {scheduleItems.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">!</div>
              <p className="text-xl font-bold text-gray-900">운송 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="flex-1 divide-y divide-gray-100 overflow-y-auto bg-white">
              {scheduleItems.map(item => {
                const metaBadges = getMetaBadges(item);
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="flex flex-col gap-1 px-4 py-3 cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-gray-400">
                        {item.date} {item.loadingStart ?? '미기재'}
                      </span>
                      {metaBadges.map(b => (
                        <span key={b} className="rounded bg-[#f4f7ff] px-1.5 py-0.5 text-[10px] font-bold text-[#3b5bdb]">
                          {b}
                        </span>
                      ))}
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${STATUS_STYLE[item.status].badge}`}>
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
      ) : (
        /* Calendar View Mode */
        <div className="flex flex-col flex-1 h-[calc(100vh-180px)]">
          {/* Calendar Header */}
          <div className="bg-white px-4 py-3 border-b border-gray-100 z-10 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-gray-900 text-[16px]">2026년 8월</span>
              <button 
                className="text-[11px] font-bold text-[#3b5bdb] bg-[#f4f7ff] px-2.5 py-1.5 rounded border border-[#d6e2ff]"
                onClick={() => setCalendarMode(calendarMode === 'weekly' ? 'monthly' : 'weekly')}
              >
                {calendarMode === 'weekly' ? '월간(Monthly)으로 보기' : '주간(Weekly)으로 보기'}
              </button>
            </div>
            
            <div className="flex justify-between mt-2">
              {weekDays.map((day, idx) => {
                const date = weekDates[idx];
                const isSelected = selectedDate === date;
                return (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedDate(date)}
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <span className={`text-[12px] mb-1.5 font-bold ${isSelected ? 'text-[#3b5bdb]' : 'text-gray-400'}`}>{day}</span>
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full text-[14px] font-bold ${isSelected ? 'bg-[#3b5bdb] text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}>
                      {date}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Area (Scrollable) */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 bg-white relative overflow-y-auto"
          >
            <div className="flex relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
              {/* Time Column */}
              <div className="w-[60px] border-r border-gray-100 flex flex-col pt-2 bg-[#fdfdfd]">
                {hours.map(hour => (
                  <div key={hour} style={{ height: `${HOUR_HEIGHT}px` }} className="flex items-start justify-center text-[11px] text-gray-400 font-bold">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                ))}
              </div>
              
              {/* Event Column */}
              <div className="flex-1 relative pt-2">
                {/* Grid Lines */}
                {hours.map(hour => (
                  <div key={hour} style={{ height: `${HOUR_HEIGHT}px` }} className="border-b border-gray-100 w-full relative">
                    {/* Half hour dashed line */}
                    <div className="absolute top-1/2 w-full border-b border-dashed border-gray-100"></div>
                  </div>
                ))}
                
                {/* 겹치지 않는 하루 체인만 렌더링 — 트립 블록 / 휴식·공차 블록 */}
                {dayBlocks.map(block => {
                  const topOffset = (block.startMin / 60) * HOUR_HEIGHT + 8;
                  const height = Math.max(((block.endMin - block.startMin) / 60) * HOUR_HEIGHT - 2, 0);

                  if (block.kind === 'rest') {
                    const gapMin = block.endMin - block.startMin;
                    const gapLabel = gapMin >= 60
                      ? `${Math.floor(gapMin / 60)}시간${gapMin % 60 > 0 ? ` ${gapMin % 60}분` : ''}`
                      : `${gapMin}분`;
                    return (
                      <div
                        key={`rest-${block.startMin}`}
                        className="absolute left-3 right-4 flex flex-col items-center justify-center overflow-hidden rounded-r-md border-l-[4px] border-dashed border-gray-300 bg-[#fafafa] z-0"
                        style={{ top: `${topOffset}px`, height: `${height}px` }}
                      >
                        {height >= 28 ? (
                          <>
                            <span className="text-[11px] font-bold text-gray-400">휴식 및 공차 이동</span>
                            <span className="text-[10px] text-gray-300">{gapLabel}</span>
                          </>
                        ) : height >= 14 ? (
                          <span className="text-[9px] font-bold text-gray-400">휴식 · {gapLabel}</span>
                        ) : null}
                      </div>
                    );
                  }

                  const item = block.item;
                  // FixedSchedule엔 source 필드 자체가 없다 — 있는 경우에만 외부 여부를 판단한다
                  const isExternal = 'source' in item.order && item.order.source === 'external';
                  const style = STATUS_STYLE[item.status];

                  // 카드 배경은 상태색으로 채우지 않는다 — 출처 기준의 옅은 톤만 유지, 구분은 배지·border가 맡는다
                  const bgColor = isExternal ? 'bg-[#f8f9fa]' : 'bg-[#eef2ff]';

                  const metaBadges = getMetaBadges(item);
                  const conditionBadges = getConditionBadges(item);
                  const visibleConditions = conditionBadges.slice(0, 4);
                  const extraCount = conditionBadges.length - visibleConditions.length;

                  // 카드가 낮으면(짧은 운행) 배지 줄부터 순서대로 생략해서 안 찌그러지게 한다
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
                      <span className={`absolute top-1.5 right-1.5 flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold ${style.badge}`}>
                        {style.pulseDot && <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${style.pulseDot}`} />}
                        {STATUS_LABEL[item.status]}
                      </span>

                      <span className={`text-[10px] font-bold ${style.title} mb-1 pr-12`}>
                        {item.loadingStart} - {item.unloadingStart}
                      </span>

                      {/* 1순위: 상단 메타 배지 — 출처 · 차량요건 · 적재형태 */}
                      {showMeta && (
                        <div className="mb-1 flex flex-wrap gap-1">
                          {metaBadges.map(b => (
                            <span
                              key={b}
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${isExternal ? 'bg-gray-200 text-gray-500' : 'bg-[#e4eaff] text-[#3b5bdb]'}`}
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

                      {/* 3순위: 작업 조건 스티커 — 핵심 4개 + 나머지는 +N */}
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
        <button className="pointer-events-auto bg-white text-gray-800 shadow-lg rounded-full py-3.5 px-5 font-bold text-[14px] flex items-center justify-center transition-transform hover:scale-105 border border-gray-200 cursor-pointer">
          + 외부 스케줄 추가
        </button>
      </div>

      {/* 운행 기록 리포트 모달 */}
      {showReportModal && (
        <AiReportModal onClose={() => setShowReportModal(false)} />
      )}

      {/* 스케줄 카드 상세 시트 */}
      {selectedItem && (
        <ScheduleDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}
