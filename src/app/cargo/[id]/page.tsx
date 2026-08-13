"use client";
import Link from "next/link";

export default function OrderDetail({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f6] pb-[80px]">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-4 bg-white sticky top-0 z-20">
        <Link href="/cargo" className="text-gray-800">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </Link>
        <span className="text-sm font-medium text-gray-600 cursor-pointer">지도 보기</span>
      </div>

      <div className="bg-white">
        {/* Distance Info */}
        <div className="px-5 py-4 flex items-center border-b border-gray-100">
          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded font-medium mr-2">편도</span>
          <span className="text-[14px] text-gray-600 mr-2">상차지까지 <span className="font-bold text-gray-900">38.4km</span></span>
          <span className="text-gray-300 mx-1">|</span>
          <span className="text-[14px] text-gray-600 ml-1">운송거리 <span className="font-bold text-gray-900">7.7km</span></span>
        </div>

        {/* Route Details */}
        <div className="px-5 pt-6 pb-6 relative">
          <div className="absolute left-[27px] top-[40px] bottom-[100px] w-[1px] border-l-[1.5px] border-dotted border-gray-300"></div>
          
          {/* Start Point */}
          <div className="flex relative mb-8">
            <div className="w-4 h-4 rounded-full border-2 border-gray-400 bg-white mt-1 z-10 flex-shrink-0 mr-3"></div>
            <div className="flex-1">
              <h2 className="text-[19px] font-extrabold text-gray-900 leading-tight">경기 하남시 미사강변중앙로7번안길 25</h2>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="bg-gray-400 text-white text-[11px] px-1.5 py-0.5 rounded font-bold">수</span>
                <span className="bg-[#3b5bdb] text-white text-[11px] px-1.5 py-0.5 rounded font-bold">당상</span>
                <span className="text-[14px] text-gray-700 font-medium">17:40</span>
              </div>
              <div className="mt-3 bg-[#f8f9fa] rounded-lg p-3 text-[14px] text-gray-700 leading-relaxed">
                직접 상차+운반해 주셔야 합니다.<br/>
                하남미사유테크밸리
              </div>
            </div>
          </div>

          {/* End Point */}
          <div className="flex relative">
            <div className="w-4 h-4 rounded-full bg-[#7a42f4] mt-1 z-10 flex-shrink-0 mr-3"></div>
            <div className="flex-1">
              <h2 className="text-[19px] font-extrabold text-gray-900 leading-tight">서울 송파구 올림픽로 424</h2>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="bg-gray-400 text-white text-[11px] px-1.5 py-0.5 rounded font-bold">수</span>
                <span className="bg-[#3b5bdb] text-white text-[11px] px-1.5 py-0.5 rounded font-bold">당착</span>
                <span className="text-[14px] text-gray-700 font-medium">18:50</span>
              </div>
              <div className="mt-3 bg-[#f8f9fa] rounded-lg p-3 text-[14px] text-gray-700 leading-relaxed">
                직접 하차+운반해 주셔야 합니다.<br/>
                올림픽공원 티켓링크라이브아레나
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cargo Spec Table */}
      <div className="px-4 mt-4">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          <div className="flex border-b border-gray-200">
            <div className="w-[80px] bg-[#f8f9fa] p-3 text-sm text-gray-600 border-r border-gray-200 flex items-center justify-center text-center leading-snug">물품정보</div>
            <div className="flex-1 p-3 text-[15px] text-gray-900 leading-relaxed">
              지금 상차 / 스티로폼박스 1개 햇반 4박스 김 4봉지<br/>
              카트 필요
            </div>
          </div>
          <div className="flex border-b border-gray-200">
            <div className="w-[80px] bg-[#f8f9fa] p-3 text-sm text-gray-600 border-r border-gray-200 flex items-center justify-center">물품중량</div>
            <div className="flex-1 p-3 text-[15px] text-gray-900 border-r border-gray-200">0.3톤</div>
            <div className="w-[80px] bg-[#f8f9fa] p-3 text-sm text-gray-600 border-r border-gray-200 flex items-center justify-center">혼적여부</div>
            <div className="flex-1 p-3 text-[15px] text-gray-900">독차</div>
          </div>
          <div className="flex">
            <div className="w-[80px] bg-[#f8f9fa] p-3 text-sm text-gray-600 border-r border-gray-200 flex items-center justify-center">요구차종</div>
            <div className="flex-1 p-3 text-[15px] text-gray-900">다마스</div>
          </div>
        </div>
      </div>

      {/* Price Detail */}
      <div className="px-4 mt-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-1.5 mb-4">
            <span className="bg-gray-100 text-gray-600 text-[11px] px-1.5 py-0.5 rounded font-bold">후불</span>
            <span className="bg-[#f0f4ff] text-[#3b5bdb] text-[11px] px-1.5 py-0.5 rounded font-bold">바로선지급</span>
          </div>

          <div className="flex justify-between items-center mb-3">
            <span className="text-[16px] font-extrabold text-gray-900">업체와 정산할 금액</span>
            <span className="text-[20px] font-extrabold text-gray-900">32,874원</span>
          </div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[14px] text-gray-400">기본운임</span>
            <span className="text-[14px] text-gray-400">21,964원</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <span className="text-[14px] text-gray-400">추가운임(수작업)</span>
            <span className="text-[14px] text-gray-400">10,910원</span>
          </div>

          <div className="flex justify-between items-center mt-4">
            <span className="text-[16px] font-extrabold text-gray-900">공제 금액</span>
            <span className="text-[18px] font-extrabold text-gray-900">0원</span>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 w-full max-w-[480px] flex h-[65px] z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="w-[30%] bg-[#5c5c5c] text-white flex justify-center items-center font-bold text-[18px] cursor-pointer" onClick={() => window.history.back()}>
          닫기
        </div>
        <div className="w-[70%] bg-[#4068e8] text-white flex justify-center items-center font-bold text-[22px] cursor-pointer hover:bg-[#3252c0] transition-colors">
          32,874원 수락
        </div>
      </div>
    </div>
  );
}
