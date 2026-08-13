"use client";

import React, { useState } from "react";
import { useAppState } from "@/lib/store/AppStateProvider";
import type { AutoDispatchCondition } from "@/lib/types";
import { SIDO_ENUM } from "@/lib/ai/parse-order-schema";

const SIDO_OPTIONS = ["전체", ...SIDO_ENUM];
const RADIUS_OPTIONS = ["지역기준", "내위치 기준"];
const DATE_OPTIONS = ["전체", "당일", "내일", "모레이후"];
const FARE_TYPE_OPTIONS = ["전체", "선착불", "인수증", "카드"];
const LOAD_OPTIONS = ["전체", "독차", "혼적"];
const BODY_OPTIONS = ["전체", "카고", "윙바디", "탑차", "호루", "냉동", "냉장"];
const TON_OPTIONS = ["전체", "1톤", "1.4톤", "2.5톤", "3.5톤", "5톤", "11톤", "25톤"];

export default function AutoDispatchSettingsModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const { settings, updateSettings, hydrated } = useAppState();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  if (!hydrated) return null;

  const conditions = settings.autoDispatchConditions || [];

  const addCondition = () => {
    if (conditions.length >= 10) {
      alert("조건은 최대 10개까지만 추가할 수 있습니다.");
      return;
    }
    const newCondition: AutoDispatchCondition = {
      id: `cond-${Date.now()}`,
      enabled: true,
      pickupSido: "전체",
      pickupSigungu: "전체",
      pickupRadius: "지역기준",
      dropoffSido: "전체",
      dropoffSigungu: "전체",
      minFare: "최소운임",
      pickupDate: "전체",
      dropoffDate: "전체",
      fareType: "전체",
      loadOption: "전체",
      bodyType: "전체",
      ton: "전체",
    };
    updateSettings({ autoDispatchConditions: [...conditions, newCondition] });
  };

  const removeCondition = (id: string) => {
    updateSettings({
      autoDispatchConditions: conditions.filter((c) => c.id !== id),
    });
  };

  const toggleCondition = (id: string) => {
    updateSettings({
      autoDispatchConditions: conditions.map((c) =>
        c.id === id ? { ...c, enabled: !c.enabled } : c
      ),
    });
  };

  const updateConditionField = <K extends keyof AutoDispatchCondition>(
    id: string,
    field: K,
    value: AutoDispatchCondition[K]
  ) => {
    updateSettings({
      autoDispatchConditions: conditions.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    });
  };

  const handleGenerateAI = async (mock: boolean) => {
    if (conditions.length >= 10) {
      alert("조건은 최대 10개까지만 추가할 수 있습니다.");
      return;
    }
    if (!mock && !prompt.trim()) {
      alert("조건을 설명하는 텍스트를 입력해주세요.");
      return;
    }

    setIsGenerating(true);
    try {
      // Mocked current location for demo purposes
      const currentLocation = "서울 강남구"; 
      
      const res = await fetch("/api/auto-dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt, 
          mock,
          context: {
            currentTime: new Date().toLocaleString("ko-KR", { hour12: false }),
            currentLocation,
            dayStart: settings.dayStart || "",
            dayEnd: settings.dayEnd || "",
          }
        }),
      });
      const data = await res.json();
      
      if (data.ok && data.condition) {
        const aiCondition: AutoDispatchCondition = {
          ...data.condition,
          id: `ai-${Date.now()}`,
          enabled: true,
        };
        updateSettings({ autoDispatchConditions: [...conditions, aiCondition] });
        setPrompt("");
      } else {
        alert(data.error || "생성에 실패했습니다.");
      }
    } catch (e) {
      alert("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] mx-auto flex w-full max-w-[480px] flex-col bg-[#f4f4f6]">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="text-xl leading-none">
            ←
          </button>
          <h2 className="text-lg font-bold text-gray-900">원터치배차 검색설정</h2>
        </div>
        <button className="bg-[#3b5bdb] text-white px-3 py-1.5 text-sm font-bold rounded">
          배차이력
        </button>
      </div>

      {/* AI Prompt Input */}
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="text-[13px] font-bold text-[#3b5bdb] mb-2">✨ AI 조건 자동 생성</div>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="예: 내일 부산으로 가는 5톤 혼적 오더 잡아줘"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-2 focus:outline-none focus:border-[#3b5bdb]"
          disabled={isGenerating}
        />
        <div className="flex gap-2">
          <button
            onClick={() => handleGenerateAI(false)}
            disabled={isGenerating || !prompt.trim()}
            className="flex-1 bg-[#3b5bdb] text-white py-2 rounded text-[13px] font-bold disabled:opacity-50"
          >
            {isGenerating ? "생성 중..." : "AI로 조건 생성"}
          </button>
          <button
            onClick={() => handleGenerateAI(true)}
            disabled={isGenerating}
            className="flex-1 bg-[#f4f7ff] border border-[#3b5bdb] text-[#3b5bdb] py-2 rounded text-[13px] font-bold disabled:opacity-50"
          >
            목업으로 빠르게 생성
          </button>
        </div>
      </div>

      {/* Condition List */}
      <div className="flex-1 overflow-y-auto p-2 pb-[80px]">
        {conditions.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            설정된 조건이 없습니다.<br/>
            새 조건을 추가하거나 AI로 생성해보세요.
          </div>
        ) : (
          conditions.map((cond, index) => (
            <div key={cond.id} className="bg-white border border-gray-200 rounded-sm mb-3 shadow-sm">
              {/* Card Header */}
              <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-[#f9f9f9]">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={cond.enabled}
                    onChange={() => toggleCondition(cond.id)}
                    className="w-4 h-4 accent-[#3b5bdb]"
                  />
                  <button className="text-gray-400 hover:text-gray-600">✎</button>
                </div>
                <div className="font-bold text-[13px] text-gray-700">{index + 1}번째</div>
                <button
                  onClick={() => removeCondition(cond.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  🗑
                </button>
              </div>
              
              {/* Card Body */}
              <div className="flex">
                {/* 복사 버튼 영역 */}
                <div className="w-[40px] bg-[#3b5bdb] text-white flex flex-col items-center justify-center text-[10px] font-bold cursor-pointer">
                  <span className="text-base mb-1">📄</span>
                  복사
                </div>
                
                {/* 그리드 영역 */}
                <div className="flex-1 flex flex-col text-[12px] text-gray-600">
                  {/* Row 1: 상 */}
                  <div className="flex border-b border-gray-100">
                    <div className="w-[30px] bg-[#f4f7ff] flex items-center justify-center font-bold border-r border-gray-100">상</div>
                    <div className="flex-1 border-r border-gray-100 flex">
                      <select 
                        value={cond.pickupSido} 
                        onChange={(e) => updateConditionField(cond.id, "pickupSido", e.target.value)}
                        className="w-full bg-transparent outline-none px-2 py-1.5 cursor-pointer appearance-none"
                      >
                        {SIDO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 border-r border-gray-100 flex">
                      <input 
                        type="text" 
                        value={cond.pickupSigungu}
                        onChange={(e) => updateConditionField(cond.id, "pickupSigungu", e.target.value)}
                        placeholder="구/군 전체"
                        className="w-full bg-transparent outline-none px-2 py-1.5"
                      />
                    </div>
                    <div className="flex-1 flex">
                      <select 
                        value={cond.pickupRadius} 
                        onChange={(e) => updateConditionField(cond.id, "pickupRadius", e.target.value)}
                        className="w-full bg-transparent outline-none px-2 py-1.5 cursor-pointer appearance-none"
                      >
                        {RADIUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  {/* Row 2: 하 */}
                  <div className="flex border-b border-gray-100">
                    <div className="w-[30px] bg-[#f4f7ff] flex items-center justify-center font-bold border-r border-gray-100">하</div>
                    <div className="flex-1 border-r border-gray-100 flex">
                      <select 
                        value={cond.dropoffSido} 
                        onChange={(e) => updateConditionField(cond.id, "dropoffSido", e.target.value)}
                        className="w-full bg-transparent outline-none px-2 py-1.5 cursor-pointer appearance-none"
                      >
                        {SIDO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 border-r border-gray-100 flex">
                      <input 
                        type="text" 
                        value={cond.dropoffSigungu}
                        onChange={(e) => updateConditionField(cond.id, "dropoffSigungu", e.target.value)}
                        placeholder="구/군 전체"
                        className="w-full bg-transparent outline-none px-2 py-1.5"
                      />
                    </div>
                    <div className="flex-1 flex">
                      <input 
                        type="text" 
                        value={cond.minFare}
                        onChange={(e) => updateConditionField(cond.id, "minFare", e.target.value)}
                        placeholder="최소운임"
                        className="w-full bg-transparent outline-none px-2 py-1.5 text-[#f05c2a] font-bold"
                      />
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="flex border-b border-gray-100">
                    <div className="flex-1 border-r border-gray-100 flex">
                      <select 
                        value={cond.pickupDate} 
                        onChange={(e) => updateConditionField(cond.id, "pickupDate", e.target.value)}
                        className="w-full bg-transparent outline-none px-2 py-1.5 cursor-pointer appearance-none"
                      >
                        {DATE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 border-r border-gray-100 flex">
                      <select 
                        value={cond.dropoffDate} 
                        onChange={(e) => updateConditionField(cond.id, "dropoffDate", e.target.value)}
                        className="w-full bg-transparent outline-none px-2 py-1.5 cursor-pointer appearance-none"
                      >
                        {DATE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 flex">
                      <select 
                        value={cond.fareType} 
                        onChange={(e) => updateConditionField(cond.id, "fareType", e.target.value)}
                        className="w-full bg-transparent outline-none px-2 py-1.5 cursor-pointer appearance-none"
                      >
                        {FARE_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Row 4 */}
                  <div className="flex">
                    <div className="flex-1 border-r border-gray-100 flex">
                      <select 
                        value={cond.loadOption} 
                        onChange={(e) => updateConditionField(cond.id, "loadOption", e.target.value)}
                        className="w-full bg-transparent outline-none px-2 py-1.5 cursor-pointer appearance-none"
                      >
                        {LOAD_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 border-r border-gray-100 flex">
                      <select 
                        value={cond.bodyType} 
                        onChange={(e) => updateConditionField(cond.id, "bodyType", e.target.value)}
                        className="w-full bg-transparent outline-none px-2 py-1.5 cursor-pointer appearance-none"
                      >
                        {BODY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 flex">
                      <select 
                        value={cond.ton} 
                        onChange={(e) => updateConditionField(cond.id, "ton", e.target.value)}
                        className="w-full bg-transparent outline-none px-2 py-1.5 cursor-pointer appearance-none"
                      >
                        {TON_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {conditions.length < 10 && (
          <button
            onClick={addCondition}
            className="w-full py-3 mt-2 border border-dashed border-gray-300 rounded text-gray-500 font-bold text-sm hover:bg-gray-50"
          >
            + 수동으로 새 조건 추가하기 ({conditions.length}/10)
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 w-full bg-[#3b5bdb] text-white text-center py-4 font-bold text-[16px] cursor-pointer">
        원터치배차 등록하기
      </div>
    </div>
  );
}
