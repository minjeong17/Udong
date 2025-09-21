import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import NotificationModal from '../components/NotificationModal';
import { useRouter } from '../hooks/useRouter';

interface PaymentManagementProps {
  onNavigateToOnboarding: () => void;
  currentRoute?: string;
}

interface PaymentRecord {
  id: number;
  name: string;
  phone: string;
  birthDate: string;
  paymentStatus: '납부완료' | '미납';
}

const PaymentManagement: React.FC<PaymentManagementProps> = ({
  onNavigateToOnboarding
}) => {
  const { navigate } = useRouter();
  const [activeCollection, setActiveCollection] = useState<'first' | 'second'>('second');
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // 샘플 데이터
  const paymentRecords: PaymentRecord[] = [
    {
      id: 1,
      name: '김민수',
      phone: '010-1234-5678',
      birthDate: '2000.03.15',
      paymentStatus: '납부완료'
    },
    {
      id: 2,
      name: '이지은',
      phone: '010-2345-6789',
      birthDate: '1999.07.22',
      paymentStatus: '납부완료'
    },
    {
      id: 3,
      name: '박철수',
      phone: '010-3456-7890',
      birthDate: '2001.11.08',
      paymentStatus: '미납'
    },
    {
      id: 4,
      name: '최영희',
      phone: '010-4567-8901',
      birthDate: '2000.05.30',
      paymentStatus: '납부완료'
    },
    {
      id: 5,
      name: '정민호',
      phone: '010-5678-9012',
      birthDate: '2002.01.12',
      paymentStatus: '미납'
    },
    {
      id: 6,
      name: '한소영',
      phone: '010-6789-0123',
      birthDate: '2001.09.18',
      paymentStatus: '납부완료'
    },
    {
      id: 7,
      name: '오준석',
      phone: '010-7890-1234',
      birthDate: '2000.12.25',
      paymentStatus: '미납'
    },
    {
      id: 8,
      name: '윤서연',
      phone: '010-8901-2345',
      birthDate: '2002.04.07',
      paymentStatus: '납부완료'
    },
    {
      id: 9,
      name: '임태현',
      phone: '010-9012-3456',
      birthDate: '2001.08.14',
      paymentStatus: '미납'
    },
    {
      id: 10,
      name: '강민지',
      phone: '010-0123-4567',
      birthDate: '2002.06.03',
      paymentStatus: '미납'
    }
  ];

  const getPaymentStatusColor = (status: string): string => {
    return status === '납부완료'
      ? 'bg-green-500 text-white'
      : 'bg-red-500 text-white';
  };

  const completedCount = paymentRecords.filter(record => record.paymentStatus === '납부완료').length;
  const unpaidCount = paymentRecords.filter(record => record.paymentStatus === '미납').length;
  const totalCount = paymentRecords.length;

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
            <h1 className="text-3xl font-bold text-gray-800 font-jua">동아리원 회비 관리</h1>
            <p className="text-gray-600 font-gowun">동아리 회원들의 회비 납부 현황을 관리하고 수금을 진행할 수 있습니다.</p>
          </div>
        </div>


        {/* 탭 메뉴 */}
        <div className="mb-8">
          <div className="flex gap-4">
            <button
              onClick={() => navigate('member-management')}
              className="bg-white text-gray-600 border border-gray-200 hover:border-orange-300 px-6 py-3 rounded-xl font-medium transition-colors font-gowun"
            >
              동아리원 현황
            </button>
            <button
              className="bg-orange-500 text-white px-6 py-3 rounded-xl font-medium transition-colors font-gowun"
            >
              동아리원 회비 관리
            </button>
          </div>
        </div>


        {/* 통계 정보 */}
        <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-700 font-jua">
              제 {activeCollection === 'first' ? '1' : '2'}차 수금 - 총 {totalCount}명의 회원
            </h3>
            <div className="flex gap-6">
              <div className="text-center">
                <span className="text-green-600 font-bold text-xl font-jua">납부완료: {completedCount}명</span>
              </div>
              <div className="text-center">
                <span className="text-red-600 font-bold text-xl font-jua">미납: {unpaidCount}명</span>
              </div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex gap-4 mt-4 justify-end">
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-jua transition-colors flex items-center gap-2 shadow-md">
              <span>📧</span>
              새로운 회비 수금 진행
            </button>
            <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-jua transition-colors flex items-center gap-2 shadow-md">
              <span>📢</span>
              미납자 알림전송
            </button>
          </div>
        </div>

        {/* 드롭다운 */}
        <div className="flex justify-end mb-4">
          <select
            value={activeCollection}
            onChange={(e) => setActiveCollection(e.target.value as 'first' | 'second')}
            className="px-4 py-2 border border-gray-200 rounded-lg font-gowun focus:outline-none focus:border-orange-300 bg-white text-sm"
          >
            <option value="second">2차 수금 내역</option>
            <option value="first">1차 수금 내역</option>
          </select>
        </div>

        {/* 테이블 헤더 */}
        <div className="bg-white rounded-t-2xl shadow-lg border border-orange-100 p-4">
          <div className="grid gap-4 text-base font-medium text-gray-600 font-gowun" style={{gridTemplateColumns: '1fr 1.2fr 1fr 1.2fr'}}>
            <div className="flex items-center gap-2">
              <span>이름</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div>연락처</div>
            <div>생년월일</div>
            <div>회비 납부 여부</div>
          </div>
        </div>

        {/* 결제 목록 */}
        <div className="bg-white rounded-b-2xl shadow-lg border-l border-r border-b border-orange-100">
          {paymentRecords.map((record, index) => (
            <div
              key={record.id}
              className={`p-4 border-b border-gray-100 ${
                index === paymentRecords.length - 1 ? 'border-b-0' : ''
              } hover:bg-gray-50 transition-colors`}
            >
              <div className="grid gap-4 text-sm font-gowun items-center" style={{gridTemplateColumns: '1fr 1.2fr 1fr 1.2fr'}}>
                <div className="font-medium text-gray-800">{record.name}</div>
                <div className="text-gray-600">{record.phone}</div>
                <div className="text-gray-600">{record.birthDate}</div>
                <div>
                  {record.paymentStatus === '납부완료' ? (
                    <span className={`px-3 py-2 rounded-lg text-xs font-medium ${getPaymentStatusColor(record.paymentStatus)}`}>
                      {record.paymentStatus}
                    </span>
                  ) : (
                    <button className={`px-3 py-2 rounded-lg text-xs font-medium ${getPaymentStatusColor(record.paymentStatus)} hover:bg-red-600 transition-colors flex items-center gap-1`}>
                      <span>❌</span>
                      {record.paymentStatus}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

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

export default PaymentManagement;