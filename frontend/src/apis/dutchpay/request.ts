export interface PayRequest {
  depositUserId: number; // 입금 받을 사람 (정산을 할 상대방의 사용자 ID)
  amount: number; // 이체 금액
}