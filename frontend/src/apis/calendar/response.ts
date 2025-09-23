// apis/calendar/response.ts
// ── 백엔드 DTO/요청 타입 (스프링 컨트롤러/DTO에 매칭)

export type IsoDate = string;       // "YYYY-MM-DD"
export type IsoDateTime = string;   // "YYYY-MM-DDTHH:mm:ss"

export type EventType = "LIGHTNING" | "REGULAR" | "MT";

// ── 목록 아이템
export interface EventListItemRes {
  id: number;
  title: string;
  place: string | null;
  startAt: IsoDateTime; // LocalDateTime 직렬화
  endAt: IsoDateTime | null;
  type: EventType;
}

// ── 단건 상세
export interface EventRes {
  id: number;
  title: string;
  content: string | null;
  place: string | null;
  capacity: number | null;     // Short -> number
  expectedCost: number | null;
  startAt: IsoDateTime;
  endAt: IsoDateTime | null;
  type: EventType;
  createdBy: number | null;
}

// ── 생성/수정 요청
export interface EventCreateReq {
  title: string;
  content?: string | null;
  place?: string | null;
  capacity?: number | null;       // Short 범위
  expectedCost?: number | null;
  startAt: IsoDateTime;
  endAt: IsoDateTime | null;
  /** 공통코드(events): LIGHTNING | REGULAR | MT */
  type: EventType;
}

export interface EventUpdateReq {
  title: string;
  content?: string | null;
  place?: string | null;
  capacity?: number | null;
  expectedCost?: number | null;
  startAt: IsoDateTime;
  endAt: IsoDateTime | null;
}
