import React, { useState } from 'react';
import type { MyUnpaidDuesItem } from '../apis/clubdues/response';

interface DuesPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  duesInfo: MyUnpaidDuesItem;
}

const DuesPaymentModal: React.FC<DuesPaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  duesInfo
}) => {
  const [hasDiscountCoupon] = useState(false); // 추후 inventory API로 확인
  const [discountAmount, setDiscountAmount] = useState(0); // 추후 계산

  // 추후 user API에서 가져올 계좌 정보 (임시 데이터)
  const [userAccount] = useState({
    bankName: 'SSAFY은행',
    accountNumber: '1023921491924'
  });

  if (!isOpen) return null;

  const finalAmount = duesInfo.membershipDues - discountAmount;

  const handleConfirm = () => {
    // 추후 결제 API 연동
    console.log('결제 정보:', {
      duesId: duesInfo.duesId,
      accountInfo: userAccount,
      originalAmount: duesInfo.membershipDues,
      discountAmount,
      finalAmount
    });
    onConfirm();
    onClose();
  };

  const handleAccountChange = () => {
    // 추후 계좌 변경 모달 또는 페이지 이동
    console.log('계좌 변경 요청');
    alert('계좌 변경 기능은 추후 구현 예정입니다.');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 w-[500px] max-h-[700px] relative overflow-y-auto">
        {/* 헤더 */}
        <div className="text-center pt-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-700 font-jua">회비 결제</h2>
          <p className="text-sm text-gray-600 font-gowun mt-2">
            제 {duesInfo.duesNo}회차 회비를 결제합니다
          </p>
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-2 right-4 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 회비 정보 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-blue-700 font-gowun">결제 대상</span>
              <span className="text-blue-600 font-jua">제 {duesInfo.duesNo}회차</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-600 font-gowun">회비 금액</span>
              <span className="text-lg font-bold text-blue-700 font-jua">
                {duesInfo.membershipDues.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>

        {/* 회비 감면권 사용 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-bold text-gray-700 font-jua mb-3">회비 감면권 사용</h3>

          {hasDiscountCoupon ? (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-600">🎫</span>
                  <span className="font-medium text-green-700 font-gowun">회비 감면권 보유</span>
                </div>
                <div className="text-sm text-green-600 font-gowun">
                  사용 가능한 감면권: 2개 (각 1,000원 할인)
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="discount"
                    value="none"
                    checked={discountAmount === 0}
                    onChange={() => setDiscountAmount(0)}
                    className="text-orange-500"
                  />
                  <span className="font-gowun text-sm">감면권 사용 안함</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="discount"
                    value="1000"
                    checked={discountAmount === 1000}
                    onChange={() => setDiscountAmount(1000)}
                    className="text-orange-500"
                  />
                  <span className="font-gowun text-sm">감면권 1개 사용 (1,000원 할인)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="discount"
                    value="2000"
                    checked={discountAmount === 2000}
                    onChange={() => setDiscountAmount(2000)}
                    className="text-orange-500"
                  />
                  <span className="font-gowun text-sm">감면권 2개 사용 (2,000원 할인)</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">🎫</span>
                <span className="text-gray-500 font-gowun text-sm">보유한 회비 감면권이 없습니다</span>
              </div>
              <p className="text-xs text-gray-400 font-gowun mt-1">
                활동 포인트로 상점에서 감면권을 구매할 수 있습니다
              </p>
            </div>
          )}
        </div>

        {/* 결제 계좌 정보 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-bold text-gray-700 font-jua mb-3">결제 계좌 정보</h3>

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
              위 계좌에서 회비가 자동 출금됩니다
            </p>
          </div>
        </div>

        {/* 결제 금액 요약 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-gowun">원래 금액</span>
              <span className="text-sm text-gray-700 font-jua">{duesInfo.membershipDues.toLocaleString()}원</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600 font-gowun">감면권 할인</span>
                <span className="text-sm text-green-600 font-jua">-{discountAmount.toLocaleString()}원</span>
              </div>
            )}

            <div className="border-t border-gray-200 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700 font-gowun">최종 결제 금액</span>
                <span className="text-xl font-bold text-orange-500 font-jua">
                  {finalAmount.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="px-6 py-4">
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="bg-white border-2 border-gray-300 text-gray-600 rounded-xl px-6 py-2 font-semibold font-jua text-sm hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              className="bg-orange-500 border-2 border-orange-600 text-white rounded-xl px-6 py-2 font-semibold font-jua text-sm hover:bg-orange-600 transition-colors"
            >
              {finalAmount.toLocaleString()}원 결제하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuesPaymentModal;