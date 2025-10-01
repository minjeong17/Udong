import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import NotificationModal from '../components/NotificationModal';
import PaymentCollectionModal from '../components/PaymentCollectionModal';
import UnpaidNotificationModal from '../components/UnpaidNotificationModal';
import FeedbackDialog from '../components/FeedbackDialog';
import { useRouter } from '../hooks/useRouter';
import { useAuthStore } from '../stores/authStore';
import { ClubDuesApi } from '../apis/clubdues';
import { ClubApi } from '../apis/clubs';
import type { DuesListResponse, DuesStatusResponse } from '../apis/clubdues';

interface PaymentManagementProps {
  onNavigateToOnboarding: () => void;
  currentRoute?: string;
}

const PaymentManagement: React.FC<PaymentManagementProps> = ({
  onNavigateToOnboarding
}) => {
  const { navigate } = useRouter();
  const { clubId } = useAuthStore();
  const [activeCollection, setActiveCollection] = useState<number>(1);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUnpaidNotificationModal, setShowUnpaidNotificationModal] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'completed' | 'unpaid'>('all');
  const [searchName, setSearchName] = useState('');

  // FeedbackDialog 상태
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    title: string;
    message: string;
    actions?: Array<{
      label: string;
      onClick: () => void;
      tone?: "primary" | "default";
    }>;
  }>({ title: "", message: "" });

  const showFeedback = (
    title: string,
    message: string,
    actions?: Array<{
      label: string;
      onClick: () => void;
      tone?: "primary" | "default";
    }>
  ) => {
    setFeedback({ title, message, actions });
    setFeedbackOpen(true);
  };

  // API 데이터 상태
  const [duesList, setDuesList] = useState<DuesListResponse | null>(null);
  const [currentDuesStatus, setCurrentDuesStatus] = useState<DuesStatusResponse | null>(null);
  const [totalClubMembers, setTotalClubMembers] = useState<number>(0); // 실제 동아리원 수
  const [loading, setLoading] = useState(false);

  // API 데이터 가져오기
  useEffect(() => {
    if (!clubId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 동아리 회원 수 조회 (항상 필요)
        const clubMembers = await ClubApi.getClubMembers(clubId);
        setTotalClubMembers(clubMembers.length);

        // 회비 목록 조회
        const duesListData = await ClubDuesApi.getDuesList(clubId);
        setDuesList(duesListData);

        // 기본적으로 가장 최신 회차 설정
        if (duesListData.duesList.length > 0) {
          const latestDues = duesListData.duesList[0];
          setActiveCollection(latestDues.duesNo);

          // 해당 회차의 납부 현황 조회
          const statusData = await ClubDuesApi.getDuesStatus(clubId, latestDues.duesNo);
          setCurrentDuesStatus(statusData);
        } else {
          // 회비 데이터가 없는 경우 초기화
          setActiveCollection(0);
          setCurrentDuesStatus(null);
        }
      } catch (error) {
        console.error('데이터 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clubId]);

  // 회차 변경시 해당 회차 데이터 조회
  useEffect(() => {
    if (!clubId || !activeCollection || activeCollection === 0) return;

    const fetchDuesStatus = async () => {
      setLoading(true);
      try {
        const statusData = await ClubDuesApi.getDuesStatus(clubId, activeCollection);
        setCurrentDuesStatus(statusData);
      } catch (error) {
        console.error('납부 현황 조회 실패:', error);
        setCurrentDuesStatus(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDuesStatus();
  }, [clubId, activeCollection]);

  const getPaymentStatusColor = (status: number): string => {
    return status === 1
      ? 'bg-green-500 text-white'
      : 'bg-red-500 text-white';
  };

  const getPaymentStatusText = (status: number): string => {
    return status === 1 ? '납부완료' : '미납';
  };

  // 필터링된 데이터
  const filteredRecords = currentDuesStatus?.memberStatuses.filter(record => {
    // 납부 상태 필터
    const statusMatch = (() => {
      switch (paymentFilter) {
        case 'completed':
          return record.paymentStatus === 1;
        case 'unpaid':
          return record.paymentStatus === 0;
        default:
          return true; // 'all' case
      }
    })();

    // 이름 검색 필터
    const nameMatch = record.userName.toLowerCase().includes(searchName.toLowerCase());

    return statusMatch && nameMatch;
  }) || [];

  const completedCount = currentDuesStatus?.completedCount || 0;
  const unpaidCount = currentDuesStatus?.unpaidCount || 0;
  const totalCount = currentDuesStatus?.totalMembers || 0;

  const handlePaymentCollection = async (amount: number, selectedUserIds?: number[]) => {
    if (!clubId) {
      console.error('clubId가 없습니다:', clubId);
      return;
    }

    console.log('회비 수금 요청 시작:', { clubId, amount, selectedUserIds });

    try {
      setLoading(true);

      const requestPayload = {
        membershipDues: amount,
        selectedUserIds
      };

      console.log('API 요청 데이터:', requestPayload);

      const newDues = await ClubDuesApi.createDues(clubId, requestPayload);
      console.log('API 응답 데이터:', newDues);

      // 회비 목록 새로고침
      const updatedDuesList = await ClubDuesApi.getDuesList(clubId);
      setDuesList(updatedDuesList);

      // 새로 생성된 회차로 설정
      setActiveCollection(newDues.duesNo);

      console.log('새로운 회비 수금 시작 완료:', newDues);
      alert('회비 수금 요청이 생성되었습니다!');
    } catch (error) {
      console.error('회비 수금 생성 실패:', error);

      // 에러 정보 더 자세히 출력
      if (error instanceof Error) {
        console.error('에러 메시지:', error.message);
        console.error('에러 스택:', error.stack);
      }

      // 서버 응답에서 에러 메시지 추출
      let errorMessage = '회비 수금 생성에 실패했습니다.';
      if ((error as any)?.responseText) {
        try {
          const errorData = JSON.parse((error as any).responseText);
          if (errorData?.data) {
            errorMessage = errorData.data;
          }
        } catch {
          errorMessage = (error as any).responseText;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 납부 상태 변경 핸들러
  const handlePaymentStatusChange = async (userId: number, currentStatus: number) => {
    if (!clubId || !currentDuesStatus) return;

    // 확인 다이얼로그
    const statusText = currentStatus === 1 ? '미납' : '납부완료';
    const confirmed = confirm(`해당 회원의 납부 상태를 ${statusText}로 변경하시겠습니까?`);
    if (!confirmed) return;

    const newStatus = currentStatus === 1 ? 0 : 1; // 토글

    try {
      await ClubDuesApi.updatePaymentStatus(clubId, currentDuesStatus.duesId, userId, {
        paymentStatus: newStatus
      });

      // 현재 화면 데이터 새로고침
      const updatedStatus = await ClubDuesApi.getDuesStatus(clubId, activeCollection);
      setCurrentDuesStatus(updatedStatus);
    } catch (error) {
      console.error('납부 상태 변경 실패:', error);
      alert('납부 상태 변경에 실패했습니다.');
    }
  };

  // 미납자 알림 전송 핸들러
  const handleUnpaidNotification = async () => {
    if (!clubId || !currentDuesStatus) return;

    try {
      setLoading(true);
      await ClubDuesApi.notifyUnpaidMembers(clubId, currentDuesStatus.duesId);
      showFeedback('알림 전송 완료', '미납자들에게 알림이 전송되었습니다.');
    } catch (error) {
      console.error('미납자 알림 전송 실패:', error);
      showFeedback('알림 전송 실패', '미납자 알림 전송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 미납자 목록 추출
  const unpaidMembers = currentDuesStatus?.memberStatuses.filter(member => member.paymentStatus === 0) || [];

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
            <p className="text-gray-600 font-maplestory font-bold">동아리 회원들의 회비 납부 현황을 관리하고 수금을 진행할 수 있습니다.</p>
          </div>
        </div>


        {/* 탭 메뉴 */}
        <div className="mb-8">
          <div className="flex gap-4">
            <button
              onClick={() => navigate('member-management')}
              className="bg-white text-gray-600 border border-gray-200 hover:border-orange-300 px-6 py-3 rounded-xl font-medium transition-colors font-maplestory font-bold"
            >
              동아리원 현황
            </button>
            <button
              className="bg-orange-500 text-white px-6 py-3 rounded-xl font-medium transition-colors font-maplestory font-bold"
            >
              동아리원 회비 관리
            </button>
          </div>
        </div>


        {/* 통계 정보 */}
        <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-700 font-jua">
              {activeCollection > 0 ? `제 ${activeCollection}차 수금 - 총 ${totalCount}명의 회원` : '수금 내역이 없습니다'}
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
            <button
              onClick={() => setShowPaymentModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-jua transition-colors flex items-center gap-2 shadow-md"
            >
              <span>📧</span>
              새로운 회비 수금 진행
            </button>
            <button
              onClick={() => setShowUnpaidNotificationModal(true)}
              disabled={unpaidMembers.length === 0}
              className={`px-6 py-3 rounded-xl font-jua transition-colors flex items-center gap-2 shadow-md ${
                unpaidMembers.length === 0
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              <span>📢</span>
              미납자 알림전송
            </button>
          </div>
        </div>

        {/* 필터 및 드롭다운 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <select
              value={activeCollection}
              onChange={(e) => setActiveCollection(Number(e.target.value))}
              className="px-4 py-2 border border-gray-200 rounded-lg font-maplestory font-bold focus:outline-none focus:border-orange-300 bg-white text-sm"
              disabled={!duesList || duesList.duesList.length === 0}
            >
              {duesList && duesList.duesList.length > 0 ? (
                duesList.duesList.map((dues) => (
                  <option key={dues.duesId} value={dues.duesNo}>
                    {dues.duesNo}차 수금 내역 ({dues.membershipDues.toLocaleString()}원)
                  </option>
                ))
              ) : (
                <option value={0}>수금 내역이 없습니다</option>
              )}
            </select>
            <div className="relative">
              <input
                type="text"
                placeholder="이름으로 검색..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="px-4 py-2 pl-10 border border-gray-200 rounded-lg font-maplestory font-bold focus:outline-none focus:border-orange-300 bg-white text-sm w-48"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPaymentFilter('all')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 font-jua text-sm ${
                paymentFilter === 'all'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              전체보기
            </button>
            <button
              onClick={() => setPaymentFilter('completed')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 font-jua text-sm ${
                paymentFilter === 'completed'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              납부완료
            </button>
            <button
              onClick={() => setPaymentFilter('unpaid')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 font-jua text-sm ${
                paymentFilter === 'unpaid'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              미납자만
            </button>
          </div>
        </div>

        {/* 테이블 헤더 */}
        <div className="bg-white rounded-t-2xl shadow-lg border border-orange-100 p-4">
          <div className="grid gap-4 text-base font-medium text-gray-600 font-maplestory font-bold" style={{gridTemplateColumns: '1fr 1fr 1fr'}}>
            <div className="flex items-center gap-2">
              <span>이름</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div>이메일</div>
            <div>회비 납부 여부</div>
          </div>
        </div>

        {/* 결제 목록 */}
        <div className="bg-white rounded-b-2xl shadow-lg border-l border-r border-b border-orange-100 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">로딩 중...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-gray-500">표시할 데이터가 없습니다.</div>
          ) : (
            filteredRecords.map((record, index) => (
              <div
                key={record.userId}
                className={`p-4 border-b border-gray-100 ${
                  index === filteredRecords.length - 1 ? 'border-b-0' : ''
                } hover:bg-gray-50 transition-colors h-16`}
              >
                <div className="grid gap-4 text-sm font-maplestory font-bold items-center h-full" style={{gridTemplateColumns: '1fr 1fr 1fr'}}>
                  <div className="font-medium text-gray-800 flex items-center">{record.userName}</div>
                  <div className="text-gray-600 flex items-center">{record.userEmail}</div>
                  <div className="flex items-center">
                    <button
                      onClick={() => handlePaymentStatusChange(record.userId, record.paymentStatus)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium ${getPaymentStatusColor(record.paymentStatus)} transition-colors inline-flex items-center gap-1 ${
                        record.paymentStatus === 1
                          ? 'hover:bg-green-600'
                          : 'hover:bg-red-600'
                      }`}
                    >
                      <span>{record.paymentStatus === 1 ? '✅' : '❌'}</span>
                      {getPaymentStatusText(record.paymentStatus)}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 알림 모달 */}
        <NotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          onNavigateToOnboarding={onNavigateToOnboarding}
        />

        {/* 회비 수금 모달 */}
        <PaymentCollectionModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={(amount, selectedUserIds) => handlePaymentCollection(amount, selectedUserIds)}
          nextDuesNo={duesList ? Math.max(...duesList.duesList.map(d => d.duesNo), 0) + 1 : 1}
          totalMembers={totalClubMembers}
        />

        {/* 미납자 알림 전송 모달 */}
        <UnpaidNotificationModal
          isOpen={showUnpaidNotificationModal}
          onClose={() => setShowUnpaidNotificationModal(false)}
          onConfirm={handleUnpaidNotification}
          unpaidMembers={unpaidMembers}
          duesNo={currentDuesStatus?.duesNo || 0}
          amount={currentDuesStatus?.membershipDues || 0}
        />

        {/* 피드백 다이얼로그 */}
        <FeedbackDialog
          open={feedbackOpen}
          title={feedback.title}
          message={feedback.message}
          actions={feedback.actions}
          onClose={() => setFeedbackOpen(false)}
        />
      </div>
    </div>
  );
};

export default PaymentManagement;