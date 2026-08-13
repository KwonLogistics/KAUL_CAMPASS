"use client";
import Link from "next/link";
import { useState } from "react";

export default function SearchSettings() {
  const filterOptions = {
    loadDate: ['당상', '내상', '월상'],
    unloadDate: ['당착', '내착', '월착'],
    payType: ['바로선지급', '선착불', '기타'],
    mixedType: ['독차', '혼적']
  };

  const [selected, setSelected] = useState<{ [key: string]: string[] }>({
    loadDate: [], unloadDate: [], payType: [], mixedType: []
  });

  const toggleFilter = (category: string, option: string) => {
    setSelected(prev => {
      const current = prev[category];
      if (current.includes(option)) {
        return { ...prev, [category]: current.filter(o => o !== option) };
      } else {
        return { ...prev, [category]: [...current, option] };
      }
    });
  };

  const FilterSection = ({ title, category, options }: { title: string, category: string, options: string[] }) => (
    <div className="mb-8">
      <h3 className="text-[15px] font-bold text-gray-800 mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const isSelected = selected[category].includes(opt);
          return (
            <button
              key={opt}
              onClick={() => toggleFilter(category, opt)}
              className={`px-4 py-2 border rounded-md text-[14px] font-medium transition-colors ${
                isSelected ? 'border-[#3b5bdb] text-[#3b5bdb] bg-[#f4f7ff]' : 'border-gray-200 text-gray-700 bg-white'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-white pb-[80px]">
      {/* Header */}
      <div className="flex items-center px-4 py-4 bg-white sticky top-0 z-20 border-b border-gray-100">
        <button onClick={() => window.history.back()} className="text-gray-800 mr-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">검색 설정</h1>
      </div>

      <div className="px-5 py-6">
        <FilterSection title="상차일자" category="loadDate" options={filterOptions.loadDate} />
        <FilterSection title="하차일자" category="unloadDate" options={filterOptions.unloadDate} />
        <FilterSection title="정산유형" category="payType" options={filterOptions.payType} />
        <FilterSection title="혼적여부" category="mixedType" options={filterOptions.mixedType} />
      </div>

      {/* Info Notice */}
      <div className="px-5 pb-6">
        <h4 className="text-[15px] font-bold text-gray-900 mb-2">이용 안내</h4>
        <ul className="text-[14px] text-gray-600 space-y-1.5 pl-4 list-disc marker:text-gray-400">
          <li>설정한 필터는 화물 정보 목록에 반영됩니다.</li>
          <li>톤수는 수락 가능한 범위내에서 노출됩니다.</li>
        </ul>
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 w-full max-w-[480px] bg-white border-t border-gray-200 p-3 flex gap-2 z-30">
        <button 
          className="w-[100px] border border-gray-200 text-gray-800 bg-white font-bold rounded-md py-3 text-[15px]"
          onClick={() => setSelected({ loadDate: [], unloadDate: [], payType: [], mixedType: [] })}
        >
          초기화
        </button>
        <button 
          className="flex-1 bg-[#3b5bdb] text-white font-bold rounded-md py-3 text-[16px]"
          onClick={() => window.history.back()}
        >
          적용하기
        </button>
      </div>
    </div>
  );
}
