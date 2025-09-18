import fetchClient, { BASE_URL, API_PREFIX, logout, getToken } from '../fetchClient';
import type { SignUpRequest, SignInRequest } from './request';

export const AuthApi = {
  /* 회원가입 요청 */
  signUp: async (payload: SignUpRequest): Promise<void> => {
    const url = `${BASE_URL}${API_PREFIX}/users/signup`;
    await fetchClient(url, {
      method: "POST",
      body: JSON.stringify(payload),
      auth: false, // 회원가입은 토큰 불필요
    });
    // 성공하면 그냥 return, 실패하면 fetchClient에서 throw
  },

  /* 로그인 요청 */
  signIn: async (payload: SignInRequest): Promise<number> => {
    const url = `${BASE_URL}${API_PREFIX}/auth/login`;
    const response = await fetchClient<{success: boolean, data: number, status: number}>(url, {
      method: "POST",
      body: JSON.stringify(payload),
      auth: false, // 로그인은 토큰 불필요
    });
    // 성공하면 access token이 자동으로 저장됨 (fetchClient에서 처리)
    // refresh token은 HttpOnly 쿠키로 자동 설정됨
    return response.data; // userId 반환
  },

  /* 로그아웃 요청 */
  logout: async (): Promise<void> => {
    await logout(); // fetchClient의 logout 함수 사용
  },

  /* 인증 상태 확인 */
  isAuthenticated: (): boolean => {
    return !!getToken();
  },
};