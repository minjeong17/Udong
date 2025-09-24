import fetchClient from '../fetchClient';
import type { InventoryResponse } from './response';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

export const InventoryApi = {
  getUserInventory: async (clubId: number): Promise<InventoryResponse[]> => {
    const url = `${BASE_URL}${API_PREFIX}/items/inv/${clubId}`;
    const response = await fetchClient<{success: boolean, data: InventoryResponse[]}>(url, {
      method: 'GET',
      auth: true
    });
    return response.data;
  },

  useItem: async (clubId: number, itemId: number): Promise<InventoryResponse> => {
    const url = `${BASE_URL}${API_PREFIX}/items/use/${clubId}/${itemId}`;
    const response = await fetchClient<{success: boolean, data: InventoryResponse}>(url, {
      method: 'POST',
      auth: true
    });
    return response.data;
  }
};