// 공통 응답 wrapper
export interface ApiResponse<T> {
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
  createdByUserId: number; 
}

// 메시지 응답
export interface ChatMessageApi {
  messageId: number;
  chatId: number;
  senderUserId: number;
  senderName: string;
  content: string;
  createdAt: string; // ISO string
}

// 프론트에서 사용하기 좋은 채널 모델
export interface Channel {
  id: number; // = roomId
  name: string;
  typeCode: "GLOBAL" | "EVENT";
  targetId: number;
  memberCount: number;
  createdByUserId: number;  
}

// 서버 응답 내 개별 참여자 레코드 
export interface ParticipantRes {
  userId: number;
  name: string;
  owner: boolean;
}

// 서버 응답 루트(data) 
export interface ChatParticipantsResponse {
  chatId: number;
  participants: ParticipantRes[];
  confirmed: boolean;
  confirmedCount: number|null;
}