import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import RoleChangeModal from '../components/RoleChangeModal';
import NotificationModal from '../components/NotificationModal';
import { useRouter } from '../hooks/useRouter';

interface MemberManagementProps {
  onNavigateToOnboarding: () => void;
  currentRoute?: string;
}

interface Member {
  id: number;
  name: string;
  score: number;
  phone: string;
  email: string;
  birthDate: string;
  gender: '남자' | '여자';
  university: string;
  department: string;
  address: string;
  paymentStatus: '납부완료' | '미납';
  role: 'LEADER' | 'MANAGER' | 'MEMBER';
}

const MemberManagement: React.FC<MemberManagementProps> = ({
  onNavigateToOnboarding
}) => {
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState<'status' | 'payment'>('status');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // 샘플 데이터
  const initialMembers: Member[] = [
    {
      id: 1,
      name: '김민수',
      score: 900,
      phone: '010-1234-5678',
      email: 'minsu@email.com',
      birthDate: '2000.03.15',
      gender: '남자',
      university: '동물대학교',
      department: '컴퓨터공학과',
      address: '서울특별시 중구 장충동',
      paymentStatus: '납부완료',
      role: 'LEADER'
    },
    {
      id: 2,
      name: '이지은',
      score: 850,
      phone: '010-2345-6789',
      email: 'jieun@email.com',
      birthDate: '1999.07.22',
      gender: '여자',
      university: '동물대학교',
      department: '경영학과',
      address: '서울특별시 관악구 신림동',
      paymentStatus: '납부완료',
      role: 'MANAGER'
    },
    {
      id: 3,
      name: '박철수',
      score: 780,
      phone: '010-3456-7890',
      email: 'cheolsu@email.com',
      birthDate: '2001.11.08',
      gender: '남자',
      university: '동물대학교',
      department: '전자공학과',
      address: '서울특별시 강남구 역삼동',
      paymentStatus: '미납',
      role: 'MANAGER'
    },
    {
      id: 4,
      name: '최영희',
      score: 720,
      phone: '010-4567-8901',
      email: 'younghee@email.com',
      birthDate: '2000.05.30',
      gender: '여자',
      university: '동물대학교',
      department: '디자인학과',
      address: '서울특별시 마포구 홍대앞',
      paymentStatus: '납부완료',
      role: 'MEMBER'
    },
    {
      id: 5,
      name: '정민호',
      score: 650,
      phone: '010-5678-9012',
      email: 'minho@email.com',
      birthDate: '2002.01.12',
      gender: '남자',
      university: '동물대학교',
      department: '수학과',
      address: '서울특별시 서대문구 신촌동',
      paymentStatus: '미납',
      role: 'MEMBER'
    }
  ];

  const [membersList, setMembersList] = useState<Member[]>(initialMembers);

  const handleRoleClick = (member: Member) => {
    setSelectedMember(member);
    setShowRoleModal(true);
  };

  const handleRoleChange = (newRole: 'LEADER' | 'MANAGER' | 'MEMBER') => {
    if (selectedMember) {
      setMembersList(prevMembers =>
        prevMembers.map(member =>
          member.id === selectedMember.id
            ? { ...member, role: newRole }
            : member
        )
      );
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

  const filteredMembers = membersList.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone.includes(searchTerm)
  );

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
            <div className="flex gap-4">
              <button className="px-4 py-2 bg-orange-100 text-orange-600 rounded-lg font-gowun hover:bg-orange-200 transition-colors">
                필터 등 🔽
              </button>
              <button className="px-4 py-2 bg-orange-100 text-orange-600 rounded-lg font-gowun hover:bg-orange-200 transition-colors">
                추가 기능 ⚙️
              </button>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="이름으로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg font-gowun focus:outline-none focus:border-orange-300"
              />
            </div>
          </div>
        </div>

        {/* 테이블 헤더 */}
        <div className="bg-white rounded-t-2xl shadow-lg border border-orange-100 p-4">
          <div className="grid gap-4 text-sm font-medium text-gray-600 font-gowun" style={{gridTemplateColumns: '1fr 0.7fr 1.2fr 1.5fr 1fr 0.7fr 1.3fr 1.5fr 1fr 0.8fr'}}>
            <div>이름</div>
            <div>점수</div>
            <div>연락처</div>
            <div>이메일</div>
            <div>생년월일</div>
            <div>성별</div>
            <div>학교/학과</div>
            <div>거주지</div>
            <div>회비 납부</div>
            <div>직책</div>
          </div>
        </div>

        {/* 멤버 목록 */}
        <div className="bg-white rounded-b-2xl shadow-lg border-l border-r border-b border-orange-100">
          {filteredMembers.map((member, index) => (
            <div
              key={member.id}
              className={`p-4 border-b border-gray-100 ${
                index === filteredMembers.length - 1 ? 'border-b-0' : ''
              } hover:bg-gray-50 transition-colors`}
            >
              <div className="grid gap-4 text-sm font-gowun items-center" style={{gridTemplateColumns: '1fr 0.7fr 1.2fr 1.5fr 1fr 0.7fr 1.3fr 1.5fr 1fr 0.8fr'}}>
                <div className="font-medium text-gray-800">{member.name}</div>
                <div className="text-gray-600">{member.score}</div>
                <div className="text-gray-600">{member.phone}</div>
                <div className="text-gray-600">{member.email}</div>
                <div className="text-gray-600">{member.birthDate}</div>
                <div className="text-gray-600">{member.gender}</div>
                <div className="text-gray-600">{member.university}<br/>{member.department}</div>
                <div className="text-gray-600">{member.address}</div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(member.paymentStatus)}`}>
                    {member.paymentStatus}
                  </span>
                </div>
                <div>
                  <button
                    onClick={() => handleRoleClick(member)}
                    className={`px-2 py-1 rounded-full text-xs transition-all hover:scale-105 cursor-pointer ${getRoleColor(member.role)}`}
                  >
                    {getRoleInKorean(member.role)}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 역할 변경 모달 */}
        <RoleChangeModal
          isOpen={showRoleModal}
          onClose={() => setShowRoleModal(false)}
          member={selectedMember ? {
            name: selectedMember.name,
            role: selectedMember.role,
            birthDate: selectedMember.birthDate
          } : null}
          onRoleChange={handleRoleChange}
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