import fetchClient, { BASE_URL, API_PREFIX } from "../fetchClient";
import type { ApiEnvelope, ChatRoomApi, ChatMessageApi, Channel } from "./response";

// mapper: 백 응답(ChatRoomApi) → 프론트 Channel
const toChannel = (r: ChatRoomApi): Channel => ({
  id: r.roomId,
  name: r.name,
  typeCode: r.typeCode,
  targetId: r.targetId,
  memberCount: r.memberCount,
});

export const ChatApi = {
  /** 특정 club의 채팅방 목록 조회 */
  getRoomsByClub: async (clubId: number): Promise<Channel[]> => {
    const url = `${BASE_URL}${API_PREFIX}/chat/rooms?clubId=${encodeURIComponent(clubId)}`;
    const response = await fetchClient<ApiEnvelope<ChatRoomApi[]>>(url, {
      method: "GET",
      auth: true,
    });
    return response.data.map(toChannel);
  },

  /** 채팅방 메시지 최근 N개 */
  getRecentMessages: async (roomId: number, limit = 50): Promise<ChatMessageApi[]> => {
    const url = `${BASE_URL}${API_PREFIX}/chats/${roomId}/messages?limit=${limit}`;
    const response = await fetchClient<ApiEnvelope<ChatMessageApi[]>>(url, {
      method: "GET",
      auth: true,
    });
    return response.data;
  },

  /** 메시지 전송 (백업용 HTTP) */
  sendMessageHttp: async (roomId: number, content: string): Promise<void> => {
    const url = `${BASE_URL}${API_PREFIX}/chats/${roomId}/messages`;
    await fetchClient(url, {
      method: "POST",
      body: JSON.stringify({ content }),
      auth: true,
    });
  },
};
