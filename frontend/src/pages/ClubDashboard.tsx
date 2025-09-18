import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Notification from './Notification';
import MascotChangeModal from '../components/MascotChangeModal';
import { useRouter } from '../hooks/useRouter';

interface ClubDashboardProps {
  onNavigateToOnboarding: () => void;
  currentRoute?: string;
}

const ClubDashboard: React.FC<ClubDashboardProps> = ({
  onNavigateToOnboarding
}) => {
  const { navigate } = useRouter();
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showMascotModal, setShowMascotModal] = useState(false);
  const [currentMascotId, setCurrentMascotId] = useState(1);

  const handleMascotChange = async (mascotId: number): Promise<void> => {
    try {
      // TODO: 실제 API 호출로 교체
      // await fetch('/api/clubs/mascot', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ mascotId, clubId: 'current-club-id' })
      // });

      // 임시 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCurrentMascotId(mascotId);
      console.log('마스코트 변경 성공:', mascotId);
    } catch (error) {
      console.error('마스코트 변경 실패:', error);
      throw new Error('마스코트 변경에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f5] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-200 rounded-full opacity-20 animate-drift"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-yellow-200 rounded-full opacity-25 animate-drift-reverse"></div>
        <div className="absolute bottom-32 left-20 w-28 h-28 bg-pink-200 rounded-full opacity-15 animate-drift"></div>
        <div className="absolute bottom-60 right-32 w-20 h-20 bg-blue-200 rounded-full opacity-30 animate-drift-reverse"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-purple-200 rounded-full opacity-20 animate-drift"></div>
        <div className="absolute top-1/3 right-1/3 w-36 h-36 bg-green-200 rounded-full opacity-10 animate-drift-reverse"></div>
        <div className="absolute bottom-20 right-10 w-22 h-22 bg-orange-300 rounded-full opacity-25 animate-drift"></div>
      </div>

      <div className="flex relative z-10">
        {/* Left Sidebar */}
        <Sidebar
          onNavigateToOnboarding={onNavigateToOnboarding}
          onShowNotification={() => setShowNotificationModal(true)}
        />

        {/* Main Content */}
        <div className="flex-1 p-8">
          {/* Club Info Header */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-6 mb-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-24 h-16 bg-orange-200 rounded-xl flex items-center justify-center">
                  <img
                    src={`/images/mas_${currentMascotId}.png`}
                    alt="동아리 마스코트"
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-700 font-jua">코스모스</h1>
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-gowun">
                    스터디
                  </span>
                </div>
              </div>
              <button className="bg-slate-400 hover:bg-slate-500 text-gray-800 px-6 py-3 rounded-xl font-jua transition-colors flex items-center gap-2 shadow-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                동아리원 관리
              </button>
            </div>
            <p className="text-gray-600 mt-4 font-jua">
              함께 성장하는 개발자들의 모임입니다. 매주 알고리즘 문제를 풀고
              프로젝트를 진행하며 서로의 실력을 향상시켜나가고 있어요.
            </p>
          </div>

          {/* Dashboard Circular Layout */}
          <div className="relative w-full h-[800px] flex items-center justify-center">
            {/* Central Mascot Card - 완전한 원형 */}
            <div className="absolute bg-orange-50 rounded-full shadow-2xl border border-orange-100 w-96 h-96 flex flex-col items-center justify-center z-10 top-60">
              <div className="w-40 h-40 flex items-center justify-center mb-1 pt-8">
                <img
                  src={`/images/mas_${currentMascotId}.png`}
                  alt="마스코트"
                  className="w-48 h-48 object-contain animate-bounce-slow"
                />
              </div>
              <h2 className="text-lg font-semibold text-gray-700 font-jua mb-2 pt-14">코스모스</h2>
              <div className="text-2xl font-bold text-orange-500 font-jua mb-3">2,450점</div>
              <div className="w-20 h-2 bg-orange-200 rounded-full">
                <div className="w-16 h-2 bg-orange-500 rounded-full"></div>
              </div>

              {/* 마스코트 변경 버튼 - 원형 카드의 오른쪽 하단 */}
              <button
                onClick={() => setShowMascotModal(true)}
                className="absolute bottom-28 right-12 w-16 h-16 bg-gradient-to-br from-green-100 to-lime-100 hover:from-green-200 hover:to-lime-200 rounded-full shadow-lg border-2 border-white hover:border-green-200 flex items-center justify-center transition-all duration-300 transform hover:scale-110 group"
                title="마스코트 변경"
              >
                <img
                  src="/images/button/masChange.png"
                  alt="마스코트 변경"
                  className="w-16 h-16 object-contain"
                />
              </button>
            </div>

            {/* 동아리 전체 채팅방 - 중앙 위쪽, 매우 가깝게 */}
            <div className="absolute top-0 bg-blue-50 rounded-full shadow-xl border border-blue-200 w-56 h-56 flex flex-col items-center justify-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-blue-600 text-lg">💬</span>
              </div>
              <h3 className="text-base font-bold text-gray-700 font-jua mb-2 text-center">
                동아리<br />
                전체 채팅방
              </h3>
              <button
                onClick={() => navigate('chat')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full font-jua transition-colors text-sm">
                입장하기
              </button>
            </div>

            {/* 회비 납부 알림 - 좌상단, 겹치도록 가깝게 */}
            <div className="absolute top-8 left-44 bg-yellow-50 rounded-full shadow-xl border border-yellow-200 w-72 h-72 flex flex-col items-center justify-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-yellow-600 text-lg">💰</span>
              </div>
              <h3 className="text-base font-bold text-gray-700 font-jua mb-2">회비 납부 알림</h3>
              <p className="text-sm text-gray-600 font-jua text-center px-2">
                납부하지 않은<br />
                회비 내역이 있습니다.
              </p>
              <div className="mt-2 bg-yellow-100 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-600 font-jua">제 3회차 정기 납부</span>
              </div>
            </div>

            {/* 진행 중인 정산 - 좌하단, 겹치도록 가깝게 */}
            <div className="absolute bottom-20 left-40 bg-pink-50 rounded-full shadow-xl border border-pink-200 w-72 h-72 flex flex-col items-center justify-center">
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-pink-600 text-lg">💸</span>
              </div>
              <h3 className="text-base font-bold text-gray-700 font-jua mb-2">진행 중인 정산</h3>
              <div className="space-y-2 text-center">
                <div className="bg-white rounded-lg px-3 py-1 shadow-sm border border-pink-100">
                  <span className="text-sm text-gray-600 font-jua">정기 회식 정산</span>
                </div>
                <div className="bg-white rounded-lg px-3 py-1 shadow-sm border border-pink-100">
                  <span className="text-sm text-gray-600 font-jua">MT 정산</span>
                </div>
                <div className="bg-white rounded-lg px-3 py-1 shadow-sm border border-pink-100">
                  <span className="text-sm text-gray-600 font-jua">번개 모임 정산</span>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-pink-500 text-sm font-jua">3개 활성</span>
              </div>
            </div>

            {/* 진행 중인 투표 - 우상단, 겹치도록 가깝게 */}
            <div className="absolute top-8 right-44 bg-purple-50 rounded-full shadow-xl border border-purple-200 w-72 h-72 flex flex-col items-center justify-center">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-purple-600 text-lg">📊</span>
              </div>
              <h3 className="text-base font-bold text-gray-700 font-jua mb-2">진행 중인 투표</h3>
              <div className="space-y-2 text-center">
                <div className="bg-white rounded-lg px-3 py-1 shadow-sm border border-purple-100">
                  <span className="text-sm text-gray-600 font-jua">스터디 주제</span>
                </div>
                <div className="bg-white rounded-lg px-3 py-1 shadow-sm border border-purple-100">
                  <span className="text-sm text-gray-600 font-jua">모임 장소 선정</span>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-purple-500 text-sm font-jua">2개 진행중</span>
              </div>
            </div>

            {/* 진행 중인 모임 - 우하단, 겹치도록 가깝게 */}
            <div className="absolute bottom-20 right-40 bg-green-50 rounded-full shadow-xl border border-green-200 w-72 h-72 flex flex-col items-center justify-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-green-600 text-lg">👥</span>
              </div>
              <h3 className="text-base font-bold text-gray-700 font-jua mb-2">진행 중인 모임</h3>
              <div className="space-y-2 text-center">
                <div className="bg-white rounded-lg px-3 py-1 shadow-sm border border-green-100">
                  <span className="text-sm text-gray-600 font-jua">프로젝트팀</span>
                </div>
                <div className="bg-white rounded-lg px-3 py-1 shadow-sm border border-green-100">
                  <span className="text-sm text-gray-600 font-jua">카페 모임</span>
                </div>
                <div className="bg-white rounded-lg px-3 py-1 shadow-sm border border-green-100">
                  <span className="text-sm text-gray-600 font-jua">알고리즘 스터디</span>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-green-500 text-sm font-jua">3개 활성</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-700 font-jua">알림</h2>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-0">
              <Notification onNavigateToOnboarding={onNavigateToOnboarding} />
            </div>
          </div>
        </div>
      )}

      {/* Mascot Change Modal */}
      <MascotChangeModal
        isOpen={showMascotModal}
        onClose={() => setShowMascotModal(false)}
        onMascotChange={handleMascotChange}
        currentMascotId={currentMascotId}
        clubId={1} // TODO: 실제 클럽 ID로 교체
      />
    </div>
  );
};

export default ClubDashboard;