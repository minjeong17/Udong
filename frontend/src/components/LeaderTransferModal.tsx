import React, { useState } from 'react';

interface LeaderTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  targetMemberName: string;
}

const LeaderTransferModal: React.FC<LeaderTransferModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  targetMemberName
}) => {
  const [isTransferring, setIsTransferring] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsTransferring(true);
      await onConfirm();
    } catch (error) {
      console.error('Leader transfer failed:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-orange-100 p-8 max-w-md w-full mx-4">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 font-jua mb-2">
            회장 위임 확인
          </h2>
          <p className="text-gray-600 font-gowun text-sm">
            이 작업은 되돌릴 수 없습니다
          </p>
        </div>

        {/* 경고 메시지 */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-lg">🔴</span>
            <div>
              <h3 className="font-semibold text-red-800 font-jua mb-2">
                본인의 모든 회장 권한이 박탈됩니다
              </h3>
              <ul className="text-red-700 font-gowun text-sm space-y-1">
                <li>• 동아리 관리 권한 상실</li>
                <li>• 멤버 관리 권한 상실</li>
                <li>• 설정 변경 권한 상실</li>
                <li>• 회장 전용 기능 접근 불가</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 위임 대상 정보 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="text-center">
            <h4 className="font-semibold text-blue-800 font-jua mb-1">
              새로운 회장
            </h4>
            <p className="text-blue-700 font-gowun text-lg font-medium">
              {targetMemberName}
            </p>
          </div>
        </div>

        {/* 확인 질문 */}
        <div className="text-center mb-8">
          <p className="text-gray-700 font-gowun font-medium">
            <span className="text-red-600 font-bold">{targetMemberName}</span>에게
            <br />
            회장을 위임하시겠습니까?
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isTransferring}
            className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 text-gray-600 font-medium py-3 px-4 rounded-xl transition-colors font-gowun"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={isTransferring}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium py-3 px-4 rounded-xl transition-colors font-gowun flex items-center justify-center gap-2"
          >
            {isTransferring ? (
              <>
                <span className="animate-spin">⏳</span>
                위임 중...
              </>
            ) : (
              '회장 위임하기'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderTransferModal;