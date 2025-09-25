import React from 'react';
import type { MyUnpaidDuesResponse, MyUnpaidDuesItem } from '../apis/clubdues/response';

interface UnpaidDuesModalProps {
  isOpen: boolean;
  onClose: () => void;
  unpaidDues: MyUnpaidDuesResponse | null;
  onDuesClick: (dues: MyUnpaidDuesItem) => void;
}

export default function UnpaidDuesModal({
  isOpen,
  onClose,
  unpaidDues,
  onDuesClick
}: UnpaidDuesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-[500px] max-h-[600px] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800 font-jua">미납 회비 내역</h2>
            <p className="text-sm text-gray-500 font-gowun mt-1">
              납부하지 않은 회비가 {unpaidDues?.unpaidDuesList.length || 0}건 있습니다
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {unpaidDues && unpaidDues.unpaidDuesList.length > 0 ? (
            <div className="space-y-3">
              {unpaidDues.unpaidDuesList.map((dues) => (
                <div
                  key={dues.duesId}
                  className="border border-red-200 bg-red-50 rounded-xl p-4 hover:bg-red-100 hover:border-red-300 transition-all cursor-pointer shadow-sm"
                  onClick={() => onDuesClick(dues)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 text-lg">💰</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-800 font-jua text-base">
                            제 {dues.duesNo}회차 회비
                          </h3>
                          <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium font-jua">
                            미납
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-lg font-bold text-red-600 font-jua">
                            {dues.membershipDues.toLocaleString()}원
                          </p>
                          <p className="text-sm text-gray-500 font-gowun">
                            생성일: {new Date(dues.createdAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium font-jua transition-colors shadow-sm hover:shadow-md">
                        납부하기
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-lg font-semibold text-gray-700 font-jua mb-2">
                모든 회비가 납부되었습니다!
              </h3>
              <p className="text-gray-500 font-gowun">
                현재 납부하지 않은 회비가 없습니다.
              </p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 font-gowun">
              💡 회비를 클릭하시면 바로 결제할 수 있습니다
            </p>
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium font-jua transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}