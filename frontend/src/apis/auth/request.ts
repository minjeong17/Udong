// 회원가입 요청 타입
export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  university?: string;
  major?: string;
  residence?: string;
  phone?: string;
  gender: 'M' | 'F';
  account: string;
  availability?: AvailabilityItem[];
}

// 활동 가능 시간 타입
export interface AvailabilityItem {
  dayOfWeek: number;    // 0-6 (Sunday-Saturday)
  startTime: string;    // Format: "HH:mm"
  endTime: string;      // Format: "HH:mm"
}

// 로그인 요청 타입
export interface SignInRequest {
  email: string;
  password: string;
}