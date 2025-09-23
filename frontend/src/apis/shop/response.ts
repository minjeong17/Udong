export interface ItemResponse {
  id: number;
  name: string;
  description: string;
  price: number;
}

export interface InventoryResponse {
  id: number;        // inventoryId
  itemId: number;    // FK: Item.id
  itemName: string;  // 조인된 아이템 이름
  qty: number;       // 보유 개수
}

export interface UserPointLedgerResponse {
  codeName: string;
  delta: number;        // 변동값
  currPoint: number;    // 변동 후 잔여 포인트
  memo: string;
  createdAt: string;    // LocalDateTime → string
}

