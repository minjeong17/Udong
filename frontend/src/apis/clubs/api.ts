import fetchClient from '../fetchClient';
import type { ClubCreateRequest } from './request';
import type { ClubCreateResponse, ClubListResponse, MascotResponse, MemberResponse, ChangeRoleRequest } from './response';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1'

export const ClubApi = {
  create: async (payload: ClubCreateRequest): Promise<ClubCreateResponse> => {
    console.log(payload);
    const url = `${BASE_URL}${API_PREFIX}/clubs`;
    const response = await fetchClient<{success: boolean, data: ClubCreateResponse}>(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      auth: true
    });
    return response.data;
  },

  getClubDetails: async (clubId: number): Promise<ClubCreateResponse> => {
    const url = `${BASE_URL}${API_PREFIX}/clubs/${clubId}`;
    const response = await fetchClient<{success: boolean, data: ClubCreateResponse}>(url, {
      method: 'GET',
      auth: true
    });
    return response.data;
  },

  getMyClubs: async (): Promise<ClubListResponse[]> => {
    const url = `${BASE_URL}${API_PREFIX}/me/clubs`;
    const response = await fetchClient<{success: boolean, data: ClubListResponse[]}>(url, {
      method: 'GET',
      auth: true
    });
    return response.data;
  },

  joinWithCode: async (inviteCode: string): Promise<void> => {
    const url = `${BASE_URL}${API_PREFIX}/clubs/join-by-code`;
    await fetchClient<{success: boolean}>(url, {
      method: 'POST',
      body: JSON.stringify({ code: inviteCode }),
      auth: true
    });
  },

  getActiveMascot: async (clubId: number): Promise<MascotResponse | null> => {
    const url = `${BASE_URL}${API_PREFIX}/clubs/${clubId}/mascot`;
    try {
      const response = await fetchClient<{success: boolean, data: MascotResponse}>(url, {
        method: 'GET',
        auth: true
      });
      return response.data;
    } catch (error) {
      // 마스코트가 없는 경우 null 반환
      return null;
    }
  },

  // 동아리 멤버 관리 API
  getClubMembers: async (clubId: number, query?: string, role?: string): Promise<MemberResponse[]> => {
    const url = `${BASE_URL}${API_PREFIX}/clubs/${clubId}/members/all`;
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (role) params.append('role', role);

    const finalUrl = params.toString() ? `${url}?${params.toString()}` : url;

    const response = await fetchClient<{success: boolean, data: MemberResponse[]}>(finalUrl, {
      method: 'GET',
      auth: true
    });
    return response.data;
  },

  changeRole: async (clubId: number, memberId: number, role: string): Promise<void> => {
    const url = `${BASE_URL}${API_PREFIX}/clubs/${clubId}/members/role`;
    await fetchClient<{success: boolean}>(url, {
      method: 'POST',
      body: JSON.stringify({ memberId, role }),
      auth: true
    });
  },

  kickMember: async (clubId: number, memberId: number, reason?: string): Promise<void> => {
    const url = `${BASE_URL}${API_PREFIX}/clubs/${clubId}/members/${memberId}`;
    const body = reason ? { reason } : undefined;
    await fetchClient<{success: boolean}>(url, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
      auth: true
    });
  },

  transferLeader: async (clubId: number, userId: number): Promise<void> => {
    const url = `${BASE_URL}${API_PREFIX}/clubs/${clubId}/members/${userId}/role`;
    await fetchClient<{success: boolean}>(url, {
      method: 'POST',
      auth: true
    });
  }
};