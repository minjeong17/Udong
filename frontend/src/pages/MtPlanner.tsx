import React, { useState } from "react";
import Sidebar from '../components/Sidebar';
import NotificationModal from '../components/NotificationModal';

interface MtPlannerProps {
  onNavigateToOnboarding: () => void;
}

interface MtPlan {
  location: { name: string; reason: string; distance: string };
  budget: { accommodation: number; meals: number; activities: number; transportation: number; total: number };
  schedule: { time: string; activity: string; location: string }[];
  items: { essential: string[]; recommended: string[]; provided: string[] };
  accommodation: { type: string; capacity: number; rooms: string; checkIn: string; checkOut: string; facilities: string[] };
}

const MtPlanner: React.FC<MtPlannerProps> = ({
  onNavigateToOnboarding
}) => {
  const [mtPlan, setMtPlan] = useState<MtPlan | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [formData, setFormData] = useState({
    duration: "",
    weather: "",
    participants: "",
    genderRatio: "",
    specialNotes: "",
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // MT 계획 생성 로직
    const generatedPlan = {
      location: { name: "강원도 평창", reason: "겨울 스포츠와 자연 경관이 뛰어남", distance: "2시간 30분" },
      schedule: [
        { time: "09:00", activity: "집합 및 출발", location: "학교 정문" },
        { time: "11:30", activity: "도착 및 짐 정리", location: "숙소" },
        { time: "12:30", activity: "점심 식사", location: "현지 맛집" },
        { time: "14:00", activity: "팀 빌딩 게임", location: "야외 공간" },
        { time: "16:00", activity: "자유 시간", location: "숙소 주변" },
        { time: "18:00", activity: "저녁 식사 & 친목 시간", location: "바베큐장" },
        { time: "21:00", activity: "레크리에이션", location: "강당" },
        { time: "23:00", activity: "자유 시간 & 취침", location: "숙소" },
      ],
      items: {
        essential: ["개인 세면도구", "여벌 옷", "운동화", "개인 약품", "충전기"],
        recommended: ["선크림", "모자", "카메라", "간식", "게임용품"],
        provided: ["침구류", "수건", "바베큐 용품", "음향 장비", "응급약품"],
      },
      budget: {
        accommodation: Math.floor(80000),
        meals: 35000,
        activities: 15000,
        transportation: 12000,
        total: Math.floor(80000) + 35000 + 15000 + 12000,
      },
      accommodation: {
        type: "펜션",
        capacity: 25,
        rooms: "4인실 6개",
        facilities: ["바베큐장", "강당", "주방", "세탁기", "와이파이"],
        checkIn: "15:00",
        checkOut: "11:00",
      },
    }

    setMtPlan(generatedPlan)
    setShowPlanModal(false)
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Left Sidebar */}
      <Sidebar
        onNavigateToOnboarding={onNavigateToOnboarding}
        onShowNotification={() => setShowNotificationModal(true)}
      />
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Content */}
        <div className="p-8 flex-1 overflow-auto">
          {!mtPlan ? (
            <div className="max-w-4xl mx-auto">
              <div className="relative mb-12 rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
                  alt="MT 계획 배경 이미지"
                  className="w-full h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h2 className="text-4xl font-bold mb-2 drop-shadow-lg">완벽한 MT 계획</h2>
                  <p className="text-xl opacity-90 drop-shadow-md">AI가 도와주는 맞춤형 MT 플래닝</p>
                </div>
                <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <div className="flex items-center gap-2 text-white">
                    <span className="text-2xl">🗺️</span>
                    <div>
                      <div className="text-sm font-semibold">AI 분석</div>
                      <div className="text-xs opacity-80">최적 장소 탐색 중...</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mb-12">
                <div className="text-6xl mb-6">🏕️</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">MT 계획 생성기</h2>
                <p className="text-lg text-gray-600 mb-8">
                  몇 가지 정보만 입력하면 완벽한 MT 계획을 자동으로 생성해드립니다
                </p>
                <button
                  onClick={() => {
                    setShowPlanModal(true);
                    // 예제: 더미 mtPlan 생성
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                >
                  ✨ MT 계획 시작하기
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8 pt-10">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">MT 계획서</h2>
                    <p className="text-gray-600">생성된 MT 계획을 확인하고 수정하세요</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                     onClick={() => {
                      setMtPlan(null);
                      setFormData({ duration: "", weather: "", participants: "", genderRatio: "", specialNotes: "" });
                      setShowPlanModal(true);
                     }}
                     className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
                    >
                      <span>🔄</span>
                      <span>새로 만들기</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 장소 정보 */}
                  <div className="bg-white rounded-xl p-6 border border-orange-200 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span>📍</span>
                      추천 장소
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-gray-800">{mtPlan.location.name}</h4>
                        <p className="text-gray-600 text-sm">{mtPlan.location.reason}</p>
                        <p className="text-orange-600 text-sm font-medium">이동시간: {mtPlan.location.distance}</p>
                      </div>
                    </div>
                  </div>

                  {/* 예산 정보 */}
                  <div className="bg-white rounded-xl p-6 border border-orange-200 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span>💰</span>
                      예상 예산
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">숙박비</span>
                        <span className="font-medium">{mtPlan.budget.accommodation.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">식비</span>
                        <span className="font-medium">{mtPlan.budget.meals.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">활동비</span>
                        <span className="font-medium">{mtPlan.budget.activities.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">교통비</span>
                        <span className="font-medium">{mtPlan.budget.transportation.toLocaleString()}원</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-bold text-orange-600">
                          <span>총 예산 (1인당)</span>
                          <span>{mtPlan.budget.total.toLocaleString()}원</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 일정표 */}
                  <div className="bg-white rounded-xl p-6 border border-orange-200 shadow-lg lg:col-span-2">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span>📅</span>
                      상세 일정표
                    </h3>
                    <div className="space-y-3">
                      {mtPlan.schedule.map((item: any, index: number) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg">
                          <div className="text-orange-600 font-bold text-sm w-16">{item.time}</div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{item.activity}</div>
                            <div className="text-gray-600 text-sm">{item.location}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 준비물 */}
                  <div className="bg-white rounded-xl p-6 border border-orange-200 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span>🎒</span>
                      준비물 리스트
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-red-600 mb-2">필수 준비물</h4>
                        <ul className="space-y-1">
                          {mtPlan.items.essential.map((item: string, index: number) => (
                            <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                              <span className="text-red-500">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-orange-600 mb-2">권장 준비물</h4>
                        <ul className="space-y-1">
                          {mtPlan.items.recommended.map((item: string, index: number) => (
                            <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                              <span className="text-orange-500">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-600 mb-2">제공 물품</h4>
                        <ul className="space-y-1">
                          {mtPlan.items.provided.map((item: string, index: number) => (
                            <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                              <span className="text-green-500">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* 숙박 정보 */}
                  <div className="bg-white rounded-xl p-6 border border-orange-200 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span>🏠</span>
                      숙박 정보
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-600 text-sm">숙박 유형:</span>
                        <span className="ml-2 font-medium">{mtPlan.accommodation.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">수용 인원:</span>
                        <span className="ml-2 font-medium">{mtPlan.accommodation.capacity}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">객실 구성:</span>
                        <span className="ml-2 font-medium">{mtPlan.accommodation.rooms}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">체크인/아웃:</span>
                        <span className="ml-2 font-medium">
                          {mtPlan.accommodation.checkIn} / {mtPlan.accommodation.checkOut}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">편의시설:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {mtPlan.accommodation.facilities.map((facility: string, index: number) => (
                            <span key={index} className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">
                              {facility}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onNavigateToOnboarding={onNavigateToOnboarding}
      />
    {showPlanModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowPlanModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4 shadow-2xl border border-orange-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">🏕️</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">MT 정보 입력</h3>
                  <p className="text-gray-600 text-sm mt-1">MT 계획 생성을 위한 기본 정보를 입력해주세요</p>
                </div>
              </div>
              <button
                className="w-10 h-10 bg-orange-100 hover:bg-orange-200 rounded-xl flex items-center justify-center text-orange-600 hover:text-orange-700 transition-all duration-200"
                onClick={() => setShowPlanModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-orange-600">⏰</span>
                  MT 기간 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-3 bg-orange-50 border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200"
                  required
                >
                  <option value="">기간을 선택하세요</option>
                  <option value="1박2일">1박 2일</option>
                  <option value="2박3일">2박 3일</option>
                  <option value="3박4일">3박 4일</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-orange-600">🌤️</span>
                  예상 날씨 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.weather}
                  onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                  className="w-full px-4 py-3 bg-orange-50 border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200"
                  required
                >
                  <option value="">날씨를 선택하세요</option>
                  <option value="맑음">맑음</option>
                  <option value="흐림">흐림</option>
                  <option value="비">비</option>
                  <option value="눈">눈</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-orange-600">👥</span>
                  참여 인원 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.participants}
                  onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                  className="w-full px-4 py-3 bg-orange-50 border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200"
                  placeholder="참여 인원을 입력하세요"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-orange-600">⚖️</span>
                  성비 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.genderRatio}
                  onChange={(e) => setFormData({ ...formData, genderRatio: e.target.value })}
                  className="w-full px-4 py-3 bg-orange-50 border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200"
                  required
                >
                  <option value="">성비를 선택하세요</option>
                  <option value="남성 위주">남성 위주 (70% 이상)</option>
                  <option value="여성 위주">여성 위주 (70% 이상)</option>
                  <option value="균등">균등 (50:50)</option>
                  <option value="혼합">혼합</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-orange-600">📝</span>
                  특이사항
                </label>
                <textarea
                  value={formData.specialNotes}
                  onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
                  className="w-full px-4 py-3 bg-orange-50 border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200 resize-none"
                  rows={3}
                  placeholder="특별한 요청사항이나 고려사항을 입력하세요 (선택사항)"
                />
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-orange-200">
                <button
                  type="button"
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200"
                  onClick={() => setShowPlanModal(false)}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white rounded-xl font-bold transition-all duration-200 hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <span>✨</span>
                  <span>MT 계획 생성</span>
                </button>
              </div>
            </form>
          </div>
        </div>
    )}
  </div>
  );
};

export default MtPlanner;
