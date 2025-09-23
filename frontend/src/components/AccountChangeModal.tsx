import React, { useState } from 'react';

interface AccountChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newAccountNumber: string) => void;
}

const AccountChangeModal: React.FC<AccountChangeModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const [accountNumber, setAccountNumber] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountNumber.trim()) {
      onConfirm(accountNumber.trim());
      setAccountNumber('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 w-[400px] relative">
        {/* 헤더 */}
        <div className="text-center pt-6 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-700 font-jua">계좌 변경</h2>
          <p className="text-sm text-gray-600 font-gowun mt-2">
            새로운 계좌번호를 입력해주세요
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

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 font-gowun mb-2">
              계좌번호
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="계좌번호를 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-gowun text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={onClose}
              className="bg-white border-2 border-gray-300 text-gray-600 rounded-xl px-6 py-2 font-semibold font-jua text-sm hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="bg-orange-500 border-2 border-orange-600 text-white rounded-xl px-6 py-2 font-semibold font-jua text-sm hover:bg-orange-600 transition-colors"
            >
              변경
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountChangeModal;