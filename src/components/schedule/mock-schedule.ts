/**
 * ⚠️ 소유: 지수. 기존 공유 목업데이터(spotOrders + pastTrips + fixedSchedules) → ScheduleItem[] 어댑터.
 *
 * 세 데이터셋(@/data/mock-data, 다른 팀원 소유)은 여기서 읽기만 한다 — 수정하지 않는다.
 * schedule-store.ts(순범 소유, 실제 등록된 오더용 런타임 저장소)도 건드리지 않는다 —
 * 지금은 그 저장소가 비어 있어서, 화면을 채우기 위해 기존 목업 세 종류를 그대로 합쳐 쓴다.
 *
 * 기존 공유 데이터 → 이 adapter → ScheduleItem[]
 * 타임라인 보기와 리스트 보기가 이 배열 하나를 그대로 같이 쓴다.
 */

import { spotOrders, pastTrips } from "@/data/mock-data";
import { convertSpotOrderToScheduleItem, convertPastTripToScheduleItem } from "./convert";
import { fixedScheduleItems } from "./fixed-occurrences";
import type { ScheduleItem } from "./types";

export const scheduleItems: ScheduleItem[] = [
  ...spotOrders.map((order) => convertSpotOrderToScheduleItem(order)),
  ...pastTrips.map((trip) => convertPastTripToScheduleItem(trip)),
  ...fixedScheduleItems,
].sort((a, b) => `${a.date}${a.loadingStart}`.localeCompare(`${b.date}${b.loadingStart}`));
