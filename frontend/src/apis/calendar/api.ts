// apis/calendar/api.ts
import fetchClient, { BASE_URL, API_PREFIX } from '../fetchClient';
import type {
  EventListItemRes,
  EventRes,
  EventCreateReq,
  EventUpdateReq,
  EventType,
  IsoDate,
  IsoDateTime,
} from './response';

// ===== 경로/도우미 =====
const withBase = (p: string) => `${BASE_URL}${API_PREFIX}${p}`;

/** 안전 언래핑: {data:T}|{result:T}|T */
function unwrap<T>(raw: any): T {
  if (raw && typeof raw === 'object') {
    if ('data' in raw && raw.data != null) return raw.data as T;
    if ('result' in raw && raw.result != null) return raw.result as T;
  }
  return raw as T;
}

/** "YYYY-MM-DD" + "HH:mm"(옵션) → "YYYY-MM-DDTHH:mm:ss" */
export const toIsoDateTime = (date: IsoDate, time?: string | null): IsoDateTime => {
  const t = (time && time.trim()) ? time : '00:00';
  const [hh, mm] = t.split(':');
  const hh2 = String(hh ?? '00').padStart(2, '0');
  const mm2 = String(mm ?? '00').padStart(2, '0');
  return `${date}T${hh2}:${mm2}:00`;
};

/** "YYYY-MM-DDTHH:mm:ss" → { date:"YYYY-MM-DD", time:"HH:mm" } */
export const splitDateTime = (dt: IsoDateTime | null | undefined) => {
  if (!dt) return { date: null as IsoDate | null, time: null as string | null };
  const [d, t] = dt.split('T');
  const time = (t ?? '').slice(0, 5) || null; // "HH:mm"
  return { date: d as IsoDate, time };
};

// ====== UI <-> 백 타입 매핑 (프론트 카테고리 ↔ 공통코드) ======
// UI: "정모" | "번개모임" | "MT"
// BE: "REGULAR" | "LIGHTNING" | "MT"
export type UICategory = "정모" | "번개모임" | "MT";

export const uiToEventType = (c: UICategory): EventType => {
  if (c === "번개모임") return "LIGHTNING";
  if (c === "MT") return "MT";
  // "정모"와 는 공통코드 REGULAR로 매핑
  return "REGULAR";
};

export const eventTypeToUi = (t: EventType): UICategory => {
  if (t === "LIGHTNING") return "번개모임";
  if (t === "MT") return "MT";
  return "정모";
};

// ===== API =====
export const CalendarApi = {
  // 단건
  async getOne(clubId: number, eventId: number): Promise<EventRes> {
    const url = withBase(`/clubs/${clubId}/events/${eventId}`);
    const raw = await fetchClient<any>(url, { method: 'GET' });
    return unwrap<EventRes>(raw);
  },

  // 월 목록
  async getMonth(params: { clubId: number; year: number; month: number }): Promise<EventListItemRes[]> {
    const url = withBase(`/clubs/${params.clubId}/events/month?year=${params.year}&month=${params.month}`);
    const raw = await fetchClient<any>(url, { method: 'GET' });
    return unwrap<EventListItemRes[]>(raw);
  },

  // 일 목록
  async getDay(params: { clubId: number; date: IsoDate }): Promise<EventListItemRes[]> {
    const url = withBase(`/clubs/${params.clubId}/events/day?date=${params.date}`);
    const raw = await fetchClient<any>(url, { method: 'GET' });
    return unwrap<EventListItemRes[]>(raw);
  },

  // 다가오는 N개
  async getUpcoming(params: { clubId: number; now: IsoDateTime; limit?: number }): Promise<EventListItemRes[]> {
    const url = withBase(
      `/clubs/${params.clubId}/events/upcoming?now=${encodeURIComponent(params.now)}&limit=${params.limit ?? 5}`,
    );
    const raw = await fetchClient<any>(url, { method: 'GET' });
    return unwrap<EventListItemRes[]>(raw);
  },

  // 생성
  async create(clubId: number, body: EventCreateReq): Promise<EventRes> {
    const url = withBase(`/clubs/${clubId}/events`);
    const raw = await fetchClient<any>(url, { method: 'POST', body: JSON.stringify(body) });
    return unwrap<EventRes>(raw);
  },

  // 수정
  async update(clubId: number, eventId: number, body: EventUpdateReq): Promise<EventRes> {
    const url = withBase(`/clubs/${clubId}/events/${eventId}`);
    const raw = await fetchClient<any>(url, { method: 'PATCH', body: JSON.stringify(body) });
    return unwrap<EventRes>(raw);
  },

  // 삭제
  async remove(clubId: number, eventId: number): Promise<void> {
    const url = withBase(`/clubs/${clubId}/events/${eventId}`);
    await fetchClient<void>(url, { method: 'DELETE' });
  },

  // 참가 확정 (이벤트 기준)
  async confirmParticipantsByEvent(clubId: number, eventId: number, userIds: number[] = []): Promise<void> {
    const url = withBase(`/clubs/${clubId}/events/${eventId}/members/confirm`);
    await fetchClient<void>(url, { method: 'POST', body: JSON.stringify({ userIds }) });
  },

  // 참가 확정 (채팅방 기준)
  async confirmParticipantsByChat(chatId: number, userIds: number[] = []): Promise<void> {
    const url = withBase(`/chats/${chatId}/participants/confirm`);
    await fetchClient<void>(url, { method: 'POST', body: JSON.stringify({ userIds }) });
  },
};
