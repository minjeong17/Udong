// 회비 요청 생성 응답 타입
export interface CreateDuesResponse {
  duesId: number;
  duesNo: number;
  membershipDues: number;
  createdAt: string;
}

// 회비 요청 목록 응답 타입
export interface DuesListResponse {
  duesList: DuesItem[];
}

export interface DuesItem {
  duesId: number;
  duesNo: number;
  membershipDues: number;
  createdAt: string;
}

// 특정 회차 납부 현황 응답 타입
export interface DuesStatusResponse {
  duesId: number;
  duesNo: number;
  membershipDues: number;
  createdAt: string;
  totalMembers: number;
  completedCount: number;
  unpaidCount: number;
  memberStatuses: MemberStatusItem[];
}

export interface MemberStatusItem {
  userId: number;
  userName: string;
  userEmail: string;
  paymentStatus: number; // 0: 미납, 1: 납부완료
  statusUpdatedAt: string;
}

// 납부 상태 변경 응답 타입
export interface UpdatePaymentStatusResponse {
  userId: number;
  paymentStatus: number;
  updatedAt: string;
}

// 현재 회차 정보 응답 타입
export interface CurrentDuesResponse {
  currentDuesNo: number;
  duesId?: number;
  membershipDues?: number;
  createdAt?: string;
}

// 납부 통계 요약 응답 타입
export interface DuesSummaryResponse {
  duesId: number;
  duesNo: number;
  totalMembers: number;
  completedCount: number;
  unpaidCount: number;
  membershipDues: number;
}

// 현재 사용자의 미납 회비 목록 응답 타입
export interface MyUnpaidDuesResponse {
  unpaidDuesList: MyUnpaidDuesItem[];
}

export interface MyUnpaidDuesItem {
  duesId: number;
  duesNo: number;
  membershipDues: number;
  createdAt: string;
}