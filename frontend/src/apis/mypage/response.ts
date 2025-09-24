// 공통 래퍼
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  status: number;
}

// 서버 응답 스키마 (백엔드 DTO와 1:1)
export interface MyPageResponse {
  profile: {
    name: string;
    clubName: string;
    joinedAt: string; // ISO
    email: string;
    phone: string;
    university: string;
    major: string | null;
    gender: "M" | "F";
    accountMasked: string; // 서버가 평문 계좌번호 내려줌 (필드명 그대로 사용)
  };
  stats: {
    points: number;
    participatingMeetings: number;
    itemKinds: number;
  };
  items: Array<{
    itemId: number;
    itemName: string;
    itemDescription: string | null;
    qty: number;
  }>;
  availabilities: Array<{
    dayOfWeek: number;        // 1~7 or 0~6 (서버 기준)
    startTime: string;        // "HH:mm:ss"
    endTime: string;          // "HH:mm:ss"
  }>;
}
