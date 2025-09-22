import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import RoleChangeModal from '../components/RoleChangeModal';
import LeaderTransferModal from '../components/LeaderTransferModal';
import NotificationModal from '../components/NotificationModal';
import { useRouter } from '../hooks/useRouter';
import { useAuthStore } from '../stores/authStore';
import { ClubApi } from '../apis/clubs';

interface MemberManagementProps {
  onNavigateToOnboarding: () => void;
  currentRoute?: string;
}

interface Member {
  membershipId: number;
  userId: number;
  name: string;
  phone: string;
  email: string;
  gender: string;
  university: string;
  department: string;
  address: string;
  role: string;
  joinedAt: string;
}

const MemberManagement: React.FC<MemberManagementProps> = ({
  onNavigateToOnboarding
}) => {
  const { navigate } = useRouter();
  const clubId = useAuthStore((state) => state.clubId);
  const myRole = useAuthStore((state) => state.myRole);
  const setClubInfo = useAuthStore((state) => state.setClubInfo);

  const [activeTab, setActiveTab] = useState<'status' | 'payment'>('status');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showLeaderTransferModal, setShowLeaderTransferModal] = useState(false);
  const [transferTargetMember, setTransferTargetMember] = useState<{userId: number, name: string} | null>(null);
  const [membersList, setMembersList] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // API에서 멤버 목록 가져오기
  const fetchMembers = async () => {
    if (!clubId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await ClubApi.getClubMembers(clubId);

      // API 응답을 Member 인터페이스에 맞게 변환
      const transformedMembers: Member[] = response.map(member => ({
        membershipId: member.membershipId,
        userId: member.userId,
        name: member.name,
        phone: member.phone,
        email: member.email,
        gender: member.gender,
        university: member.university,
        department: member.major,
        address: member.residence,
        role: member.role,
        joinedAt: member.joinedAtIso
      }));

      setMembersList(transformedMembers);

      // 현재 회장인 사용자의 userId 찾기 (본인 역할 변경 방지를 위해)
      const leaderMember = transformedMembers.find(member => member.role === 'LEADER');
      if (leaderMember && myRole === 'LEADER') {
        setCurrentUserId(leaderMember.userId);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
      setError('멤버 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 멤버 목록 불러오기
  useEffect(() => {
    fetchMembers();
  }, [clubId]);

  const handleRoleClick = (member: Member) => {
    // 회장이 본인의 역할을 변경하려고 하는 경우 방지
    if (myRole === 'LEADER' && member.userId === currentUserId) {
      alert('본인의 역할은 변경할 수 없습니다.\n회장 위임을 원하시면 다른 멤버를 회장으로 지정해주세요.');
      return;
    }

    setSelectedMember(member);
    setShowRoleModal(true);
  };

  const handleRoleChange = async (newRole: string) => {
    if (!selectedMember || !clubId) return;

    try {
      await ClubApi.changeRole(clubId, selectedMember.membershipId, newRole);

      // 로컬 상태 업데이트
      setMembersList(prevMembers =>
        prevMembers.map(member =>
          member.membershipId === selectedMember.membershipId
            ? { ...member, role: newRole }
            : member
        )
      );

      console.log('역할 변경 성공:', newRole);
    } catch (error) {
      console.error('Failed to change role:', error);
      alert('역할 변경에 실패했습니다.');
    }
  };

  // 회장 위임 핸들러
  const handleLeaderTransfer = (userId: number, name: string) => {
    setTransferTargetMember({ userId, name });
    setShowLeaderTransferModal(true);
  };

  // 회장 위임 확인
  const handleConfirmLeaderTransfer = async () => {
    if (!transferTargetMember || !clubId) return;

    try {
      await ClubApi.transferLeader(clubId, transferTargetMember.userId);

      // 위임 성공 후 내 역할을 일반 멤버로 변경
      if (clubId) {
        setClubInfo(clubId, 'MANAGER');
      }

      // 위임 성공 후 동아리 대시보드로 이동
      alert('회장 위임이 완료되었습니다. 동아리 대시보드로 이동합니다.');
      navigate('club-dashboard');

    } catch (error) {
      console.error('Failed to transfer leader:', error);
      alert('회장 위임에 실패했습니다.');
    } finally {
      setShowLeaderTransferModal(false);
      setTransferTargetMember(null);
    }
  };

  // 멤버 추방 핸들러
  const handleKickMember = async (member: Member) => {
    if (!clubId) return;

    const confirmMessage = `정말로 ${member.name}님을 동아리에서 추방하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`;
    if (!confirm(confirmMessage)) return;

    try {
      await ClubApi.kickMember(clubId, member.membershipId);

      // 로컬 상태에서 제거
      setMembersList(prevMembers =>
        prevMembers.filter(m => m.membershipId !== member.membershipId)
      );

      alert(`${member.name}님이 동아리에서 추방되었습니다.`);
    } catch (error) {
      console.error('Failed to kick member:', error);
      alert('멤버 추방에 실패했습니다.');
    }
  };

  const getRoleInKorean = (role: string): string => {
    switch (role) {
      case 'LEADER': return '회장';
      case 'MANAGER': return '임원';
      case 'MEMBER': return '회원';
      default: return role;
    }
  };

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'LEADER': return 'bg-red-500 text-white';
      case 'MANAGER': return 'bg-blue-500 text-white';
      case 'MEMBER': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPaymentStatusColor = (status: string): string => {
    return status === '납부완료'
      ? 'bg-green-500 text-white'
      : 'bg-red-500 text-white';
  };

  // 프론트엔드에서 검색 및 역할 필터링
  const filteredMembers = membersList.filter(member => {
    // 검색 필터
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm);

    // 역할 필터
    const matchesRole = roleFilter === 'ALL' || member.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const roleStats = {
    leader: membersList.filter(m => m.role === 'LEADER').length,
    manager: membersList.filter(m => m.role === 'MANAGER').length,
    member: membersList.filter(m => m.role === 'MEMBER').length,
    total: membersList.length
  };

  return (
    <div className="min-h-screen bg-[#fcf9f5] flex">
      <Sidebar
        onNavigateToOnboarding={onNavigateToOnboarding}
        onShowNotification={() => setShowNotificationModal(true)}
      />

      <div className="flex-1 p-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-800 font-jua">동아리원 현황</h1>
            <p className="text-gray-600 font-gowun">동아리 회원들의 정보를 관리하고 현황을 확인할 수 있습니다.</p>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="mb-8">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('status')}
              className={`px-6 py-3 rounded-xl font-medium transition-colors font-gowun ${
                activeTab === 'status'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'
              }`}
            >
              동아리원 현황
            </button>
            <button
              onClick={() => navigate('payment-management')}
              className="bg-white text-gray-600 border border-gray-200 hover:border-orange-300 px-6 py-3 rounded-xl font-medium transition-colors font-gowun"
            >
              동아리원 회비 관리
            </button>
          </div>
        </div>

        {/* 통계 섹션 */}
        <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6 mb-8">
          <div className="grid grid-cols-4 gap-6 text-center">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-gray-800 font-jua">{roleStats.total}명</div>
              <div className="text-sm text-gray-600 font-gowun">총 회원</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-red-600 font-jua">{roleStats.leader}명</div>
              <div className="text-sm text-gray-600 font-gowun">회장</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-600 font-jua">{roleStats.manager}명</div>
              <div className="text-sm text-gray-600 font-gowun">임원</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-600 font-jua">{roleStats.member}명</div>
              <div className="text-sm text-gray-600 font-gowun">회원</div>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setRoleFilter('ALL')}
                className={`px-4 py-2 rounded-lg font-gowun transition-colors ${
                  roleFilter === 'ALL'
                    ? 'bg-orange-500 text-white'
                    : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setRoleFilter('LEADER')}
                className={`px-4 py-2 rounded-lg font-gowun transition-colors ${
                  roleFilter === 'LEADER'
                    ? 'bg-red-500 text-white'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                회장
              </button>
              <button
                onClick={() => setRoleFilter('MANAGER')}
                className={`px-4 py-2 rounded-lg font-gowun transition-colors ${
                  roleFilter === 'MANAGER'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }`}
              >
                임원
              </button>
              <button
                onClick={() => setRoleFilter('MEMBER')}
                className={`px-4 py-2 rounded-lg font-gowun transition-colors ${
                  roleFilter === 'MEMBER'
                    ? 'bg-gray-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                회원
              </button>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="이름, 이메일, 전화번호로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg font-gowun focus:outline-none focus:border-orange-300 w-72"
              />
              {(searchTerm || roleFilter !== 'ALL') && (
                <span className="text-orange-500 font-gowun text-sm">
                  {filteredMembers.length}명 필터됨
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-8">
            <p className="text-red-600 font-gowun">{error}</p>
            <button
              onClick={fetchMembers}
              className="mt-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg font-gowun hover:bg-red-200 transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 테이블 헤더 */}
        <div className="bg-white rounded-t-2xl shadow-lg border border-orange-100 p-4">
          <div className="grid gap-4 text-sm font-medium text-gray-600 font-gowun" style={{gridTemplateColumns: '1fr 1.2fr 2fr 0.7fr 1.3fr 1.5fr 0.8fr 0.8fr'}}>
            <div>이름</div>
            <div>연락처</div>
            <div>이메일</div>
            <div>성별</div>
            <div>학교/학과</div>
            <div>거주지</div>
            <div>직책</div>
            <div>관리</div>
          </div>
        </div>

        {/* 멤버 목록 */}
        <div className="bg-white rounded-b-2xl shadow-lg border-l border-r border-b border-orange-100">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
                <span className="text-gray-400 text-xl">⏳</span>
              </div>
              <p className="text-gray-500 font-gowun">멤버 목록을 불러오는 중...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-gray-400 text-xl">👥</span>
              </div>
              <p className="text-gray-500 font-gowun">멤버가 없습니다.</p>
            </div>
          ) : (
            filteredMembers.map((member, index) => (
            <div
              key={member.membershipId}
              className={`p-4 border-b border-gray-100 ${
                index === filteredMembers.length - 1 ? 'border-b-0' : ''
              } hover:bg-gray-50 transition-colors`}
            >
              <div className="grid gap-4 text-sm font-gowun items-center" style={{gridTemplateColumns: '1fr 1.2fr 2fr 0.7fr 1.3fr 1.5fr 0.8fr 0.8fr'}}>
                <div className="font-medium text-gray-800">{member.name}</div>
                <div className="text-gray-600">{member.phone}</div>
                <div className="text-gray-600">{member.email}</div>
                <div className="text-gray-600">{member.gender}</div>
                <div className="text-gray-600">{member.university}<br/>{member.department}</div>
                <div className="text-gray-600">{member.address}</div>
                <div>
                  {myRole === 'LEADER' && member.userId === currentUserId ? (
                    <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(member.role)} opacity-75 cursor-not-allowed`}>
                      {getRoleInKorean(member.role)} (본인)
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRoleClick(member)}
                      className={`px-2 py-1 rounded-full text-xs transition-all hover:scale-105 cursor-pointer ${getRoleColor(member.role)}`}
                    >
                      {getRoleInKorean(member.role)}
                    </button>
                  )}
                </div>
                <div>
                  {myRole === 'LEADER' && member.role !== 'LEADER' ? (
                    <button
                      onClick={() => handleKickMember(member)}
                      className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs transition-colors font-gowun"
                    >
                      추방
                    </button>
                  ) : (
                    <span className="text-gray-400 text-xs font-gowun">-</span>
                  )}
                </div>
              </div>
            </div>
            ))
          )}
        </div>

        {/* 역할 변경 모달 */}
        <RoleChangeModal
          isOpen={showRoleModal}
          onClose={() => setShowRoleModal(false)}
          member={selectedMember ? {
            name: selectedMember.name,
            role: selectedMember.role,
            userId: selectedMember.userId
          } : null}
          onRoleChange={handleRoleChange}
          onLeaderTransfer={handleLeaderTransfer}
          currentUserRole={myRole || undefined}
        />

        {/* 회장 위임 모달 */}
        <LeaderTransferModal
          isOpen={showLeaderTransferModal}
          onClose={() => {
            setShowLeaderTransferModal(false);
            setTransferTargetMember(null);
          }}
          onConfirm={handleConfirmLeaderTransfer}
          targetMemberName={transferTargetMember?.name || ''}
        />

        {/* 알림 모달 */}
        <NotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          onNavigateToOnboarding={onNavigateToOnboarding}
        />
      </div>
    </div>
  );
};

export default MemberManagement;