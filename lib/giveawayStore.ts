// 나눔이벤트 응모권 + 회원(인증) 상태 (데모용 localStorage).
// 응모권 = 방문(로그인) 응모권 + 광고 응모권.
//   - 방문: 하루를 6시간 슬롯 4개(0·6·12·18시)로 나눠, 슬롯당 1회 응모 → 하루 최대 4회
//           (개별 쿨다운 대신 고정 시간대 초기화 — 간편하고 공정)
//   - 광고: 보상형 광고 완주 시 +1, 최대 5회
// 추후 Supabase users / giveaway_entries + 실제 인증/서버검증으로 교체.

const USER_KEY = "oneuldeal_user_v1";
const ENTRY_KEY = "oneuldeal_entries_v4";
const REF_KEY = "oneuldeal_refcode_v1";

export const VISIT_SLOT_HOURS = 6; // 슬롯 길이(시간)
export const VISIT_DAILY_CAP = 24 / VISIT_SLOT_HOURS; // 하루 슬롯 수 = 4
export const AD_ENTRY_CAP = 5; // 광고 응모권 한도
// 친구 공유: 채널별 1회씩(유니크), 중복 채널은 영구 제거. 채널 수 = 최대 응모권.
export const SHARE_CHANNELS = ["share", "x", "facebook", "line", "copy"] as const;
export const REF_ENTRY_CAP = SHARE_CHANNELS.length;
export const AUTH_EVENT = "oneuldeal-auth"; // 로그인/응모권 변동 알림 (컴포넌트 동기화)

export interface MockUser {
  loggedIn: boolean;
  provider?: "kakao" | "naver";
  marketingConsent: boolean;
}

export interface EntryState {
  visitEntries: number; // 방문 누적 응모권
  adEntries: number; // 광고 누적 응모권
  refChannels: string[]; // 공유한 SNS 채널(유니크) — 채널당 응모권 1
  claimDay: string; // 'YYYY-MM-DD' (로컬)
  claimedSlots: number[]; // 오늘 응모한 슬롯 인덱스(0~3)
}

export interface VisitEligibility {
  ok: boolean;
  reason?: "not-logged-in" | "cooldown" | "maxed";
  nextClaimAt?: number; // 다음 슬롯 시작 시각(ms)
  remainingToday: number; // 오늘 남은 방문 응모 횟수
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 현재 시간대 슬롯 인덱스 (0:0~6시, 1:6~12시, 2:12~18시, 3:18~24시)
function currentSlot(): number {
  return Math.floor(new Date().getHours() / VISIT_SLOT_HOURS);
}

// 다음 슬롯 시작 시각(ms)
function nextSlotStart(): number {
  const d = new Date();
  const nextHour = (currentSlot() + 1) * VISIT_SLOT_HOURS; // 6/12/18/24
  d.setHours(nextHour, 0, 0, 0); // 24면 다음날 0시로 정규화
  return d.getTime();
}

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTH_EVENT));
}

/* ---- 회원(인증) ---- */
export function getUser(): MockUser {
  return read<MockUser>(USER_KEY, { loggedIn: false, marketingConsent: false });
}

export function loginMock(provider: "kakao" | "naver"): MockUser {
  const next: MockUser = { loggedIn: true, provider, marketingConsent: getUser().marketingConsent };
  write(USER_KEY, next);
  emit();
  return next;
}

export function setConsent(value: boolean): MockUser {
  const next: MockUser = { ...getUser(), marketingConsent: value };
  write(USER_KEY, next);
  emit();
  return next;
}

export function logoutMock(): MockUser {
  const next: MockUser = { loggedIn: false, marketingConsent: false };
  write(USER_KEY, next);
  emit();
  return next;
}

export function canEnter(user: MockUser): boolean {
  return user.loggedIn && user.marketingConsent;
}

/* ---- 응모권 ---- */
function defaultEntry(): EntryState {
  return { visitEntries: 0, adEntries: 0, refChannels: [], claimDay: todayStr(), claimedSlots: [] };
}

// 친구 공유용 레퍼럴 코드 (1회 생성·고정)
export function getRefCode(): string {
  let code = read<string>(REF_KEY, "");
  if (!code) {
    code = Math.random().toString(36).slice(2, 8).toUpperCase();
    write(REF_KEY, code);
  }
  return code;
}

// 날짜가 바뀌었으면 오늘 슬롯 기록 리셋(누적 응모권은 유지)
function normalized(s: EntryState): EntryState {
  if (s.claimDay !== todayStr()) {
    return { ...s, claimDay: todayStr(), claimedSlots: [] };
  }
  return s;
}

export function getEntry(giveawayId: string): EntryState {
  const all = read<Record<string, EntryState>>(ENTRY_KEY, {});
  return normalized({ ...defaultEntry(), ...(all[giveawayId] ?? {}) });
}

function setEntry(giveawayId: string, state: EntryState) {
  const all = read<Record<string, EntryState>>(ENTRY_KEY, {});
  all[giveawayId] = state;
  write(ENTRY_KEY, all);
}

export function visitEligibility(giveawayId: string): VisitEligibility {
  const s = getEntry(giveawayId);
  const remainingToday = Math.max(0, VISIT_DAILY_CAP - s.claimedSlots.length);
  if (!canEnter(getUser())) return { ok: false, reason: "not-logged-in", remainingToday };
  if (s.claimedSlots.length >= VISIT_DAILY_CAP) return { ok: false, reason: "maxed", remainingToday: 0 };
  if (s.claimedSlots.includes(currentSlot())) {
    return { ok: false, reason: "cooldown", nextClaimAt: nextSlotStart(), remainingToday };
  }
  return { ok: true, remainingToday };
}

// 방문 응모권 1개 획득 (현재 슬롯에서 아직 안 받았을 때). 실서비스에선 서버가 슬롯·한도 검증.
export function claimVisit(giveawayId: string): EntryState {
  const s = getEntry(giveawayId);
  if (visitEligibility(giveawayId).ok) {
    s.visitEntries += 1;
    s.claimedSlots = [...s.claimedSlots, currentSlot()];
    emit();
  }
  setEntry(giveawayId, s); // 날짜 리셋 반영
  return s;
}

// 광고 1회 완주 = 응모권 +1 (한도 내). 실서비스에선 서버(SSV/검증)가 호출.
export function addAdEntry(giveawayId: string): EntryState {
  const s = getEntry(giveawayId);
  if (s.adEntries < AD_ENTRY_CAP) {
    s.adEntries += 1;
    emit();
  }
  setEntry(giveawayId, s);
  return s;
}

// 특정 SNS 채널로 공유 = 응모권 +1 (채널당 1회, 중복 채널은 영구 무시).
export function addRefChannel(giveawayId: string, channel: string): EntryState {
  const s = getEntry(giveawayId);
  if (!s.refChannels.includes(channel) && s.refChannels.length < REF_ENTRY_CAP) {
    s.refChannels = [...s.refChannels, channel];
    emit();
  }
  setEntry(giveawayId, s);
  return s;
}

export function totalEntries(s: EntryState): number {
  return (s.visitEntries ?? 0) + (s.adEntries ?? 0) + (s.refChannels?.length ?? 0);
}
