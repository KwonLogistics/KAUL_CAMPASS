"use client";

import React, { useState, useRef, useEffect } from 'react';

export default function ScheduleTab() {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [calendarMode, setCalendarMode] = useState<'weekly' | 'monthly'>('weekly');
  
  const [selectedDate, setSelectedDate] = useState<number>(13);
  const weekDays = ['월', '화', '수', '목', '금', '토', '일'];
  const weekDates = [10, 11, 12, 13, 14, 15, 16]; 

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 1시간당 높이를 80px로 설정하여 일정이 많아도 편안하게 보이도록 조절
  const HOUR_HEIGHT = 80;

  // 임시 스케줄 데이터
  const schedules = [
    { id: 1, date: 13, startHour: 9, startMin: 0, endHour: 11, endMin: 30, title: '서울 양천구 ➔ 서울 송파구', desc1: '다마스 / 독차', desc2: '스티로폼박스 1개, 햇반 4박스...', type: 'kakao' },
    { id: 2, date: 13, startHour: 14, startMin: 0, endHour: 16, endMin: 0, title: '경기 김포시 ➔ 서울 서초구 (외부오더)', desc1: '다마스 / 독차', desc2: '', type: 'external' },
    { id: 3, date: 14, startHour: 7, startMin: 30, endHour: 9, endMin: 0, title: '인천 부평구 ➔ 서울 마포구', desc1: '1톤 / 혼적', desc2: '박스 10개', type: 'kakao' },
  ];

  const currentDaySchedules = schedules.filter(s => s.date === selectedDate);

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
                  const topOffset = (schedule.startHour + schedule.startMin / 60) * HOUR_HEIGHT + 8; // 8px padding top (pt-2)
                  const height = ((schedule.endHour + schedule.endMin / 60) - (schedule.startHour + schedule.startMin / 60)) * HOUR_HEIGHT;
                  
                  const isExternal = schedule.type === 'external';
                  const bgColor = isExternal ? 'bg-[#f8f9fa]' : 'bg-[#eef2ff]';
                  const borderColor = isExternal ? 'border-gray-400' : 'border-[#3b5bdb]';
                  const titleColor = isExternal ? 'text-gray-500' : 'text-[#3b5bdb]';

                  return (
                    <div 
                      key={schedule.id}
                      className={`absolute left-3 right-4 ${bgColor} border-l-[4px] ${borderColor} rounded-r-md p-3 shadow-sm flex flex-col cursor-pointer transition-colors hover:shadow-md z-10`}
                      style={{ top: `${topOffset}px`, height: `${height - 2}px` }}
                    >
                      <span className={`text-[10px] font-bold ${titleColor} mb-1`}>
                        {schedule.startHour.toString().padStart(2, '0')}:{schedule.startMin.toString().padStart(2, '0')} - {schedule.endHour.toString().padStart(2, '0')}:{schedule.endMin.toString().padStart(2, '0')}
                      </span>
                      <span className="text-[14px] font-bold text-gray-900 leading-tight truncate">{schedule.title}</span>
                      <span className="text-[12px] text-gray-600 mt-1 truncate">{schedule.desc1}</span>
                      {schedule.desc2 && <span className="text-[11px] text-gray-400 mt-auto truncate">{schedule.desc2}</span>}
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
        <button className="pointer-events-auto bg-[#3b5bdb] text-white shadow-lg rounded-full py-3.5 px-5 font-bold text-[14px] flex items-center justify-center transition-transform hover:scale-105 border border-[#3b5bdb]">
          + 외부 스케줄 추가
        </button>
      </div>
    </div>
  );
}
