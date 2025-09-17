import React from 'react';

interface SidebarProps {
  onNavigateToOnboarding: () => void;
  onNavigateToClubList?: () => void;
  onNavigateToClubDashboard?: () => void;
  onNavigateToMtPlanner?: () => void;
  onNavigateToSettlement?: () => void;
  onNavigateToChat?: () => void;
  onNavigateToVote?: () => void;
  onShowNotification?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onNavigateToOnboarding,
  onNavigateToClubList,
  onNavigateToClubDashboard,
  onNavigateToMtPlanner,
  onNavigateToSettlement,
  onNavigateToChat,
  onNavigateToVote,
  onShowNotification
}) => {
  return (
    <div className="w-20 bg-white shadow-lg min-h-screen">
      <div className="flex flex-col items-center py-4 space-y-4">
        {/* Logout Button */}
        <button
          onClick={onNavigateToOnboarding}
          className="w-14 h-14 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border-2 border-red-200 hover:border-red-300 rounded-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl cursor-pointer group"
          title="로그아웃"
        >
          <img src="/images/button/Logout.png" alt="로그아웃" className="w-14 h-14" />
        </button>

        {/* Navigation Items */}
        <div className="flex flex-col space-y-4">
          {/* 1. 동아리 목록으로 이동 */}
          <button
            onClick={onNavigateToClubList}
            className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center cursor-pointer hover:from-orange-100 hover:to-orange-150 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl group"
            title="동아리 목록"
          >
            <img src="/images/button/ClubList.png" alt="동아리 목록" className="w-14 h-14" />
          </button>

          {/* 2. 대시보드로 돌아가기 */}
          <button
            onClick={onNavigateToClubDashboard}
            className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center cursor-pointer hover:from-orange-100 hover:to-orange-150 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl group"
            title="대시보드"
          >
            <div className="text-2xl">🏠</div>
          </button>

          {/* 3. 마이페이지 */}
          <button className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center cursor-pointer hover:from-orange-100 hover:to-orange-150 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl group" title="마이페이지">
            <img src="/images/button/MyPage.png" alt="마이페이지" className="w-14 h-14" />
          </button>

          {/* 4. 알림창 */}
          <button
            onClick={onShowNotification}
            className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center cursor-pointer hover:from-orange-100 hover:to-orange-150 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl group relative" title="알림">
            <img src="/images/button/Alarm.png" alt="알림" className="w-14 h-14" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">3</span>
            </div>
          </button>

          {/* 5. 캘린더 */}
          <button className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center cursor-pointer hover:from-orange-100 hover:to-orange-150 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl group" title="캘린더">
            <img src="/images/button/Calender.png" alt="캘린더" className="w-14 h-14" />
          </button>

          {/* 6. 정산 */}
          <button
            onClick={onNavigateToSettlement}
            className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center cursor-pointer hover:from-orange-100 hover:to-orange-150 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl group" title="정산">
            <img src="/images/button/nbbang.png" alt="정산" className="w-14 h-14" />
          </button>

          {/* 7. 투표 */}
          <button
            onClick={onNavigateToVote}
            className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center cursor-pointer hover:from-orange-100 hover:to-orange-150 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl group" title="투표">
            <img src="/images/button/Vote.png" alt="투표" className="w-14 h-14" />
          </button>

          {/* 8. 채팅방 */}
          <button
            onClick={onNavigateToChat}
            className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center cursor-pointer hover:from-orange-100 hover:to-orange-150 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl group" title="채팅방">
            <img src="/images/button/Chat.png" alt="채팅방" className="w-14 h-14" />
          </button>

          {/* 9. MT내용추천 */}
          <button
            onClick={onNavigateToMtPlanner}
            className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center cursor-pointer hover:from-orange-100 hover:to-orange-150 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl group" title="MT추천">
            <img src="/images/button/Mt.png" alt="MT추천" className="w-14 h-14" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;