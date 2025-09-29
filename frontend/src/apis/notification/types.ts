// 백엔드 NotificationResponse DTO와 매핑
export interface NotificationResponse {
  notificationDeliveryId: number; // 읽음 처리를 위한 delivery ID
  payload: string;                // 알림 내용
  type: string;                   // 알림 타입
  targetId: number;               // 클릭 시 이동할 대상 ID
  hasRead: boolean;               // 읽음 여부
  createdAt: string;              // ISO 문자열 형태
}

// 백엔드 NotificationRequest DTO와 매핑
export interface NotificationRequest {
  payload: string;
  type: string;
  targetId: number;
  createdBy: number;
  userIds: number[];              // 수신자 목록
}

// 페이지네이션 응답
export interface NotificationPageResponse {
  content: NotificationResponse[];
  pageable: {
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    pageSize: number;
    pageNumber: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

// API 응답 래퍼 타입
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  status: number;
}