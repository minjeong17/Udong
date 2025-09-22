export interface InventoryItemResponse {
  id: number;        // inventoryId
  itemId: number;    // FK: Item.id
  itemName: string;  // 조인된 아이템 이름
  qty: number;       // 보유 개수
}

export interface PurchaseResponse {
  success: boolean;
  message: string;
  newPoints: number;          // 잔여 포인트
  inventory: InventoryItemResponse; // 갱신된 인벤토리
}

export interface ShopItemResponse {
  id: number;
  name: string;
  description: string;
  price: number;
}