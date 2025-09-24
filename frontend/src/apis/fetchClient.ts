const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_PREFIX = import.meta.env.VITE_API_PREFIX;

// 토큰 관리 클래스
class TokenManager {
  private accessToken: string | null = null;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string | null) => void> = [];

  // Access Token 관리
  getAccessToken(): string | null {
    return this.accessToken || localStorage.getItem("accessToken");
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
    localStorage.setItem("accessToken", token);
  }

  removeAccessToken(): void {
    this.accessToken = null;
    localStorage.removeItem("accessToken");
  }

  // 토큰 새로고침
  async refreshAccessToken(): Promise<string | null> {
    if (this.isRefreshing) {
      // 이미 새로고침 중이면 대기
      return new Promise((resolve) => {
        this.refreshSubscribers.push(resolve);
      });
    }

    this.isRefreshing = true;

    try {
      const response = await fetch(`${BASE_URL}${API_PREFIX}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // refresh token 쿠키 전송
      });

      if (response.ok) {
        // Authorization 헤더에서 새 access token 추출
        const authHeader = response.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const newToken = authHeader.substring(7);
          this.setAccessToken(newToken);

          // 대기 중인 요청들에게 새 토큰 전달
          this.refreshSubscribers.forEach(callback => callback(newToken));
          this.refreshSubscribers = [];

          return newToken;
        }
      } else {
        // Refresh 실패 - 로그인 필요
        this.removeAccessToken();
        this.refreshSubscribers.forEach(callback => callback(null));
        this.refreshSubscribers = [];

        // 로그인 페이지로 리다이렉트 (필요시)
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          alert('로그인 세션이 만료되었습니다!\n다시 로그인 해주세요!');
          // 로컬스토리지도 완전히 정리
          localStorage.clear();
          window.location.href = '/login';
        }

        return null;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.removeAccessToken();
      this.refreshSubscribers.forEach(callback => callback(null));
      this.refreshSubscribers = [];

      // 토큰 갱신 실패 시 로그인 페이지로 리다이렉트
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        alert('로그인 세션이 만료되었습니다!\n다시 로그인 해주세요!');
        localStorage.clear();
        window.location.href = '/login';
      }

      return null;
    } finally {
      this.isRefreshing = false;
    }

    return null;
  }

  // 로그인 시 토큰 추출
  extractTokenFromResponse(response: Response): void {
    const authHeader = response.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      this.setAccessToken(authHeader.substring(7));
    }
  }
}

// 토큰 매니저 인스턴스
const tokenManager = new TokenManager();

// fetchClient 옵션 타입
interface FetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: HeadersInit;
  auth?: boolean;
  asText?: boolean;
  skipTokenRefresh?: boolean; // refresh 요청 시 무한 루프 방지
}

// 공통 fetch 클라이언트
const fetchClient = async <T>(url: string, options: FetchOptions = {}): Promise<T> => {
  const { auth = true, asText = false, skipTokenRefresh = false, ...rest } = options;
  const h = new Headers(rest.headers);

  // JSON 바디 전송 시 content-type 자동 설정
  const isJsonBody =
    rest.body && !(rest.body instanceof FormData) && !h.has("Content-Type");
  if (isJsonBody) h.set("Content-Type", "application/json");

  // Authorization 헤더 자동 추가
  if (auth) {
    const token = tokenManager.getAccessToken();
    if (token) h.set("Authorization", `Bearer ${token}`);
  }

  // 첫 번째 요청
  let res = await fetch(url, {
    method: rest.method || "GET",
    headers: h,
    credentials: "include", // refresh token 쿠키 처리
    ...rest,
  });

  // 401 에러 시 토큰 새로고침 시도
  if (res.status === 401 && auth && !skipTokenRefresh && !url.includes('/auth/')) {
    const newToken = await tokenManager.refreshAccessToken();

    if (newToken) {
      // 새 토큰으로 재시도
      h.set("Authorization", `Bearer ${newToken}`);
      res = await fetch(url, {
        method: rest.method || "GET",
        headers: h,
        credentials: "include",
        ...rest,
      });
    }
  }

  // 로그인/회원가입 응답에서 토큰 추출
  if (res.ok && (url.includes('/auth/login'))) {
    tokenManager.extractTokenFromResponse(res);
  }

  // 에러 처리
  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (res.status === 403) {
    console.log(40333333333333333)
    throw new Error("FORBIDDEN");
  }
  if (!res.ok) {
    const responseText = await res.text().catch(() => "");
    const error = new Error(responseText || `HTTP_${res.status}`);
    (error as any).responseText = responseText;
    throw error;
  }

  if (asText) return (await res.text()) as unknown as T;

  // JSON 응답 가정
  return (await res.json()) as T;
};

// 편의 함수들
export const setToken = (token: string): void => {
  tokenManager.setAccessToken(token);
};

export const removeToken = (): void => {
  tokenManager.removeAccessToken();
};

export const getToken = (): string | null => {
  return tokenManager.getAccessToken();
};

export const logout = async (): Promise<void> => {
  try {
    await fetchClient(`${BASE_URL}${API_PREFIX}/auth/logout`, {
      method: 'POST',
      skipTokenRefresh: true, // 로그아웃 시에는 토큰 새로고침 안함
    });
  } catch (error) {
    console.warn('Logout API call failed:', error);
  } finally {
    tokenManager.removeAccessToken();
  }
};

export default fetchClient;
export { BASE_URL, API_PREFIX };