export default function Transport() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa]">
      <div className="flex justify-between items-center px-4 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-900">내 운송</h1>
        <div className="flex items-center cursor-pointer">
          <input type="checkbox" className="w-4 h-4 text-[#3b5bdb] rounded border-gray-300 focus:ring-[#3b5bdb]" defaultChecked />
          <span className="ml-2 text-sm text-gray-600">하차지연 오더 숨기기</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center h-[60vh]">
        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">!</div>
        <p className="text-xl font-bold text-gray-900">운송 내역이 없습니다.</p>
      </div>
    </div>
  );
}
