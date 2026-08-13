"use client";

import React, { useState, useRef, useEffect } from 'react';
import AiReportModal from '@/components/report/AiReportModal';
import { pastTrips, fixedSchedules } from '@/data/mock-data';

interface ScheduleItem {
  id: string | number;
  date: number; // 10 ~ 16
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
  title: string;
  desc1: string;
  desc2: string;
  type: 'kakao' | 'external' | 'fixed';
  fare?: number;
}

export default function ScheduleTab() {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [calendarMode, setCalendarMode] = useState<'weekly' | 'monthly'>('weekly');
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  
  const [selectedDate, setSelectedDate] = useState<number>(13);
  const weekDays = ['월', '화', '수', '목', '금', '토', '일'];
  const weekDates = [10, 11, 12, 13, 14, 15, 16]; 

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const HOUR_HEIGHT = 80;

  // mock-data.ts 기반 실제 스케줄 생성 (8/10 ~ 8/16)
  const schedules: ScheduleItem[] = [
    // 8/10 (월) - pastTrips PT-0810-1, PT-0810-2
    {
      id: 'PT-0810-1',
      date: 10,
      startHour: 9,
      startMin: 30,
      endHour: 10,
      endMin: 50,
      title: '화성 동탄 ➔ 아산 둔포 (대륙정공)',
      desc1: '5톤 윙바디 · 독차',
      desc2: '파렛트 5개 / 지게차 상하차',
      type: 'kakao',
      fare: 108000,
    },
    {
      id: 'PT-0810-2',
      date: 10,
      startHour: 14,
      startMin: 0,
      endHour: 16,
      endMin: 20,
      title: '아산 둔포 ➔ 인천 중구 (우진로지스)',
      desc1: '5톤 윙바디 · 독차',
      desc2: '상차지 대기 발생 (실제 2시간 10분 소요)',
      type: 'kakao',
      fare: 188000,
    },

    // 8/11 (화) - pastTrips PT-0811-1, PT-0811-2
    {
      id: 'PT-0811-1',
      date: 11,
      startHour: 8,
      startMin: 0,
      endHour: 10,
      endMin: 20,
      title: '이천 부발 ➔ 서울 강서 (미래식품)',
      desc1: '5톤 윙바디 · 독차',
      desc2: '파렛트 8개 / 지게차 상하차',
      type: 'kakao',
      fare: 168000,
    },
    {
      id: 'PT-0811-2',
      date: 11,
      startHour: 13,
      startMin: 30,
      endHour: 14,
      endMin: 40,
      title: '서울 강서 ➔ 일산 성석 (우성목재)',
      desc1: '5톤 카고 · 독차',
      desc2: '각재 / 윙 양쪽 개방 필요',
      type: 'kakao',
      fare: 124000,
    },

    // 8/12 (수) - pastTrips PT-0812-1, PT-0812-2
    {
      id: 'PT-0812-1',
      date: 12,
      startHour: 9,
      startMin: 0,
      endHour: 11,
      endMin: 20,
      title: '화성 향남 ➔ 청주 오송 (대성정밀)',
      desc1: '5톤 윙바디 · 독차',
      desc2: '지게차 상하차 / 파렛트 12개 / 연휴 전 물량',
      type: 'kakao',
      fare: 190000,
    },
    {
      id: 'PT-0812-2',
      date: 12,
      startHour: 14,
      startMin: 30,
      endHour: 17,
      endMin: 0,
      title: '청주 오송 ➔ 시흥 정왕 (동양기전)',
      desc1: '5톤 윙바디 · 독차',
      desc2: '파렛트 11개 / 지게차 상하차',
      type: 'kakao',
      fare: 196000,
    },

    // 8/13 (목, 오늘) - fixedSchedules FS-02 (대륙정공, 매주 화·목)
    {
      id: 'FS-02-today',
      date: 13,
      startHour: 9,
      startMin: 30,
      endHour: 10,
      endMin: 50,
      title: '경기 화성시 동탄면 ➔ 충남 아산시 둔포면 (대륙정공)',
      desc1: '5톤 윙바디 · 독차 (고정 스케줄)',
      desc2: '정기 납품 / 파렛트 5개',
      type: 'fixed',
      fare: 110000,
    },

    // 8/14 (금, 내일) - fixedSchedules FS-01 (대성정밀, 매주 월·수·금)
    {
      id: 'FS-01-tomorrow',
      date: 14,
      startHour: 9,
      startMin: 0,
      endHour: 11,
      endMin: 20,
      title: '경기 화성시 향남읍 ➔ 충북 청주시 오송읍 (대성정밀)',
      desc1: '5톤 윙바디 · 독차 (고정 스케줄)',
      desc2: '정기 납품 / 지게차 상하차 / 파렛트 12개',
      type: 'fixed',
      fare: 190000,
    },

    // 8/15 (토) - fixedSchedules FS-03 (미래식품, 매주 토)
    {
      id: 'FS-03-sat',
      date: 15,
      startHour: 6,
      startMin: 0,
      endHour: 8,
      endMin: 20,
      title: '경기 이천시 부발읍 ➔ 서울 강서구 외발산동 (미래식품)',
      desc1: '5톤 윙바디 · 독차 (주말 고정)',
      desc2: '주말 정기 / 지게차 상하차 / 파렛트 8개',
      type: 'fixed',
      fare: 172000,
    },
  ];

  const currentDaySchedules = schedules.filter(s => s.date === selectedDate);

  // 가장 이른 스케줄 기준으로 자동 스크롤
  useEffect(() => {
    if (viewMode === 'calendar' && scrollContainerRef.current) {
      if (currentDaySchedules.length > 0) {
        const earliestHour = Math.min(...currentDaySchedules.map(s => s.startHour));
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
        /* List View Mode */
        <div className="flex flex-col flex-1 min-h-[70vh]">
          <div className="flex justify-end items-center px-4 py-3 bg-white border-b border-gray-100">
            <div className="flex items-center cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-[#3b5bdb] rounded border-gray-300 focus:ring-[#3b5bdb]" defaultChecked />
              <span className="ml-2 text-sm text-gray-600">하차지연 오더 숨기기</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">!</div>
            <p className="text-xl font-bold text-gray-900">운송 내역이 없습니다.</p>
          </div>
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
                
                {/* Render Schedules for the selected day */}
                {currentDaySchedules.map(schedule => {
                  const topOffset = (schedule.startHour + schedule.startMin / 60) * HOUR_HEIGHT + 8;
                  const height = ((schedule.endHour + schedule.endMin / 60) - (schedule.startHour + schedule.startMin / 60)) * HOUR_HEIGHT;
                  
                  const isFixed = schedule.type === 'fixed';
                  const isExternal = schedule.type === 'external';
                  const bgColor = isFixed ? 'bg-[#eff6ff]' : isExternal ? 'bg-[#f8f9fa]' : 'bg-[#eef2ff]';
                  const borderColor = isFixed ? 'border-[#3b5bdb]' : isExternal ? 'border-gray-400' : 'border-[#3b5bdb]';
                  const titleColor = isFixed ? 'text-[#1e40af]' : isExternal ? 'text-gray-500' : 'text-[#3b5bdb]';

                  return (
                    <div 
                      key={schedule.id}
                      className={`absolute left-3 right-4 ${bgColor} border-l-[4px] ${borderColor} rounded-r-md p-3 shadow-sm flex flex-col cursor-pointer transition-colors hover:shadow-md z-10`}
                      style={{ top: `${topOffset}px`, height: `${height - 2}px` }}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] font-bold ${titleColor}`}>
                          {schedule.startHour.toString().padStart(2, '0')}:{schedule.startMin.toString().padStart(2, '0')} - {schedule.endHour.toString().padStart(2, '0')}:{schedule.endMin.toString().padStart(2, '0')}
                        </span>
                        {schedule.fare && (
                          <span className="text-[11px] font-extrabold text-gray-700">
                            {schedule.fare.toLocaleString()}원
                          </span>
                        )}
                      </div>
                      <span className="text-[13px] font-bold text-gray-900 leading-tight truncate">{schedule.title}</span>
                      <span className="text-[12px] text-gray-600 mt-1 truncate">{schedule.desc1}</span>
                      {schedule.desc2 && <span className="text-[11px] text-gray-500 mt-auto truncate">{schedule.desc2}</span>}
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
        
        {/* 운행 기록 리포트 버튼 (왼쪽 하단 고정) */}
        <button 
          onClick={() => setShowReportModal(true)}
          className="pointer-events-auto bg-[#3b5bdb] hover:bg-[#324ec7] text-white shadow-lg rounded-full py-3.5 px-6 font-bold text-[14px] flex items-center justify-center transition-transform hover:scale-105 border border-[#3b5bdb] cursor-pointer"
        >
          운행 기록 리포트
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
    </div>
  );
}
