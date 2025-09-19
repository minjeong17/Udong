import fetchClient from '../fetchClient';
import type { ClubCreateRequest } from './request';
import type { ClubCreateResponse } from './response';

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
  }
};