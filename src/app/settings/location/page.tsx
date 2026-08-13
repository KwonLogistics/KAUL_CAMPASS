"use client";

/**
 * ⚠️ 소유: 순범. 선호 지역 설정.
 *
 * 이 화면에는 축이 두 개다. 섞이면 기사가 무엇을 고르는지 모른다.
 *   ① 오더 축 — 선호 상차지 / 하차지 : 「어떤 오더를 목록에서 볼까」 (원래 앱, 여러 곳, 목록 필터)
 *   ② 하루 축 — "나의 하루 동선"(선호 출발지 / 복귀점) : 「언제·어느 방향이 나에게 유리한가」
 *      (우리가 더한 것, 한 곳씩, 목록은 안 줄이고 화물 정보 탭 「추천순」 정렬 순서만 바꾼다)
 *
 * ★ 이름을 "하루의 시작과 끝"에서 "나의 하루 동선"으로 바꿨다 — "시작과 끝"은 그 값이
 *   어디에 쓰이는지 안 드러난다. "동선"은 방향·경로 개념이라 「추천순」 정렬(시간대별
 *   방향 우대)과 나중에 나올 자동배차 추천의 기준이라는 게 이름에서부터 짐작이 간다.
 *
 * ★ ②의 두 값은 색과 아이콘으로 갈라 놓는다 — 초록 「출발」, 보라 「복귀」.
 *   위의 경로 띠가 둘의 관계를 한 눈에 보여주므로 설명 문장을 길게 쓰지 않는다.
 *   더 필요한 사람만 ! 을 눌러서 한 줄을 편다.
 * ★ 지역을 고르는 화면은 네 군데가 <RegionPicker> 하나를 같이 쓴다. 원래 앱의
 *   「상차지 설정」 화면 그대로다 — 시도 줄 → 펼치면 3열 시군구 표 → 초기화·저장하기.
 * ★ 값은 useAppState() 하나에만 쓴다. 이 화면에 별도 상태를 두지 않는다 —
 *   동의의 AI 리포트 [이 노선을 내 운행 구간으로 설정하기]가 dayStart/dayEnd 를 같이 쓴다.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/store/AppStateProvider";
import InfoDot from "@/components/common/InfoDot";
import RegionPicker from "@/components/settings/RegionPicker";

const BLUE = "#3b5bdb";
const START = { tone: "#2f9e44", bg: "#ebfbee", border: "#b2f2bb" };
const END = { tone: "#7048e8", bg: "#f3f0ff", border: "#d0bfff" };

type Axis = "start" | "end";
type Target = Axis | "pickup" | "dropoff";

const AXIS_META: Record<
  Axis,
  { title: string; chip: string; icon: string; hint: string; color: typeof START }
> = {
  start: {
    title: "선호 출발지",
    chip: "출발",
    icon: "▶",
    hint: "하루의 첫 오더를 이 지점 주변에서 찾습니다. 화물 정보 탭 「추천순」이 지금 시각·위치를 함께 봐서, 하루를 시작할 시간대엔 이 방향 오더를 위로 올립니다.",
    color: START,
  },
  end: {
    title: "선호 복귀점",
    chip: "복귀",
    icon: "⌂",
    hint: "마지막 오더의 하차지를 이 지점 쪽으로 맞춥니다. 복귀 공차를 줄이려는 값입니다. 화물 정보 탭 「추천순」이 지금 시각·위치를 함께 봐서, 하루를 마무리할 시간대엔 이 방향 오더를 위로 올립니다.",
    color: END,
  },
};

export default function LocationSettings() {
  const router = useRouter();
  const { settings, updateSettings, hydrated } = useAppState();
  const [radius, setRadius] = useState(60);
  const [picking, setPicking] = useState<Target | null>(null);
  const [hint, setHint] = useState<Axis | null>(null);

  const handleClose = () => {
    router.push("/cargo?sort=recommend");
  };

  const dayValue = (a: Axis) =>
    hydrated ? (a === "start" ? settings.dayStart : settings.dayEnd) : "";
  const orderValue = (t: "pickup" | "dropoff") =>
    hydrated ? (t === "pickup" ? settings.preferPickup : settings.preferDropoff) : [];

  /** 네 군데가 같은 컴포넌트를 쓴다. 다른 건 제목·개수·색뿐이다. */
  const pickerProps = (t: Target) => {
    switch (t) {
      case "start":
      case "end":
        return {
          title: `${AXIS_META[t].title} 설정`,
          mode: "single" as const,
          tone: AXIS_META[t].color.tone,
          value: dayValue(t) ? [dayValue(t)] : [],
          onSave: (next: string[]) =>
            updateSettings(
              t === "start" ? { dayStart: next[0] ?? "" } : { dayEnd: next[0] ?? "" },
            ),
        };
      case "pickup":
      case "dropoff":
        return {
          title: t === "pickup" ? "상차지 설정" : "하차지 설정",
          mode: "multi" as const,
          tone: BLUE,
          value: orderValue(t),
          onSave: (next: string[]) =>
            updateSettings(
              t === "pickup" ? { preferPickup: next } : { preferDropoff: next },
            ),
        };
    }
  };

  const OrderAxisCard = ({ t }: { t: "pickup" | "dropoff" }) => {
    const list = orderValue(t);
    return (
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[16px] font-extrabold flex items-center gap-1 text-[#3b5bdb]">
            <span>♥</span> {t === "pickup" ? "상차지" : "하차지"}
          </h3>
          <button
            onClick={() => setPicking(t)}
            className="border border-[#3b5bdb] text-[#3b5bdb] px-3 py-1.5 rounded text-[13px] font-bold"
          >
            지역 설정하기
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {list.length === 0 && (
            <span className="text-[15px] text-gray-400">설정 안 함</span>
          )}
          {list.map((label) => {
            const cut = label.lastIndexOf(" ");
            return (
              <div key={label} className="flex items-center text-[15px]">
                <span className="font-bold text-gray-900 w-20 shrink-0">
                  {label.slice(0, cut)}
                </span>
                <span className="text-gray-600">{label.slice(cut + 1)}</span>
              </div>
            );
          })}
        </div>

        {t === "pickup" && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex justify-between items-end mb-2">
              <span className="font-bold text-gray-900 text-[15px]">현위치 주변 <span className="text-[#3b5bdb]">{radius}km</span></span>
            </div>

            <div className="relative w-full h-2 bg-gray-200 rounded-full mt-4">
              <div
                className="absolute top-0 left-0 h-full bg-[#3b5bdb] rounded-full"
                style={{ width: `${(radius / 60) * 100}%` }}
              ></div>
              <input
                type="range"
                min="5"
                max="60"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className="absolute top-1/2 transform -translate-y-1/2 w-5 h-5 bg-white border-2 border-[#3b5bdb] rounded-full shadow-md pointer-events-none"
                style={{ left: `calc(${(radius / 60) * 100}% - 10px)` }}
              ></div>
            </div>

            <div className="flex justify-between text-[12px] text-gray-400 mt-2">
              <span>5km</span>
              <span>60km</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f6] pb-[80px]">
      {/* Header */}
      <div className="flex items-center px-4 py-4 bg-white sticky top-0 z-20 border-b border-gray-100">
        <button onClick={handleClose} className="text-gray-800 mr-4 cursor-pointer" aria-label="닫기">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">선호 지역 설정</h1>
      </div>

      {/* Notice bar */}
      <div className="bg-[#f4f7ff] px-5 py-3 flex justify-between items-center border-b border-[#d6e2ff]">
        <span className="text-[13px] text-[#3b5bdb]">설정한 지역으로 오더를 추천 중입니다.</span>
        <span className="text-[13px] text-gray-500 font-medium cursor-pointer">더보기</span>
      </div>

      {/* ───────── ② 하루 축 — 출발지 · 복귀점 ───────── */}
      <div className="px-4 pt-4">
        <div className="mb-2 flex items-center gap-1.5 px-1">
          <span className="rounded bg-[#3b5bdb] px-1.5 py-0.5 text-[10px] font-extrabold text-white">
            NEW
          </span>
          <h2 className="text-[15px] font-extrabold text-gray-900">
            나의 하루 동선
          </h2>
        </div>

        {/*
          "선호 상하차지"와 이름이 비슷해 보여서 헷갈리기 쉽다 — 하나는 "무엇을 볼까"(목록 필터),
          하나는 "언제·어느 방향이 나에게 유리한가"(시간·방향 기준)다. 문장으로 우기지 않고
          두 축을 나란히 놓아 비교한다. 아래 두 줄은 실제로 이 값들이 무엇을 바꾸는지에 대한
          정확한 설명이다 — "선호 상하차지"가 지금 정확히 무엇을 바꾸는지는 그 섹션에서 스스로
          말하게 두고, 여기서는 이 값(하루 동선)이 하는 일만 과장 없이 적는다.
        */}
        <div className="mb-3 rounded-lg border border-[#d6e2ff] bg-[#f4f7ff] p-3">
          <p className="mb-2 text-[12px] font-extrabold text-[#3b5bdb]">
            아래 「선호 상하차지」와 다른 축입니다
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <span className="mt-0.5 shrink-0 rounded bg-[#3b5bdb] px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                상하차지
              </span>
              <p className="text-[12px] leading-snug text-gray-600">
                <strong className="text-gray-900">어떤 오더를 볼까</strong> — 화물 정보 탭 목록을 좁히는 지역 필터입니다.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="mt-0.5 shrink-0 rounded bg-[#3b5bdb] px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                하루 동선
              </span>
              <p className="text-[12px] leading-snug text-gray-600">
                <strong className="text-gray-900">언제·어느 방향이 유리할까</strong> — 오늘 어디서 시작해서 어디로 돌아갈지입니다.
                목록을 좁히지 않고, 지금은 화물 정보 탭 <strong className="text-gray-900">「추천순」</strong> 정렬의 기준으로만 쓰입니다.
                나중엔 자동배차 추천이 이 값을 봅니다.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          {/* 경로 띠 — 둘이 다른 값이라는 걸 문장 대신 그림으로 */}
          <div className="flex items-center rounded-lg bg-[#f8f9fa] px-3 py-3">
            {(["start", "end"] as Axis[]).map((a, i) => (
              <div key={a} className="contents">
                {i === 1 && (
                  <div className="mx-2 flex shrink-0 items-center gap-1">
                    <span className="block w-5 border-t border-dashed border-gray-300" />
                    <span className="text-[12px] leading-none text-gray-400">▶</span>
                  </div>
                )}
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: AXIS_META[a].color.tone }}
                  />
                  <div className="min-w-0">
                    <p
                      className="text-[10px] font-bold"
                      style={{ color: AXIS_META[a].color.tone }}
                    >
                      {AXIS_META[a].chip}
                    </p>
                    <p className="truncate text-[13px] font-bold text-gray-900">
                      {dayValue(a) || <span className="text-gray-400">설정 안 함</span>}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 카드 두 장 — 색·아이콘·왼쪽 굵은 띠로 갈라놓는다 */}
          {(["start", "end"] as Axis[]).map((a) => {
            const m = AXIS_META[a];
            return (
              <div
                key={a}
                className="mt-3 rounded-lg border border-l-4 px-3 py-3"
                style={{ borderColor: m.color.border, borderLeftColor: m.color.tone, backgroundColor: m.color.bg }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center">
                    <span
                      className="mr-1.5 inline-flex h-[20px] items-center rounded px-1.5 text-[11px] font-extrabold text-white"
                      style={{ backgroundColor: m.color.tone }}
                    >
                      {m.icon} {m.chip}
                    </span>
                    <span className="text-[15px] font-extrabold text-gray-900">
                      {m.title}
                    </span>
                    <InfoDot
                      open={hint === a}
                      onClick={() => setHint((v) => (v === a ? null : a))}
                      label={`${m.title} 설명`}
                      glyph="!"
                      tone={m.color.tone}
                    />
                  </span>
                  <button
                    onClick={() => setPicking(a)}
                    className="shrink-0 rounded border bg-white px-3 py-1.5 text-[13px] font-bold"
                    style={{ borderColor: m.color.tone, color: m.color.tone }}
                  >
                    {dayValue(a) ? "변경" : "지역 설정하기"}
                  </button>
                </div>

                <p className="mt-2 text-[15px] font-bold text-gray-900">
                  {dayValue(a) || <span className="text-gray-400">설정 안 함</span>}
                </p>

                {hint === a && (
                  <p className="mt-2 border-t pt-2 text-[12px] leading-snug text-gray-600" style={{ borderColor: m.color.border }}>
                    {m.hint}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ───────── ① 오더 축 — 원래 앱의 상차지 · 하차지 ───────── */}
      <div className="px-4 pt-5">
        <h2 className="mb-2 px-1 text-[15px] font-extrabold text-gray-900">
          선호 상하차지
        </h2>
        <div className="space-y-4">
          <OrderAxisCard t="pickup" />
          <OrderAxisCard t="dropoff" />
        </div>
      </div>

      {/* Info Notice */}
      <div className="px-5 pt-2 pb-6 border-t border-gray-200 mt-5 bg-[#f4f4f6]">
        <h4 className="text-[15px] font-bold text-gray-900 mb-3 mt-4">이용 안내</h4>
        <ul className="text-[13.5px] text-gray-600 space-y-2 pl-4 list-disc marker:text-gray-400 leading-relaxed">
          <li><span style={{ color: START.tone }} className="font-bold">출발지·복귀점</span>은 <strong>나의 하루 동선</strong>(시간·방향 기준), <span className="text-[#3b5bdb] font-bold">상하차지</span>는 <strong>목록에 띄울 오더</strong>(지역 필터)입니다.</li>
          <li>선호 상하차지를 설정하지 않을 경우, <strong>현위치 주변의 오더</strong>만 추천해 드립니다.</li>
          <li>선호 상하차지 주변에서 올라온 오더 추천은 주소를 <span className="text-[#3b5bdb] font-bold">♥파란색</span>으로 강조해 보여줍니다.</li>
          <li>출발지·복귀점은 화물 정보 탭 <strong>「추천순」</strong> 정렬에서 지금 시각·위치를 함께 보는 데 쓰입니다 — 목록을 줄이지 않고 순서만 바꿉니다.</li>
        </ul>
      </div>

      {/* 지역 선택 — 원래 앱의 「상차지 설정」 화면 */}
      {picking &&
        (() => {
          const p = pickerProps(picking);
          return (
            <RegionPicker
              title={p.title}
              mode={p.mode}
              tone={p.tone}
              value={p.value}
              onClose={() => setPicking(null)}
              onSave={(next) => {
                p.onSave(next);
                setPicking(null);
              }}
            />
          );
        })()}
    </div>
  );
}
