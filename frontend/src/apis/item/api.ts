import fetchClient from '../fetchClient';
import type {
  ItemResponse,
  InventoryResponse,
  ApiResponse
} from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

export const ItemApi = {
  /**
   * 전체 아이템 목록 조회
   * GET /v1/items
   */
  getAllItems: async (): Promise<ItemResponse[]> => {
    const url = `${BASE_URL}${API_PREFIX}/items`;
    const response = await fetchClient<ApiResponse<ItemResponse[]>>(url, {
      method: 'GET',
      auth: true
    });
    return response.data;
  },

  /**
   * 단일 아이템 조회
   * GET /v1/items/{itemId}
   */
  getItem: async (itemId: number): Promise<ItemResponse> => {
    const url = `${BASE_URL}${API_PREFIX}/items/${itemId}`;
    const response = await fetchClient<ApiResponse<ItemResponse>>(url, {
      method: 'GET',
      auth: true
    });
    return response.data;
  },

  /**
   * 사용자 인벤토리 조회
   * GET /v1/items/inv/{clubId}
   */
  getInventory: async (clubId: number): Promise<InventoryResponse[]> => {
    const url = `${BASE_URL}${API_PREFIX}/items/inv/${clubId}`;
    const response = await fetchClient<ApiResponse<InventoryResponse[]>>(url, {
      method: 'GET',
      auth: true
    });
    return response.data;
  },

  /**
   * 아이템 구매 (수량 증가)
   * POST /v1/items/purchase/{clubId}/{itemId}
   */
  purchaseItem: async (clubId: number, itemId: number): Promise<InventoryResponse> => {
    const url = `${BASE_URL}${API_PREFIX}/items/purchase/${clubId}/${itemId}`;
    const response = await fetchClient<ApiResponse<InventoryResponse>>(url, {
      method: 'POST',
      auth: true
    });
    return response.data;
  },

  /**
   * 아이템 사용 (수량 감소)
   * POST /v1/items/use/{clubId}/{itemId}
   */
  useItem: async (clubId: number, itemId: number): Promise<InventoryResponse> => {
    const url = `${BASE_URL}${API_PREFIX}/items/use/${clubId}/${itemId}`;
    const response = await fetchClient<ApiResponse<InventoryResponse>>(url, {
      method: 'POST',
      auth: true
    });
    return response.data;
  }
};