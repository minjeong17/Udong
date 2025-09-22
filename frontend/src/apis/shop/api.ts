import fetchClient from '../fetchClient';
import type { PurchaseRequest } from './request';
import type { InventoryItemResponse, PurchaseResponse, ShopItemResponse } from './response';

// === API 구현 ===
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const API_PREFIX = import.meta.env.VITE_API_PREFIX || "/api/v1";

export const ShopApi = {
  /** 상점 아이템 목록 가져오기 */
  getItems: async (): Promise<ShopItemResponse[]> => {
    const url = `${BASE_URL}${API_PREFIX}/shop/items`;
    const response = await fetchClient<{ success: boolean; data: ShopItemResponse[] }>(url, {
      method: "GET",
      auth: true,
    });
    return response.data;
  },

  /** 내 인벤토리 조회 */
  getInventory: async (): Promise<InventoryItemResponse[]> => {
    const url = `${BASE_URL}${API_PREFIX}/shop/inventory`;
    const response = await fetchClient<{ success: boolean; data: InventoryItemResponse[] }>(url, {
      method: "GET",
      auth: true,
    });
    return response.data;
  },

  /** 아이템 구매 */
  purchase: async (payload: PurchaseRequest): Promise<PurchaseResponse> => {
    const url = `${BASE_URL}${API_PREFIX}/shop/purchase`;
    const response = await fetchClient<{ success: boolean; data: PurchaseResponse }>(url, {
      method: "POST",
      body: JSON.stringify(payload),
      auth: true,
    });
    return response.data;
  },
};