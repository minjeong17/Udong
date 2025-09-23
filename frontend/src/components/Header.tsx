import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { useLogout } from '../hooks/useLogout';

interface HeaderProps {
  onNavigateToOnboarding: () => void;
  variant?: 'default' | 'onboarding';
  onLoginClick?: () => void;
  onBackClick?: () => void;
  showBackButton?: boolean;
  currentRoute?: string;
}

const Header: React.FC<HeaderProps> = ({
  onNavigateToOnboarding,
  variant = 'default',
  onLoginClick,
  onBackClick,
  showBackButton = false,
  currentRoute
}) => {
  // Zustand store에서 로그인 상태 가져오기
  const { isAuthenticated } = useAuthStore();

  // 로그아웃 커스텀 훅 사용
  const { handleLogout } = useLogout();

  // 온보딩 페이지가 아닌 모든 페이지에서 뒤로가기 버튼 표시
  const shouldShowBackButton = showBackButton || (currentRoute && currentRoute !== 'onboarding');
  if (variant === 'onboarding') {
    return (
      <header className="w-full py-6">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {shouldShowBackButton && (
              <button
                onClick={() => onBackClick ? onBackClick() : window.history.back()}
                className="text-gray-600 hover:text-orange-500 transition-colors cursor-pointer p-2 rounded-lg hover:bg-orange-100 active:scale-95"
                title="뒤로 가기"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <button
              onClick={onNavigateToOnboarding}
              className="text-orange-500 text-lg font-medium font-jua hover:text-orange-600 transition-colors cursor-pointer"
              title="홈으로 가기"
            >
              우동 - 우리들의 동아리
            </button>
          </div>
          {isAuthenticated ? (
            <button
              onClick={() => handleLogout(onNavigateToOnboarding)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-medium font-gowun transition-colors"
            >
              로그아웃
            </button>
          ) : (
            <button
              onClick={onLoginClick}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-medium font-gowun transition-colors"
            >
              로그인
            </button>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="absolute top-0 left-0 w-full py-6 z-50">
      <div className="w-full px-16 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {shouldShowBackButton && (
            <button
              onClick={() => onBackClick ? onBackClick() : window.history.back()}
              className="text-gray-600 hover:text-orange-500 transition-colors cursor-pointer p-2 rounded-lg hover:bg-orange-100 active:scale-95"
              title="뒤로 가기"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <button
            onClick={onNavigateToOnboarding}
            className="text-orange-500 text-lg font-medium font-jua hover:text-orange-600 transition-colors cursor-pointer"
            title="홈으로 가기"
          >
            우동 - 우리들의 동아리
          </button>
        </div>
        {isAuthenticated ? (
          <button
            onClick={() => handleLogout(onNavigateToOnboarding)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-2xl font-medium font-jua transition-colors text-sm shadow-sm hover:shadow-md"
            title="로그아웃"
          >
            로그아웃
          </button>
        ) : (
          <button
            onClick={onNavigateToOnboarding}
            className="text-2xl hover:text-orange-500 transition-colors cursor-pointer p-2 rounded-lg hover:bg-orange-100 active:scale-95"
            title="홈으로 가기"
          >
            🏠
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;