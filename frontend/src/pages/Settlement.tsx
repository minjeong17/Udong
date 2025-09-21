import { useState, useEffect } from "react"
import Sidebar from '../components/Sidebar';
import NotificationModal from '../components/NotificationModal';
// 참여자(결제 현황) 타입: id는 number, isPaid 필수
export type ParticipantPayment = {
  id: number;
  name: string;
  isPaid: boolean;
};

// 정산 상태
export type SettlementStatus = "pending" | "completed";

// 정산 아이템 타입 (더미데이터/화면에서 실제 쓰는 필드 기준)
export type Settlement = {
  id: number;
  title: string;
  description?: string;
  totalAmount: number;
  status: SettlementStatus;
  createdAt: string;
  dueDate: string;
  createdBy: string;
  createdById: number;
  receiptImage: string | null;
  bankAccount: string;
  accountHolder: string;
  participantsList: ParticipantPayment[];
};


interface SettlementProps {
  onNavigateToOnboarding: () => void;
}

export default function SettlementPage({
  onNavigateToOnboarding,
}: SettlementProps) {
  const [selectedSettlement, setSelectedSettlement] = useState<number | null>(1)
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const currentUser = "김민수" // 실제로는 로그인된 사용자 정보를 가져와야 함
  const currentUserId = 1; // 더미용 (실서비스: 로그인 사용자 id)
  const [settlements, setSettlements] = useState<Settlement[]>([
    {
      id: 1,
      title: "신년회 정산",
      description: "한식당 맛나에서 진행된 신년회 비용 정산입니다. 총 22명이 참여했으며, 음식비와 음료비를 포함한 전체 비용을 정산합니다.",
      totalAmount: 350000,
      status: "pending",
      createdAt: "2024-01-25",
      dueDate: "2024-01-30",
      createdBy: "김민수",
      createdById: 1, // ✅ 추가
      receiptImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=600&fit=crop&crop=center",
      bankAccount: "카카오뱅크 3333-12-1234567",
      accountHolder: "김민수",
      participantsList: [
        { id: 1, name: "김민수", isPaid: true },
        { id: 2, name: "이지은", isPaid: false },
        { id: 3, name: "박준호", isPaid: true },
        { id: 4, name: "최유진", isPaid: false },
        { id: 5, name: "정수현", isPaid: true },
        { id: 6, name: "한지민", isPaid: false },
      ],
    },
    {
      id: 2,
      title: "정기 모임 정산",
      description: "스터디룸 A 대관료 및 간식비 정산",
      totalAmount: 150000,
      status: "completed",
      createdAt: "2024-01-15",
      dueDate: "2024-01-20",
      createdBy: "이지은",
      createdById: 2, // ✅ 추가
      receiptImage: null,
      bankAccount: "국민은행 123456-78-901234",
      accountHolder: "이지은",
      participantsList: [
        { id: 1, name: "김민수", isPaid: true },
        { id: 2, name: "이지은", isPaid: true },
        { id: 3, name: "박준호", isPaid: true },
        { id: 4, name: "최유진", isPaid: true },
      ],
    },
    {
      id: 3,
      title: "MT 기획 회의",
      description: "카페 모임터 음료비",
      totalAmount: 48000,
      status: "pending",
      createdAt: "2024-01-20",
      dueDate: "2024-01-25",
      createdBy: "박준호",
      createdById: 3, // ✅ 추가
      receiptImage: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=600&fit=crop&crop=center",
      bankAccount: "신한은행 110-123-456789",
      accountHolder: "박준호",
      participantsList: [
        { id: 1, name: "김민수", isPaid: false },
        { id: 2, name: "이지은", isPaid: true },
        { id: 3, name: "박준호", isPaid: true },
        { id: 4, name: "최유진", isPaid: false },
        { id: 5, name: "정수현", isPaid: false },
      ],
    },
  ]);
  
  // const ParticipantPayment = (settlementId: number, participantId: number) => {
  //     console.log(`Toggling payment status for participant ${participantId} in settlement ${settlementId}`)
  //     // 실제로는 API 호출로 결제 상태 업데이트
  // }

  // 참여자 수 / 1인당 금액(올림) 공통 계산
  const getParticipantCount = (s: Settlement) => s.participantsList.length;
  const getPerPerson = (s: Settlement) =>
    Math.ceil(s.totalAmount / Math.max(1, getParticipantCount(s)));

  const ongoingSettlements = settlements.filter((settlement) => settlement.status === "pending")
  const completedSettlements = settlements.filter((settlement) => settlement.status === "completed")
  const visibleSettlements = paymentCompleted ? completedSettlements : ongoingSettlements;

  useEffect(() => {
    if (selectedSettlement != null && !visibleSettlements.some(s => s.id === selectedSettlement)) {
      setSelectedSettlement(visibleSettlements[0]?.id ?? null)
    }
  }, [paymentCompleted, settlements])

  const handleEndSettlement = (settlementId: number) => {
    setSettlements((prev) => {
      const next = prev.map((s): Settlement =>
        s.id === settlementId ? { ...s, status: "completed" as SettlementStatus } : s // ← 명시
      );

      // 현재 탭이 "진행중"일 때 종료한 항목 보고 있었다면 선택 보정
      if (!paymentCompleted && selectedSettlement === settlementId) {
        const nextVisible = next.filter((s) => s.status === "pending");
        setSelectedSettlement(nextVisible[0]?.id ?? null);
      }
      return next;
    });
  };


  const handleDeleteSettlement = (settlementId: number) => {
    setSettlements((prev) => {
      const next: Settlement[] = prev.filter((s) => s.id !== settlementId); // ← 반환 타입 고정

      if (selectedSettlement === settlementId) {
        const nextVisible = paymentCompleted
          ? next.filter((s) => s.status === "completed")
          : next.filter((s) => s.status === "pending");
        setSelectedSettlement(nextVisible[0]?.id ?? null);
      }
      return next;
    });
  };



  const handlePayment = (settlementId: number) => {
    // TODO: 백엔드 결제 성공 후 호출
    setSettlements((prev) =>
      prev.map((s): Settlement => {
        if (s.id !== settlementId) return s;

        const nextParticipantsList = s.participantsList.map((p) =>
          p.id === currentUserId ? { ...p, isPaid: true } : p
        );

        const allPaid = nextParticipantsList.length > 0 && nextParticipantsList.every((p) => p.isPaid);
        const nextStatus: SettlementStatus = allPaid ? "completed" : s.status;

        return { ...s, participantsList: nextParticipantsList, status: nextStatus };
      })
    );
  };



  const selectedSettlementData = settlements.find((settlement) => settlement.id === selectedSettlement)

  const currentUserEntry = selectedSettlementData?.participantsList.find((p) => p.id === currentUserId);
  const isCurrentUserPaid = Boolean(currentUserEntry?.isPaid);

  const isPaymentRequired =
    !!selectedSettlementData &&
    selectedSettlementData.createdById !== currentUserId &&
    selectedSettlementData.status === "pending";

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="flex">
        {/* Left Sidebar */}
        <Sidebar
          onNavigateToOnboarding={onNavigateToOnboarding}
          onShowNotification={() => setShowNotificationModal(true)}
        />

        <div className="flex-1 flex">
          {/* 정산 리스트 사이드바 */}
          <div className="w-80 bg-white border-r border-orange-200 shadow-lg">
            {/* 헤더 */}
            <div className="p-6 border-b border-orange-200 bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 font-jua">정산 목록</h2>
              </div>

              {/* 탭 */}
              <div className="flex gap-1 bg-orange-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setPaymentCompleted(false)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold transition-colors font-gowun
                    ${!paymentCompleted ? "bg-green-400 text-white shadow-sm" : "text-orange-700 hover:bg-orange-200 bg-transparent"}`}
                  aria-pressed={!paymentCompleted}
                >
                  진행중 ({ongoingSettlements.length})
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentCompleted(true)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold transition-colors font-gowun
                    ${paymentCompleted ? "bg-green-400 text-white shadow-sm" : "text-orange-700 hover:bg-orange-200 bg-transparent"}`}
                  aria-pressed={paymentCompleted}
                >
                  완료 ({completedSettlements.length})
                </button>
              </div>
            </div>

            {/* 정산 리스트 */}
            <div className="overflow-y-auto h-[calc(100vh-200px)]">
              {visibleSettlements.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                  <div className="text-4xl mb-3">💰</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 font-jua">
                    {paymentCompleted ? "완료된 정산 없음" : "현재 진행중인 정산 없음"}
                  </h3>
                  <p className="text-sm text-gray-600 font-gowun">
                    {paymentCompleted ? "완료된 정산이 여기 표시됩니다." : "새로운 정산을 생성해보세요!"}
                  </p>
                </div>
              ) : (
                visibleSettlements.map((settlement) => (
                  <div
                    key={settlement.id}
                    onClick={() => setSelectedSettlement(settlement.id)}
                    className={`p-4 border-b border-orange-200 cursor-pointer transition-colors hover:bg-orange-50 ${
                      selectedSettlement === settlement.id ? "bg-orange-100 border-l-4 border-l-green-400" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full mt-2 flex-shrink-0 bg-green-400" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-sm mb-1 truncate font-jua">{settlement.title}</h3>
                        <p className="text-gray-600 text-xs mb-2 line-clamp-2 font-gowun">{settlement.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 font-gowun">{getParticipantCount(settlement)}명 참여</span>
                          <span className="text-gray-600 font-gowun">{settlement.dueDate}</span>
                        </div>
                        <div className="mt-2">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold font-jua">
                            {getPerPerson(settlement).toLocaleString()}원/인
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 상세 뷰 */}
          <div className="flex-1 bg-gradient-to-br from-orange-50 to-orange-100">
            {selectedSettlementData ? (
              <div className="p-6">
                {/* 헤더 */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-gray-800 font-gowun">
                        💰 정산
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          selectedSettlementData.status === "pending"
                            ? "bg-gradient-to-r from-green-300 to-green-500 text-white"
                            : "bg-orange-100 text-orange-600"
                        }`}
                      >
                        {selectedSettlementData.status === "pending" ? "진행중" : "완료"}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 font-gowun">생성자: {selectedSettlementData.createdBy} | 생성일: {selectedSettlementData.createdAt}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <h1 className="text-2xl font-bold text-gray-800 font-jua">{selectedSettlementData.title}</h1>
                    <p className="text-gray-600 text-sm font-gowun">{selectedSettlementData.description}</p>
                  </div>

                  {/* 정산 정보 카드 */}
                  <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-lg mb-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-500 mb-1 font-jua">
                          {selectedSettlementData.totalAmount.toLocaleString()}원
                        </div>
                        <div className="text-xs text-gray-600 font-gowun">총 금액</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-800 mb-1 font-jua">
                          {getPerPerson(selectedSettlementData).toLocaleString()}원
                        </div>
                        <div className="text-xs text-gray-600 font-gowun">1인당</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600 mb-1 font-jua">
                          {getParticipantCount(selectedSettlementData)}명
                        </div>
                        <div className="text-xs text-gray-600 font-gowun">참여자</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl p-4 border border-orange-200 text-center shadow-lg">
                      <h3 className="font-semibold text-gray-800 text-base mb-3 font-jua">영수증</h3>
                      <div className="flex justify-center mb-3">
                        {selectedSettlementData.receiptImage ? (
                          <img
                            src={selectedSettlementData.receiptImage || "/placeholder.svg"}
                            alt="영수증"
                            className="w-48 h-60 border border-orange-200 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-48 h-60 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50">
                            <div className="text-3xl text-gray-400 mb-2">📄</div>
                            <p className="text-gray-500 font-medium font-jua text-sm">영수증 없음</p>
                            <p className="text-gray-400 text-xs mt-1 font-gowun">업로드된 영수증이 없습니다</p>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 font-gowun">
                        {selectedSettlementData.receiptImage
                          ? "정산 관련 영수증입니다"
                          : "영수증이 업로드되지 않았습니다"}
                      </p>
                    </div>

                    {isPaymentRequired ? (
                      <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-lg">
                        <h3 className="font-semibold text-gray-800 text-base mb-3 font-jua">정산 정보</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                {selectedSettlementData.accountHolder.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800 font-jua">받는 사람</p>
                                <p className="text-sm text-gray-600 font-gowun">{selectedSettlementData.accountHolder}</p>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm text-gray-600 mb-1 font-gowun">보낼 금액</p>
                            <p className="text-2xl font-bold text-green-500 font-jua">
                              {getPerPerson(selectedSettlementData).toLocaleString()}원
                            </p>
                          </div>

                          <button
                            onClick={() => !isCurrentUserPaid && handlePayment(selectedSettlementData.id)}
                            disabled={isCurrentUserPaid}
                            className={`w-full py-4 bg-gradient-to-r from-green-300 to-green-500 text-white rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 font-jua
                              ${isCurrentUserPaid ? "opacity-60 cursor-not-allowed" : "hover:from-green-400 hover:to-green-600 hover:scale-105 shadow-lg hover:shadow-xl"}`}
                          >
                            <span>💳</span>
                            <span>{isCurrentUserPaid ? "정산 완료" : "정산하기"}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-lg">
                        <h3 className="font-semibold text-gray-800 text-base mb-3 font-jua">참여자 결제 현황</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {selectedSettlementData.participantsList.map((participant) => (
                            <div
                              key={participant.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                  {participant.name.charAt(0)}
                                </div>
                                <span className="font-medium text-gray-800 font-jua">{participant.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 font-gowun">
                                  {getPerPerson(selectedSettlementData).toLocaleString()}원
                                </span>
                                <span
                                  className={`px-3 py-1 rounded-full text-sm font-semibold font-gowun ${
                                    participant.isPaid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                  }`}
                                  aria-readonly="true"
                                >
                                  {participant.isPaid ? "✅ 완료" : "❌ 미완료"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 font-gowun">결제 완료</span>
                            <span className="font-semibold text-green-500 font-jua">
                              {selectedSettlementData.participantsList.filter((p) => p.isPaid).length} /{" "}
                              {selectedSettlementData.participantsList.length}명
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm mt-1">
                            <span className="text-gray-600 font-gowun">수금 완료</span>
                            <span className="font-semibold text-green-500 font-jua">
                              {(
                                  selectedSettlementData.participantsList.filter((p) => p.isPaid).length *
                                  getPerPerson(selectedSettlementData)
                                ).toLocaleString()}원
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedSettlementData.createdBy === currentUser && (
                  <div className="mt-8 pt-6 border-t border-orange-200">
                    <div className="flex justify-end gap-4">
                      {selectedSettlementData.status === "pending" && (
                        <button
                          onClick={() => handleEndSettlement(selectedSettlementData.id)}
                          className="px-6 py-3 bg-green-400 hover:bg-green-500 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg flex items-center gap-2 font-jua"
                        >
                          <span>🔒</span>
                          <span>정산 종료</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteSettlement(selectedSettlementData.id)}
                        className="px-6 py-3 bg-red-400 hover:bg-red-500 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg flex items-center gap-2 font-jua"
                      >
                        <span>🗑️</span>
                        <span>정산 삭제</span>
                      </button>
                    </div>
                  </div>
                )}


              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">💰</div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2 font-jua">정산을 선택해주세요</h2>
                  <p className="text-gray-600 font-gowun">왼쪽 목록에서 정산을 선택하면 상세 내용을 확인할 수 있습니다.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onNavigateToOnboarding={onNavigateToOnboarding}
      />
    </div>
  )
}
