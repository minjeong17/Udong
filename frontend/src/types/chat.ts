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
  id: number;          // = roomId
  name: string;
  typeCode: "GLOBAL" | "EVENT";
  targetId: number;
  memberCount: number;
}
