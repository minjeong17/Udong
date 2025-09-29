// Item API 관련 타입 정의

// 백엔드 ItemResponse와 매핑
export interface ItemResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  createdAt: string;
}

// 백엔드 InventoryResponse와 매핑 (실제 API 응답 구조)
export interface InventoryResponse {
  itemId: number;
  itemName: string;
  qty: number;
}

// API 공통 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string;
}