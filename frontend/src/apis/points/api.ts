import fetchClient from '../fetchClient';
import type { UserPointLedgerResponse } from './response';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

export const PointsApi = {
  getAllLedgers: async (clubId: number): Promise<UserPointLedgerResponse[]> => {
    const url = `${BASE_URL}${API_PREFIX}/point/${clubId}`;
    const response = await fetchClient<{success: boolean, data: UserPointLedgerResponse[]}>(url, {
      method: 'GET',
      auth: true
    });
    return response.data;
  },

  getClubPoints: async (clubId: number): Promise<number> => {
    const url = `${BASE_URL}${API_PREFIX}/point/club/${clubId}`;
    const response = await fetchClient<{success: boolean, data: number}>(url, {
      method: 'GET',
      auth: true
    });
    return response.data;
  }
};