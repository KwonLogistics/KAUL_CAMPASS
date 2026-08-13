"use client";

import { useState } from 'react';

type MenuItem = {
  name: string;
  type: 'link' | 'value' | 'toggle';
  value?: string;
  on?: boolean;
};

export default function Menu() {
  const [showModal, setShowModal] = useState(false);
  const [menuList, setMenuList] = useState<MenuItem[]>([
    { name: '공지/이벤트', type: 'link' },
    { name: '배송방법 안내', type: 'link' },
    { name: '입출금 내역', type: 'value', value: '0원' },
    { name: '출금신청', type: 'link' },
    { name: '차량 수정/등록', type: 'link' },
    { name: '자격 정보 관리', type: 'link' },
    { name: '파트너사 관리', type: 'link' },
    { name: '이메일 및 주소', type: 'link' },
    { name: '이벤트 수신 설정', type: 'link' },
    { name: '추천오더 소리 알림', type: 'toggle', on: false },
    { name: '파트너 오더 소리 알림', type: 'toggle', on: false },
    { name: '라이트 모드', type: 'toggle', on: true },
    { name: '자주 묻는 질문', type: 'link' },
    { name: '고객센터', type: 'link' },
    { name: '이용 약관', type: 'link' },
    { name: '버전정보', type: 'value', value: '2.20.2' },
  ]);

  const handleToggle = (index: number) => {
    setMenuList(prev =>
      prev.map((item, idx) =>
        idx === index && item.type === 'toggle' ? { ...item, on: !item.on } : item
      )
    );
  };

  return (
    <div className="flex flex-col bg-[#f8f9fa] min-h-screen pb-10 relative">
      <div className="px-5 py-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">메뉴</h1>
      </div>
      
      <div className="bg-white px-5 py-6 mb-2">
        <h2 className="text-lg font-bold text-gray-900">홍길동 님</h2>
        <p className="text-gray-500 mt-1">010-1234-5678</p>
      </div>

      <div className="bg-white flex flex-col mb-4">
        {menuList.map((menu, idx) => (
          <div 
            key={idx} 
            onClick={() => menu.type === 'toggle' && handleToggle(idx)}
            className="flex justify-between items-center px-5 py-4 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <span className="text-[15px] font-medium text-gray-800">{menu.name}</span>
            
            {menu.type === 'link' && (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            )}
            
            {menu.type === 'value' && (
              <div className="flex items-center">
                <span className={`text-[15px] font-bold mr-2 ${menu.value === '0원' ? 'text-gray-900' : 'text-gray-400 font-normal'}`}>{menu.value}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
            )}
            
            {menu.type === 'toggle' && (
              <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors ${menu.on ? 'bg-[#3b5bdb]' : 'bg-gray-300'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${menu.on ? 'translate-x-5' : ''}`}></div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-5 py-6 flex justify-center pb-20">
        <button 
          onClick={() => setShowModal(true)}
          className="bg-white border border-gray-200 text-gray-700 text-sm font-medium px-8 py-3 rounded-md shadow-sm w-full max-w-[200px] hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          카카오 T 트럭커 탈퇴하기
        </button>
      </div>

      {/* 안내 팝업 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[320px] shadow-2xl flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">안내</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              죄송합니다 지원하지 않는 서비스입니다
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 bg-[#3b5bdb] hover:bg-[#324ec7] active:bg-[#2b44b0] text-white font-semibold rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

