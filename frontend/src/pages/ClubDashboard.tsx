import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import NotificationModal from '../components/NotificationModal';
import MascotChangeModal from '../components/MascotChangeModal';
import DuesPaymentModal from '../components/DuesPaymentModal';
import { useRouter } from '../hooks/useRouter';
import { useAuthStore } from '../stores/authStore';
import { ClubApi } from '../apis/clubs';
import { ClubDuesApi } from '../apis/clubdues';
import { PointsApi } from '../apis/points';
import type { ClubCreateResponse, MascotResponse } from '../apis/clubs/response';
import type { MyUnpaidDuesResponse, MyUnpaidDuesItem } from '../apis/clubdues/response';
import type { UserPointLedgerResponse } from '../apis/points/response';

interface ClubDashboardProps {
  onNavigateToOnboarding: () => void;
  currentRoute?: string;
}

const ClubDashboard: React.FC<ClubDashboardProps> = ({
  onNavigateToOnboarding
}) => {
  const { navigate } = useRouter();
  const clubId = useAuthStore((state) => state.clubId);
  const myRole = useAuthStore((state) => state.myRole);

  // 카테고리 매핑
  const categories = [
    { value: "sports", label: "운동/스포츠" },
    { value: "hobby", label: "취미/여가" },
    { value: "study", label: "학습/스터디" },
    { value: "volunteer", label: "봉사/사회활동" },
    { value: "culture", label: "문화/예술" },
    { value: "technology", label: "기술/IT" },
    { value: "language", label: "언어/외국어" },
    { value: "other", label: "기타" },
  ];

  // 카테고리 변환 함수
  const getCategoryLabel = (categoryValue: string): string => {
    const category = categories.find(cat => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showMascotModal, setShowMascotModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDues, setSelectedDues] = useState<MyUnpaidDuesItem | null>(null);
  const [currentMascotId, setCurrentMascotId] = useState(1);

  const [clubInfo, setClubInfo] = useState<ClubCreateResponse | null>(null);
  const [mascotInfo, setMascotInfo] = useState<MascotResponse | null>(null);
  const [unpaidDues, setUnpaidDues] = useState<MyUnpaidDuesResponse | null>(null);
  const [clubPoints, setClubPoints] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // 동아리 정보와 마스코트 정보 가져오기
  useEffect(() => {
    if (!clubId) return;

    const fetchClubData = async () => {
      try {
        setIsLoading(true);

        // 동아리 정보, 마스코트 정보, 동아리 포인트를 병렬로 가져오기
        const [clubData, mascotData, clubPointsData] = await Promise.all([
          ClubApi.getClubDetails(clubId),
          ClubApi.getActiveMascot(clubId),
          PointsApi.getClubPoints(clubId)
        ]);

        setClubInfo(clubData);
        setMascotInfo(mascotData);
        setClubPoints(clubPointsData);

        // 미납 회비 정보는 별도로 가져오기 (실패해도 다른 데이터에 영향 없음)
        try {
          const unpaidDuesData = await ClubDuesApi.getMyUnpaidDues(clubId);
          setUnpaidDues(unpaidDuesData);
        } catch (error) {
          console.error('Failed to fetch unpaid dues:', error);
          // 미납 회비 조회 실패 시 빈 목록으로 설정
          setUnpaidDues({ unpaidDuesList: [] });
        }

        // 마스코트 ID 업데이트
        if (mascotData) {
          setCurrentMascotId(mascotData.id);
        }
      } catch (error) {
        console.error('Failed to fetch club data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClubData();
  }, [clubId]);

  const handleMascotChange = async (mascotId: number): Promise<void> => {
    if (!clubId) {
      throw new Error('클럽 정보를 찾을 수 없습니다.');
    }

    try {
      // 실제 API 호출
      await ClubApi.activateMascot(clubId, mascotId);

      // 성공 시 현재 마스코트 ID 업데이트
      setCurrentMascotId(mascotId);

      // 마스코트 정보도 새로고침
      try {
        const updatedMascot = await ClubApi.getActiveMascot(clubId);
        setMascotInfo(updatedMascot);
      } catch (error) {
        console.error('마스코트 정보 새로고침 실패:', error);
      }

      console.log('마스코트 변경 성공:', mascotId);
    } catch (error) {
      console.error('마스코트 변경 실패:', error);
      throw new Error('마스코트 변경에 실패했습니다.');
    }
  };

  // 회비 칸 클릭 핸들러
  const handleDuesClick = (dues: MyUnpaidDuesItem) => {
    setSelectedDues(dues);
    setShowPaymentModal(true);
  };

  // 결제 완료 핸들러
  const handlePaymentComplete = async () => {
    if (!clubId) return;

    try {
      // 미납 회비 목록 새로고침
      const unpaidDuesData = await ClubDuesApi.getMyUnpaidDues(clubId);
      setUnpaidDues(unpaidDuesData);
    } catch (error) {
      console.error('Failed to refresh unpaid dues:', error);
      // 실패 시 빈 목록으로 설정
      setUnpaidDues({ unpaidDuesList: [] });
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
        <div className="flex-1 p-2">
          {/* Club Info Header */}
          {clubInfo ? (
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-2 mb-3 border border-orange-200 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-10 bg-orange-200 rounded-lg flex items-center justify-center">
                    {mascotInfo?.imageUrl ? (
                      <img
                        src={mascotInfo.imageUrl}
                        alt="동아리 마스코트"
                        className="w-6 h-6 object-contain rounded"
                      />
                    ) : (
                      <span className="text-orange-600 font-bold text-sm">
                        {clubInfo.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <h1 className="text-lg font-semibold text-gray-700 font-jua">{clubInfo.name}</h1>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-gowun">
                        {getCategoryLabel(clubInfo.category)}
                      </span>
                    </div>
                    <p className="text-gray-600 font-jua">
                      {clubInfo.description}
                    </p>
                  </div>
                </div>
                {/* 회장만 동아리원 관리 버튼 표시 */}
                {myRole === 'LEADER' ? (
                  <button
                    onClick={() => navigate('member-management')}
                    className="bg-slate-400 hover:bg-slate-500 text-gray-800 px-6 py-3 rounded-xl font-jua transition-colors flex items-center gap-2 shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    동아리원 관리
                  </button>
                ) : (
                  <div className="bg-gray-200 text-gray-500 px-6 py-3 rounded-xl font-jua flex items-center gap-2 shadow-md cursor-not-allowed">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    회장 전용 기능
                  </div>
                )}
              </div>
            </div>
          ) : isLoading ? (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-2 mb-3 border border-gray-200 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-10 bg-gray-200 rounded-lg flex items-center justify-center animate-pulse">
                    <span className="text-gray-400 text-xs">⏳</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 bg-gray-300 rounded w-24 animate-pulse"></div>
                      <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-2 mb-3 border border-gray-200 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-xs">?</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <h1 className="text-lg font-semibold text-gray-400 font-jua">동아리 정보 없음</h1>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Circular Layout */}
          <div className="relative w-full h-[650px] flex items-center justify-center">
            {/* Central Mascot Card - 완전한 원형 */}
            <div className="absolute bg-orange-50 rounded-full shadow-2xl border border-orange-100 w-96 h-96 flex flex-col items-center justify-center z-10 top-52">
              <div className="w-40 h-40 flex items-center justify-center mb-1 pt-8">
                {mascotInfo?.imageUrl ? (
                  <img
                    src={mascotInfo.imageUrl}
                    alt="마스코트"
                    className="w-48 h-48 object-contain animate-bounce-slow rounded-2xl"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gradient-to-br from-orange-200 to-orange-300 rounded-3xl flex items-center justify-center animate-bounce-slow">
                    <span className="text-6xl font-bold text-orange-600">
                      {clubInfo?.name?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
              </div>
              <h2 className="text-lg font-semibold text-gray-700 font-jua mb-2 pt-14">
                {clubInfo?.name || '동아리'}
              </h2>
              <div className="text-2xl font-bold text-orange-500 font-jua mb-3">
                {clubPoints}p
              </div>
              <div className="w-20 h-2 bg-orange-200 rounded-full">
                <div
                  className="h-2 bg-orange-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((clubPoints % 1000) / 1000 * 100, 100)}%`
                  }}
                ></div>
              </div>

              {/* 마스코트 변경 버튼 - LEADER, MANAGER만 표시 */}
              {(myRole === 'LEADER' || myRole === 'MANAGER') && (
                <button
                  onClick={() => setShowMascotModal(true)}
                  className="absolute bottom-28 right-12 w-12 h-12 bg-gradient-to-br from-green-100 to-lime-100 hover:from-green-200 hover:to-lime-200 rounded-full shadow-lg border-2 border-white hover:border-green-200 flex items-center justify-center transition-all duration-300 transform hover:scale-110 group"
                  title="마스코트 변경"
                >
                  <img
                    src="/images/button/masChange.png"
                    alt="마스코트 변경"
                    className="w-16 h-16 object-contain"
                  />
                </button>
              )}
            </div>

            {/* 동아리 전체 채팅방 - 중앙 위쪽, 매우 가깝게 */}
            <div className="absolute top-0 bg-blue-50 rounded-full shadow-xl border border-blue-200 w-48 h-48 flex flex-col items-center justify-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-blue-600 text-lg">💬</span>
              </div>
              <h3 className="text-base font-bold text-gray-700 font-jua mb-2 text-center">
                동아리<br />
                전체 채팅방
              </h3>
              <button
                onClick={() => {
                  localStorage.setItem('autoSelectRoom', 'global');
                  navigate('chat');
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full font-jua transition-colors text-sm">
                입장하기
              </button>
            </div>

            {/* 회비 납부 알림 - 좌상단, 겹치도록 가깝게 */}
            {unpaidDues && unpaidDues.unpaidDuesList.length > 0 ? (
              <div className="absolute top-8 left-56 bg-yellow-50 rounded-full shadow-xl border border-yellow-200 w-64 h-64 flex flex-col items-center justify-center">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-yellow-600 text-lg">💰</span>
                </div>
                <h3 className="text-base font-bold text-gray-700 font-jua mb-2">회비 납부 알림</h3>
                <p className="text-sm text-gray-600 font-jua text-center px-2">
                  납부하지 않은<br />
                  회비 내역이 있습니다.
                </p>
                <div className="mt-2 space-y-1 flex flex-col items-center">
                  {unpaidDues.unpaidDuesList.slice(0, 2).map((dues) => (
                    <button
                      key={dues.duesId}
                      onClick={() => handleDuesClick(dues)}
                      className="bg-yellow-100 hover:bg-yellow-200 rounded-lg px-3 py-1 transition-colors"
                    >
                      <span className="text-xs text-gray-600 font-jua">
                        제 {dues.duesNo}회차 ({dues.membershipDues.toLocaleString()}원)
                      </span>
                    </button>
                  ))}
                  {unpaidDues.unpaidDuesList.length > 2 && (
                    <div className="text-xs text-gray-500 font-jua text-center">
                      외 {unpaidDues.unpaidDuesList.length - 2}건
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="absolute top-8 left-56 bg-green-50 rounded-full shadow-xl border border-green-200 w-64 h-64 flex flex-col items-center justify-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-green-600 text-lg">✅</span>
                </div>
                <h3 className="text-base font-bold text-gray-700 font-jua mb-2">회비 납부 현황</h3>
                <p className="text-sm text-gray-600 font-jua text-center px-2">
                  모든 회비가<br />
                  납부 완료되었습니다!
                </p>
              </div>
            )}

            {/* 진행 중인 정산 - 좌하단, 겹치도록 가깝게 */}
            <div className="absolute bottom-0 left-48 bg-pink-50 rounded-full shadow-xl border border-pink-200 w-[17rem] h-[17rem] flex flex-col items-center justify-center">
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
            <div className="absolute top-8 right-56 bg-purple-50 rounded-full shadow-xl border border-purple-200 w-64 h-64 flex flex-col items-center justify-center">
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
            <div className="absolute bottom-0 right-48 bg-green-50 rounded-full shadow-xl border border-green-200 w-[17rem] h-[17rem] flex flex-col items-center justify-center">
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
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onNavigateToOnboarding={onNavigateToOnboarding}
      />

      {/* Mascot Change Modal */}
      <MascotChangeModal
        isOpen={showMascotModal}
        onClose={() => setShowMascotModal(false)}
        onMascotChange={handleMascotChange}
        currentMascotId={currentMascotId}
        clubId={clubId || 1}
      />

      {/* 회비 결제 모달 */}
      {selectedDues && (
        <DuesPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handlePaymentComplete}
          duesInfo={selectedDues}
        />
      )}
    </div>
  );
};

export default ClubDashboard;