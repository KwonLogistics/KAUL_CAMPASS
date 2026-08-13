"use client";
import { useState } from 'react';
import Link from 'next/link';

export default function CargoInfo() {
  const [sortOpen, setSortOpen] = useState(false);

  const orders = [
    {
      id: 1,
      badge: '선호지역',
      badgeDesc: '5km 주변',
      from: '서울 양천 목동동로',
      to: '서울 서대문 서소문로',
      fromTime: '당상 17:30',
      toTime: '당착 19:20',
      specs: '독차 · 0.3톤 · 다마스',
      desc: '지금 상차 / 태블릿 가방3개(태블릿...',
      payType: '후불 바로선지급',
      price: '30,328',
      isNew: true
    },
    {
      id: 2,
      badge: '선호지역',
      badgeDesc: '10km 주변',
      from: '경기 김포 고촌읍',
      to: '서울 서초 사평대로20길 8',
      fromTime: '당상 17:40',
      toTime: '당착 19:40',
      specs: '독차 · 0.3톤 · 다마스',
      desc: '지금 상차 / 식품, 치즈입니다.',
      payType: '후불 바로선지급',
      price: '36,365',
      isNew: false
    },
    {
      id: 3,
      badge: '인증업체',
      badge2: '선호지역',
      badgeDesc: '30km 주변',
      from: '경기 하남 초이동',
      to: '서울 서초 서초동',
      fromTime: '내상',
      toTime: '08.09 07:30',
      specs: '독차 · 0.3톤 · 다마스',
      desc: '타일10박스(300*600) 오전상,내...',
      payType: '후불 바로선지급',
      price: '35,000',
      isNew: false
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f6] relative pb-[120px]">
      {/* Header */}
      <div className="bg-[#3b5bdb] text-white flex justify-between items-center px-4 py-3 sticky top-0 z-20">
        <h1 className="text-lg font-bold">화물 정보</h1>
        <div className="flex items-center bg-white/20 px-3 py-1 rounded-full border border-white/30 cursor-pointer">
          <span className="text-sm font-medium mr-2">오더추천 ON</span>
          <div className="w-8 h-4 bg-white rounded-full flex items-center p-0.5">
            <div className="w-3 h-3 bg-[#3b5bdb] rounded-full transform translate-x-4 transition-transform"></div>
          </div>
        </div>
      </div>

      {/* Sub Header (Filters) */}
      <div className="bg-white flex items-center px-4 py-3 border-b border-gray-200 sticky top-[52px] z-10">
        <div 
          className="flex items-center text-gray-700 font-medium text-[15px] cursor-pointer relative mr-auto"
          onClick={() => setSortOpen(!sortOpen)}
        >
          <span className="mr-1 text-gray-400 font-bold">↓↑</span> 최신순
          {sortOpen && (
            <div className="absolute top-8 left-0 bg-white border border-gray-200 shadow-xl rounded-md w-40 py-2 z-30">
              <div className="px-4 py-2.5 text-sm text-[#3b5bdb] font-bold flex justify-between hover:bg-gray-50">최신순 <span className="text-xs">✓</span></div>
              <div className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">가까운 순</div>
              <div className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">운송거리 짧은 순</div>
              <div className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">금액 높은 순</div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Link href="/settings/search" className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"></path></svg>
            검색설정
          </Link>
          <Link href="/settings/location" className="flex items-center px-3 py-1.5 border border-[#d6e2ff] text-[#3b5bdb] rounded text-xs font-bold bg-[#f4f7ff] hover:bg-[#e9efff] transition-colors">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            선호지역
          </Link>
        </div>
      </div>

      {/* Banner */}
      <div className="bg-[#eef2ff] px-5 py-5 flex justify-between items-center relative overflow-hidden">
        <div className="z-10">
          <p className="text-gray-800 font-bold text-base leading-snug">화물기사 자격을 등록하면<br/>오더를 수행할 수 있어요</p>
          <p className="text-[#3b5bdb] font-semibold text-sm mt-2 flex items-center cursor-pointer">
            서류 제출하러 가기 <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </p>
        </div>
        <div className="absolute right-[-5px] bottom-[-5px] text-7xl opacity-90 drop-shadow-sm">🗂️</div>
      </div>

      {/* Order List */}
      <div className="flex flex-col bg-white">
        {orders.map((order) => (
          <Link href={`/cargo/${order.id}`} key={order.id} className="block border-t-[6px] border-gray-100 px-5 py-5 relative cursor-pointer hover:bg-gray-50 transition-colors">
            {order.isNew && (
              <div className="absolute top-5 right-5 w-[18px] h-[18px] bg-[#ff6b00] rounded-full text-white text-[10px] font-bold flex items-center justify-center">N</div>
            )}
            
            <div className="flex items-center gap-1.5 mb-3">
              {order.badge2 && <span className="bg-[#f0e6ff] text-[#7a42f4] text-[11px] px-1.5 py-0.5 rounded font-bold">{order.badge2}</span>}
              <span className={`text-[11px] px-1.5 py-0.5 rounded font-bold border ${order.badge === '선호지역' ? 'bg-[#f4f7ff] text-[#3b5bdb] border-[#d6e2ff]' : 'bg-[#f0e6ff] text-[#7a42f4] border-[#d4c1ff]'}`}>{order.badge}</span>
              <span className="text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-medium">{order.badgeDesc}</span>
            </div>

            <div className="flex flex-col gap-1 mt-3">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full border-[1.5px] border-gray-400 mr-2 bg-transparent"></div>
                <span className="font-bold text-gray-900 text-base">{order.from}</span>
                <span className="ml-2 bg-gray-400 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">{order.fromTime.split(' ')[0]}</span>
                {order.fromTime.split(' ')[1] && <span className="ml-1 text-[13px] text-gray-500 font-medium">{order.fromTime.split(' ')[1]}</span>}
              </div>
              
              <div className="flex flex-col ml-[3px] my-1">
                <div className="w-[1.5px] h-1.5 bg-gray-300 mb-1"></div>
                <div className="w-[1.5px] h-1.5 bg-gray-300"></div>
              </div>
              
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-[#3b5bdb] mr-2"></div>
                <span className="font-bold text-gray-900 text-base">{order.to}</span>
                <span className="ml-2 bg-[#3b5bdb] text-white text-[10px] px-1.5 py-0.5 rounded font-bold">{order.toTime.split(' ')[0]}</span>
                {order.toTime.split(' ')[1] && <span className="ml-1 text-[13px] text-gray-500 font-medium">{order.toTime.split(' ')[1]}</span>}
              </div>
            </div>

            <div className="mt-4 text-[14px]">
              <span className="font-bold text-gray-900">{order.specs.split('·')[0].trim()}</span>
              <span className="text-gray-300 mx-1.5 font-bold">·</span>
              <span className="font-bold text-gray-900">{order.specs.split('·')[1].trim()}</span>
              <span className="text-gray-300 mx-1.5 font-bold">·</span>
              <span className="font-bold text-gray-900">{order.specs.split('·')[2].trim()}</span>
              <span className="text-gray-600 ml-1.5">{order.desc}</span>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <div className="text-[13px] text-[#3b5bdb] font-medium flex gap-1">
                <span>{order.payType.split(' ')[0]}</span>
                <span className="text-[#3b5bdb]/30">|</span>
                <span>{order.payType.split(' ')[1]}</span>
              </div>
              <div className="text-[22px] font-extrabold text-gray-900">{order.price}</div>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Floating Button */}
      <div className="fixed bottom-[80px] w-full max-w-[480px] px-5 flex justify-center z-30 pointer-events-none">
        <button className="pointer-events-auto bg-[#f4f7ff]/95 backdrop-blur-sm border border-[#3b5bdb] text-[#3b5bdb] shadow-lg rounded-full py-3.5 px-8 font-bold text-[15px] flex items-center justify-center transition-transform hover:scale-105">
          자동배차 예약하고 오더 선점하기 
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>
    </div>
  );
}
