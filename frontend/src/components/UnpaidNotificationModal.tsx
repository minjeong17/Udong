import React from 'react';
import type { MemberStatusItem } from '../apis/clubdues';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface UnpaidNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  unpaidMembers: MemberStatusItem[];
  duesNo: number;
  amount: number;
}

const UnpaidNotificationModal: React.FC<UnpaidNotificationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  unpaidMembers,
  duesNo,
  amount
}) => {
  // ESC 키로 모달 닫기
  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 w-[500px] max-h-[600px] relative">
        {/* 헤더 */}
        <div className="text-center pt-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-700 font-jua">미납자 알림 전송</h2>
          <p className="text-sm text-gray-600 font-gowun mt-2">
            제 {duesNo}차 회비 ({amount.toLocaleString()}원) 미납자에게 알림을 전송합니다
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

        {/* 안내 메시지 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-600">⚠️</span>
              <span className="font-semibold text-red-700 font-gowun">알림 전송 대상</span>
            </div>
            <p className="text-sm text-red-600 font-gowun">
              아래의 미납자 명단에게 납부 알림을 보내시겠습니까?
            </p>
          </div>
        </div>

        {/* 미납자 목록 */}
        <div className="px-6 py-4 max-h-80 overflow-y-auto">
          <div className="space-y-3">
            {unpaidMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 font-gowun">
                현재 미납자가 없습니다.
              </div>
            ) : (
              unpaidMembers.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200"
                >
                  <span className="text-red-500">❌</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 font-gowun">
                      {member.userName}
                    </div>
                    <div className="text-sm text-gray-500 font-gowun">
                      {member.userEmail}
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 font-gowun">
                    미납
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 전송 정보 및 버튼 */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600 font-gowun">
              알림 전송 대상: <span className="font-bold text-red-500">{unpaidMembers.length}명</span>
            </span>
            <span className="text-xs text-gray-500 font-gowun">
              알림 내용: "{duesNo}회차 회비가 납부되지 않았습니다."
            </span>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="bg-white border-2 border-gray-300 text-gray-600 rounded-xl px-6 py-2 font-semibold font-jua text-sm hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              disabled={unpaidMembers.length === 0}
              className={`rounded-xl px-6 py-2 font-semibold font-jua text-sm transition-colors ${
                unpaidMembers.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 border-2 border-red-600 text-white hover:bg-red-600'
              }`}
            >
              알림 전송
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnpaidNotificationModal;