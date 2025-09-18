import React, { useState } from 'react';
import Header from '../components/Header';

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
  memberCount: number;
  participationPeriod: string;
  totalPoints: number;
  myPoints: number;
  image?: string;
}

const ClubList: React.FC<ClubListProps> = ({ onNavigateToOnboarding, onNavigateToClubDashboard, onNavigateToClubSelection, currentRoute }) => {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [clubsOrder, setClubsOrder] = useState<Club[]>([]);

  // 샘플 동아리 데이터 - 빈 상태 테스트를 위해 임시로 빈 배열로 설정
  // const clubs: Club[] = [];

  // 기본 동아리 데이터
  const defaultClubs: Club[] = [
    {
      id: 1,
      name: '코딩하는척 하고 노는 동아리',
      description: '코딩을 사랑하는 사람들이 모인 동아리입니다. 매주 스터디를 진행하고 프로젝트를 함께 만들어가고 있어요.',
      category: '학술/교육',
      memberCount: 24,
      participationPeriod: '3개월',
      totalPoints: 12450,
      myPoints: 850,
      image: '/images/mas_1.png'
    },
    {
      id: 2,
      name: '책책책 책을 읽읍시다',
      description: '다양한 책을 읽고 토론하는 독서 동아리입니다. 매월 한 권의 책을 선정하여 깊이 있는 토론을 진행해요.',
      category: '문화/예술',
      memberCount: 18,
      participationPeriod: '2개월',
      totalPoints: 8200,
      myPoints: 420,
      image: '/images/mas_2.png'
    },
    {
      id: 3,
      name: '운동을 하면 되잖아',
      description: '건강한 몸과 마음을 위한 운동 동아리입니다. 다양한 스포츠 활동을 통해 체력을 기르고 있어요.',
      category: '운동/스포츠',
      memberCount: 32,
      participationPeriod: '5개월',
      totalPoints: 15800,
      myPoints: 1200,
      image: '/images/mas_3.png'
    }
  ];

  // 초기화 useEffect
  React.useEffect(() => {
    if (clubsOrder.length === 0) {
      setClubsOrder(defaultClubs);
    }
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
  


  const handleJoinWithCode = () => {
    if (inviteCode.trim()) {
      console.log('Joining club with invite code:', inviteCode);
      // 실제로는 API 호출
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
                  />
                  <button
                    onClick={handleJoinWithCode}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors border border-orange-400 font-gowun text-sm"
                  >
                    참가하기
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-700 mb-2 font-jua">참가 중인 동아리</h2>
                  <p className="text-sm text-gray-500 font-gowun">{clubsOrder.length}개의 동아리에 참가 중</p>
                </div>
              </div>

              <div className="space-y-3">
                {clubsOrder.length > 0 ? (
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
                          {club.image ? (
                            <img
                              src={club.image}
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
                          <p className="text-sm text-gray-500 font-gowun">{club.memberCount}명</p>
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
                            <span>👥</span>
                            {selectedClub.memberCount}명
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Club Mascot - Center */}
                    <div className="flex justify-center mb-8">
                      {selectedClub.image && (
                        <div className="relative">
                          <img
                            src={selectedClub.image}
                            alt={`${selectedClub.name} 마스코트`}
                            className="w-64 h-64 object-contain animate-mascot-wiggle"
                          />
                        </div>
                      )}
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <span className="text-orange-500">⏱️</span>
                        </div>
                        <div className="text-lg font-semibold text-gray-700 font-jua">{selectedClub.participationPeriod}</div>
                        <div className="text-sm text-gray-500 font-gowun">참여 기간</div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <span className="text-orange-500">🏆</span>
                        </div>
                        <div className="text-lg font-semibold text-gray-700 font-jua">{selectedClub.totalPoints.toLocaleString()}점</div>
                        <div className="text-sm text-gray-500 font-gowun">동아리 누적 포인트</div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <span className="text-orange-500">⭐</span>
                        </div>
                        <div className="text-lg font-semibold text-gray-700 font-jua">{selectedClub.myPoints}점</div>
                        <div className="text-sm text-gray-500 font-gowun">내 포인트</div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-700 mb-3 font-jua">동아리 설명</h3>
                      <p className="text-gray-600 leading-relaxed font-gowun">{selectedClub.description}</p>
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