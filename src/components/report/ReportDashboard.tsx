"use client";

import React, { useState } from "react";
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
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isTomorrowOpen, setIsTomorrowOpen] = useState(false);
  const [isVagueExamplesOpen, setIsVagueExamplesOpen] = useState(false);

  // 도트 그리드 (6 x 7 = 42개)
  // 채운 도트 24개 (30초 이내), 빈 도트 18개 (30초 초과)
  const dots = Array.from({ length: 42 }, (_, i) => i < stats.acceptUnder30Count);

  // 좌우 대비 바 최대 기준값 (대기시간 66분을 100% 기준으로 비율 계산)
  const maxBarValue = 70;

  return (
    <div className="flex flex-col bg-[#f8f9fa] min-h-screen text-gray-900 pb-16">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 px-5 py-4 sticky top-0 z-30 flex justify-between items-center">
        <div>
          <h1 className="text-[17px] font-bold text-gray-900">운행 기록 리포트</h1>
          <p className="text-[12px] text-gray-500 mt-0.5 font-medium">
            기간 {stats.period} · 대상 기사 본인 운행 기록
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

      <div className="p-4 space-y-6 max-w-[480px] mx-auto w-full">
        {/* ① 지난 30일 (과거 분석) */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-2">
            <h2 className="text-[18px] font-bold text-gray-900">지난 30일 기록</h2>
          </div>

          {/* 5-1. 수락까지 걸린 시간 -> 도트 그리드 */}
          <div className="bg-white rounded-xl p-5 border border-gray-200/80 space-y-4">
            <div className="flex justify-between items-baseline">
              <h3 className="text-[15px] font-bold text-gray-900">수락까지 걸린 시간</h3>
              <span className="text-[12px] text-gray-500">
                {stats.totalTrips}건 중 {stats.acceptUnder30Count}건 30초 이내 ({stats.acceptUnder30Pct}%)
              </span>
            </div>

            {/* 도트 그리드 (6행 7열) */}
            <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center">
              <div className="grid grid-cols-7 gap-2.5 my-1">
                {dots.map((isFilled, idx) => (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-[2px] transition-all ${
                      isFilled ? "bg-[#3b5bdb]" : "border border-gray-300 bg-white"
                    }`}
                  />
                ))}
              </div>

              <div className="mt-4 text-center">
                <div className="text-[28px] font-extrabold text-gray-900 tracking-tight">
                  21초
                </div>
                <div className="text-[12px] text-gray-500 mt-0.5">
                  오더가 뜬 뒤 수락까지, 가운데 값
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-gray-200/70 w-full text-[11px] text-gray-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#3b5bdb]"></span>
                  <span>30초 이내 ({stats.acceptUnder30Count})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] border border-gray-300 bg-white"></span>
                  <span>그 이상 ({stats.acceptOver30Count})</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5-2. 조건이 적혀 있던 오더와 아니었던 오더 -> 좌우 대비 바 */}
          <div className="bg-white rounded-xl p-5 border border-gray-200/80 space-y-4">
            <h3 className="text-[15px] font-bold text-gray-900">
              조건이 적혀 있던 오더와 아니었던 오더
            </h3>

            <div className="space-y-4 pt-1">
              {/* 적혀 있던 것 */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[13px] font-medium">
                  <span className="text-gray-900 font-bold">조건이 적혀 있던 오더</span>
                  <span className="text-gray-500 font-mono text-[12px]">{stats.specificCount}건</span>
                </div>

                <div className="space-y-1.5 bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center text-[12px]">
                    <span className="w-10 text-gray-500">지연</span>
                    <div className="flex-1 bg-gray-200 h-4 rounded-xs overflow-hidden mx-2">
                      <div
                        className="bg-[#3b5bdb] h-full rounded-xs"
                        style={{ width: `${(stats.specificAvgDelayMin / maxBarValue) * 100}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono font-bold text-gray-900">
                      {stats.specificAvgDelayMin}분
                    </span>
                  </div>

                  <div className="flex items-center text-[12px]">
                    <span className="w-10 text-gray-500">대기</span>
                    <div className="flex-1 bg-gray-200 h-4 rounded-xs overflow-hidden mx-2">
                      <div
                        className="bg-[#6b7280] h-full rounded-xs"
                        style={{ width: `${(stats.specificAvgWaitMin / maxBarValue) * 100}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono font-bold text-gray-900">
                      {stats.specificAvgWaitMin}분
                    </span>
                  </div>
                </div>
              </div>

              {/* 비어 있거나 모호했던 것 */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[13px] font-medium">
                  <span className="text-gray-900 font-bold">비어 있거나 모호했던 오더</span>
                  <span className="text-gray-500 font-mono text-[12px]">{stats.vagueCount}건</span>
                </div>

                <div className="space-y-1.5 bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center text-[12px]">
                    <span className="w-10 text-gray-500">지연</span>
                    <div className="flex-1 bg-gray-200 h-4 rounded-xs overflow-hidden mx-2">
                      <div
                        className="bg-[#3b5bdb] h-full rounded-xs"
                        style={{ width: `${(stats.vagueAvgDelayMin / maxBarValue) * 100}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono font-bold text-gray-900">
                      {stats.vagueAvgDelayMin}분
                    </span>
                  </div>

                  <div className="flex items-center text-[12px]">
                    <span className="w-10 text-gray-500">대기</span>
                    <div className="flex-1 bg-gray-200 h-4 rounded-xs overflow-hidden mx-2">
                      <div
                        className="bg-[#6b7280] h-full rounded-xs"
                        style={{ width: `${(stats.vagueAvgWaitMin / maxBarValue) * 100}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono font-bold text-gray-900">
                      {stats.vagueAvgWaitMin}분
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 6. 모호 오더 실제 카드 3건 재현 (토글 형식) */}
          <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
            <button
              onClick={() => setIsVagueExamplesOpen(!isVagueExamplesOpen)}
              className="w-full px-5 py-4 text-left text-[14px] font-bold text-gray-800 hover:bg-gray-50 flex justify-between items-center transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span>비어 있거나 모호했던 오더 원문 예시</span>
                <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  3건
                </span>
              </div>
              <span className="text-gray-400 text-[12px] font-bold">
                {isVagueExamplesOpen ? "▴ 접기" : "▾ 보기"}
              </span>
            </button>

            {isVagueExamplesOpen && (
              <div className="px-5 pb-5 pt-1 border-t border-gray-100 space-y-3 bg-gray-50/40">
                {stats.vagueExamples.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-2.5"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {item.date}
                          </span>
                          <span className="text-[14px] font-bold text-gray-900">{item.route}</span>
                        </div>
                        <div className="text-[12px] text-gray-500 mt-1">{item.specs}</div>
                      </div>
                      <span className="text-[15px] font-extrabold text-gray-900">{item.fare}</span>
                    </div>

                    <div className="border-t border-gray-100 pt-2 bg-gray-50/70 p-2.5 rounded-md">
                      <div className="text-[11px] font-bold text-gray-400 mb-1">비고</div>
                      <div className="text-[13px] font-medium text-gray-800 min-h-[20px]">
                        {item.remarks ? (
                          item.remarks
                        ) : (
                          <span className="text-gray-300 italic text-[12px]">(원문 공란)</span>
                        )}
                      </div>
                    </div>

                    <div className="text-[12px] font-medium text-gray-600 border-t border-gray-100 pt-2">
                      {item.actual}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5-3. 수작업 15건 중 5건은 추가운임이 없었습니다 -> 15칸 블록 */}
          <div className="bg-white rounded-xl p-5 border border-gray-200/80 space-y-4">
            <h3 className="text-[15px] font-bold text-gray-900">
              수작업 15건 중 5건은 추가운임이 없었습니다
            </h3>

            {/* 15칸 블록 시각화 */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1 w-full h-7">
                {/* 추가운임 받음 10건 */}
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={`paid-${i}`}
                    className="bg-[#3b5bdb] rounded-[2px] h-full"
                    title="추가운임 받음"
                  />
                ))}
                {/* 관행상 미청구 2건 */}
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={`custom-${i}`}
                    className="bg-gray-300 rounded-[2px] h-full"
                    title="관행상 미청구"
                  />
                ))}
                {/* 조건이 없어서 못 받음 3건 */}
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={`gap-${i}`}
                    className="bg-gray-800 rounded-[2px] h-full"
                    title="조건이 없어서 못 받음"
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200 text-center text-[11px]">
                <div>
                  <span className="inline-block w-2 h-2 rounded-[1px] bg-[#3b5bdb] mr-1"></span>
                  <div className="text-gray-600">추가운임 받음</div>
                  <div className="font-bold text-gray-900 text-[12px]">10건</div>
                </div>
                <div>
                  <span className="inline-block w-2 h-2 rounded-[1px] bg-gray-300 mr-1"></span>
                  <div className="text-gray-600">관행상 미청구</div>
                  <div className="font-bold text-gray-900 text-[12px]">2건</div>
                </div>
                <div>
                  <span className="inline-block w-2 h-2 rounded-[1px] bg-gray-800 mr-1"></span>
                  <div className="text-gray-600">조건 없어서 못 받음</div>
                  <div className="font-bold text-gray-900 text-[12px]">
                    3건 <span className="font-normal text-gray-500 font-mono">(≈ 9만 5천 원)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-gray-200 flex justify-between items-center text-[13px]">
              <span className="text-gray-700">조건이 적혀 있지 않았던 3건 환산 금액</span>
              <span className="font-extrabold text-[16px] text-gray-900 font-mono">
                {stats.estimatedLossFormatted}
              </span>
            </div>

            <p className="text-[11px] text-gray-400 leading-tight">
              * 추가운임을 받은 건의 평균으로 3건을 환산한 값입니다
            </p>
          </div>
        </div>

        {/* ② 다음 오더에서 확인할 것 */}
        <div className="space-y-4 pt-2">
          <div className="border-b border-gray-200 pb-2">
            <h2 className="text-[18px] font-bold text-gray-900">다음 오더에서 확인할 것</h2>
            <p className="text-[13px] text-gray-600 mt-0.5">
              42건 중 10건에서 현장이 달랐습니다 ({stats.mismatchPct}%)
            </p>
          </div>

          {/* 5-4. 불일치 유형 -> 가로 막대 */}
          <div className="bg-white rounded-xl p-5 border border-gray-200/80 space-y-3">
            {stats.mismatchCategories.map((item, idx) => {
              const maxCount = 4;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[13px]">
                    <span className="font-medium text-gray-800">{item.label}</span>
                    <span className="font-mono font-bold text-gray-900">{item.count}건</span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-xs overflow-hidden">
                    <div
                      className="bg-gray-700 h-full rounded-xs"
                      style={{ width: `${(item.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* [ 이 리포트를 읽는 법 ▾ ] (접히는 링크) */}
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

        {/* ③ 참고 — 내일 8/14(금) (하단 접힘 아코디언) */}
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
                <p>내일은 &apos;택배 없는 날&apos;입니다. 주요 택배사의 집화 및 배송 업무가 중단됩니다.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">·</span>
                <p>단, 쿠팡 로켓배송, SSG 쓱배송, 컬리 샛별배송 등 자체 물류망은 정상 운영됩니다.</p>
              </div>
            </div>
          )}
        </div>

        {/* 합성 데이터 캡션 (최하단 필수) */}
        <div className="pt-2 pb-4 text-center">
          <p className="text-[11px] text-gray-400">
            * 본 화면의 수치는 합성 데이터 기준입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
