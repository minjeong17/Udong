import React, { useState } from 'react';

interface RoleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    name: string;
    role: 'LEADER' | 'MANAGER' | 'MEMBER';
    birthDate: string;
  } | null;
  onRoleChange: (newRole: 'LEADER' | 'MANAGER' | 'MEMBER') => void;
}

const RoleChangeModal: React.FC<RoleChangeModalProps> = ({
  isOpen,
  onClose,
  member,
  onRoleChange
}) => {
  const [selectedRole, setSelectedRole] = useState<'LEADER' | 'MANAGER' | 'MEMBER'>('MEMBER');

  if (!isOpen || !member) return null;

  const getRoleInKorean = (role: string): string => {
    switch (role) {
      case 'LEADER': return '회장';
      case 'MANAGER': return '임원';
      case 'MEMBER': return '회원';
      default: return role;
    }
  };

  const handleRoleSelect = (role: 'LEADER' | 'MANAGER' | 'MEMBER') => {
    setSelectedRole(role);
  };

  const handleConfirm = () => {
    onRoleChange(selectedRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 w-[450px] h-[420px] relative">
        {/* 헤더 */}
        <div className="text-center pt-6 pb-4">
          <h2 className="text-2xl font-bold text-gray-700 font-jua">직책변경</h2>
        </div>

        {/* 회원 정보 섹션 */}
        <div className="px-6 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 font-semibold font-gowun text-sm">이름:</span>
              <span className="text-lg font-bold text-gray-800 font-jua">{member.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-semibold font-gowun text-sm">생년월일:</span>
              <span className="text-sm font-semibold text-gray-700 font-gowun">{member.birthDate}</span>
            </div>
          </div>
        </div>

        {/* 직책 변경 섹션 */}
        <div className="px-6 mb-6">
          <div className="grid grid-cols-2 gap-6">
            {/* 기존 직책 */}
            <div>
              <div className="text-gray-600 font-semibold font-gowun text-sm mb-2">기존직책:</div>
              <div className="bg-gray-500 text-white rounded-xl px-4 py-2 text-center">
                <span className="text-sm font-bold font-jua">{getRoleInKorean(member.role)}</span>
              </div>
            </div>

            {/* 신규 직책 */}
            <div>
              <div className="text-gray-600 font-semibold font-gowun text-sm mb-2">신규직책:</div>
              <div className="space-y-2">
                {/* 회장 */}
                <button
                  onClick={() => handleRoleSelect('LEADER')}
                  className={`w-full rounded-xl px-3 py-2 text-center transition-all font-jua text-sm border ${
                    selectedRole === 'LEADER'
                      ? 'bg-red-500 text-white border-red-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
                  }`}
                >
                  회장
                </button>

                {/* 임원 */}
                <button
                  onClick={() => handleRoleSelect('MANAGER')}
                  className={`w-full rounded-xl px-3 py-2 text-center transition-all font-jua text-sm border ${
                    selectedRole === 'MANAGER'
                      ? 'bg-blue-500 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  임원
                </button>

                {/* 회원 */}
                <button
                  onClick={() => handleRoleSelect('MEMBER')}
                  className={`w-full rounded-xl px-3 py-2 text-center transition-all font-jua text-sm border ${
                    selectedRole === 'MEMBER'
                      ? 'bg-gray-500 text-white border-gray-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  회원
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 버튼 섹션 */}
        <div className="px-6 pb-6 pt-20">
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
              변경
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleChangeModal;