import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { ClubApi } from '../apis/clubs';

interface ClubListProps {
  onNavigateToOnboarding: () => void;
  onNavigateToClubDashboard?: () => void;
  onNavigateToClubSelection?: () => void;
  currentRoute?: string;
}

interface Club {
  id: number;
  name: string;
  description: string;
  category: string;
  codeUrl: string;
  activeMascotId: number | null;
  masUrl: string | null;
  joinedAt: string;
  myRole: string;
}

const ClubList: React.FC<ClubListProps> = ({ onNavigateToOnboarding, onNavigateToClubDashboard, onNavigateToClubSelection, currentRoute }) => {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [clubsOrder, setClubsOrder] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 가입일수 계산 함수
  const calculateDaysSinceJoined = (joinedAt: string): number => {
    const joinedDate = new Date(joinedAt);
    const currentDate = new Date();

    // 시간을 00:00:00으로 맞춰서 정확한 날짜 차이 계산
    const joinedDateOnly = new Date(joinedDate.getFullYear(), joinedDate.getMonth(), joinedDate.getDate());
    const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

    const timeDiff = currentDateOnly.getTime() - joinedDateOnly.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

    // 당일 가입은 1일차, 그 이후는 실제 경과일 + 1일로 계산
    return daysDiff + 1;
  };

  // 역할 한국어 변환
  const getRoleInKorean = (role: string): string => {
    switch (role) {
      case 'LEADER': return '리더';
      case 'MANAGER': return '임원';
      case 'MEMBER': return '멤버';
      default: return role;
    }
  };

  // 내가 가입한 동아리 목록 불러오기
  const fetchMyClubs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const clubs = await ClubApi.getMyClubs();
      setClubsOrder(clubs);
    } catch (error) {
      console.error('Failed to fetch my clubs:', error);
      setError('동아리 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트시 내 동아리 목록 불러오기
  useEffect(() => {
    fetchMyClubs();
  }, []);

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newClubsOrder = [...clubsOrder];
    const draggedClub = newClubsOrder[draggedIndex];

    // 드래그된 아이템 제거
    newClubsOrder.splice(draggedIndex, 1);
    // 새 위치에 삽입
    newClubsOrder.splice(dropIndex, 0, draggedClub);

    setClubsOrder(newClubsOrder);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };
  


  const handleJoinWithCode = async () => {
    if (!inviteCode.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      // 초대코드로 동아리 가입 API 호출
      await ClubApi.joinWithCode(inviteCode);
      console.log('Successfully joined club with invite code:', inviteCode);
      setInviteCode('');
      // 가입 성공 후 목록 새로고침
      await fetchMyClubs();
      alert('동아리에 성공적으로 가입했습니다! 🎉');
    } catch (error) {
      console.error('Failed to join club:', error);
      setError('동아리 가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnterClub = () => {
    if (selectedClub && onNavigateToClubDashboard) {
      console.log('Entering club:', selectedClub.name);
      onNavigateToClubDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f5] relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-32 left-8 w-24 h-24 bg-orange-200 rounded-full opacity-8 animate-drift"></div>
        <div className="absolute top-16 right-16 w-20 h-20 bg-orange-300 rounded-full opacity-10 animate-drift-reverse"></div>
        <div className="absolute bottom-24 left-24 w-16 h-16 bg-orange-400 rounded-full opacity-12 animate-drift"></div>
        <div className="absolute bottom-40 right-12 w-18 h-18 bg-orange-200 rounded-full opacity-8 animate-drift-reverse"></div>
      </div>

      <Header
        onNavigateToOnboarding={onNavigateToOnboarding}
        onBackClick={onNavigateToClubSelection}
        currentRoute={currentRoute}
      />

      <div className="pt-24 px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-8 min-h-[calc(100vh-6rem)]">
            {/* Left Sidebar - Club List */}
            <div className="w-80 bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
              {/* Invite Code Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3 font-jua">동아리 추가</h3>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="초대코드를 입력하세요"
                    className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-gray-600 font-gowun focus:outline-none focus:border-orange-300 placeholder-gray-400 text-sm"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleJoinWithCode}
                    disabled={isLoading || !inviteCode.trim()}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors border border-orange-400 font-gowun text-sm"
                  >
                    {isLoading ? '참가 중...' : '참가하기'}
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-700 mb-2 font-jua">참가 중인 동아리</h2>
                  <p className="text-sm text-gray-500 font-gowun">{clubsOrder.length}개의 동아리에 참가 중</p>
                </div>
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm font-gowun">{error}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-gray-400 text-2xl">⏳</span>
                    </div>
                    <p className="text-gray-500 font-gowun">동아리 목록을 불러오는 중...</p>
                  </div>
                ) : clubsOrder.length > 0 ? (
                  clubsOrder.map((club, index) => (
                    <div
                      key={club.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedClub(club)}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedClub?.id === club.id
                          ? 'bg-orange-50 border-2 border-orange-200'
                          : 'bg-gray-50 border-2 border-gray-100 hover:border-orange-100'
                      } ${
                        draggedIndex === index
                          ? 'opacity-50 transform rotate-2'
                          : 'hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                          {club.masUrl ? (
                            <img
                              src={club.masUrl}
                              alt={`${club.name} 마스코트`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
                              <span className="text-white font-semibold text-lg">
                                {club.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-700 font-jua truncate">{club.name}</h3>
                          <p className="text-sm text-gray-500 font-gowun">{getRoleInKorean(club.myRole)} • {calculateDaysSinceJoined(club.joinedAt)}일</p>
                        </div>
                        <div className="text-gray-400 hover:text-orange-500 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-gray-400 text-2xl">🏠</span>
                    </div>
                    <p className="text-gray-500 font-gowun">참가중인 동아리가 없습니다.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {selectedClub ? (
                <>
                  {/* Club Info Header */}
                  <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-8">
                    {/* Club Title and Category */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h1 className="text-3xl font-semibold text-gray-700 font-jua">{selectedClub.name}</h1>
                          <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-gowun">
                            {selectedClub.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-gray-500 font-gowun">
                          <span className="flex items-center gap-1">
                            <span>👑</span>
                            {getRoleInKorean(selectedClub.myRole)}
                          </span>
                          <span className="flex items-center gap-1">
                            <span>📅</span>
                            가입 {calculateDaysSinceJoined(selectedClub.joinedAt)}일차
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Club Mascot - Center */}
                    <div className="flex justify-center mb-8">
                      {selectedClub.masUrl ? (
                        <div className="relative">
                          <img
                            src={selectedClub.masUrl}
                            alt={`${selectedClub.name} 마스코트`}
                            className="w-64 h-64 object-contain animate-mascot-wiggle"
                          />
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="w-64 h-64 bg-gradient-to-br from-orange-200 to-orange-300 rounded-3xl flex items-center justify-center">
                            <span className="text-6xl font-bold text-orange-600">
                              {selectedClub.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stats Cards - Smaller */}
                    <div className="flex justify-center gap-6 mb-6">
                      <div className="bg-gray-50 rounded-lg p-3 text-center min-w-[120px]">
                        <div className="w-6 h-6 bg-orange-100 rounded-lg mx-auto mb-1 flex items-center justify-center">
                          <span className="text-orange-500 text-sm">📅</span>
                        </div>
                        <div className="text-base font-semibold text-gray-700 font-jua">{calculateDaysSinceJoined(selectedClub.joinedAt)}일</div>
                        <div className="text-xs text-gray-500 font-gowun">가입 일수</div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 text-center min-w-[120px]">
                        <div className="w-6 h-6 bg-orange-100 rounded-lg mx-auto mb-1 flex items-center justify-center">
                          <span className="text-orange-500 text-sm">👑</span>
                        </div>
                        <div className="text-base font-semibold text-gray-700 font-jua">
                          {getRoleInKorean(selectedClub.myRole)}
                        </div>
                        <div className="text-xs text-gray-500 font-gowun">내 직책</div>
                      </div>
                    </div>

                    {/* Club Description */}
                    <div className="mb-6 text-center">
                      <p className="text-gray-600 font-gowun text-lg">
                        <span className="font-semibold text-gray-700">동아리 설명: </span>
                        {selectedClub.description}
                      </p>
                    </div>

                    {/* Enter Club Button */}
                    <button
                      onClick={handleEnterClub}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-4 px-6 rounded-xl transition-colors border border-orange-400 font-gowun text-lg"
                    >
                      동아리 입장
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-8">
                  <div className="text-center py-16">
                    <div className="mx-auto mb-6 flex items-center justify-center">
                      <img
                        src="/images/clubChoice.png"
                        alt="우동 마스코트"
                        className="w-[28rem] h-80 object-contain"
                      />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-2 font-jua">선택된 <span className="text-orange-500">동아리</span>가 없습니다.</h2>
                    <p className="text-gray-500 font-gowun">왼쪽에서 <span className="text-orange-500">동아리를 선택</span>하거나 <span className="text-orange-500">초대코드로 새 동아리에 참가</span>해보세요.</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubList;