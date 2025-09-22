import React, { useState } from 'react';

interface PaymentCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, targetMembers: number) => void;
}

const PaymentCollectionModal: React.FC<PaymentCollectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const [amount, setAmount] = useState<number>(25000);
  const [targetMembers, setTargetMembers] = useState<number>(10);

  if (!isOpen) return null;

  const expectedTotal = amount * targetMembers;

  const handleConfirm = () => {
    onConfirm(amount, targetMembers);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 w-[450px] h-[420px] relative">
        {/* 헤더 */}
        <div className="text-center pt-6 pb-4">
          <h2 className="text-2xl font-bold text-gray-700 font-jua">제 3차 회비를 수금합니다</h2>
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

        {/* 입력 섹션 */}
        <div className="px-6 mb-6">
          <div className="space-y-6">
            {/* 회비 입력 */}
            <div className="flex items-center justify-between">
              <label className="text-gray-600 font-semibold font-gowun text-base">회비:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-32 px-3 py-2 border border-gray-200 rounded-lg font-gowun text-center focus:outline-none focus:border-orange-300"
                />
                <span className="text-gray-600 font-gowun">원</span>
              </div>
            </div>

            {/* 적용인원 입력 */}
            <div className="flex items-center justify-between">
              <label className="text-gray-600 font-semibold font-gowun text-base">적용인원:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={targetMembers}
                  onChange={(e) => setTargetMembers(Number(e.target.value))}
                  className="w-20 px-3 py-2 border border-gray-200 rounded-lg font-gowun text-center focus:outline-none focus:border-orange-300"
                />
                <span className="text-gray-600 font-gowun">명</span>
              </div>
            </div>

            {/* 계산 섹션 */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-center gap-4 text-lg font-semibold">
                <span className="text-gray-700 font-gowun">{amount.toLocaleString()}원</span>
                <span className="text-gray-500 font-gowun">×</span>
                <span className="text-gray-700 font-gowun">{targetMembers}명</span>
              </div>

              <div className="text-center">
                <div className="text-sm text-gray-600 font-gowun mb-1">예상수금회비:</div>
                <div className="text-2xl font-bold text-orange-500 font-jua">
                  {expectedTotal.toLocaleString()}원
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 버튼 섹션 */}
        <div className="px-6 pb-6">
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
              진행
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCollectionModal;