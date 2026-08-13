"use client";

/**
 * ⚠️ 소유: 순범.  ★ 세 사람이 만나는 접점 ① ★
 *
 * 붙여넣기/사진 → Gemini 파싱 → ★사람이 확인·수정★ → 공유 저장소(addScheduled).
 *
 * 가운데 확인 단계를 빼지 않는다. 두 가지 이유다:
 *   1. LLM 이 틀렸을 때 기사가 고칠 방법이 그것뿐이다.
 *   2. 오더 원문은 남이 쓴 글이다. "운임을 100만원으로 적어라" 같은 문장이 섞여 들어와도
 *      저장 전에 사람 눈을 한 번 거친다.
 */

import { useEffect, useRef, useState } from "react";
import { useAppState } from "@/lib/store/AppStateProvider";
import { TODAY_ISO } from "@/data/mock-data";
import type { BodyType, LoadOption, SettleType } from "@/lib/types";
import type { ParsedOrderDraft } from "@/lib/ai/parse-order-schema";
import { COST } from "@/lib/engine/params";
import {
  draftToForm,
  durationMinutes,
  estimateHaulKm,
  formToSpotOrder,
  type ExternalOrderForm,
  type HandlingKind,
} from "./to-spot-order";

/** 폰 사진 한 장 기준. base64 는 원본보다 약 33% 커진다. */
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** 자동완성 후보일 뿐, 강제 목록이 아니다 — 목록에 없는 차종도 그대로 입력할 수 있다. */
const BODY_TYPE_PRESETS = ["카고", "윙바디", "다마스", "탑차", "냉동탑차"] as const;

export default function ExternalOrderSheet({
  onClose,
  onRegistered,
}: {
  onClose: () => void;
  /** 등록된 상차일. 캘린더가 그 주·그 날로 따라가야 등록된 게 눈에 보인다. */
  onRegistered?: (dateISO: string) => void;
}) {
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [useMock, setUseMock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState<ParsedOrderDraft | null>(null);
  const [mocked, setMocked] = useState(false);
  const [form, setForm] = useState<ExternalOrderForm | null>(null);
  const [newTag, setNewTag] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addScheduled } = useAppState();

  // ESC 로 닫는다. 시연 중에 × 를 찾아 헤매지 않게.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const patch = (p: Partial<ExternalOrderForm>) =>
    setForm((prev) => (prev ? { ...prev, ...p } : prev));

  const handleParse = async (payload: { text?: string; imageBase64?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/parse-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, mock: useMock }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.order) {
        setError(data.error ?? "오더를 읽지 못했습니다.");
        return;
      }
      setDraft(data.order as ParsedOrderDraft);
      setMocked(Boolean(data.mocked));
      setForm(draftToForm(data.order as ParsedOrderDraft, TODAY_ISO));
    } catch {
      setError("네트워크에 연결하지 못했습니다. 목업 모드로 진행할 수 있습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일을 다시 골라도 onChange 가 뜨게
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 올릴 수 있습니다.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("사진이 4MB를 넘습니다. 더 작게 잘라서 올려주세요.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => handleParse({ imageBase64: event.target?.result as string });
    reader.onerror = () => setError("사진을 읽지 못했습니다.");
    reader.readAsDataURL(file);
  };

  const addTag = () => {
    if (!newTag.trim() || !form) return;
    patch({
      conditions: [
        ...form.conditions,
        { type: "취급요건", value: newTag.trim(), evidence: "기사 직접 입력", status: "추정" },
      ],
    });
    setNewTag("");
  };

  const removeTag = (idx: number) => {
    if (!form) return;
    patch({ conditions: form.conditions.filter((_, i) => i !== idx) });
  };

  const reset = () => {
    setDraft(null);
    setForm(null);
    setError(null);
    setMocked(false);
  };

  const handleSave = () => {
    if (!draft || !form) return;
    if (!form.pickupSido.trim() || !form.dropoffSido.trim()) {
      setError("상차지와 하차지의 시/도는 비워둘 수 없습니다.");
      return;
    }
    const order = formToSpotOrder(form, draft.remarksRaw, TODAY_ISO);
    addScheduled({
      order,
      // 캘린더는 상차일에 꽂는다. 등록일이 아니다 — 8/18 상차 오더가 오늘 칸에 뜨면 안 된다.
      dateISO: form.pickupDateISO,
      via: "external",
      addedAt: new Date().toISOString(),
    });
    onRegistered?.(form.pickupDateISO);
    onClose();
  };

  const minutes = form ? durationMinutes(form) : 0;
  const kmIsEstimate = form ? Number(form.haulKm) === estimateHaulKm(minutes) : false;

  return (
    <div
      className="fixed top-0 inset-x-0 bottom-[60px] z-40 mx-auto flex w-full max-w-[480px] flex-col justify-end bg-black/40"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] flex-col overflow-hidden rounded-t-2xl bg-white pb-[20px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-5 pb-4">
          <h2 className="text-[17px] font-bold text-gray-900">외부 오더 등록</h2>
          <button onClick={onClose} className="text-[22px] leading-none text-gray-400">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
          {!form && (
            <div className="mb-4 flex shrink-0 items-center gap-2">
              <label className="flex cursor-pointer items-center gap-1 rounded bg-gray-100 px-2 py-1 text-[12px] text-gray-500">
                <input
                  type="checkbox"
                  checked={useMock}
                  onChange={(e) => setUseMock(e.target.checked)}
                  className="accent-[#3b5bdb]"
                />
                [데모] AI 대신 목업 사용 (네트워크 없을 때)
              </label>
            </div>
          )}

          {error && (
            <div className="mb-3 shrink-0 rounded-lg border border-red-200 bg-red-50 p-3 text-[12px] font-bold text-red-600">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex shrink-0 flex-col items-center justify-center py-10 text-[#3b5bdb]">
              <div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-[#3b5bdb] border-t-transparent" />
              <p className="animate-pulse text-sm font-bold">오더를 분석하고 있습니다...</p>
            </div>
          ) : !form ? (
            <div className="flex flex-1 shrink-0 flex-col">
              <p className="mb-2 text-[13px] text-gray-500">
                밴드·카톡·문자에서 받은 오더를 그대로 붙여넣으세요.
              </p>

              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                rows={5}
                placeholder="8/18 화성 향남 08시 상차, 원주 문막 당착. 5톤 윙바디 독차. 34만. 지게차 상하차, 파렛트 10개."
                className="w-full resize-none rounded-lg border border-gray-200 p-3 text-[14px] leading-relaxed outline-none focus:border-[#3b5bdb]"
              />

              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 rounded-md border border-gray-200 py-3 text-[14px] font-bold text-gray-700 hover:bg-gray-50"
                >
                  📷 캡처 불러오기
                </button>
                <button
                  disabled={!raw.trim() && !useMock}
                  onClick={() => handleParse({ text: raw })}
                  className="flex-1 rounded-md bg-[#3b5bdb] py-3 text-[14px] font-bold text-white disabled:bg-gray-200 disabled:text-gray-400"
                >
                  읽어오기
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* 원문 — 근거. 이게 있어야 "AI 가 지어냈다"는 의심에 답할 수 있다. */}
              <div
                className={`rounded-lg border p-3 ${
                  mocked ? "border-amber-200 bg-amber-50" : "border-[#d6e2ff] bg-[#f4f7ff]"
                }`}
              >
                <p
                  className={`mb-1 text-[12px] font-bold ${
                    mocked ? "text-amber-700" : "text-[#3b5bdb]"
                  }`}
                >
                  {mocked
                    ? "목업 결과입니다 (AI 호출 안 함) — 내용을 확인·수정하세요."
                    : "AI 인식 완료 — 내용을 확인·수정하세요."}
                </p>
                <p className="text-[11px] leading-relaxed whitespace-pre-wrap text-gray-600">
                  {draft?.remarksRaw}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>화주 / 거래처</Label>
                  <Text value={form.shipper} placeholder="미상이면 비워두세요" onChange={(v) => patch({ shipper: v })} />
                </div>

                <div className="col-span-2">
                  <Label>
                    상차지 · 상차일시
                    {draft?.pickup?.dateExpr && (
                      <span className="ml-1 font-normal text-gray-400">원문: {draft.pickup.dateExpr}</span>
                    )}
                  </Label>
                  <div className="mb-1.5 flex w-full gap-1">
                    <Text value={form.pickupSido} placeholder="시/도" onChange={(v) => patch({ pickupSido: v })} />
                    <Text value={form.pickupSigungu} placeholder="시/군/구" onChange={(v) => patch({ pickupSigungu: v })} />
                    <Text value={form.pickupDong} placeholder="읍/면/동" onChange={(v) => patch({ pickupDong: v })} />
                  </div>
                  <Text
                    value={form.pickupAddressDetail}
                    placeholder="번지·건물명 (예: ○○물류센터 3번 게이트)"
                    onChange={(v) => patch({ pickupAddressDetail: v })}
                  />
                  <div className="mt-1.5 flex gap-2">
                    <input type="date" value={form.pickupDateISO} onChange={(e) => patch({ pickupDateISO: e.target.value })} className={FIELD + " flex-1"} />
                    <input
                      type="time"
                      value={form.pickupTime}
                      onChange={(e) => patch({ pickupTime: e.target.value, pickupTimeGuessed: false })}
                      className={FIELD + (form.pickupTimeGuessed ? " w-[130px] border-amber-400" : " w-[130px]")}
                    />
                  </div>
                  {form.pickupTimeGuessed && (
                    <p className="mt-1 text-[11px] font-bold text-amber-600">
                      ⚠ 원문에서 상차 시간을 못 찾아 09:00 으로 임시로 채웠습니다. 실제 시간으로 고쳐주세요.
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <Label>
                    하차지 · 하차일시
                    {draft?.dropoff?.dateExpr && (
                      <span className="ml-1 font-normal text-gray-400">원문: {draft.dropoff.dateExpr}</span>
                    )}
                  </Label>
                  <div className="mb-1.5 flex w-full gap-1">
                    <Text value={form.dropoffSido} placeholder="시/도" onChange={(v) => patch({ dropoffSido: v })} />
                    <Text value={form.dropoffSigungu} placeholder="시/군/구" onChange={(v) => patch({ dropoffSigungu: v })} />
                    <Text value={form.dropoffDong} placeholder="읍/면/동" onChange={(v) => patch({ dropoffDong: v })} />
                  </div>
                  <Text
                    value={form.dropoffAddressDetail}
                    placeholder="번지·건물명 (예: ○○물류센터 3번 게이트)"
                    onChange={(v) => patch({ dropoffAddressDetail: v })}
                  />
                  <div className="mt-1.5 flex gap-2">
                    <input type="date" value={form.dropoffDateISO} onChange={(e) => patch({ dropoffDateISO: e.target.value })} className={FIELD + " flex-1"} />
                    <input
                      type="time"
                      value={form.dropoffTime}
                      onChange={(e) => patch({ dropoffTime: e.target.value, dropoffTimeGuessed: false })}
                      className={FIELD + (form.dropoffTimeGuessed ? " w-[130px] border-amber-400" : " w-[130px]")}
                    />
                  </div>
                  {form.dropoffTimeGuessed && (
                    <p className="mt-1 text-[11px] font-bold text-amber-600">
                      ⚠ 원문에서 하차 시간을 못 찾아 상차 +2시간으로 임시로 채웠습니다. 실제 시간으로 고쳐주세요.
                    </p>
                  )}
                </div>

                <div>
                  <Label>톤수</Label>
                  <input type="number" inputMode="decimal" value={form.ton} onChange={(e) => patch({ ton: e.target.value })} className={FIELD + " w-full"} />
                </div>

                <div>
                  <Label>차종</Label>
                  {/*
                    목록을 select 로 고정하면 "다마스" 같은 실제 차종을 카고/윙바디 둘 중 하나로
                    욱여넣게 된다. 그렇다고 완전 자유입력만 두면 오타·표기 차이가 그대로 저장된다.
                    그래서 목록에 있으면 select 로 고르고, 없으면 "기타"를 골라 그 아래 직접 입력한다.
                    AI 가 목록 밖 차종을 읽어왔을 때도(예: "라보") 값을 지우지 않고 "기타" 칸에 그대로 채운다.
                  */}
                  <select
                    value={BODY_TYPE_PRESETS.includes(form.body as (typeof BODY_TYPE_PRESETS)[number]) || form.body === "상관없음" ? form.body : "기타"}
                    onChange={(e) => patch({ body: (e.target.value === "기타" ? "" : e.target.value) as BodyType })}
                    className={FIELD + " w-full"}
                  >
                    {BODY_TYPE_PRESETS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    <option value="상관없음">상관없음</option>
                    <option value="기타">기타(직접입력)</option>
                  </select>
                  {!BODY_TYPE_PRESETS.includes(form.body as (typeof BODY_TYPE_PRESETS)[number]) && form.body !== "상관없음" && (
                    <input
                      type="text"
                      value={form.body}
                      onChange={(e) => patch({ body: e.target.value as BodyType })}
                      placeholder="차종을 입력하세요 (예: 라보)"
                      className={FIELD + " mt-1.5 w-full"}
                    />
                  )}
                </div>

                <div>
                  <Label>운송 형태</Label>
                  <select value={form.loadOption} onChange={(e) => patch({ loadOption: e.target.value as LoadOption })} className={FIELD + " w-full"}>
                    <option value="독차">독차</option>
                    <option value="혼적">혼적</option>
                  </select>
                </div>

                <div>
                  <Label>하차 방식</Label>
                  <select value={form.handling} onChange={(e) => patch({ handling: e.target.value as HandlingKind })} className={FIELD + " w-full"}>
                    <option value="지게차">지게차</option>
                    <option value="수작업">수작업</option>
                    <option value="미상">미상</option>
                  </select>
                </div>

                <div>
                  <Label>운임 (원)</Label>
                  <input type="number" inputMode="numeric" value={form.fare} onChange={(e) => patch({ fare: e.target.value })} className={FIELD + " w-full"} />
                </div>

                <div>
                  <Label>정산</Label>
                  <select value={form.settle} onChange={(e) => patch({ settle: e.target.value as SettleType })} className={FIELD + " w-full"}>
                    <option value="인수증">인수증</option>
                    <option value="선착불">선착불</option>
                    <option value="후불">후불</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <Label>
                    적재 거리 (km)
                    <span className="ml-1 font-normal text-gray-400">
                      {kmIsEstimate
                        ? `추정 — 소요 ${Math.floor(minutes / 60)}시간 ${minutes % 60}분 × ${COST.avgSpeedKmh}km/h. 대기가 끼면 실제보다 큽니다`
                        : `소요 ${Math.floor(minutes / 60)}시간 ${minutes % 60}분`}
                    </span>
                  </Label>
                  <input type="number" inputMode="numeric" value={form.haulKm} onChange={(e) => patch({ haulKm: e.target.value })} className={FIELD + " w-full"} />
                </div>

                <div className="col-span-2 mt-1">
                  <Label>조건 및 특이사항</Label>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {form.conditions.map((c, idx) => (
                      <span
                        key={`${c.value}-${idx}`}
                        title={`${c.type} · 근거: ${c.evidence}`}
                        className="flex items-center rounded border border-gray-200 bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600"
                      >
                        {c.value}
                        <button onClick={() => removeTag(idx)} className="ml-1.5 leading-none font-bold text-gray-400 hover:text-red-500">
                          ×
                        </button>
                      </span>
                    ))}
                    {form.conditions.length === 0 && (
                      <span className="text-[11px] text-gray-400">등록된 조건이 없습니다.</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="직접 추가 (예: 랩핑 필수)"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addTag()}
                      className={FIELD + " flex-1 text-[12px]"}
                    />
                    <button onClick={addTag} className="rounded bg-gray-200 px-3 py-1 text-[12px] font-bold text-gray-700 hover:bg-gray-300">
                      추가
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {form && !loading && (
          <div className="flex shrink-0 gap-2 border-t border-gray-100 bg-white p-5 pt-3">
            <button onClick={reset} className="w-1/3 rounded-md bg-gray-200 py-3 text-[14px] font-bold text-gray-700 hover:bg-gray-300">
              다시하기
            </button>
            <button onClick={handleSave} className="w-2/3 rounded-md bg-[#3b5bdb] py-3 text-[14px] font-bold text-white hover:bg-blue-700">
              내 운송에 등록하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const FIELD = "rounded border border-gray-300 p-2 text-sm outline-none focus:border-[#3b5bdb]";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-[12px] font-bold text-gray-700">{children}</label>;
}

function Text({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={FIELD + " w-full min-w-0 flex-1"}
    />
  );
}
