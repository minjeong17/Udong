import React, { useState, useEffect } from 'react';
import { ClubApi } from '../apis/clubs';
import type { MascotResponse } from '../apis/clubs/response';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface Mascot {
  id: number;
  name: string;
  src: string;
  description?: string;
  createdAt?: string;
}

interface MascotChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMascotChange: (mascotId: number) => Promise<void>;
  currentMascotId?: number;
  clubId?: number;
}

const MascotChangeModal: React.FC<MascotChangeModalProps> = ({
  isOpen,
  onClose,
  onMascotChange,
  currentMascotId = 1,
  clubId,
}) => {
  // ESC 키로 모달 닫기
  useEscapeKey(onClose, isOpen);

  const [selectedMascotId, setSelectedMascotId] = useState(currentMascotId);
  const [currentPage, setCurrentPage] = useState(0);
  const [mascots, setMascots] = useState<Mascot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChanging, setIsChanging] = useState(false);

  const itemsPerPage = 4;
  const totalPages = Math.ceil(mascots.length / itemsPerPage);

  // 실제 API로 마스코트 목록 가져오기
  const fetchMascots = async () => {
    if (!clubId) {
      setError('동아리 정보가 없습니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 실제 API 호출
      const response = await ClubApi.getMascotList(clubId, 0, 20); // 최대 20개까지 가져오기

      // API 응답을 Mascot 인터페이스에 맞게 변환
      const apiMascots: Mascot[] = response.content.map((mascot: MascotResponse) => ({
        id: mascot.id,
        name: `마스코트 ${mascot.id}`,
        src: mascot.imageUrl,
        description: `생성일: ${new Date(mascot.createdAt).toLocaleDateString()}`,
        createdAt: mascot.createdAt
      }));

      // 정순으로 정렬 (오래된 마스코트가 먼저 나오도록)
      apiMascots.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      setMascots(apiMascots);

      if (apiMascots.length === 0) {
        setError('아직 생성된 마스코트가 없습니다. 마스코트 리롤권을 사용해보세요!');
      }
    } catch (err) {
      setError('마스코트 목록을 불러오는데 실패했습니다.');
      console.error('마스코트 목록 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 현재 페이지의 마스코트들 가져오기
  const getCurrentPageMascots = () => {
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageMascots = mascots.slice(startIndex, endIndex);

    // 4개 칸을 채우기 위해 빈 칸 추가
    while (pageMascots.length < itemsPerPage) {
      pageMascots.push({ id: -1, name: '', src: '' });
    }

    return pageMascots;
  };

  const handleMascotSelect = (mascotId: number) => {
    if (mascotId !== -1) {
      setSelectedMascotId(mascotId);
    }
  };

  const handleConfirm = async () => {
    if (!selectedMascotId) return;

    setIsChanging(true);
    try {
      await onMascotChange(selectedMascotId);
      onClose();
    } catch (err) {
      setError('마스코트 변경에 실패했습니다. 다시 시도해주세요.');
      console.error('마스코트 변경 실패:', err);
    } finally {
      setIsChanging(false);
    }
  };

  const handleCancel = () => {
    setSelectedMascotId(currentMascotId);
    setError(null);
    onClose();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 모달이 열릴 때 데이터 로드 및 초기화
  useEffect(() => {
    if (isOpen && clubId) {
      setSelectedMascotId(currentMascotId);
      setError(null);
      setCurrentPage(0);
      fetchMascots();
    }
  }, [isOpen, currentMascotId, clubId]);

  // 마스코트 목록이 로드된 후 선택된 마스코트가 있는 페이지로 이동
  useEffect(() => {
    if (mascots.length > 0 && currentMascotId) {
      const mascotIndex = mascots.findIndex(m => m.id === currentMascotId);
      if (mascotIndex !== -1) {
        const pageIndex = Math.floor(mascotIndex / itemsPerPage);
        setCurrentPage(pageIndex);
      }
    }
  }, [mascots, currentMascotId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 rounded-3xl shadow-2xl w-[700px] h-[550px] p-6 relative overflow-hidden border border-orange-200">
        {/* 제목 */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800 font-jua">마스코트 선택</h2>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700 font-jua text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* 로딩 상태 */}
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-600 font-jua">마스코트를 불러오는 중...</span>
          </div>
        ) : (
          <>
        {/* 마스코트 그리드 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {getCurrentPageMascots().map((mascot, index) => (
            <div key={`${currentPage}-${index}`} className="flex flex-col items-center">
              {mascot.id === -1 ? (
                // 빈 칸 표시
                <div className="relative w-48 h-40 rounded-2xl border-4 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
                  <div className="text-purple-300 text-4xl">×</div>
                </div>
              ) : (
                <button
                  onClick={() => handleMascotSelect(mascot.id)}
                  className={`relative w-48 h-40 rounded-2xl border-4 transition-all duration-300 ${
                    selectedMascotId === mascot.id
                      ? 'bg-gradient-to-br from-orange-100 to-pink-100 border-orange-400 shadow-lg transform scale-105'
                      : 'bg-gradient-to-br from-white to-purple-50 border-purple-200 hover:border-orange-300 hover:scale-105'
                  }`}
                >
                  <img
                    src={mascot.src}
                    alt={`마스코트 ${mascot.id}`}
                    className="w-32 h-32 object-contain mx-auto mt-2"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  {selectedMascotId === mascot.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1 mb-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="p-1 rounded-full bg-purple-100 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i)}
                className={`w-6 h-6 rounded-full text-sm font-semibold transition-colors ${
                  currentPage === i
                    ? 'bg-orange-500 text-white'
                    : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className="p-1 rounded-full bg-purple-100 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* 버튼들 */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleCancel}
            disabled={isChanging}
            className="bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-700 px-8 py-2 rounded-xl font-semibold font-jua border-2 border-purple-300 hover:border-purple-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={isChanging || !selectedMascotId || !mascots.find(m => m.id === selectedMascotId)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2 rounded-xl font-semibold font-jua transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            {isChanging && (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
            )}
            {isChanging ? '변경 중...' : '변경'}
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MascotChangeModal;