import fetchClient, { BASE_URL, API_PREFIX } from "../fetchClient";
import type { ApiResponse, ChatRoomApi, ChatMessageApi, Channel, ChatParticipantsResponse, ParticipantRes } from "./response";
import type { ChatParticipants, CreateDutchpayPayload, Participant } from "../../types/chat";

// mapper: 백 응답(ChatRoomApi) → 프론트 Channel
const toChannel = (r: ChatRoomApi): Channel => ({
  id: r.roomId,
  name: r.name,
  typeCode: r.typeCode,
  targetId: r.targetId,
  memberCount: r.memberCount,
});

function mapParticipant(r: ParticipantRes): Participant {
  return {
    id: r.userId,
    name: r.name,
    isOwner: r.owner,
  };
}

function mapChatParticipants(r: ChatParticipantsResponse): ChatParticipants {
  return {
    chatId: r.chatId,
    participants: r.participants.map(mapParticipant),
  };
}

export const ChatApi = {
  /** 특정 club의 채팅방 목록 조회 */
  getRoomsByClub: async (clubId: number): Promise<Channel[]> => {
    const url = `${BASE_URL}${API_PREFIX}/chat/rooms?clubId=${encodeURIComponent(clubId)}`;
    const response = await fetchClient<ApiResponse<ChatRoomApi[]>>(url, {
      method: "GET",
      auth: true,
    });
    return response.data.map(toChannel);
  },

  /** 채팅방 메시지 최근 N개 */
  getRecentMessages: async (roomId: number, limit = 50): Promise<ChatMessageApi[]> => {
    const url = `${BASE_URL}${API_PREFIX}/chats/${roomId}/messages?limit=${limit}`;
    const response = await fetchClient<ApiResponse<ChatMessageApi[]>>(url, {
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

  async getParticipants(chatId: number): Promise<ChatParticipants> {
    const token = localStorage.getItem("accessToken");

    const res = await fetch(`${BASE_URL}${API_PREFIX}/chat/rooms/${chatId}/participants`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`참여자 조회 실패 (${res.status}) ${text}`);
    }

    const json = (await res.json()) as ApiResponse<ChatParticipantsResponse>;
    return mapChatParticipants(json.data);
  },

  /** 채팅방에서 정산 생성 (multipart/form-data) */
  createDutchpayByChat: async (chatId: number, payload: CreateDutchpayPayload): Promise<ApiResponse<string>> => {
    const { amount, note, participantUserIds, receipt } = payload;

    if (!Array.isArray(participantUserIds) || participantUserIds.length === 0) {
      throw new Error("참가자 목록이 비어 있습니다.");
    }
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      throw new Error("amount는 양의 숫자여야 합니다.");
    }

    const form = new FormData();
    form.append("amount", String(amount));
    if (note != null && note !== "") form.append("note", note);
    participantUserIds.forEach((uid) => form.append("participantUserIds", String(uid)));
    if (receipt) {
      const filename = (receipt as File)?.name ?? "receipt.png";
      form.append("receipt", receipt, filename);
    }

    const url = `${BASE_URL}${API_PREFIX}/dutchpays/${encodeURIComponent(chatId)}`;

    // ✅ fetchClient가 JSON 파싱/토큰/401재시도 다 처리
    return await fetchClient<ApiResponse<string>>(url, {
      method: "POST",
      body: form,
      auth: true,
    });
  }, // ← 메서드 끝! 쉼표로 다음 메서드와 구분

  /** (EVENT 전용) 실제 참여 인원 확정 */
  confirmParticipantsByChatId: async (clubId: number, chatId: number, userIds: number[]): Promise<void> => {
    const url = `${BASE_URL}${API_PREFIX}/clubs/${clubId}/events/chats/${chatId}/participants/confirm`;
    await fetchClient<ApiResponse<unknown>>(url, {
      method: "PUT",
      auth: true,
      body: JSON.stringify({ userIds }),
    });
  },
};
