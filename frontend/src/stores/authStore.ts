import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logout as apiLogout } from '../apis/fetchClient';

// 유저 정보 타입 (최소한의 정보만)
export interface User {
  id: number;
  name?: string;  // 추후 프로필 API에서 가져올 예정
  clubId?: number; 
}

// Auth Store 타입
interface AuthStore {
  // 상태
  isAuthenticated: boolean;
  user: User | null;

  // 액션
  login: (user: User) => void;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setClubId: (clubId: number) => void; 
}

// Zustand Store 생성 (persist로 localStorage에 저장)
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // 초기 상태
      isAuthenticated: false,
      user: null,

      // 로그인 액션
      login: (user: User) => {
        set({
          isAuthenticated: true,
          user,
        });
      },

      // 로그아웃 액션
      logout: async () => {
        try {
          // API 로그아웃 호출 (토큰 삭제 + refresh token 쿠키 제거)
          await apiLogout();
        } catch (error) {
          console.warn('Logout API failed:', error);
        } finally {
          // Store 상태 초기화
          set({
            isAuthenticated: false,
            user: null,
          });
        }
      },

      // 유저 정보 설정
      setUser: (user: User) => {
        set({
          user,
          isAuthenticated: true,
        });
      },

      // 인증 상태 초기화 (토큰 만료 등)
      clearAuth: () => {
        set({
          isAuthenticated: false,
          user: null,
        });
      },

      setClubId: (clubId) =>
        set((state) =>
          state.user
            ? { user: { ...state.user, clubId } }
            : state
        ),
    }),
    {
      name: 'auth-store', // localStorage key
      partialize: (state) => ({
        // 필요한 상태만 localStorage에 저장
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);