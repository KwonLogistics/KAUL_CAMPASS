export default function Menu() {
  const menuList = [
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
  ];

  return (
    <div className="flex flex-col bg-[#f8f9fa] min-h-screen pb-10">
      <div className="px-5 py-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">메뉴</h1>
      </div>
      
      <div className="bg-white px-5 py-6 mb-2">
        <h2 className="text-lg font-bold text-gray-900">홍길동 님</h2>
        <p className="text-gray-500 mt-1">010-1234-5678</p>
      </div>

      <div className="bg-white flex flex-col mb-4">
        {menuList.map((menu, idx) => (
          <div key={idx} className="flex justify-between items-center px-5 py-4 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50">
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
        <button className="bg-white border border-gray-200 text-gray-700 text-sm font-medium px-8 py-3 rounded-md shadow-sm w-full max-w-[200px]">
          카카오 T 트럭커 탈퇴하기
        </button>
      </div>
    </div>
  );
}
