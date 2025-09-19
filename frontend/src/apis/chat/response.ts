// 공통 응답 wrapper
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  status: number;
}

// 채팅방 목록 응답
export interface ChatRoomApi {
  roomId: number;
  name: string;
  typeCode: "GLOBAL" | "EVENT";
  targetId: number;
  memberCount: number;
}

// 메시지 응답
export interface ChatMessageApi {
  id: number;
  chatId: number;
  senderUserId: number;
  senderName: string;
  content: string;
  createdAt: string; // ISO string
}

// 프론트에서 사용하기 좋은 채널 모델
export interface Channel {
  id: number;          // = roomId
  name: string;
  typeCode: "GLOBAL" | "EVENT";
  targetId: number;
  memberCount: number;
}
