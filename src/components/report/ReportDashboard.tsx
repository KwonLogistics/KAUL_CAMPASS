"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getReportStats, type ReportStats } from "@/lib/report";

interface ReportDashboardProps {
  stats?: ReportStats;
  onClose?: () => void;
}

export default function ReportDashboard({
  stats: customStats,
  onClose,
}: ReportDashboardProps) {
  const stats = customStats || getReportStats();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"sectionA" | "sectionB">("sectionA");
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isTomorrowOpen, setIsTomorrowOpen] = useState(false);
  const [isWaitDetailOpen, setIsWaitDetailOpen] = useState(false);
  const [isOrderRawDetailsOpen, setIsOrderRawDetailsOpen] = useState(false);

  const sectionARef = useRef<HTMLDivElement>(null);
  const sectionBRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (section: "sectionA" | "sectionB") => {
    setActiveTab(section);
    if (section === "sectionA" && sectionARef.current) {
      sectionARef.current.scrollIntoView({ behavior: "smooth" });
    } else if (section === "sectionB" && sectionBRef.current) {
      sectionBRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const openPreferredRegionSettings = () => {
    if (onClose) onClose();
    router.push("/settings/location");
  };

  // 6행 x 7열 도트 그리드 (42개: 채운 것 24개, 빈 것 18개)
  const dots = Array.from({ length: 42 }, (_, i) => i < stats.acceptUnder30Count);

  // 수평 막대 계산 기준
  const maxDelayWait = 70; // 66분 기준
  const maxLocationCount = 30; // 30건 기준

  return (
    <div className="flex flex-col bg-[#f8f9fa] min-h-screen text-gray-900 pb-20">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 px-5 py-4 sticky top-0 z-30 flex justify-between items-center">
        <div>
          <h1 className="text-[17px] font-bold text-gray-900">운행 리포트</h1>
          <p className="text-[12px] text-gray-500 mt-0.5 font-medium tabular-nums">
            {stats.period} · {stats.totalTrips}건
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-2xl font-light transition-colors cursor-pointer"
            aria-label="닫기"
          >
            ×
          </button>
        )}
      </div>

      {/* Section Anchor Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 sticky top-[69px] z-20 flex gap-2">
        <button
          onClick={() => scrollToSection("sectionA")}
          className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === "sectionA"
              ? "bg-[#f4f7ff] text-[#3b5bdb] border border-[#d6e2ff]"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          지난 30일
        </button>
        <button
          onClick={() => scrollToSection("sectionB")}
          className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === "sectionB"
              ? "bg-[#f4f7ff] text-[#3b5bdb] border border-[#d6e2ff]"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          다음 오더를 위해
        </button>
      </div>

      <div className="p-4 space-y-8 max-w-[480px] mx-auto w-full">
        {/* ========================================================= */}
        {/* [섹션 A] 지난 30일 */}
        {/* ========================================================= */}
        <section ref={sectionARef} className="space-y-5">
          <div className="border-b border-gray-200 pb-2">
            <h2 className="text-[17px] font-extrabold text-gray-900">지난 30일</h2>
          </div>

          {/* 블록 1. 수락까지 걸린 시간 */}
          <div className="bg-white rounded-xl p-5 border border-gray-200/80 space-y-4">
            <h3 className="text-[14px] font-bold text-gray-900">수락까지 걸린 시간</h3>

            <div className="bg-gray-50 p-5 rounded-lg flex flex-col items-center">
              <div className="text-[32px] font-extrabold text-gray-900 tracking-tight tabular-nums">
                21초
              </div>
              <div className="text-[12px] text-gray-500 mt-0.5 mb-4">
                오더가 뜬 뒤 수락까지, 가운데 값
              </div>

              {/* 6행 x 7열 도트 그리드 */}
              <div className="grid grid-cols-7 gap-2.5 my-2">
                {dots.map((isFilled, idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-[2px] ${
                      isFilled ? "bg-[#3b5bdb]" : "border border-gray-300 bg-white"
                    }`}
                  />
                ))}
              </div>

              <div className="mt-4 text-[13px] font-medium text-gray-700 text-center">
                42건 중 24건을 30초 안에 결정했습니다
              </div>
            </div>
          </div>

          {/* 통합 블록 2 & 3. 조건과 결과 분석 */}
          <div className="bg-white rounded-xl p-5 border border-gray-200/80 space-y-6">
            {/* 상단: 오더 사전 정보 안내 유무 */}
            <div className="space-y-3">
              <h3 className="text-[14px] font-bold text-gray-900 leading-snug">
                오더 사전 정보 안내 유무
              </h3>

              {/* 수평 막대 2쌍 */}
              <div className="space-y-3 pt-1">
                {/* 사전에 파악 가능했던 오더 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-gray-900 font-bold">사전에 파악 가능했던 오더</span>
                    <span className="text-gray-500 tabular-nums text-[12px]">{stats.specificCount}건</span>
                  </div>

                  <div className="space-y-1.5 bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center text-[12px]">
                      <span className="w-10 text-gray-500">지연</span>
                      <div className="flex-1 bg-gray-200 h-3.5 rounded-xs overflow-hidden mx-2">
                        <div
                          className="bg-[#3b5bdb] h-full rounded-xs"
                          style={{ width: `${(stats.specificAvgDelayMin / maxDelayWait) * 100}%` }}
                        />
                      </div>
                      <span className="w-12 text-right font-mono font-bold text-gray-900 tabular-nums">
                        {stats.specificAvgDelayMin}분
                      </span>
                    </div>

                    <div className="flex items-center text-[12px]">
                      <span className="w-10 text-gray-500">대기</span>
                      <div className="flex-1 bg-gray-200 h-3.5 rounded-xs overflow-hidden mx-2">
                        <div
                          className="bg-gray-600 h-full rounded-xs"
                          style={{ width: `${(stats.specificAvgWaitMin / maxDelayWait) * 100}%` }}
                        />
                      </div>
                      <span className="w-12 text-right font-mono font-bold text-gray-900 tabular-nums">
                        {stats.specificAvgWaitMin}분
                      </span>
                    </div>
                  </div>
                </div>

                {/* 현장에서 확인해야 했던 오더 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-gray-900 font-bold">현장에서 확인해야 했던 오더</span>
                    <span className="text-gray-500 tabular-nums text-[12px]">{stats.vagueCount}건</span>
                  </div>

                  <div className="space-y-1.5 bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center text-[12px]">
                      <span className="w-10 text-gray-500">지연</span>
                      <div className="flex-1 bg-gray-200 h-3.5 rounded-xs overflow-hidden mx-2">
                        <div
                          className="bg-[#3b5bdb] h-full rounded-xs"
                          style={{ width: `${(stats.vagueAvgDelayMin / maxDelayWait) * 100}%` }}
                        />
                      </div>
                      <span className="w-12 text-right font-mono font-bold text-gray-900 tabular-nums">
                        {stats.vagueAvgDelayMin}분
                      </span>
                    </div>

                    <div className="flex items-center text-[12px]">
                      <span className="w-10 text-gray-500">대기</span>
                      <div className="flex-1 bg-gray-200 h-3.5 rounded-xs overflow-hidden mx-2">
                        <div
                          className="bg-gray-600 h-full rounded-xs"
                          style={{ width: `${(stats.vagueAvgWaitMin / maxDelayWait) * 100}%` }}
                        />
                      </div>
                      <span className="w-12 text-right font-mono font-bold text-gray-900 tabular-nums">
                        {stats.vagueAvgWaitMin}분
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 중단: 수작업 15건 중 5건은 추가운임이 없었습니다 */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <h3 className="text-[14px] font-bold text-gray-900">
                수작업 15건 중 5건은 추가운임이 없었습니다
              </h3>

              {/* 15칸 블록 한 줄 */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1 w-full h-7">
                  {/* 추가운임 받음 10건 */}
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={`paid-${i}`}
                      className="bg-[#3b5bdb] rounded-[2px] h-full"
                      title="추가운임 받음 (10건)"
                    />
                  ))}
                  {/* 관행상 미청구 2건 */}
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div
                      key={`custom-${i}`}
                      className="bg-gray-300 rounded-[2px] h-full"
                      title="관행상 미청구 (2건)"
                    />
                  ))}
                  {/* 조건이 없어서 못 받음 3건 */}
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={`gap-${i}`}
                      className="bg-gray-800 rounded-[2px] h-full"
                      title="조건이 없어서 못 받음 (3건)"
                    />
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200 text-center text-[11px]">
                  <div>
                    <span className="inline-block w-2 h-2 rounded-[1px] bg-[#3b5bdb] mr-1"></span>
                    <div className="text-gray-600">추가운임 받음</div>
                    <div className="font-bold text-gray-900 text-[12px] tabular-nums">10건</div>
                  </div>
                  <div>
                    <span className="inline-block w-2 h-2 rounded-[1px] bg-gray-300 mr-1"></span>
                    <div className="text-gray-600">관행상 미청구</div>
                    <div className="font-bold text-gray-900 text-[12px] tabular-nums">2건</div>
                  </div>
                  <div>
                    <span className="inline-block w-2 h-2 rounded-[1px] bg-gray-800 mr-1"></span>
                    <div className="text-gray-600">조건이 없어서 못 받음</div>
                    <div className="font-bold text-gray-900 text-[12px] tabular-nums">3건</div>
                  </div>
                </div>
              </div>

              {/* 손실 환산액 */}
              <div className="text-center py-2 bg-gray-50/60 rounded-lg">
                <div className="text-[26px] font-extrabold text-gray-900 tracking-tight">
                  약 9만 5천 원
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  * 추가운임을 받은 건의 평균으로 3건을 환산한 값입니다
                </p>
              </div>
            </div>

            {/* 하단: '현장에서 확인해야 했던 오더' 정보 격차 대표 사례 카드 토글 */}
            <div className="border-t border-gray-100 pt-3">
              <button
                onClick={() => setIsOrderRawDetailsOpen(!isOrderRawDetailsOpen)}
                className="w-full p-3.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 flex justify-between items-center text-[13px] font-bold text-gray-800 transition-colors cursor-pointer"
              >
                <span>현장에서 확인해야 했던 오더 대표 사례 (3건)</span>
                <span className="text-[12px] text-gray-400 font-bold">
                  {isOrderRawDetailsOpen ? "▴ 접기" : "▾ 보기"}
                </span>
              </button>

              {isOrderRawDetailsOpen && (
                <div className="mt-3.5 space-y-3 pt-1">
                  {stats.infoGapCases.map((c, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-3"
                    >
                      {/* 카드 헤더: 사례 태그 & 기본 노선 정보 */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-[#3b5bdb] bg-[#eff6ff] px-2 py-0.5 rounded">
                              {c.tag}
                            </span>
                            <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded tabular-nums">
                              {c.date}
                            </span>
                          </div>
                          <div className="text-[14px] font-bold text-gray-900 mt-1.5">
                            {c.route}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            {c.vehicle}
                          </div>
                        </div>
                        <span className="text-[14px] font-extrabold text-gray-900 tabular-nums">
                          {c.fare}
                        </span>
                      </div>

                      {/* [오더 원문] vs [현장 결과] 대조 레이아웃 */}
                      <div className="grid grid-cols-1 gap-2 pt-1">
                        {/* 오더 원문 */}
                        <div className="bg-gray-50 border border-gray-200/80 rounded-lg p-2.5">
                          <div className="text-[11px] font-bold text-gray-400 mb-0.5">
                            오더 원문 (비고)
                          </div>
                          <div className="text-[12px] font-medium text-gray-800">
                            {c.remarks ? (
                              `"${c.remarks}"`
                            ) : (
                              <span className="text-gray-400 italic">(원문 공란)</span>
                            )}
                          </div>
                        </div>

                        {/* 현장 결과 */}
                        <div className="bg-[#fdf8f6] border border-[#fbdcd0]/70 rounded-lg p-2.5">
                          <div className="text-[11px] font-bold text-[#c2410c] mb-0.5">
                            현장 결과
                          </div>
                          <div className="text-[12px] font-medium text-gray-800">
                            {c.result}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* 사례 하단 팩트 문구 */}
                  <div className="pt-2 text-center">
                    <p className="text-[11px] text-gray-500 font-medium">
                      * 이처럼 오더 원문이 비어 있거나 모호했던 9건 중 5건에서 현장 불일치가 발생했습니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* [섹션 B] 다음 오더를 위해 */}
        {/* ========================================================= */}
        <section ref={sectionBRef} className="space-y-5 pt-2">
          <div className="border-b border-gray-200 pb-2">
            <h2 className="text-[17px] font-extrabold text-gray-900">다음 오더를 위해</h2>
          </div>

          {/* 블록 4. 확인할 것 */}
          <div className="bg-white rounded-xl p-5 border border-gray-200/80 space-y-4">
            <div>
              <h3 className="text-[14px] font-bold text-gray-900">확인할 것</h3>
              <p className="text-[12px] text-gray-500 mt-0.5 tabular-nums">
                42건 중 10건에서 현장이 달랐습니다
              </p>
            </div>

            {/* 가로 막대 */}
            <div className="space-y-3">
              {stats.mismatchCategories.map((item, idx) => {
                const maxCount = 4;
                const isWaitItem = item.label.includes("대기 시간");
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-[13px] items-center">
                      <span className="font-medium text-gray-800">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-900 tabular-nums">
                          {item.count}
                        </span>
                        {isWaitItem && (
                          <button
                            onClick={() => setIsWaitDetailOpen(!isWaitDetailOpen)}
                            className="text-[11px] text-[#3b5bdb] font-bold hover:underline cursor-pointer"
                          >
                            {isWaitDetailOpen ? "접기" : "원문 보기"}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-xs overflow-hidden">
                      <div
                        className="bg-gray-700 h-full rounded-xs"
                        style={{ width: `${(item.count / maxCount) * 100}%` }}
                      />
                    </div>

                    {/* 대기 시간 정량 표기 없음 3건 펼침 */}
                    {isWaitItem && isWaitDetailOpen && (
                      <div className="mt-2.5 p-3 rounded-lg bg-gray-50 border border-gray-200 text-[12px] space-y-2">
                        {stats.waitTimeNoSpecTrips.map((trip, tIdx) => (
                          <div key={tIdx} className="flex justify-between text-gray-700 pb-1 border-b border-gray-200 last:border-b-0 last:pb-0">
                            <div>
                              <span className="font-bold mr-1.5 tabular-nums">{trip.date}</span>
                              <span>{trip.route}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-gray-900 mr-2">{trip.duration}</span>
                              <span className="text-gray-500 italic">{trip.raw}</span>
                            </div>
                          </div>
                        ))}
                        <div className="text-[11px] text-gray-500 pt-1 text-center font-medium">
                          세 건 모두 오더에 시간이 적혀 있지 않았습니다
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 블록 5. 내 선호지역 설정이 놓치고 있는 것 (신규) */}
          <div className="bg-white rounded-xl p-5 border border-gray-200/80 space-y-4">
            <h3 className="text-[14px] font-bold text-gray-900 leading-snug">
              내 선호지역 설정이 놓치고 있는 것
            </h3>

            {/* 현재 설정 정보 */}
            <div className="bg-gray-50 p-3.5 rounded-lg text-[12px] space-y-1">
              <div className="text-gray-500 font-bold">
                현재 설정 <span className="text-gray-800 font-medium">화성 향남 반경 30km</span>
              </div>
              <div className="text-gray-700">
                {stats.preferredCities.join(" · ")}
              </div>
            </div>

            {/* 지난 30일 상차지 수평 막대 2개 */}
            <div className="space-y-3 pt-1">
              <div className="text-[12px] font-bold text-gray-700">지난 30일 상차지</div>

              <div className="space-y-2">
                <div className="flex items-center text-[12px]">
                  <span className="w-14 text-gray-600 font-medium">설정 안</span>
                  <div className="flex-1 bg-gray-100 h-4 rounded-xs overflow-hidden mx-2">
                    <div
                      className="bg-gray-400 h-full rounded-xs"
                      style={{ width: `${(stats.insideCount / maxLocationCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-28 text-right font-mono font-bold text-gray-900 tabular-nums">
                    {stats.insideCount}건 · {stats.insideFareText}
                  </span>
                </div>

                <div className="flex items-center text-[12px]">
                  <span className="w-14 text-gray-600 font-medium">설정 밖</span>
                  <div className="flex-1 bg-gray-100 h-4 rounded-xs overflow-hidden mx-2">
                    <div
                      className="bg-[#3b5bdb] h-full rounded-xs"
                      style={{ width: `${(stats.outsideCount / maxLocationCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-28 text-right font-mono font-bold text-gray-900 tabular-nums">
                    {stats.outsideCount}건 · {stats.outsideFareText}
                  </span>
                </div>
              </div>
            </div>

            {/* 설정 밖에서 자주 상차한 곳 */}
            <div className="border-t border-gray-100 pt-3 space-y-1 text-[12px]">
              <div className="text-gray-500 font-bold">설정 밖에서 자주 상차한 곳</div>
              <div className="text-gray-800 font-medium">
                {stats.outsideTopCities
                  .map((c) => `${c.city} ${c.count}회`)
                  .join(" · ")}
              </div>
            </div>

            {/* 보조 요소: 가장 자주 뛴 구간 */}
            <div className="border-t border-gray-100 pt-3 space-y-1 text-[12px]">
              <div className="text-gray-500 font-bold">가장 자주 뛴 구간</div>
              <div className="text-gray-800 font-medium tabular-nums">
                {stats.mostFrequentRoute.from} → {stats.mostFrequentRoute.to}{" "}
                {stats.mostFrequentRoute.count}회 · 평균 대기 {stats.mostFrequentRoute.avgWaitMin}분 · 평균 운임 {stats.mostFrequentRoute.avgFare.toLocaleString()}원
              </div>
            </div>

            {/* 선호지역 설정 열기 버튼 */}
            <div className="pt-2">
              <button
                onClick={openPreferredRegionSettings}
                className="w-full py-3 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-800 font-bold rounded-lg text-[13px] transition-colors cursor-pointer shadow-2xs"
              >
                선호지역 설정 열기
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 접힘 블록: 이 리포트를 읽는 법 */}
        {/* ========================================================= */}
        <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
          <button
            onClick={() => setIsGuideOpen(!isGuideOpen)}
            className="w-full px-5 py-3.5 text-left text-[13px] font-bold text-gray-700 hover:bg-gray-50 flex justify-between items-center transition-colors cursor-pointer"
          >
            <span>이 리포트를 읽는 법</span>
            <span className="text-gray-400 text-[12px]">{isGuideOpen ? "▴" : "▾"}</span>
          </button>

          {isGuideOpen && (
            <div className="px-5 pb-4 pt-1 border-t border-gray-100 text-[12px] text-gray-600 space-y-2 leading-relaxed bg-gray-50/50">
              <div className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">·</span>
                <p>조건 배지는 화주가 쓴 원문에서 뽑은 것입니다. 근거 구절을 눌러 확인할 수 있습니다.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">·</span>
                <p>차량 요건이 맞지 않는 오더도 목록에 그대로 남습니다. 회색으로 표시되고 사유가 붙습니다.</p>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 접힘 블록: 참고 — 내일 8/14(금) */}
        {/* ========================================================= */}
        <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
          <button
            onClick={() => setIsTomorrowOpen(!isTomorrowOpen)}
            className="w-full px-5 py-3.5 text-left text-[13px] font-bold text-gray-700 hover:bg-gray-50 flex justify-between items-center transition-colors cursor-pointer"
          >
            <span>참고 — 내일 8/14(금)</span>
            <span className="text-gray-400 text-[12px]">{isTomorrowOpen ? "▴" : "▾"}</span>
          </button>

          {isTomorrowOpen && (
            <div className="px-5 pb-4 pt-1 border-t border-gray-100 text-[12px] text-gray-700 space-y-2 leading-relaxed bg-gray-50/50">
              <div className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">·</span>
                <p>내일 8/14(금)은 &apos;택배 없는 날&apos;입니다. 주요 택배사의 집화·배송이 중단됩니다.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">·</span>
                <p>쿠팡 로켓배송, SSG 쓱배송, 컬리 샛별배송 등 자체 물류망은 정상 운영됩니다.</p>
              </div>
            </div>
          )}
        </div>

        {/* 하단 캡션 */}
        <div className="pt-2 pb-4 text-center">
          <p className="text-[11px] text-gray-400">
            본 화면의 수치는 합성 데이터 기준입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
