import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F4F4F6] pb-8">
      {/* Top Header Section */}
      <div className="px-5 py-4 mt-2">
        <button className="bg-white border border-gray-200 text-gray-800 text-sm font-semibold px-4 py-2 rounded-md shadow-sm">
          오더 그만 받기
        </button>
      </div>

      {/* Balance Section */}
      <div className="px-5 flex justify-between items-end mt-2">
        <h2 className="text-xl font-bold text-gray-900">잔액 0원</h2>
        <span className="text-sm text-gray-500 underline underline-offset-2 decoration-gray-400">
          입출금 내역
        </span>
      </div>

      {/* Unsettled Orders */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-xl p-4 flex justify-between items-center shadow-sm">
          <span className="font-bold text-gray-800">미정산 오더 <span className="text-gray-400 font-normal text-sm ml-1">(최근 90일)</span></span>
          <div className="flex items-center text-[#3b5bdb] font-bold">
            0건
            <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </div>
        </div>
      </div>

      {/* Notice / Events */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800">공지/이벤트</h3>
            <span className="text-xs text-gray-400 flex items-center">
              더보기 
              <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </span>
          </div>
          
          <div className="flex flex-col gap-3">
            {['카카오 T 트럭커 서비스 이용약관 개정 ...', '전남·광주 통합 및 인천 구 개편에 따른 ...', '카카오 T 트럭커 간편정산 서비스 이용...'].map((notice, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="bg-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded font-medium">공지</span>
                <p className="text-sm text-gray-700 truncate flex-1">{notice}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Menus */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-xl shadow-sm flex flex-col">
          {['자주 묻는 질문', '배송 방법 안내', '메뉴 더보기'].map((menu, idx) => (
            <div key={idx} className={`p-4 flex justify-between items-center ${idx !== 2 ? 'border-b border-gray-100' : ''}`}>
              <span className="text-sm font-medium text-gray-800">{menu}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
          ))}
        </div>
      </div>

      {/* Banner */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
          <div className="font-bold text-gray-800 text-sm leading-snug">
            카카오 T 트럭커는<br/>
            다양한 제휴 파트너사들과<br/>
            함께 하고 있습니다
          </div>
          <div className="text-4xl">🤝</div>
        </div>
      </div>
    </div>
  );
}
