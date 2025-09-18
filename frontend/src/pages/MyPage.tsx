import React, { useState } from "react";
import Sidebar from '../components/Sidebar';
import NotificationModal from '../components/NotificationModal';
import { useRouter } from '../hooks/useRouter';

interface MyPageProps {
  onNavigateToOnboarding: () => void
  currentRoute?: string
}

interface UserProfile {
  name: string
  joinDate: string
  email: string
  phone: string
  university: string
  major?: string
  address?: string
  bankAccount: string
  gender: string
  availableTime: string
  points: number
}

interface ItemHistory {
  id: number;
  type: "구매" | "사용";
  title: string;
  date: string;   // 2024-01-25
  time: string;   // 20:10
  points?: number; // 차감된 포인트 (구매 시만)
}

const MyPage: React.FC<MyPageProps> = ({ onNavigateToOnboarding }) => {
  const { navigate } = useRouter();
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const [profile] = useState<UserProfile>({
    name: "김동아리",
    joinDate: "2025-09-01",
    email: "dongari@university.ac.kr",
    phone: "010-1234-5678",
    university: "한국대학교",
    major: "컴퓨터공학과",
    address: "서울시 강남구 테헤란로 123",
    bankAccount: "국민은행 123-456-789012",
    gender: "남성",
    availableTime: "평일 저녁, 주말 오후",
    points: 2450
  });

  const [history] = useState<ItemHistory[]>([
    { id: 1, type: "구매", title: "투표권", date: "2025-09-10", time: "14:20", points: 100 },
    { id: 2, type: "사용", title: "자치 면제권", date: "2025-09-12", time: "10:30" },
    { id: 3, type: "구매", title: "회비 감면권", date: "2025-09-15", time: "18:45", points: 200 },
    { id: 4, type: "구매", title: "아이템 구매", date: "2025-09-16", time: "09:15", points: 150 },
    { id: 5, type: "사용", title: "투표권", date: "2025-09-17", time: "11:00" }
  ]);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showPointModal, setShowPointModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="flex">
        {/* Left Sidebar */}
        <Sidebar
          onNavigateToOnboarding={onNavigateToOnboarding}
          onShowNotification={() => setShowNotificationModal(true)}
        />

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-6 relative border border-orange-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profile.name.charAt(0)}
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-1 font-jua">{profile.name}</h1>
                <p className="text-sm text-gray-600 font-gowun">가입일: {profile.joinDate}</p>
              </div>
            </div>
            <div className="text-right">
              <button
                onClick={() => setShowProfileModal(true)}
                className="bg-orange-100 text-orange-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-200 transition-all duration-200 font-jua shadow-md hover:shadow-lg"
              >
                프로필 수정
              </button>
            </div>
          </div>
        </div>


      {/* --- 프로필 수정 모달 --- */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 relative">
            {/* 닫기 버튼 */}
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                ✏️
              </div>
              <h2 className="text-lg font-bold text-gray-800 font-jua">프로필 수정</h2>
            </div>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 대학교 */}
              <div>
                <label className="text-sm text-gray-500 font-gowun">대학교</label>
                <input
                  type="text"
                  defaultValue={profile.university}
                  className="w-full border rounded-lg px-3 py-2 bg-orange-50 focus:outline-none"
                />
              </div>

              {/* 전공 */}
              <div>
                <label className="text-sm text-gray-500 font-gowun">전공</label>
                <input
                  type="text"
                  defaultValue={profile.major}
                  className="w-full border rounded-lg px-3 py-2 bg-orange-50 focus:outline-none"
                />
              </div>

              {/* 거주지 */}
              <div className="md:col-span-2">
                <label className="text-sm text-gray-500 font-gowun">거주지</label>
                <input
                  type="text"
                  defaultValue={profile.address}
                  className="w-full border rounded-lg px-3 py-2 bg-orange-50 focus:outline-none"
                />
              </div>

              {/* 전화번호 */}
              <div>
                <label className="text-sm text-gray-500 font-gowun">전화번호</label>
                <input
                  type="text"
                  defaultValue={profile.phone}
                  className="w-full border rounded-lg px-3 py-2 bg-orange-50 focus:outline-none"
                />
              </div>

              {/* 성별 */}
              <div>
                <label className="text-sm text-gray-500 font-gowun">성별</label>
                <select
                  defaultValue={profile.gender}
                  className="w-full border rounded-lg px-3 py-2 bg-orange-50 focus:outline-none"
                >
                  <option value="남성">남성</option>
                  <option value="여성">여성</option>
                </select>
              </div>

              {/* 계좌번호 */}
              <div className="md:col-span-2">
                <label className="text-sm text-gray-500 font-gowun">계좌번호</label>
                <input
                  type="text"
                  defaultValue={profile.bankAccount}
                  className="w-full border rounded-lg px-3 py-2 bg-orange-50 focus:outline-none"
                />
              </div>

              {/* 활동 가능 시간 */}
              <div className="md:col-span-2">
                <label className="text-sm text-gray-500 font-gowun">활동 가능 시간</label>
                <textarea
                  defaultValue={profile.availableTime}
                  className="w-full border rounded-lg px-3 py-2 bg-orange-50 focus:outline-none"
                  rows={2}
                />
              </div>
            </form>

            {/* 하단 버튼 */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-6 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-gowun"
              >
                취소
              </button>
              <button
                type="submit"
                onClick={() => setShowProfileModal(false)}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 text-white font-medium font-jua"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {showItemModal && (
        <div className="min-h-screen bg-orange-50">
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
        <div className="bg-white w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl p-6 relative">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold font-jua">내 아이템 내역</h2>
          <button 
            onClick={() => setShowItemModal(false)}
            className="text-gray-500 text-xl">✕</button>
        </div>

        {/* 내역 리스트 */}
        {history.map((item) => (
          <div key={item.id} className="mb-6">
            {/* 날짜 라벨 */}
            <div className="flex justify-center my-2">
              <span className="bg-orange-100 text-orange-600 text-sm px-3 py-1 rounded-full font-gowun">
                {item.date}
              </span>
            </div>

            {/* 아이템 카드 */}
            <div className="flex justify-between items-center bg-orange-50 p-4 rounded-lg">
              <div>
                <p className="font-semibold font-gowun">
                  <span className={item.type === "구매" ? "text-blue-500" : "text-green-500"}>
                    {item.type}:
                  </span>{" "}
                  {item.title}
                </p>
                <p className="text-sm text-gray-500 mt-1 font-gowun">{item.time}</p>
              </div>
              {item.points && (
                <p className="text-red-500 font-bold font-jua">-{item.points}P</p>
              )}
              </div>
            </div>
           ))}
          </div>
        </div>
        </div>
      )}

      {showPointModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="relative bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col p-6">
            <button 
              onClick={() => setShowPointModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>

          <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl h-36 flex items-center justify-center flex-col mb-8">
            <div className="text-white font-bold text-xl font-jua">내 포인트</div>
            <div className="text-white font-extrabold text-4xl mt-2 mb-2 font-jua">345P</div>
            <div className="flex gap-6 text-sm">
              <div className="text-white font-gowun">이번 달 획득 <span className="font-bold font-jua">+425P</span></div>
              <div className="text-white font-gowun">이번 달 사용 <span className="font-bold font-jua">-80P</span></div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => navigate('shop')}
              className="bg-blue-400 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-medium shadow transition font-jua"
            >
              포인트샵 이동
            </button>
          </div>

          <div className="bg-yellow-50 rounded-xl max-w-5xl mx-auto p-8 shadow-lg mb-6">
            <div className="mb-4 font-bold text-lg text-gray-700 font-jua">포인트 내역</div>
            <div className="overflow-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-gray-600 font-gowun">내역</th>
                    <th className="py-2 px-4 text-gray-600 font-gowun">사용/획득</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b">
                    <td className="py-2 px-4 text-gray-900 flex gap-3 items-center font-gowun">
                      <span className="bg-green-400 rounded-full w-6 h-6 flex items-center justify-center text-white font-bold">+</span>
                     정기 모임 참석 <span className="text-xs text-gray-500 ml-2">2024-01-15</span>
                    </td>
                    <td className="py-2 px-4 font-bold text-green-600 font-jua">+100P</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4 text-gray-900 flex gap-3 items-center font-gowun">
                      <span className="bg-green-400 rounded-full w-6 h-6 flex items-center justify-center text-white font-bold">+</span>
                      투표 참여 <span className="text-xs text-gray-500 ml-2">2024-01-14</span>
                    </td>
                    <td className="py-2 px-4 font-bold text-green-600 font-jua">+50P</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4 text-gray-900 flex gap-3 items-center font-gowun">
                      <span className="bg-pink-400 rounded-full w-6 h-6 flex items-center justify-center text-white font-bold">-</span>
                      동아리 굿즈 구매 <span className="text-xs text-gray-500 ml-2">2024-01-13</span>
                    </td>
                    <td className="py-2 px-4 font-bold text-red-600 font-jua">-30P</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4 text-gray-900 flex gap-3 items-center font-gowun">
                      <span className="bg-green-400 rounded-full w-6 h-6 flex items-center justify-center text-white font-bold">+</span>
                      MT 기획 참여 <span className="text-xs text-gray-500 ml-2">2024-01-12</span>
                    </td>
                    <td className="py-2 px-4 font-bold text-green-600 font-jua">+200P</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4 text-gray-900 flex gap-3 items-center font-gowun">
                      <span className="bg-pink-400 rounded-full w-6 h-6 flex items-center justify-center text-white font-bold">-</span>
                      간식 쿠폰 구매 <span className="text-xs text-gray-500 ml-2">2024-01-11</span>
                    </td>
                   <td className="py-2 px-4 font-bold text-red-600 font-jua">-50P</td>
                  </tr>
                  <tr>
                   <td className="py-2 px-4 text-gray-900 flex gap-3 items-center font-gowun">
                      <span className="bg-green-400 rounded-full w-6 h-6 flex items-center justify-center text-white font-bold">+</span>
                     회비 납부 <span className="text-xs text-gray-500 ml-2">2024-01-10</span>
                   </td>
                   <td className="py-2 px-4 font-bold text-green-600 font-jua">+75P</td>
                  </tr>
                </tbody>
              </table>
           </div>
          </div>

          <div className="bg-yellow-50 rounded-xl max-w-5xl mx-auto p-8 shadow-lg mb-8">
            <div className="mb-4 font-bold text-lg text-gray-700 font-jua">포인트 획득 방법</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
                <div className="mb-2 text-3xl">📅</div>
                <div className="font-bold text-orange-500 mb-2 font-jua">정기 모임 참석</div>
                <div className="text-sm text-gray-700 font-gowun">+100P</div>
              </div>
              <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
                <div className="mb-2 text-3xl">🗳️</div>
                <div className="font-bold text-green-500 mb-2 font-jua">투표 참여</div>
                <div className="text-sm text-gray-700 font-gowun">+50P</div>
              </div>
              <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
                <div className="mb-2 text-3xl">💰</div>
                <div className="font-bold text-yellow-600 mb-2 font-jua">회비 납부</div>
                <div className="text-sm text-gray-700 font-gowun">+75P</div>
              </div>
              <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
                <div className="mb-2 text-3xl">🎯</div>
                <div className="font-bold text-red-500 mb-2 font-jua">특별 활동</div>
                <div className="text-sm text-gray-700 font-gowun">+200P</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}


        {/* Contact Information */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600">📧</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-gowun">이메일</p>
                <p className="font-medium font-gowun">dongari@university.ac.kr</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600">📞</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-gowun">연락처</p>
                <p className="font-medium font-gowun">010-1234-5678</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600">🏫</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-gowun">대학교</p>
                <p className="font-medium font-gowun">한국대학교</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600">💳</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-gowun">계좌번호</p>
                <p className="font-medium font-gowun">국민은행 123-456-789012</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600">👤</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-gowun">성별</p>
                <p className="font-medium font-gowun">남성</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600">⏰</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-gowun">활동 가능 시간</p>
                <p className="font-medium font-gowun">평일 저녁, 주말 오후</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button onClick={() => setShowPointModal(true)}
            className="bg-white hover:bg-orange-200 rounded-2xl shadow-lg p-6 text-center border border-orange-100 transition-all duration-200 hover:shadow-xl">
            <div className="text-3xl font-bold text-orange-600 mb-2 font-jua">2,450</div>
            <div className="text-sm text-gray-600 font-gowun">보유 포인트</div>
          </button>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center border border-orange-100">
            <div className="text-3xl font-bold text-green-600 mb-2 font-jua">87</div>
            <div className="text-sm text-gray-600 font-gowun">출석률 (%)</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center border border-orange-100">
            <div className="text-3xl font-bold text-purple-600 mb-2 font-jua">23</div>
            <div className="text-sm text-gray-600 font-gowun">참여 모임</div>
          </div>
          <button onClick={() => setShowItemModal(true)}
            className="bg-white hover:bg-orange-200 rounded-2xl shadow-lg p-6 text-center border border-orange-100 transition-all duration-200 hover:shadow-xl">
            <div className="text-3xl font-bold text-red-600 mb-2 font-jua">6</div>
            <div className="text-sm text-gray-600 font-gowun">보유 아이템</div>
          </button>
        </div>

        {/* Weekly Activity Summary */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-6 border border-orange-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 font-jua">📊 이번 달 활동 요약</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-2xl border border-green-200">
              <div className="text-2xl mb-2">✅</div>
              <div className="text-2xl font-bold text-green-600 mb-1 font-jua">18</div>
              <div className="text-sm text-gray-600 mb-1 font-gowun">출석</div>
              <div className="text-xs text-green-600 font-gowun">+90P</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-2xl border border-blue-200">
              <div className="text-2xl mb-2">🏆</div>
              <div className="text-2xl font-bold text-blue-600 mb-1 font-jua">5</div>
              <div className="text-sm text-gray-600 mb-1 font-gowun">투표 참여</div>
              <div className="text-xs text-blue-600 font-gowun">+50P</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
              <div className="text-2xl mb-2">🥇</div>
              <div className="text-2xl font-bold text-yellow-600 mb-1 font-jua">3</div>
              <div className="text-sm text-gray-600 mb-1 font-gowun">모임 참여</div>
              <div className="text-xs text-yellow-600 font-gowun">+60P</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-2xl border border-red-200">
              <div className="text-2xl mb-2">🛒</div>
              <div className="text-2xl font-bold text-red-600 mb-1 font-jua">2</div>
              <div className="text-sm text-gray-600 mb-1 font-gowun">아이템 구매</div>
              <div className="text-xs text-red-600 font-gowun">-150P</div>
            </div>
          </div>
        </div>

        {/* My Items Section */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 font-jua">🎁 내 아이템</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">👑</span>
              </div>
              <div className="font-medium text-gray-800 mb-1 font-jua">투표권</div>
              <div className="text-sm text-gray-600 mb-1 font-gowun">보유: 1개</div>
              <div className="text-xs text-gray-500 font-gowun">만료: 25일 후</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💳</span>
              </div>
              <div className="font-medium text-gray-800 mb-1 font-jua">회비 감면권</div>
              <div className="text-sm text-gray-600 mb-1 font-gowun">보유: 2개</div>
              <div className="text-xs text-gray-500 font-gowun">만료: 45일 후</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🎫</span>
              </div>
              <div className="font-medium text-gray-800 mb-1 font-jua">자치 면제권</div>
              <div className="text-sm text-gray-600 mb-1 font-gowun">보유: 2개</div>
              <div className="text-xs text-gray-500 font-gowun">만료: 80일 후</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🍪</span>
              </div>
              <div className="font-medium text-gray-800 mb-1 font-jua">간식 쿠폰</div>
              <div className="text-sm text-gray-600 mb-1 font-gowun">보유: 1개</div>
              <div className="text-xs text-gray-500 font-gowun">만료: 30일 후</div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onNavigateToOnboarding={onNavigateToOnboarding}
      />
    </div>
    </div>
  )
}

export default MyPage;