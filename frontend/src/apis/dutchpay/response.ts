// 공통 응답 wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  status: number;
}

export interface DutchpayListResponse {
  id: number;
  createdAt: string;
  note: string;
  amount: number;
  participantCount: number;
  eventId: number;
  eventTitle: string;
  isDone: boolean;
}

// Dutchpay 상세 응답 인터페이스
export interface DutchpayDetailResponse {
  id: number;
  amount: number;
  note: string;
  createdAt: string;  // LocalDateTime을 string으로 변환하여 처리
  createdBy: string;  // User.name
  createdUserId: number;
  done: boolean;
  isDone?: boolean;
  s3Key: string;
  imageUrl: string;
  event: {
    id: number;
    title: string;
    description: string;
  };  // Event 정보
  participants: {
    userId: number;
    name: string;
    isPaid: boolean;
  }[];  // 참여자 리스트
}

