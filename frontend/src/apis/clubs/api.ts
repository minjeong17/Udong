import fetchClient from '../fetchClient';
import type { ClubCreateRequest } from './request';
import type { ClubCreateResponse, ClubListResponse } from './response';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1'

export const ClubApi = {
  create: async (payload: ClubCreateRequest): Promise<ClubCreateResponse> => {
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
      auth: false
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
  }
};