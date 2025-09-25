import fetchClient from '../fetchClient';
import type {
  VoteResponse,
  VoteListResponse,
  VoteCreateRequest,
  VoteParticipateRequest,
  ApiResponse
} from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

export const VoteApi = {
  /**
   * 동아리의 투표 목록 조회
   * GET /v1/clubs/{clubId}/votes
   */
  getVoteListByClub: async (clubId: number): Promise<VoteListResponse[]> => {
    const url = `${BASE_URL}${API_PREFIX}/clubs/${clubId}/votes`;
    const response = await fetchClient<ApiResponse<VoteListResponse[]>>(url, {
      method: 'GET',
      auth: true
    });
    return response.data;
  },

  /**
   * 투표 상세 조회
   * GET /v1/votes/{voteId}
   */
  getVoteDetail: async (voteId: number): Promise<VoteResponse> => {
    const url = `${BASE_URL}${API_PREFIX}/votes/${voteId}`;
    const response = await fetchClient<ApiResponse<VoteResponse>>(url, {
      method: 'GET',
      auth: true
    });
    return response.data;
  },

  /**
   * 투표 생성
   * POST /v1/chat-rooms/{chatRoomId}/votes
   */
  createVote: async (chatRoomId: number, payload: VoteCreateRequest): Promise<VoteResponse> => {
    const url = `${BASE_URL}${API_PREFIX}/chat-rooms/${chatRoomId}/votes`;
    const response = await fetchClient<ApiResponse<VoteResponse>>(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      auth: true
    });
    return response.data;
  },

  /**
   * 투표 참여
   * POST /v1/votes/{voteId}/participate
   */
  participateVote: async (voteId: number, payload: VoteParticipateRequest): Promise<VoteResponse> => {
    const url = `${BASE_URL}${API_PREFIX}/votes/${voteId}/participate`;
    const response = await fetchClient<ApiResponse<VoteResponse>>(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      auth: true
    });
    return response.data;
  },

  /**
   * 투표 조기 마감
   * PATCH /v1/votes/{voteId}/close
   */
  closeVote: async (voteId: number): Promise<VoteResponse> => {
    const url = `${BASE_URL}${API_PREFIX}/votes/${voteId}/close`;
    const response = await fetchClient<ApiResponse<VoteResponse>>(url, {
      method: 'PATCH',
      auth: true
    });
    return response.data;
  },

  /**
   * 투표 삭제
   * DELETE /v1/votes/{voteId}
   */
  deleteVote: async (voteId: number): Promise<void> => {
    const url = `${BASE_URL}${API_PREFIX}/votes/${voteId}`;
    await fetchClient<ApiResponse<null>>(url, {
      method: 'DELETE',
      auth: true
    });
  }
};