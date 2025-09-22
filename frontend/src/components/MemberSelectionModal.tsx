import React, { useState, useEffect } from 'react';
import type { MemberResponse } from '../apis/clubs';

interface MemberSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedUserIds: number[]) => void;
  members: MemberResponse[];
  totalMembers: number;
  initialSelectedUserIds?: number[];
}

const MemberSelectionModal: React.FC<MemberSelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  members,
  totalMembers,
  initialSelectedUserIds
}) => {
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(true);

  useEffect(() => {
    if (isOpen && members.length > 0) {
      // initialSelectedUserIds가 있으면 그것을 사용, 없으면 전체 선택
      const userIds = initialSelectedUserIds && initialSelectedUserIds.length > 0
        ? initialSelectedUserIds
        : members.map(member => member.userId);

      setSelectedUserIds(userIds);
      setSelectAll(userIds.length === members.length);
    }
  }, [isOpen, members, initialSelectedUserIds]);

  if (!isOpen) return null;

  const handleMemberToggle = (userId: number) => {
    setSelectedUserIds(prev => {
      const newSelected = prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId];

      setSelectAll(newSelected.length === members.length);
      return newSelected;
    });
  };

  const handleSelectAllToggle = () => {
    if (selectAll) {
      setSelectedUserIds([]);
      setSelectAll(false);
    } else {
      setSelectedUserIds(members.map(member => member.userId));
      setSelectAll(true);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedUserIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 w-[500px] max-h-[600px] relative">
        {/* 헤더 */}
        <div className="text-center pt-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-700 font-jua">회비 적용 대상 선택</h2>
          <p className="text-sm text-gray-600 font-gowun mt-2">
            회비를 납부할 동아리원을 선택해주세요
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

        {/* 전체 선택 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAllToggle}
              className="w-4 h-4 text-orange-500 rounded focus:ring-orange-300"
            />
            <span className="font-semibold text-gray-700 font-gowun">
              전체 선택 ({selectedUserIds.length}/{totalMembers}명)
            </span>
          </label>
        </div>

        {/* 회원 목록 */}
        <div className="px-6 py-4 max-h-80 overflow-y-auto">
          <div className="space-y-3">
            {members.map((member) => (
              <label
                key={member.userId}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(member.userId)}
                  onChange={() => handleMemberToggle(member.userId)}
                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-300"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800 font-gowun">
                      {member.name}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium font-gowun ${
                      member.role === 'LEADER'
                        ? 'bg-red-100 text-red-700'
                        : member.role === 'MANAGER'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {member.role === 'LEADER' ? '회장' :
                       member.role === 'MANAGER' ? '임원' : '회원'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 font-gowun">
                    {member.email}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 선택 정보 및 버튼 */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600 font-gowun">
              선택된 인원: <span className="font-bold text-orange-500">{selectedUserIds.length}명</span>
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
              disabled={selectedUserIds.length === 0}
              className={`rounded-xl px-6 py-2 font-semibold font-jua text-sm transition-colors ${
                selectedUserIds.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 border-2 border-orange-600 text-white hover:bg-orange-600'
              }`}
            >
              선택 완료
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberSelectionModal;