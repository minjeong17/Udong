// 회비 요청 생성 요청 타입
export interface CreateDuesRequest {
  membershipDues: number;
  selectedUserIds?: number[]; // undefined면 전체 회원, 값이 있으면 선택된 회원만
}

// 납부 상태 변경 요청 타입
export interface UpdatePaymentStatusRequest {
  paymentStatus: number; // 0: 미납, 1: 납부완료
}

// 회비 결제 요청 타입
export interface PayDuesRequest {
  originalAmount: number;
  discountAmount: number;
}