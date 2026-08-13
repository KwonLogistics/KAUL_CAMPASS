"use client";

import { useAppState } from "@/lib/store/AppStateProvider";
import { spotOrders, pastTrips, TODAY_ISO } from "@/data/mock-data";
import { useState, useMemo } from "react";
import type { ScheduledOrder } from "@/lib/store/schedule-store";
import type { SpotOrder } from "@/data/mock-data";

// 미정산 오더 목업 (시연용으로 자연스러운 왕복콜 구성)
const LOCAL_MOCK_ORDERS: ScheduledOrder[] = [
  {
    order: {
      ...spotOrders[0], 
      pickup: { ...spotOrders[0].pickup, sido: "경기", sigungu: "화성시", time: "09:00" },
      dropoff: { ...spotOrders[0].dropoff, sido: "충북", sigungu: "청주시", time: "12:00" },
    },
    dateISO: TODAY_ISO,
    via: "kakao",
    addedAt: "2026-08-13T08:50:00.000Z",
    settlement: {
      isCompleted: false,
      workMatched: true,
      notInterested: false,
      memo: "",
    }
  },
  {
    order: { 
      ...spotOrders[1], 
      id: "EXT-MOCK1", 
      source: "external",
      pickup: { ...spotOrders[1].pickup, sido: "충북", sigungu: "청주시", time: "14:00" },
      dropoff: { ...spotOrders[1].dropoff, sido: "경기", sigungu: "화성시", time: "17:00" },
    },
    dateISO: TODAY_ISO,
    via: "external",
    addedAt: "2026-08-13T13:30:00.000Z",
    settlement: {
      isCompleted: false,
      workMatched: false,
      notInterested: true,
      memo: "상하차지 대기 2시간 발생함. 다음부터 안 감",
    }
  }
];

// 과거 데이터셋을 기반으로 한 정산 완료 오더 목록
const PAST_COMPLETED_ORDERS: ScheduledOrder[] = pastTrips.map(pt => {
  const pickupParts = pt.route.from.split(' ');
  const dropoffParts = pt.route.to.split(' ');
  
  return {
    order: {
      id: pt.id,
      source: pt.source,
      shipper: pt.shipper,
      pickup: { sido: pickupParts[0], sigungu: pickupParts[1] || "", dong: "", date: "D+0", dateISO: pt.dateISO, time: pt.plannedPickup, manual: pt.manualWork, forklift: !pt.manualWork },
      dropoff: { sido: dropoffParts[0], sigungu: dropoffParts[1] || "", dong: "", date: "D+0", dateISO: pt.dateISO, time: pt.actualDropoff, manual: pt.manualWork, forklift: !pt.manualWork },
      vehicle: pt.vehicle,
      loadOption: "독차",
      distance: { toPickupKm: 0, haulKm: pt.distance.haulKm },
      durationMin: 0,
      fare: pt.fare,
      remarksRaw: pt.remarksRaw,
      conditions: [],
      vehicleFit: { ok: true, reason: "" },
      postedAt: pt.postedAt,
    } as SpotOrder,
    dateISO: pt.dateISO,
    via: pt.source,
    addedAt: pt.acceptedAt,
    settlement: {
      isCompleted: true,
      workMatched: !pt.conditionMismatch,
      notInterested: false,
      memo: pt.mismatchDetail,
    }
  };
});

export default function Settlement() {
  const { scheduled, updateScheduled, hydrated } = useAppState();
  const [hideCompleted, setHideCompleted] = useState(false);
  const [localForms, setLocalForms] = useState<Record<string, any>>({});
  const [submittedLocalIds, setSubmittedLocalIds] = useState<Set<string>>(new Set());

  // 전역 상태에 로컬 목업 및 과거 데이터를 병합
  const combinedOrders = useMemo(() => {
    const map = new Map<string, ScheduledOrder>();
    PAST_COMPLETED_ORDERS.forEach(o => map.set(o.order.id, o));
    LOCAL_MOCK_ORDERS.forEach(o => map.set(o.order.id, o));
    scheduled.forEach(o => map.set(o.order.id, o));
    return Array.from(map.values()).sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  }, [scheduled]);

  // 예상 총 수입 (아직 제출/완료되지 않은 오더들의 합)
  const totalIncome = useMemo(() => {
    return combinedOrders
      .filter(o => {
        const isLocallySubmitted = submittedLocalIds.has(o.order.id);
        const set = localForms[o.order.id] || o.settlement;
        // 로컬 폼 상태가 제출되었거나 기존 상태가 완료면 수입 합계에서 제외
        return !(isLocallySubmitted || set?.isCompleted);
      })
      .reduce((acc, curr) => acc + curr.order.fare.total, 0);
  }, [combinedOrders, localForms, submittedLocalIds]);

  const displayOrders = hideCompleted 
    ? combinedOrders.filter(o => {
        const isLocallySubmitted = submittedLocalIds.has(o.order.id);
        return !(isLocallySubmitted || o.settlement?.isCompleted);
      })
    : combinedOrders;

  const handleLocalUpdate = (id: string, patch: any) => {
    setLocalForms(prev => ({
      ...prev,
      [id]: { ...(prev[id] || combinedOrders.find(o => o.order.id === id)?.settlement || { isCompleted: false, workMatched: true, notInterested: false, memo: "" }), ...patch }
    }));
  };

  const handleSubmit = (id: string) => {
    // 폼에 저장된 상태(또는 기본 상태)를 가져온 뒤, 무조건 정산 완료로 덮어씌워서 전송
    const existing = combinedOrders.find(o => o.order.id === id)?.settlement || { isCompleted: false, workMatched: true, notInterested: false, memo: "" };
    const patch = { ...existing, ...(localForms[id] || {}), isCompleted: true };
    updateScheduled(id, { settlement: patch });
    
    // 목업의 경우 전역 스토어 업데이트가 안 먹힐 수 있으므로 로컬 제출 상태를 추가로 기록
    setSubmittedLocalIds(prev => new Set(prev).add(id));
  };

  if (!hydrated) {
    return <div className="min-h-screen bg-[#f4f4f6]" />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f6] pb-[80px]">
      <div className="flex justify-between items-center px-4 py-4 bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <h1 className="text-lg font-bold text-gray-900">정산 및 피드백</h1>
        <div className="flex gap-4 text-sm text-gray-600 font-medium cursor-pointer">
          <span className="text-[#3b5bdb] font-bold">건별 정산</span>
          <span>입출금내역</span>
        </div>
      </div>
      
      <div className="px-4 py-3 bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <span className="text-sm font-bold text-gray-800 flex items-center cursor-pointer">
          최근 90일 
          <svg className="w-4 h-4 ml-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </span>
        <span className="text-sm text-gray-600 font-medium">예상 총 수입 <span className="text-[#3b5bdb] font-extrabold text-[16px] ml-1">{totalIncome.toLocaleString()}원</span></span>
      </div>
      
      <div className="flex justify-end px-4 mt-4 mb-2">
        <label className="flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={hideCompleted}
            onChange={(e) => setHideCompleted(e.target.checked)}
            className="w-4 h-4 text-[#3b5bdb] rounded border-gray-300 focus:ring-[#3b5bdb]" 
          />
          <span className="ml-2 text-sm text-gray-600 font-bold">정산 완료 오더 숨기기</span>
        </label>
      </div>

      <div className="flex-1 px-4 flex flex-col gap-3">
        {displayOrders.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center h-[50vh]">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-2xl font-bold mb-4">✓</div>
            <p className="text-[15px] font-bold text-gray-700">모든 정산이 완료되었거나 오더가 없습니다.</p>
          </div>
        ) : (
          displayOrders.map(item => {
            const isAlreadySubmitted = item.settlement?.isCompleted === true || submittedLocalIds.has(item.order.id);
            // 폼은 로컬 상태와 기존 상태를 병합하여 보여줌
            const set = localForms[item.order.id] || item.settlement || { isCompleted: false, workMatched: true, notInterested: false, memo: "" };
            
            return (
              <div 
                key={item.order.id} 
                className={`rounded-xl shadow-sm border p-4 transition-colors ${
                  isAlreadySubmitted ? "bg-gray-100 border-gray-200 opacity-70" : "bg-white border-gray-100"
                }`}
              >
                {/* 상단 뱃지 및 상태 */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex gap-1.5 items-center">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      isAlreadySubmitted 
                        ? 'bg-gray-200 text-gray-500' 
                        : (item.via === 'kakao' ? 'bg-[#ffe812] text-[#3c1e1e]' : 'bg-gray-100 text-gray-600')
                    }`}>
                      {item.via === 'kakao' ? '카카오 T' : '외부 오더'}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[11px] font-bold">
                      {item.dateISO}
                    </span>
                    {isAlreadySubmitted && (
                      <span className="text-[11px] font-bold text-[#3b5bdb] ml-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        ✓ 정산 완료
                      </span>
                    )}
                  </div>
                  <div className={`text-[15px] font-extrabold ${isAlreadySubmitted ? 'text-gray-500' : 'text-gray-900'}`}>
                    {item.order.fare.total.toLocaleString()}원
                  </div>
                </div>

                {/* 경로 */}
                <div className={`flex items-center gap-2 text-[14px] font-bold ${isAlreadySubmitted ? 'text-gray-500' : 'text-gray-800'}`}>
                  <span className="truncate">{item.order.pickup.sido} {item.order.pickup.sigungu}</span>
                  <span className="text-gray-300">➔</span>
                  <span className="truncate">{item.order.dropoff.sido} {item.order.dropoff.sigungu}</span>
                </div>

                {/* 정산 완료 후에도 문제가 있던 기록(메모, 차단 여부 등)을 남겨둠 */}
                {isAlreadySubmitted && !set.workMatched && (
                  <div className="mt-3 bg-red-50/50 rounded-lg p-3 border border-red-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      <span className="text-[11px] font-bold text-red-600">
                        조건 불일치로 기록된 오더
                      </span>
                      {set.notInterested && (
                        <span className="ml-auto text-[10px] font-bold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">차단됨</span>
                      )}
                    </div>
                    {set.memo && (
                      <p className="text-[12px] text-gray-600 mt-1 font-medium bg-white p-2 rounded border border-red-50/50">
                        {set.memo}
                      </p>
                    )}
                  </div>
                )}

                {/* 입력 폼 (제출 전인 경우에만 노출) */}
                {!isAlreadySubmitted && (
                  <div className="bg-[#f8f9fa] rounded-lg p-3 flex flex-col gap-3 border border-gray-100 mt-4">
                    {/* 상하차 작업 일치 여부 */}
                    <label className="flex items-center justify-between cursor-pointer border-b border-gray-200 pb-2">
                      <span className="text-[13px] font-bold text-gray-700">사전 상하차 조건과 일치함</span>
                      <input 
                        type="checkbox" 
                        checked={set.workMatched} 
                        onChange={(e) => handleLocalUpdate(item.order.id, { workMatched: e.target.checked })}
                        className="w-5 h-5 accent-[#3b5bdb]"
                      />
                    </label>
                    
                    {/* 불일치 시 신고/메모 영역 */}
                    {!set.workMatched && (
                      <div className="flex flex-col gap-2 mt-1 mb-2">
                        <p className="text-[11px] text-[#e03131] font-bold">
                          {item.via === 'kakao' ? '⚠ 불일치 항목에 대해 카카오에 신고/기록합니다.' : '⚠ 다음 운송을 위해 화주에 대한 메모를 남깁니다.'}
                        </p>
                        
                        <label className="flex items-center gap-1.5 cursor-pointer mb-1">
                          <input 
                            type="checkbox" 
                            checked={set.notInterested} 
                            onChange={(e) => handleLocalUpdate(item.order.id, { notInterested: e.target.checked })}
                            className="accent-[#e03131]"
                          />
                          <span className="text-[12px] font-bold text-gray-700">이 화주(담당자)의 오더 다시 보지 않음</span>
                        </label>

                        <textarea 
                          rows={2}
                          placeholder={item.via === 'kakao' ? "신고 사유를 작성해주세요 (예: 대기 2시간 지연, 수작업 강요)" : "화주 특이사항 메모 (본인만 볼 수 있습니다)"}
                          value={set.memo}
                          onChange={(e) => handleLocalUpdate(item.order.id, { memo: e.target.value })}
                          className="w-full resize-none text-[12px] p-2 border border-gray-300 rounded focus:border-[#3b5bdb] outline-none"
                        />
                      </div>
                    )}

                    <button 
                      onClick={() => handleSubmit(item.order.id)}
                      className="w-full mt-1 bg-[#3b5bdb] text-white font-bold text-[14px] py-2.5 rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors"
                    >
                      정산 완료 확인
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
