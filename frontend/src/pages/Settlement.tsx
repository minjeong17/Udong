import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import NotificationModal from "../components/NotificationModal";
import { DutchpayApi, type DutchpayListResponse } from "../apis/dutchpay";
import { useAuthStore } from "../stores/authStore";
import PayPasswordModal from "../components/PayPasswordModal";

// 참여자(결제 현황) 타입: id는 number, isPaid 필수
export type ParticipantPayment = {
  userId: number;
  name: string;
  isPaid: boolean;
};

export type DutchpayDetailResponse = {
  id: number;
  amount: number;
  note: string;
  createdAt: string;
  createdBy: string;
  createdUserId: number;
  done: boolean;
  isDone?: boolean;
  s3Key: string;
  imageUrl: string;
  payAmount?: number;
  event: {
    id: number;
    title: string;
    description: string;
  };
  participants: {
    userId: number;
    name: string;
    isPaid: boolean;
  }[];
};

interface SettlementProps {
  onNavigateToOnboarding: () => void;
}

export default function SettlementPage({
  onNavigateToOnboarding,
}: SettlementProps) {
  const [selectedSettlement, setSelectedSettlement] = useState<number | null>();
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [settlements, setSettlements] = useState<DutchpayListResponse[]>([]);
  const [selectedSettlementData, setSelectedSettlementData] =
    useState<DutchpayDetailResponse | null>(null);

  const userId = useAuthStore.getState().user?.id;
  // 정산 목록을 API에서 가져오는 함수
  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        const auth = useAuthStore.getState();
        const clubId = auth?.clubId;

        if (clubId == null) return;

        const fetchedSettlements = await DutchpayApi.getMyDutchpays(clubId); // API 호출
        console.log(fetchedSettlements);
        setSettlements(fetchedSettlements); // 상태에 정산 목록 저장
      } catch (error) {
        console.error("정산 목록 조회 실패:", error);
      }
    };

    fetchSettlements(); // 컴포넌트 로드 시 API 호출
  }, []);

  const [isPaymentRequired, setIsPaymentRequired] = useState<boolean>(false);

  // selectedSettlement이 변경될 때마다 상세 정보 가져오기
  useEffect(() => {
    const fetchSettlementDetails = async () => {
      try {
        if (!selectedSettlement) return;
        const fetchedSettlement = await DutchpayApi.getSettlementDetails(
          selectedSettlement
        );

        console.log("fetchedSettlement", fetchedSettlement);

        const normalized: DutchpayDetailResponse = {
          ...fetchedSettlement,
          isDone: fetchedSettlement.done, // done을 isDone으로 변경
          participants: fetchedSettlement.participants.map((p) => ({
            userId: p.userId, // id를 userId로 변경
            name: p.name,
            isPaid: (p as any).isPaid ?? (p as any).paid ?? false,
          })),
          payAmount: Math.ceil(
            fetchedSettlement.amount / fetchedSettlement.participants.length
          ),
        };
        console.log(normalized);

        setSelectedSettlementData(normalized); // 상태 업데이트

        const currentUserParticipant = normalized.participants.find(
          (p) => p.userId === userId
        );

        if (currentUserParticipant) {
          if (currentUserParticipant.isPaid) {
            setIsPaymentRequired(false); // 결제 완료된 경우
          } else {
            setIsPaymentRequired(true); // 결제 안된 경우
          }
        } else {
          // 유저가 참여하지 않았다면 결제 불가
          setIsPaymentRequired(false);
        }
      } catch (error) {
        console.error("Error fetching settlement details:", error);
      }
    };

    fetchSettlementDetails();
  }, [selectedSettlement]);

  const [openPasswordModal, setOpenPasswordModal] = useState(false);

  const getPerPersonAmount = (amount: number, participantCount: number) => {
    return Math.ceil(amount / participantCount).toLocaleString(); // 금액을 인당 계산 후 포맷팅
  };

  const handleDeleteSettlement = async (settlementId: number) => {
    try {
      confirm("정말 삭제하시겠습니까?");

      // API를 호출하여 정산 삭제
      await DutchpayApi.deleteSettlement(settlementId);

      // 삭제 완료 후 알림
      alert("정산이 삭제되었습니다.");

      // 여기서 상태 업데이트나 UI 변경을 할 수 있습니다.
      // 예: 삭제된 정산을 목록에서 제거하는 등의 처리
      setSettlements((prevSettlements) =>
        prevSettlements.filter((settlement) => settlement.id !== settlementId)
      );
      setSelectedSettlement(null);
      window.location.reload();
    } catch (error) {
      console.error("정산 삭제 중 오류 발생:", error);
      alert("정산 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleEndSettlement = async (settlementId: number) => {
    try {
      confirm("정말 정산을 종료하시겠습니까?");

      // 정산 종료 API 호출
      await DutchpayApi.endSettlement(settlementId);

      // 종료 완료 후 알림
      alert("정산이 종료되었습니다.");
    } catch (error) {
      console.error("정산 종료 중 오류 발생:", error);
      alert("정산 종료 중 오류가 발생했습니다.");
    }
  };
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
                <h2 className="text-xl font-bold text-gray-800 font-jua">
                  정산 목록
                </h2>
              </div>

              {/* 탭 */}
              <div className="flex gap-1 bg-orange-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setPaymentCompleted(false)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold transition-colors font-jua
                    ${
                      !paymentCompleted
                        ? "bg-green-400 text-white shadow-sm"
                        : "text-orange-700 hover:bg-orange-200 bg-transparent"
                    }`}
                  aria-pressed={!paymentCompleted}
                >
                  진행중 (
                  {
                    settlements.filter((settlement) => !settlement.isDone)
                      .length
                  }
                  )
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentCompleted(true)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold transition-colors font-jua
                    ${
                      paymentCompleted
                        ? "bg-green-400 text-white shadow-sm"
                        : "text-orange-700 hover:bg-orange-200 bg-transparent"
                    }`}
                  aria-pressed={paymentCompleted}
                >
                  완료 (
                  {settlements.filter((settlement) => settlement.isDone).length}
                  )
                </button>
              </div>
            </div>

            {/* 정산 리스트 */}
            <div className="overflow-y-auto h-[calc(100vh-200px)]">
              {settlements.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                  <div className="text-4xl mb-3">💰</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 font-jua">
                    {paymentCompleted
                      ? "완료된 정산 없음"
                      : "현재 진행중인 정산 없음"}
                  </h3>
                  <p className="text-sm text-gray-600 font-gowun">
                    {paymentCompleted
                      ? "완료된 정산이 여기 표시됩니다."
                      : "새로운 정산을 생성해보세요!"}
                  </p>
                </div>
              ) : (
                settlements
                  .filter((settlement) =>
                    paymentCompleted
                      ? settlement.isDone === true
                      : settlement.isDone === false
                  )
                  .map((settlement) => (
                    <div
                      key={settlement.id}
                      onClick={() => setSelectedSettlement(settlement.id)} // 여기에 선택 시 상세보기로 넘어가게 할 수 있음
                      className="p-4 border-b border-orange-200 cursor-pointer transition-colors hover:bg-orange-50"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                            settlement.isDone ? "bg-red-400" : "bg-green-400"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 text-sm mb-1 truncate font-jua">
                            {settlement.eventTitle}
                          </h3>
                          <p className="text-gray-600 text-xs mb-2 line-clamp-2 font-gowun">
                            {settlement.note}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 font-gowun">
                              {settlement.participantCount}명 참여
                            </span>
                            <span className="text-gray-600 font-gowun">
                              {/* 날짜 포맷팅 */}
                              {new Date(
                                settlement.createdAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="mt-2">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold font-jua">
                              {/* 인당 금액 계산 */}
                              {getPerPersonAmount(
                                settlement.amount,
                                settlement.participantCount
                              )}
                              원/인
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* 상세 뷰 부분 */}
          {!selectedSettlementData ? (
            <div className="flex-1 bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">💰</div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2 font-jua">
                    정산을 선택해주세요
                  </h2>
                  <p className="text-gray-600 font-gowun">
                    왼쪽 목록에서 정산을 선택하면 상세 내용을 확인할 수
                    있습니다.
                  </p>
                </div>
              </div>
            </div>
          ) : (
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
                          className={`px-3 py-1 rounded-full text-sm font-semibold font-jua ${
                            !selectedSettlementData.isDone
                              ? "bg-gradient-to-r from-green-300 to-green-500 text-white"
                              : "bg-orange-100 text-orange-600"
                          }`}
                        >
                          {!selectedSettlementData.isDone ? "진행중" : "완료"}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 font-gowun">
                          생성자: {selectedSettlementData.createdBy} | 생성일:{" "}
                          {new Date(
                            selectedSettlementData.createdAt
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <h1 className="text-2xl font-bold text-gray-800 font-jua">
                        {selectedSettlementData.event.title}
                      </h1>
                      <p className="text-gray-600 text-sm font-gowun">
                        {selectedSettlementData.note}
                      </p>
                    </div>

                    {/* 정산 정보 카드 */}
                    <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-lg mb-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-500 mb-1 font-jua">
                            {selectedSettlementData.payAmount}원
                          </div>
                          <div className="text-xs text-gray-600 font-gowun">
                            1인당
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-800 mb-1 font-jua">
                            {selectedSettlementData.amount.toLocaleString()}원
                          </div>
                          <div className="text-xs text-gray-600 font-gowun">
                            총 금액
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600 mb-1 font-jua">
                            {selectedSettlementData.participants.length}명
                          </div>
                          <div className="text-xs text-gray-600 font-gowun">
                            참여자
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl p-4 border border-orange-200 text-center shadow-lg">
                        <h3 className="font-semibold text-gray-800 text-base mb-3 font-jua">
                          영수증
                        </h3>
                        <div className="flex justify-center mb-3">
                          {selectedSettlementData.imageUrl ? (
                            <img
                              src={
                                selectedSettlementData.imageUrl ||
                                "/placeholder.svg"
                              }
                              alt="영수증"
                              className="w-48 h-60 border border-orange-200 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-48 h-60 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50">
                              <div className="text-3xl text-gray-400 mb-2">
                                📄
                              </div>
                              <p className="text-gray-500 font-medium font-jua text-sm">
                                영수증 없음
                              </p>
                              <p className="text-gray-400 text-xs mt-1 font-gowun">
                                업로드된 영수증이 없습니다
                              </p>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 font-gowun">
                          {selectedSettlementData.imageUrl
                            ? "정산 관련 영수증입니다"
                            : "영수증이 업로드되지 않았습니다"}
                        </p>
                      </div>
                      {selectedSettlementData.createdUserId !== userId ? (
                        <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-lg">
                          <h3 className="font-semibold text-gray-800 text-base mb-3 font-jua">
                            정산 정보
                          </h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-semibold font-jua">
                                  {selectedSettlementData.createdBy.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800 font-jua">
                                    받는 사람
                                  </p>
                                  <p className="text-sm text-gray-600 font-gowun">
                                    {selectedSettlementData.createdBy}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-sm text-gray-600 mb-1 font-gowun">
                                보낼 금액
                              </p>
                              <p className="text-2xl font-bold text-green-500 font-jua">
                                {selectedSettlementData.payAmount}원
                              </p>
                            </div>

                            <button
                              onClick={() => setOpenPasswordModal(true)}
                              disabled={
                                selectedSettlementData.isDone ||
                                !isPaymentRequired
                              }
                              className={`w-full py-4 bg-gradient-to-r from-green-300 to-green-500 text-white rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 font-jua
                                ${
                                  selectedSettlementData.isDone ||
                                  !isPaymentRequired
                                    ? "opacity-60 cursor-not-allowed"
                                    : "hover:from-green-400 hover:to-green-600 hover:scale-105 shadow-lg hover:shadow-xl"
                                }`}
                            >
                              <span>💳</span>
                              <span>
                                {isPaymentRequired &&
                                !selectedSettlementData.isDone
                                  ? "정산하기"
                                  : "정산완료"}
                              </span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* 참여자 결제 현황 */}
                          <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-lg">
                            <h3 className="font-semibold text-gray-800 text-base mb-3 font-jua">
                              참여자 결제 현황
                            </h3>
                            <div className="space-y-2 h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                              {selectedSettlementData.participants.map(
                                (participant) => (
                                  <div
                                    key={participant.userId}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-semibold font-jua">
                                        {participant.name.charAt(0)}
                                      </div>
                                      <span className="font-medium text-gray-800 font-jua">
                                        {participant.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm text-gray-600 font-gowun">
                                        {selectedSettlementData.amount /
                                          selectedSettlementData.participants
                                            .length}{" "}
                                        원
                                      </span>
                                      <span
                                        className={`px-3 py-1 rounded-full text-sm font-semibold font-gowun ${
                                          participant.isPaid
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                        }`}
                                        aria-readonly="true"
                                      >
                                        {participant.isPaid
                                          ? "✅ 완료"
                                          : "❌ 미완료"}
                                      </span>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>

                            {/* 결제 완료와 수금 완료 텍스트 */}
                            <div className="mt-auto pt-4 border-t border-gray-200">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 font-gowun">
                                  결제 완료
                                </span>
                                <span className="font-semibold text-green-500 font-jua">
                                  {
                                    selectedSettlementData.participants.filter(
                                      (p) => p.isPaid
                                    ).length
                                  }{" "}
                                  / {selectedSettlementData.participants.length}
                                  명
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-sm mt-1">
                                <span className="text-gray-600 font-gowun">
                                  수금 완료
                                </span>
                                <span className="font-semibold text-green-500 font-jua">
                                  {selectedSettlementData.participants.filter(
                                    (p) => p.isPaid
                                  ).length *
                                    (selectedSettlementData.amount /
                                      selectedSettlementData.participants
                                        .length)}{" "}
                                  원
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {selectedSettlementData?.createdUserId === userId &&
                      !selectedSettlementData.isDone && (
                        <div className="mt-6 flex gap-4 font-semibold font-jua justify-end">
                          <button
                            onClick={() =>
                              handleDeleteSettlement(selectedSettlementData.id)
                            }
                            className="inline-flex items-center gap-2 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                          >
                            <span className="text-xl">❌</span>
                            <span>정산 삭제</span>
                          </button>
                          <button
                            onClick={() =>
                              handleEndSettlement(selectedSettlementData.id)
                            }
                            className="inline-flex items-center gap-2 py-2 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                          >
                            <span className="text-xl">⏰</span>
                            <span>정산 종료</span>
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
      {openPasswordModal && (
        <PayPasswordModal
          isOpen={openPasswordModal} // 모달 열기 상태
          onClose={() => setOpenPasswordModal(false)} // 모달 닫기
          onConfirm={() => {
            // 결제 완료 후 처리 (예: 상세 조회 다시 불러오기, 토스트 메시지, UI 업데이트 등)
            setOpenPasswordModal(false); // 모달 닫기
            setIsPaymentRequired(false);
          }}
          payInfo={selectedSettlementData}
        />
      )}
      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onNavigateToOnboarding={onNavigateToOnboarding}
      />
    </div>
  );
}
