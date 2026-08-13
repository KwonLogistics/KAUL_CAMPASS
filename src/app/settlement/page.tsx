export default function Settlement() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa]">
      <div className="flex justify-between items-center px-4 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-900">정산</h1>
        <div className="flex gap-4 text-sm text-gray-600 font-medium cursor-pointer">
          <span>출금신청</span>
          <span>입출금내역</span>
        </div>
      </div>
      
      <div className="px-4 py-3 bg-[#ebebec] mx-4 mt-4 rounded-md flex justify-between items-center">
        <span className="text-sm font-medium text-gray-800 flex items-center cursor-pointer">
          최근 90일 
          <svg className="w-4 h-4 ml-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </span>
        <span className="text-sm text-gray-600">예상 총 수입 <span className="text-[#3b5bdb] font-bold">0원</span></span>
      </div>
      
      <div className="flex justify-end px-4 mt-3">
        <div className="flex items-center cursor-pointer">
          <input type="checkbox" className="w-4 h-4 text-[#3b5bdb] rounded border-gray-300 focus:ring-[#3b5bdb]" />
          <span className="ml-2 text-sm text-gray-600">정산완료 오더 숨기기</span>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center items-center h-[50vh]">
        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">!</div>
        <p className="text-xl font-bold text-gray-900">정산 대상 오더가 없습니다.</p>
      </div>
    </div>
  );
}
