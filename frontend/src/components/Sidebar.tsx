import React, { useState, useEffect } from 'react';
import { useRouter } from '../hooks/useRouter';
import { useLogout } from '../hooks/useLogout';
import { useAuthStore } from '../stores/authStore';
import { ClubApi } from '../apis/clubs';
import { NotificationApi } from '../apis/notification';
import type { ClubCreateResponse, MascotResponse } from '../apis/clubs/response';

interface SidebarProps {
  onNavigateToOnboarding: () => void; // 로그아웃은 특별히 처리
  onShowNotification?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onNavigateToOnboarding,
  onShowNotification
}) => {
  const { navigate } = useRouter();
  const { handleLogout } = useLogout();
  const clubId = useAuthStore((state) => state.clubId);

  const [clubInfo, setClubInfo] = useState<ClubCreateResponse | null>(null);
  const [mascotInfo, setMascotInfo] = useState<MascotResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 미읽음 알림 개수 가져오기
  const loadUnreadCount = async () => {
    if (!clubId) return;
    try {
      const count = await NotificationApi.getUnreadNotificationCount(clubId);
      setUnreadCount(count);
    } catch (error) {
      console.error('미읽음 개수 로드 실패:', error);
    }
  };

  // 동아리 정보와 마스코트 정보 가져오기
  useEffect(() => {
    if (!clubId) return;

    const fetchClubData = async () => {
      try {
        setIsLoading(true);

        // 동아리 정보, 마스코트 정보, 미읽음 개수를 병렬로 가져오기
        const [clubData, mascotData] = await Promise.all([
          ClubApi.getClubDetails(clubId),
          ClubApi.getActiveMascot(clubId)
        ]);

        setClubInfo(clubData);
        setMascotInfo(mascotData);

        // 미읽음 개수도 로드
        await loadUnreadCount();
      } catch (error) {
        console.error('Failed to fetch club data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClubData();
  }, [clubId]);
  return (
    <div className="w-20 bg-white shadow-lg min-h-screen">
      <div className="flex flex-col items-center py-4 space-y-4 h-screen overflow-y-auto sidebar-scrollbar">
        {/* Current Club Info */}
        {clubInfo ? (
          <div
            className="w-16 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-2 mb-2"
            title={`${clubInfo.name} - 현재 동아리`}
          >
            <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center mb-1">
              {mascotInfo?.imageUrl ? (
                <img
                  src={mascotInfo.imageUrl}
                  alt="동아리 마스코트"
                  className="w-8 h-8 object-contain rounded-lg"
                />
              ) : (
                <span className="text-orange-600 font-bold text-sm">
                  {clubInfo.name.charAt(0)}
                </span>
              )}
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-orange-700 font-jua truncate">{clubInfo.name}</p>
              <p className="text-[10px] text-orange-600 font-gowun leading-tight">현재<br/>동아리</p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="w-16 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-2 mb-2">
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mb-1 animate-pulse">
              <span className="text-gray-400 text-xs">⏳</span>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-gray-400 font-jua">로딩중...</p>
              <p className="text-[10px] text-gray-400 font-gowun leading-tight">현재<br/>동아리</p>
            </div>
          </div>
        ) : (
          <div className="w-16 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-2 mb-2">
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mb-1">
              <span className="text-gray-400 text-xs">?</span>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-gray-400 font-jua">동아리 없음</p>
              <p className="text-[10px] text-gray-400 font-gowun leading-tight">현재<br/>동아리</p>
            </div>
          </div>
        )}
        {/* Logout Button */}
        <button
          onClick={() => handleLogout(onNavigateToOnboarding)}
          className="w-14 h-14 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border-2 border-red-200 hover:border-red-300 rounded-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl cursor-pointer group"
          title="로그아웃"
        >
          <img src="/images/button/Logout.png" alt="로그아웃" className="w-14 h-14" />
        </button>

        {/* Navigation Items */}
        <div className="flex flex-col space-y-4">
          {/* 1. 동아리 목록으로 이동 */}
          <button
            onClick={() => navigate('club-list')}
            className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center cursor-pointer hover:from-orange-100 hover:to-orange-150 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl group"
            title="동아리 목록"
          >
            <img src="/images/button/ClubList.png" alt="동아리 목록" className="w-14 h-14" />
          </button>

          {/* 2. 대시보드로 돌아가기 */}
          <button
            onClick={() => navigate('club-dashboard')}
            className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center cursor-pointer hover:from-orange-100 hover:to-orange-150 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl group"
            title="대시보드"
          >
            <img src="/images/button/Home.png" alt="홈" className="w-14 h-14" />
          </button>

          {/* 3. 마이페이지 */}
          <button
            onClick={() => navigate('mypage')}
            className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center cursor-pointer hover:from-orange-100 hover:to-orange-150 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl group" title="마이페이지">
            <img src="/images/button/MyPage.png" alt="마이페이지" className="w-14 h-14" />
          </button>

          {/* 4. 알림창 */}
          <button
            onClick={onShowNotification}
            className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center cursor-pointer hover:from-orange-100 hover:to-orange-150 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl group relative" title="알림">
            <img src="/images/button/Alarm.png" alt="알림" className="w-14 h-14" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{unreadCount}</span>
              </div>
            )}
          </button>

          {/* 5. 공금 사용 내역 */}
          <button
            onClick={() => navigate('club-fund')}
            className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center cursor-pointer hover:from-orange-100 hover:to-orange-150 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl group" title="공금 사용 내역">
            <img src="/images/button/MoneyList.png" alt="공금 사용 내역" className="w-14 h-14" />
          </button>

          {/* 6. 캘린더 */}
          <button
            onClick={() => navigate('calendar')}
            className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center cursor-pointer hover:from-orange-100 hover:to-orange-150 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl group" title="캘린더">
            <img src="/images/button/Calender.png" alt="캘린더" className="w-14 h-14" />
          </button>

          {/* 7. 정산 */}
          <button
            onClick={() => navigate('settlement')}
            className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center cursor-pointer hover:from-orange-100 hover:to-orange-150 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl group" title="정산">
            <img src="/images/button/nbbang.png" alt="정산" className="w-14 h-14" />
          </button>

          {/* 8. 투표 */}
          <button
            onClick={() => navigate('vote')}
            className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center cursor-pointer hover:from-orange-100 hover:to-orange-150 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl group" title="투표">
            <img src="/images/button/Vote.png" alt="투표" className="w-14 h-14" />
          </button>

          {/* 9. 채팅방 */}
          <button
            onClick={() => navigate('chat')}
            className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center cursor-pointer hover:from-orange-100 hover:to-orange-150 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl group" title="채팅방">
            <img src="/images/button/Chat.png" alt="채팅방" className="w-14 h-14" />
          </button>

          {/* 10. 상점 */}
          <button
            onClick={() => navigate('shop')}
            className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center cursor-pointer hover:from-orange-100 hover:to-orange-150 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl group" title="상점">
            <img src="/images/button/Shop.png" alt="상점" className="w-14 h-14" />
          </button>

          {/* 11. MT내용추천 */}
          <button
            onClick={() => navigate('mt-planner')}
            className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center cursor-pointer hover:from-orange-100 hover:to-orange-150 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl group" title="MT추천">
            <img src="/images/button/Mt.png" alt="MT추천" className="w-14 h-14" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;