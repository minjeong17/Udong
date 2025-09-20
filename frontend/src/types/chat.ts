// 백엔드 응답 원형
export interface ChatRoomApi {
  roomId: number;
  name: string;
  typeCode: "GLOBAL" | "EVENT";
  targetId: number;
  memberCount: number;
}

export interface ChatRoomListResponse {
  success: boolean;
  data: ChatRoomApi[];
  status: number;
}

// 프론트에서 사용할 채널 모델 (렌더 편의형)
export interface Channel {
  id: number; // = roomId
  name: string;
  typeCode: "GLOBAL" | "EVENT";
  targetId: number;
  memberCount: number;
}

// --- WebSocket 수신/송신 메시지 타입 ---
export type WsChatIn = {
  type: "CHAT";
  roomId: number;
  messageId: number;
  senderUserId: number;
  senderName: string;
  content: string;
  createdAt: string; // ISO 문자열
};

export type WsChatOut = {
  type: "CHAT";
  content: string;
};

// --- 프론트에서 렌더링할 UI 메시지 타입 ---
export type UIMsg = {
  id: string; // 클라이언트 임시 ID 또는 서버 messageId
  user: string; // 닉네임
  avatar?: string; // 프로필 이니셜 등
  message: string; // 본문
  timestamp: string; // HH:mm 같은 표시용
  isOwn: boolean; // 내가 보낸 메시지 여부
};

// // 서버 응답 메시지 타입
// export interface ChatMessageApi {
//   messageId: number;
//   roomId: number;
//   senderUserId: number;
//   senderName: string | null;
//   content: string;
//   createdAt: string; // ISO 문자열 (예: "2025-09-20T07:52:31Z")
// }
