import fetchClient from '../fetchClient';
import type { ItemResponse, InventoryResponse, UserPointLedgerResponse } from './response';

// === API 구현 ===
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const API_PREFIX = import.meta.env.VITE_API_PREFIX || "/api/v1";

export const ShopApi = {
  /** 상점 아이템 목록 가져오기 */
  getItems: async (): Promise<ItemResponse[]> => {
    const url = `${BASE_URL}${API_PREFIX}/items`;
    const response = await fetchClient<{ success: boolean; data: ItemResponse[] }>(url, {
      method: "GET",
      auth: true,
    });
    return response.data;
  },

  /** 내 인벤토리 조회 */
  getInventory: async (clubId: number): Promise<InventoryResponse[]> => {
    const url = `${BASE_URL}${API_PREFIX}/items/inv/${clubId}`;
    const response = await fetchClient<{ success: boolean; data: InventoryResponse[] }>(url, {
      method: "GET",
      auth: true,
    });
    return response.data;
  },

  /** 포인트 조회 */
  getPoint: async (clubId: number): Promise<UserPointLedgerResponse> => {
    const url = `${BASE_URL}${API_PREFIX}/point/${clubId}/latest`;
    const response = await fetchClient<{ success: boolean; data: UserPointLedgerResponse }>(url, {
      method: "GET",
      auth: true,
    });
    return response.data;
  },

  /** 아이템 구매 */
  purchase: async (clubId: number, itemId: number): Promise<UserPointLedgerResponse> => {
    const url = `${BASE_URL}${API_PREFIX}/purchase/${clubId}/${itemId}`;
    const response = await fetchClient<{ success: boolean; data: UserPointLedgerResponse }>(url, {
      method: "POST",
      auth: true,
    });
    return response.data;
  },
};