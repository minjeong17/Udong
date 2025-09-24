// Vote API 관련 타입 정의

// 백엔드 VoteResponse와 매핑
export interface VoteResponse {
  id: number;
  title: string;
  description?: string;
  endsAt: string; // LocalDateTime -> string
  multiSelect: boolean;
  isActive: boolean;
  createdAt: string;
  createdBy: number;
  createdByName: string;
  chatRoomId: number;
  chatRoomName: string;
  clubId: number;
  isExpired: boolean;
  canParticipate: boolean;
  hasParticipated: boolean;
  totalParticipants: number;
  totalChatMembers: number;
  participationRate: number;
  totalVotes: number;
  options: VoteOptionResponse[];
}

// 백엔드 VoteOptionResponse와 매핑
export interface VoteOptionResponse {
  id: number;
  text: string;
  voteCount: number;
  percentage: number;
  isSelected: boolean;
  myVoteCount: number;
}

// 백엔드 VoteListResponse와 매핑
export interface VoteListResponse {
  id: number;
  title: string;
  endsAt: string;
  multiSelect: boolean;
  isActive: boolean;
  createdAt: string;
  createdBy: number;
  createdByName: string;
  clubId: number;
  isExpired: boolean;
  canParticipate: boolean;
  hasParticipated: boolean;
  totalParticipants: number;
  optionCount: number; // 투표 옵션 개수
}

// 백엔드 VoteCreateRequest와 매핑
export interface VoteCreateRequest {
  title: string;
  description?: string;
  endsAt: string; // LocalDateTime string format
  multiSelect: boolean;
  options: VoteOptionRequest[];
}

// 백엔드 VoteOptionRequest와 매핑
export interface VoteOptionRequest {
  text: string;
}

// 백엔드 VoteParticipateRequest와 매핑
export interface VoteParticipateRequest {
  selections: VoteSelectionRequest[];
}

// 백엔드 VoteSelectionRequest와 매핑
export interface VoteSelectionRequest {
  voteOptionId: number;
  optionCount: number;
}

// API 공통 응답 타입 (기존 notification과 동일)
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string;
}