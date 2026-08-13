"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import ExternalOrderSheet from './order-import/ExternalOrderSheet';
import { useAppState } from '@/lib/store/AppStateProvider';
import type { ScheduledOrder } from '@/lib/store/schedule-store';
import { TODAY_ISO } from '@/data/mock-data';

/** 타임라인 블록 하나. 카카오 목업이든 외부 등록이든 같은 모양으로 만들어 같이 그린다. */
interface Block {
  id: string;
  /** "YYYY-MM-DD". 일(day) 숫자로 들고 있으면 8/18 오더가 8월 셋째 주에서 사라진다. */
  dateISO: string;
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
  title: string;
  desc1: string;
  desc2: string;
  type: 'kakao' | 'external';
}

function hhmm(t: string): [number, number] {
  const [h, m] = t.split(':').map(Number);
  return [Number.isFinite(h) ? h : 9, Number.isFinite(m) ? m : 0];
}

/**
 * 등록된 오더 → 타임라인 블록.
 * 하차가 다음 날이면 그날 23:59 로 잘라 그린다 — 블록이 캘린더 밖으로 흘러나가지 않게.
 */
function toBlock(s: ScheduledOrder): Block {
  const { order } = s;
  const [startHour, startMin] = hhmm(order.pickup.time);
  const sameDay = order.dropoff.dateISO === order.pickup.dateISO;
  const [rawEndH, rawEndM] = hhmm(order.dropoff.time);
  const [endHour, endMin] = sameDay ? [rawEndH, rawEndM] : [23, 59];

  const place = (w: { sigungu: string; dong: string; sido: string }) =>
    [w.sido, w.sigungu || w.dong].filter(Boolean).join(' ') || '미상';

  return {
    id: order.id,
    dateISO: s.dateISO,
    startHour,
    startMin,
    // 최소 1시간은 차지하게 — 30분짜리 블록은 글자가 안 들어간다
    endHour: endHour * 60 + endMin - (startHour * 60 + startMin) < 60 ? startHour + 1 : endHour,
    endMin: endHour * 60 + endMin - (startHour * 60 + startMin) < 60 ? startMin : endMin,
    title: `${place(order.pickup)} ➔ ${place(order.dropoff)}`,
    desc1: `${order.vehicle.ton}톤 ${order.vehicle.body} / ${order.loadOption} · ${order.fare.total.toLocaleString()}원`,
    desc2: order.conditions.map((c) => c.value).join(', '),
    type: 'external',
  };
}

/** 그 날짜가 속한 주의 월요일. 주간 보기는 항상 월요일에서 시작한다. */
function mondayOf(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00`);
  const offset = (d.getDay() + 6) % 7; // 일=0 → 6, 월=1 → 0
  d.setDate(d.getDate() - offset);
  return toISO(d);
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function shiftDays(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export default function ScheduleTab() {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [calendarMode, setCalendarMode] = useState<'weekly' | 'monthly'>('weekly');
  const [showExternal, setShowExternal] = useState(false);

  const { scheduled, hydrated, removeScheduled } = useAppState();

  const [selectedDate, setSelectedDate] = useState<string>(TODAY_ISO);
  const weekDays = ['월', '화', '수', '목', '금', '토', '일'];
  const weekStart = mondayOf(selectedDate);
  const weekDates = Array.from({ length: 7 }, (_, i) => shiftDays(weekStart, i));

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 1시간당 높이를 80px로 설정하여 일정이 많아도 편안하게 보이도록 조절
  const HOUR_HEIGHT = 80;

  // 임시 스케줄 데이터 (카카오 콜)
  const schedules: Block[] = [
    { id: 'k1', dateISO: '2026-08-13', startHour: 9, startMin: 0, endHour: 11, endMin: 30, title: '서울 양천구 ➔ 서울 송파구', desc1: '다마스 / 독차', desc2: '스티로폼박스 1개, 햇반 4박스...', type: 'kakao' },
    { id: 'k3', dateISO: '2026-08-14', startHour: 7, startMin: 30, endHour: 9, endMin: 0, title: '인천 부평구 ➔ 서울 마포구', desc1: '1톤 / 혼적', desc2: '박스 10개', type: 'kakao' },
  ];

  // 외부 등록 오더는 여기서 합류한다. hydrated 전에는 빈 배열 —
  // localStorage 를 서버 렌더에서 읽을 수 없어 마크업이 갈리기 때문이다.
  const externalBlocks = hydrated ? scheduled.map(toBlock) : [];
  const allBlocks = [...schedules, ...externalBlocks];

  const currentDaySchedules = allBlocks
    .filter((s) => s.dateISO === selectedDate)
    .sort((a, b) => a.startHour * 60 + a.startMin - (b.startHour * 60 + b.startMin));

  /** 주간 날짜 칸에 찍는 점 — 그날 일정이 있는지 */
  const datesWithBlocks = new Set(allBlocks.map((b) => b.dateISO));

  // 가장 이른 스케줄 기준으로 자동 스크롤
  useEffect(() => {
    if (viewMode === 'calendar' && scrollContainerRef.current) {
      if (currentDaySchedules.length > 0) {
        // 가장 이른 시작 시간 찾기
        const earliestHour = Math.min(...currentDaySchedules.map(s => s.startHour));
        // 약간의 여유를 위해 1시간 위로 스크롤 (단, 0보다 작아지지 않게)
        const scrollTo = Math.max((earliestHour - 1) * HOUR_HEIGHT, 0);
        
        // setTimeout을 주어 렌더링 후 부드럽게 스크롤되도록 함
        setTimeout(() => {
          scrollContainerRef.current?.scrollTo({ top: scrollTo, behavior: 'smooth' });
        }, 100);
      } else {
        // 일정이 없으면 오전 9시로 기본 스크롤
        setTimeout(() => {
          scrollContainerRef.current?.scrollTo({ top: 8 * HOUR_HEIGHT, behavior: 'smooth' });
        }, 100);
      }
    }
    // scheduled.length — 외부 오더를 새로 등록하면 그 자리로 스크롤이 따라가야 한다
  }, [selectedDate, viewMode, scheduled.length]);

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
        /* List View Mode */
        <div className="flex flex-col flex-1 min-h-[70vh]">
          <div className="flex justify-end items-center px-4 py-3 bg-white border-b border-gray-100">
            <div className="flex items-center cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-[#3b5bdb] rounded border-gray-300 focus:ring-[#3b5bdb]" defaultChecked />
              <span className="ml-2 text-sm text-gray-600">하차지연 오더 숨기기</span>
            </div>
          </div>
          {hydrated && scheduled.length > 0 ? (
            <div className="flex flex-col gap-2 p-4">
              {scheduled.map((s) => {
                const b = toBlock(s);
                return (
                  <Link
                    key={s.order.id}
                    href={`/cargo/${s.order.id}`}
                    className="block rounded-lg border border-gray-200 bg-white p-3"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#b07600]">
                        <span className="mr-1 rounded bg-[#f59f00] px-1 py-0.5 text-[9px] text-white">외부</span>
                        {s.dateISO} {s.order.pickup.time} → {s.order.dropoff.time}
                      </span>
                      <button
                        onClick={(e) => { e.preventDefault(); removeScheduled(s.order.id); }}
                        className="text-[12px] font-bold text-gray-400 hover:text-red-500"
                      >
                        삭제
                      </button>
                    </div>
                    <p className="text-[14px] font-bold text-gray-900">{b.title}</p>
                    <p className="mt-0.5 text-[12px] text-gray-600">{b.desc1}</p>
                    {b.desc2 && <p className="mt-1 text-[11px] text-gray-400">{b.desc2}</p>}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">!</div>
              <p className="text-xl font-bold text-gray-900">운송 내역이 없습니다.</p>
            </div>
          )}
        </div>
      ) : (
        /* Calendar View Mode */
        <div className="flex flex-col flex-1 h-[calc(100vh-180px)]">
          {/* Calendar Header */}
          <div className="bg-white px-4 py-3 border-b border-gray-100 z-10 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedDate(shiftDays(selectedDate, -7))}
                  aria-label="이전 주"
                  className="px-1.5 text-[16px] leading-none text-gray-400 hover:text-gray-700"
                >
                  ‹
                </button>
                <span className="font-bold text-gray-900 text-[16px]">
                  {weekStart.slice(0, 4)}년 {Number(weekStart.slice(5, 7))}월
                </span>
                <button
                  onClick={() => setSelectedDate(shiftDays(selectedDate, 7))}
                  aria-label="다음 주"
                  className="px-1.5 text-[16px] leading-none text-gray-400 hover:text-gray-700"
                >
                  ›
                </button>
              </div>
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
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full text-[14px] font-bold ${isSelected ? 'bg-[#3b5bdb] text-white shadow-md' : date === TODAY_ISO ? 'text-[#3b5bdb] ring-1 ring-[#d6e2ff]' : 'text-gray-700 hover:bg-gray-100'}`}>
                      {Number(date.slice(8, 10))}
                    </div>
                    <div className={`mt-1 h-1 w-1 rounded-full ${datesWithBlocks.has(date) ? (isSelected ? 'bg-[#3b5bdb]' : 'bg-gray-300') : 'bg-transparent'}`} />
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
                
                {/* Render Schedules for the selected day */}
                {currentDaySchedules.map(schedule => {
                  const topOffset = (schedule.startHour + schedule.startMin / 60) * HOUR_HEIGHT + 8; // 8px padding top (pt-2)
                  const height = ((schedule.endHour + schedule.endMin / 60) - (schedule.startHour + schedule.startMin / 60)) * HOUR_HEIGHT;
                  
                  const isExternal = schedule.type === 'external';
                  const bgColor = isExternal ? 'bg-[#fff8e6]' : 'bg-[#eef2ff]';
                  const borderColor = isExternal ? 'border-[#f59f00]' : 'border-[#3b5bdb]';
                  const titleColor = isExternal ? 'text-[#b07600]' : 'text-[#3b5bdb]';

                  const blockClass = `absolute left-3 right-4 ${bgColor} border-l-[4px] ${borderColor} rounded-r-md p-3 shadow-sm flex flex-col cursor-pointer transition-colors hover:shadow-md z-10 overflow-hidden`;
                  const blockStyle = { top: `${topOffset}px`, height: `${height - 2}px` };

                  const content = (
                    <>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold ${titleColor} mb-1`}>
                          {isExternal && <span className="mr-1 rounded bg-[#f59f00] px-1 py-0.5 text-[9px] text-white">외부</span>}
                          {schedule.startHour.toString().padStart(2, '0')}:{schedule.startMin.toString().padStart(2, '0')} - {schedule.endHour.toString().padStart(2, '0')}:{schedule.endMin.toString().padStart(2, '0')}
                        </span>
                        {isExternal && (
                          <button
                            onClick={(e) => { e.preventDefault(); removeScheduled(schedule.id); }}
                            aria-label="등록 취소"
                            className="px-1 text-[14px] leading-none font-bold text-gray-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <span className="text-[14px] font-bold text-gray-900 leading-tight truncate">{schedule.title}</span>
                      <span className="text-[12px] text-gray-600 mt-1 truncate">{schedule.desc1}</span>
                      {schedule.desc2 && <span className="text-[11px] text-gray-400 mt-auto truncate">{schedule.desc2}</span>}
                    </>
                  );

                  // 카카오 목업 두 건(k1/k3)은 진짜 spotOrders 아이디가 아니라 화면용 가짜 id다 —
                  // 외부 등록 건만 상세 화면(/cargo/[id])이 실제로 그 id 를 찾을 수 있다.
                  return isExternal ? (
                    <Link key={schedule.id} href={`/cargo/${schedule.id}`} className={blockClass} style={blockStyle}>
                      {content}
                    </Link>
                  ) : (
                    <div key={schedule.id} className={blockClass} style={blockStyle}>
                      {content}
                    </div>
                  );
                })}

                {currentDaySchedules.length === 0 && (
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
        
        {/* AI 보고서 보기 버튼 (왼쪽 하단 고정) */}
        <button className="pointer-events-auto bg-gradient-to-r from-purple-500 to-[#7a42f4] text-white shadow-lg rounded-full py-3.5 px-5 font-bold text-[14px] flex items-center justify-center transition-transform hover:scale-105 border border-purple-400">
          <span className="mr-1.5 text-lg">✨</span> AI 보고서 보기
        </button>

        {/* 외부 스케줄 추가 버튼 (오른쪽 하단 고정) */}
        <button 
          onClick={() => setShowExternal(true)}
          className="pointer-events-auto bg-[#3b5bdb] text-white shadow-lg rounded-full py-3.5 px-5 font-bold text-[14px] flex items-center justify-center transition-transform hover:scale-105 border border-[#3b5bdb]"
        >
          + 외부 스케줄 추가
        </button>
      </div>

      {showExternal && (
        <ExternalOrderSheet
          onClose={() => setShowExternal(false)}
          onRegistered={(dateISO) => {
            setViewMode('calendar');
            setSelectedDate(dateISO); // 8/18 오더면 캘린더가 그 주로 넘어간다
          }}
        />
      )}
    </div>
  );
}
