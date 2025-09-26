import React, { useState, useEffect } from "react";
import { UserApi } from "../apis/user/api";
import AccountChangeModal from "./AccountChangeModal";
import type { DutchpayDetailResponse } from "../pages/Settlement";
import { DutchpayApi, type PayRequest } from "../apis/dutchpay";
import { useEscapeKey } from '../hooks/useEscapeKey';

interface PayPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  payInfo: DutchpayDetailResponse | null;
}

const PayPasswordModal: React.FC<PayPasswordModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  payInfo,
}) => {
  // ESC 키로 모달 닫기
  useEscapeKey(onClose, isOpen);

  const [userAccount, setUserAccount] = useState({
    bankName: "로딩중...",
    accountNumber: "로딩중...",
  });
  const [isAccountChangeModalOpen, setIsAccountChangeModalOpen] =
    useState(false);
  const [paymentPassword, setPaymentPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 계좌 정보와 인벤토리 정보를 병렬로 조회
      Promise.all([UserApi.getMyAccount()])
        .then(([accountData]) => {
          setUserAccount(accountData);
        })
        .catch((error) => {
          console.error("정보 조회 실패:", error);
          setUserAccount({
            bankName: "계좌 정보 오류",
            accountNumber: "정보를 불러올 수 없습니다",
          });
        });
    } else if (!isOpen) {
      // 모달이 닫힐 때 상태 초기화
      setShowPasswordInput(false);
      setPaymentPassword("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePayment = () => {
    setShowPasswordInput(true);
  };

  const handleConfirm = async (settlementId: number | undefined) => {
    try {
      if (!settlementId || !payInfo) {
        alert("정산 데이터를 찾을 수 없습니다.");
        return;
      }
      // 2. 결제 요청 데이터 생성
      const payRequest: PayRequest = {
        depositUserId: payInfo.createdUserId, // 결제 받을 사람
        amount: payInfo.payAmount, // 결제 금액
        paymentPassword: paymentPassword,
      };

      console.log(payRequest);

      // 3. '정산하기' API 호출
      await DutchpayApi.pay(settlementId, payRequest); // API 호출

      alert("정상적으로 처리되었습니다."); // 알림
      onConfirm(); // 부모 컴포넌트의 후속 작업 호출 (모달 닫기 및 UI 업데이트)

      onClose(); // 모달 닫기
    } catch (error: any) {
      console.error("결제 실패:", error);

      console.log("errrrrr", error.data);

      let errorMessage = "결제에 실패했습니다.";

      // fetchClient에서 이미 파싱된 에러 응답 처리
      if (error?.data) {
        errorMessage = error.data;
      } else if (error?.message) {
        try {
          const errorData = JSON.parse(error.message);
          errorMessage = errorData?.data || errorData?.message || errorMessage;
        } catch {
          errorMessage = error.message;
        }
      }

      // 특정 에러 메시지에 대한 사용자 친화적 처리
      if (errorMessage.includes("잔액이 부족")) {
        errorMessage =
          "💳 계좌 잔액이 부족합니다.\n계좌에 충분한 금액이 있는지 확인해 주세요.";
      } else if (errorMessage.includes("계좌번호")) {
        errorMessage =
          "🏦 계좌 정보에 문제가 있습니다.\n계좌번호를 다시 확인해 주세요.";
      } else if (errorMessage.includes("이체")) {
        errorMessage = "⚠️ " + errorMessage;
      } else if (errorMessage.includes("비밀번호")) {
        errorMessage = "🔒 결제 비밀번호가 올바르지 않습니다.";
      }

      alert(errorMessage);
    }
  };

  const handleAccountChange = () => {
    setIsAccountChangeModalOpen(true);
  };

  const handleAccountUpdate = async (newAccountNumber: string) => {
    try {
      await UserApi.updateMyAccount(newAccountNumber);
      const updatedAccount = await UserApi.getMyAccount();
      setUserAccount(updatedAccount);
      alert("계좌가 성공적으로 변경되었습니다.");
    } catch (error: any) {
      console.error("계좌 변경 실패:", error);

      let errorMessage = "계좌 변경에 실패했습니다.";

      // fetchClient에서 throw한 에러 메시지 파싱
      if (error?.message) {
        try {
          // JSON 형태의 에러 응답인지 확인
          const errorData = JSON.parse(error.message);
          // ApiResponse 구조: { success: false, data: "메시지", status: 400 }
          errorMessage = errorData?.data || errorData?.message || errorMessage;
        } catch {
          // JSON이 아니면 그대로 사용
          errorMessage = error.message;
        }
      }

      alert(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 w-[500px] max-h-[700px] relative overflow-y-auto">
        <div className="text-center pt-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-700 font-jua">
            정산하기
          </h2>
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-2 right-4 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* 결제 계좌 정보 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-bold text-gray-700 font-jua mb-3">
            결제 계좌 정보
          </h3>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-blue-600 text-lg">🏦</span>
                <div>
                  <div className="font-medium text-blue-700 font-gowun text-sm">
                    {userAccount.bankName}
                  </div>
                  <div className="text-blue-600 font-jua">
                    {userAccount.accountNumber}
                  </div>
                </div>
              </div>
              <button
                onClick={handleAccountChange}
                className="bg-white border border-blue-300 text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg font-gowun text-xs transition-colors"
              >
                계좌 변경
              </button>
            </div>
            <p className="text-xs text-blue-500 font-gowun mt-2">
              위 계좌에서 자동 출금됩니다
            </p>
          </div>
        </div>

        {/* 결제 비밀번호 입력 */}
        {showPasswordInput && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-bold text-gray-700 font-jua mb-3">
              결제 비밀번호 입력
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-600 text-lg">🔒</span>
                <span className="font-medium text-yellow-700 font-gowun text-sm">
                  결제를 위해 비밀번호를 입력하세요
                </span>
              </div>
              <input
                type="password"
                value={paymentPassword}
                onChange={(e) => setPaymentPassword(e.target.value)}
                placeholder="결제 비밀번호를 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-gowun text-center text-lg tracking-widest focus:outline-none focus:border-orange-500"
                maxLength={6}
                autoFocus
              />
              <p className="text-xs text-yellow-600 font-gowun mt-2 text-center">
                회원가입 시 설정한 6자리 결제 비밀번호를 입력하세요
              </p>
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="px-6 py-4">
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                if (showPasswordInput) {
                  setShowPasswordInput(false);
                  setPaymentPassword("");
                } else {
                  onClose();
                }
              }}
              className="bg-white border-2 border-gray-300 text-gray-600 rounded-xl px-6 py-2 font-semibold font-jua text-sm hover:bg-gray-50 transition-colors"
            >
              {showPasswordInput ? "이전" : "취소"}
            </button>
            <button
              onClick={
                showPasswordInput
                  ? () => handleConfirm(payInfo?.id)
                  : handlePayment
              }
              className="bg-orange-500 border-2 border-orange-600 text-white rounded-xl px-6 py-2 font-semibold font-jua text-sm hover:bg-orange-600 transition-colors"
            >
              {showPasswordInput
                ? "결제 완료"
                : `${payInfo?.payAmount}원 결제하기`}
            </button>
          </div>
        </div>
      </div>

      {/* 계좌 변경 모달 */}
      <AccountChangeModal
        isOpen={isAccountChangeModalOpen}
        onClose={() => setIsAccountChangeModalOpen(false)}
        onConfirm={handleAccountUpdate}
      />
    </div>
  );
};

export default PayPasswordModal;
