import React from 'react';
import Header from '../components/Header';

interface OnboardingProps {
  onNavigateToLogin: () => void;
  onNavigateToClubSelection?: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onNavigateToLogin}) => {

  // 온보딩은 로그인 상태와 관계없이 언제든 접근 가능하도록 변경
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100">
      <Header
        variant="onboarding"
        onNavigateToOnboarding={() => window.location.reload()}
        onLoginClick={onNavigateToLogin}
      />

      {/* Hero Section */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 leading-tight font-jua">
                동아리 운영을
                <br />
                <span className="text-orange-500">스마트하게</span>
                <br />
                시작하세요
              </h1>

              <p className="text-gray-600 text-lg leading-relaxed font-gowun">
                회원 관리부터 회비 정산, 투표, 일정 관리까지 동아리 운영에
                <br />
                필요한 모든 기능을 하나의 플랫폼에서 간편하게 관리하세요.
                <br />
                AI 마스코트와 포인트 시스템으로 더욱 재미있는 동아리 활동
                <br />
                을 만들어보세요.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={onNavigateToLogin}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold font-gowun transition-colors"
              >
                무료로 시작하기
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-96 h-96 bg-orange-200 rounded-3xl flex items-center justify-center">
              <img
                src="/images/udonMascot.png"
                alt="우동 마스코트"
                className="w-full h-full object-contain animate-mascot-wiggle"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-orange-400 text-sm font-medium mb-2">PLATFORM FEATURES</p>
            <h2 className="text-3xl font-bold text-gray-800 font-jua">핵심 기능 소개</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature Card 1 */}
            <div className="bg-gray-50 hover:bg-orange-500 rounded-3xl p-8 text-center hover:shadow-lg transition-all duration-300 group">
              <div className="w-16 h-20 bg-orange-100 group-hover:bg-orange-400 rounded-2xl mx-auto mb-6 flex items-center justify-center transition-colors duration-300">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 group-hover:text-orange-100 mb-4 transition-colors duration-300 font-jua">회원 관리</h3>
              <p className="text-gray-600 group-hover:text-orange-200 text-sm leading-relaxed transition-colors duration-300 font-gowun">
                회원 가입부터 권한 관리까지,
                <br />
                체계적인 멤버 관리
                <br />
                시스템으로 동아리를
                <br />
                효율적으로 운영하세요
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-gray-50 hover:bg-orange-500 rounded-3xl p-8 text-center hover:shadow-lg transition-all duration-300 group">
              <div className="w-16 h-20 bg-orange-100 group-hover:bg-orange-400 rounded-2xl mx-auto mb-6 flex items-center justify-center transition-colors duration-300">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 group-hover:text-orange-100 mb-4 transition-colors duration-300 font-jua">회비 & N빵 정산</h3>
              <p className="text-gray-600 group-hover:text-orange-200 text-sm leading-relaxed transition-colors duration-300 font-gowun">
                투명한 회비 관리와 간편한 N
                <br />
                빵 정산으로 금전 관리의
                <br />
                부담을 덜어드려요
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-gray-50 hover:bg-orange-500 rounded-3xl p-8 text-center hover:shadow-lg transition-all duration-300 group">
              <div className="w-16 h-20 bg-blue-100 group-hover:bg-orange-400 rounded-2xl mx-auto mb-6 flex items-center justify-center transition-colors duration-300">
                <span className="text-2xl">🗳️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 group-hover:text-orange-100 mb-4 transition-colors duration-300 font-jua">투표 시스템</h3>
              <p className="text-gray-600 group-hover:text-orange-200 text-sm leading-relaxed transition-colors duration-300 font-gowun">
                익명/실명 투표 기능으로
                <br />
                민주적인 의사결정을 지원합니다
              </p>
            </div>

            {/* Feature Card 4 */}
            <div className="bg-gray-50 hover:bg-orange-500 rounded-3xl p-8 text-center hover:shadow-lg transition-all duration-300 group">
              <div className="w-16 h-20 bg-green-100 group-hover:bg-orange-400 rounded-2xl mx-auto mb-6 flex items-center justify-center transition-colors duration-300">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 group-hover:text-orange-100 mb-4 transition-colors duration-300 font-jua">포인트</h3>
              <p className="text-gray-600 group-hover:text-orange-200 text-sm leading-relaxed transition-colors duration-300 font-gowun">
                활동 참여도에 따른 포인트
                <br />
                적립으로 동기부여를 제공해요
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Onboarding;