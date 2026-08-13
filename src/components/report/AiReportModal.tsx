"use client";

/**
 * 운행 분석 리포트 모달 (ReportModal)
 * - pastTrips 기반 집계 지표 렌더링
 * - 불필요한 필터 축소 액션 제거
 */

import ReportDashboard from "./ReportDashboard";

export default function AiReportModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 mx-auto max-w-[480px] bg-white overflow-y-auto">
      <ReportDashboard onClose={onClose} />
    </div>
  );
}
