"use client";
import Link from "next/link";
import { useState } from "react";

export default function LocationSettings() {
  const [radius, setRadius] = useState(60);

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f6] pb-[80px]">
      {/* Header */}
      <div className="flex items-center px-4 py-4 bg-white sticky top-0 z-20 border-b border-gray-100">
        <button onClick={() => window.history.back()} className="text-gray-800 mr-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">선호 상하차지 설정</h1>
      </div>

      {/* Notice bar */}
      <div className="bg-[#f4f7ff] px-5 py-3 flex justify-between items-center border-b border-[#d6e2ff]">
        <span className="text-[13px] text-[#3b5bdb]">설정한 지역으로 오더를 추천 중입니다.</span>
        <span className="text-[13px] text-gray-500 font-medium cursor-pointer">더보기</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Loading Point */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[16px] font-extrabold flex items-center gap-1 text-[#3b5bdb]">
              <span>♥</span> 상차지
            </h2>
            <button className="border border-[#3b5bdb] text-[#3b5bdb] px-3 py-1.5 rounded text-[13px] font-bold">
              지역 설정하기
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center text-[15px]">
              <span className="font-bold text-gray-900 w-16">서울</span>
              <span className="text-gray-600">전체</span>
            </div>
            <div className="flex items-center text-[15px]">
              <span className="font-bold text-gray-900 w-16">경기 북</span>
              <span className="text-gray-600">고양시</span>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex justify-between items-end mb-2">
              <span className="font-bold text-gray-900 text-[15px]">현위치 주변 <span className="text-[#3b5bdb]">{radius}km</span></span>
            </div>
            
            {/* Custom Slider */}
            <div className="relative w-full h-2 bg-gray-200 rounded-full mt-4">
              <div 
                className="absolute top-0 left-0 h-full bg-[#3b5bdb] rounded-full" 
                style={{ width: `${(radius / 60) * 100}%` }}
              ></div>
              <input 
                type="range" 
                min="5" 
                max="60" 
                value={radius} 
                onChange={(e) => setRadius(Number(e.target.value))}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 w-5 h-5 bg-white border-2 border-[#3b5bdb] rounded-full shadow-md pointer-events-none"
                style={{ left: `calc(${(radius / 60) * 100}% - 10px)` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-[12px] text-gray-400 mt-2">
              <span>5km</span>
              <span>60km</span>
            </div>
          </div>
        </div>

        {/* Unloading Point */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[16px] font-extrabold flex items-center gap-1 text-[#3b5bdb]">
              <span>♥</span> 하차지
            </h2>
            <button className="border border-[#3b5bdb] text-[#3b5bdb] px-3 py-1.5 rounded text-[13px] font-bold">
              지역 설정하기
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center text-[15px]">
              <span className="font-bold text-gray-900 w-16">서울</span>
              <span className="text-gray-600">전체</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Notice */}
      <div className="px-5 pt-2 pb-6 border-t border-gray-200 mt-4 bg-[#f4f4f6]">
        <h4 className="text-[15px] font-bold text-gray-900 mb-3 mt-4">이용 안내</h4>
        <ul className="text-[13.5px] text-gray-600 space-y-2 pl-4 list-disc marker:text-gray-400 leading-relaxed">
          <li>선호 상하차지를 설정하지 않을 경우, <strong>현위치 주변의 오더</strong>만 추천해 드립니다.</li>
          <li><strong>선호 상하차지를 설정</strong>하면 해당 지역의 오더를 함께 추천해 드립니다.</li>
          <li>선호 상하차지 주변에서 올라온 오더 추천은 주소를 <span className="text-[#3b5bdb] font-bold">♥파란색</span>으로 강조해 보여줍니다.</li>
        </ul>
      </div>
    </div>
  );
}
