import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { AuthApi } from '../apis/auth';
import type { SignInRequest } from '../apis/auth';
import { useAuthStore } from '../stores/authStore';

interface LoginProps {
  onNavigateToOnboarding: () => void;
  onNavigateToSignup?: () => void;
  onNavigateToClubSelection?: () => void;
  currentRoute?: string;
}

const Login: React.FC<LoginProps> = ({ onNavigateToOnboarding, onNavigateToSignup, onNavigateToClubSelection, currentRoute }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Zustand store 사용
  const { isAuthenticated } = useAuthStore();
  const login = useAuthStore((state) => state.login);

  // 이미 로그인 상태면 club-selection으로 자동 리다이렉트
  useEffect(() => {
    if (isAuthenticated && onNavigateToClubSelection) {
      onNavigateToClubSelection();
    }
  }, [isAuthenticated, onNavigateToClubSelection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const loginData: SignInRequest = {
        email,
        password,
      };

      // 로그인 API 호출 - userId 반환
      const userId = await AuthApi.signIn(loginData);

      // userId로 유저 정보 구성
      const user = {
        id: userId,
        // name은 추후 프로필 API에서 가져올 예정
      };

      // Zustand store에 로그인 상태 저장
      login(user);

      // 성공 알림 표시
      alert('로그인 되었습니다! 🎉');

      // 성공 시 club-selection으로 이동
      if (onNavigateToClubSelection) {
        onNavigateToClubSelection();
      }

    } catch (error) {
      console.error('Login failed:', error);
      if (error instanceof Error) {
        if (error.message.includes('UNAUTHORIZED')) {
          setError('이메일 또는 비밀번호가 잘못되었습니다.');
        } else if (error.message.includes('email')) {
          setError('이메일 형식이 올바르지 않습니다.');
        } else {
          setError('로그인에 실패했습니다. 다시 시도해주세요.');
        }
      } else {
        setError('로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f5] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Drifting circles with gentle movement */}
        <div className="absolute top-32 left-8 w-24 h-24 bg-orange-200 rounded-full opacity-8 animate-drift"></div>
        <div className="absolute top-16 right-16 w-20 h-20 bg-orange-300 rounded-full opacity-10 animate-drift-reverse"></div>
        <div className="absolute bottom-24 left-24 w-16 h-16 bg-orange-400 rounded-full opacity-12 animate-drift"></div>
        <div className="absolute bottom-40 right-12 w-18 h-18 bg-orange-200 rounded-full opacity-8 animate-drift-reverse"></div>

        {/* Additional drifting elements */}
        <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-gradient-to-br from-orange-200 to-orange-300 rounded-full opacity-6 animate-drift"></div>
        <div className="absolute bottom-1/3 right-1/4 w-28 h-28 bg-gradient-to-br from-orange-300 to-orange-400 rounded-full opacity-8 animate-drift-reverse"></div>
        <div className="absolute top-1/2 left-10 w-14 h-14 bg-orange-300 rounded-full opacity-10 animate-drift"></div>
        <div className="absolute top-3/4 right-20 w-12 h-12 bg-orange-200 rounded-full opacity-8 animate-drift-reverse"></div>

        {/* Extra floating circles */}
        <div className="absolute top-2/3 left-1/3 w-20 h-20 bg-orange-200 rounded-full opacity-7 animate-drift"></div>
        <div className="absolute top-1/4 right-1/3 w-16 h-16 bg-orange-300 rounded-full opacity-9 animate-drift-reverse"></div>
        <div className="absolute bottom-1/2 left-20 w-22 h-22 bg-orange-400 rounded-full opacity-8 animate-drift"></div>
      </div>

      <Header onNavigateToOnboarding={onNavigateToOnboarding} currentRoute={currentRoute} />

      {/* Main Content */}
      <div className="min-h-screen flex items-center relative z-20">
        {/* Left Side - Login Form */}
        <div className="w-1/2 pl-16 pr-8">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-700 mb-1 font-jua leading-tight">
              우동에
            </h1>
            <h2 className="text-3xl font-semibold mb-4 font-jua">
              <span className="text-orange-500">로그인</span> 하세요!
            </h2>
            <p className="text-gray-600 text-base font-gowun">
              이메일과 비밀번호로 간편하게 <span className="text-orange-500">로그인</span>하고 <span className="text-orange-500">동아리 활동</span>을 시작해보세요
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            {/* Email Field */}
            <div>
              <label className="block text-gray-600 text-sm mb-2 font-gowun">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-3 bg-white border-2 border-gray-200 rounded-md text-gray-500 font-gowun focus:outline-none focus:border-orange-300 placeholder-gray-400 text-sm"
                placeholder="이메일을 입력하세요"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-gray-600 text-sm mb-2 font-gowun">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-3 bg-white border-2 border-gray-200 rounded-md text-gray-500 font-gowun focus:outline-none focus:border-orange-300 placeholder-gray-400 text-sm"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm font-gowun">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-2xl transition-colors border border-orange-400 font-gowun text-base"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-[#fcf9f5] text-gray-400 text-base font-gowun">또는</span>
              </div>
            </div>

            {/* Sign up button */}
            <div className="text-center">
              <button
                onClick={onNavigateToSignup}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-2xl font-medium border border-orange-400 transition-colors font-gowun text-sm"
              >
                회원가입
              </button>
            </div>

            
          </form>

        </div>

        {/* Right Side - Mascot */}
        <div className="w-1/2 flex items-center justify-center">
          <div className="relative">
            <img
              src="/images/udonMascot.png"
              alt="우동 마스코트"
              className="w-72 h-auto object-contain animate-mascot-wiggle"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;