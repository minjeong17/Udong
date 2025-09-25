import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import NotificationModal from "../components/NotificationModal";
import { useRouter } from "../hooks/useRouter";
import { MyPageApi } from "../apis/mypage";
import type { MyPageResponse } from "../apis/mypage/response";
import { useAuthStore } from "../stores/authStore";

interface MyPageProps {
  onNavigateToOnboarding: () => void;
  currentRoute?: string;
}

interface UserProfile {
  name: string;
  joinDate: string;
  email: string;
  phone: string;
  university: string;
  major?: string;
  address?: string;
  bankAccount: string;
  gender: string;
  availableTime: string;
  points: number;
}

export default function MyPage({ onNavigateToOnboarding }: MyPageProps) {
  const { navigate } = useRouter();

  // ✅ 로딩/에러/API 데이터 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MyPageResponse | null>(null);

  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const auth = useAuthStore.getState();
  const clubId = auth?.clubId;

  // ✅ 마운트 시 데이터 로드 + clubId 유효성 검사(예외처리)

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (!Number.isFinite(clubId)) {
          setError("유효하지 않은 clubId 입니다.");
          return;
        }
        setLoading(true);
        setError(null);

        const res = await MyPageApi.getMyPage(clubId!);
        console.log(res);
        if (!alive) return;
        setData(res); // ✅ 여기서 state에 세팅
        // console.log("마이페이지 응답:", res);  // 필요하면 이렇게 로그
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [clubId]);

  // ✅ API 데이터를 UI용으로 변환
  const profile: UserProfile | null = React.useMemo(() => {
    if (!data) return null;
    const p = data.profile;
    const stats = data.stats;

    // '월 11:30~20:00, 토 10:00~18:00' 같은 요약
    const dow = ["월", "화", "수", "목", "금", "토", "일"];
    const fmtTime = (t: string) => t.slice(0, 5);
    const availSummary = (data.availabilities ?? [])
      .map(
        (a) =>
          `${dow[Math.max(1, Math.min(7, a.dayOfWeek)) - 1]} ${fmtTime(
            a.startTime
          )}~${fmtTime(a.endTime)}`
      )
      .join(", ");

    return {
      name: p.name,
      joinDate: (p.joinedAt ?? "").slice(0, 10),
      email: p.email,
      phone: p.phone,
      university: p.university,
      major: p.major ?? "",
      address: "", // 서버에 없음
      bankAccount: p.accountMasked, // 현재 서버가 평문 계좌를 여기에 내려줌
      gender: p.gender === "M" ? "남성" : "여성",
      availableTime: availSummary || "-",
      points: stats.points ?? 0,
    };
  }, [data]);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showPointModal, setShowPointModal] = useState(false);

  // 모달이 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (showItemModal || showPointModal || showProfileModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showItemModal, showPointModal, showProfileModal]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        로딩중…
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        에러: {error}
      </div>
    );
  }
  if (!data || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        데이터가 없습니다.
      </div>
    );
  }

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
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-4 relative border border-orange-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                      {profile.name.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-800 mb-1 font-jua">
                      {profile.name}{" "}
                      <span className="text-base text-orange-600 font-medium">
                        ({data.profile.clubName})
                      </span>
                    </h1>
                    <p className="text-sm text-gray-600 font-gowun">
                      가입일: {profile.joinDate}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-200 transition-all duration-200 font-jua shadow-md hover:shadow-lg"
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
                    <h2 className="text-lg font-bold text-gray-800 font-jua">
                      프로필 수정
                    </h2>
                  </div>

                  <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 대학교 */}
                    <div>
                      <label className="text-sm text-gray-500 font-gowun">
                        대학교
                      </label>
                      <input
                        type="text"
                        defaultValue={profile.university}
                        className="w-full border rounded-lg px-3 py-2 bg-orange-50 focus:outline-none"
                      />
                    </div>

                    {/* 전공 */}
                    <div>
                      <label className="text-sm text-gray-500 font-gowun">
                        전공
                      </label>
                      <input
                        type="text"
                        // defaultValue={data.profile?.major}
                        className="w-full border rounded-lg px-3 py-2 bg-orange-50 focus:outline-none"
                      />
                    </div>

                    {/* 거주지 */}
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-500 font-gowun">
                        거주지
                      </label>
                      <input
                        type="text"
                        defaultValue={""}
                        className="w-full border rounded-lg px-3 py-2 bg-orange-50 focus:outline-none"
                      />
                    </div>

                    {/* 전화번호 */}
                    <div>
                      <label className="text-sm text-gray-500 font-gowun">
                        전화번호
                      </label>
                      <input
                        type="text"
                        defaultValue={profile.phone}
                        className="w-full border rounded-lg px-3 py-2 bg-orange-50 focus:outline-none"
                      />
                    </div>

                    {/* 성별 */}
                    <div>
                      <label className="text-sm text-gray-500 font-gowun">
                        성별
                      </label>
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
                      <label className="text-sm text-gray-500 font-gowun">
                        계좌번호
                      </label>
                      <input
                        type="text"
                        defaultValue={profile.bankAccount}
                        className="w-full border rounded-lg px-3 py-2 bg-orange-50 focus:outline-none"
                      />
                    </div>

                    {/* 활동 가능 시간 */}
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-500 font-gowun">
                        활동 가능 시간
                      </label>
                      <textarea
                        defaultValue={""}
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
              <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
                <div className="bg-white w-[500px] max-h-[90vh] rounded-2xl flex flex-col relative">
                  {/* 헤더 */}
                  <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold font-jua">
                      내 아이템 내역
                    </h2>
                    <button
                      onClick={() => setShowItemModal(false)}
                      className="text-gray-500 hover:text-gray-700 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                    >
                      ✕
                    </button>
                  </div>

                  {/* 스크롤 가능한 내역 리스트 */}
                  <div className="flex-1 overflow-y-auto px-6 pb-6"></div>
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
                    <div className="text-white font-bold text-xl font-jua">
                      내 포인트
                    </div>
                    <div className="text-white font-extrabold text-4xl mt-2 mb-2 font-jua">
                      345P
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div className="text-white font-gowun">
                        이번 달 획득{" "}
                        <span className="font-bold font-jua">+425P</span>
                      </div>
                      <div className="text-white font-gowun">
                        이번 달 사용{" "}
                        <span className="font-bold font-jua">-80P</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-4 mb-8">
                    <button
                      onClick={() => navigate("shop")}
                      className="bg-blue-400 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-medium shadow transition font-jua"
                    >
                      포인트샵 이동
                    </button>
                  </div>

                  <div className="bg-yellow-50 rounded-xl max-w-5xl mx-auto p-8 shadow-lg mb-6">
                    <div className="mb-4 font-bold text-lg text-gray-700 font-jua">
                      포인트 내역
                    </div>
                    <div className="overflow-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2 px-4 text-gray-600 font-gowun">
                              내역
                            </th>
                            <th className="py-2 px-4 text-gray-600 font-gowun">
                              사용/획득
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          <tr className="border-b">
                            <td className="py-2 px-4 text-gray-900 flex gap-3 items-center font-gowun">
                              <span className="bg-green-400 rounded-full w-6 h-6 flex items-center justify-center text-white font-bold">
                                +
                              </span>
                              정기 모임 참석{" "}
                              <span className="text-xs text-gray-500 ml-2">
                                2024-01-15
                              </span>
                            </td>
                            <td className="py-2 px-4 font-bold text-green-600 font-jua">
                              +100P
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 px-4 text-gray-900 flex gap-3 items-center font-gowun">
                              <span className="bg-green-400 rounded-full w-6 h-6 flex items-center justify-center text-white font-bold">
                                +
                              </span>
                              투표 참여{" "}
                              <span className="text-xs text-gray-500 ml-2">
                                2024-01-14
                              </span>
                            </td>
                            <td className="py-2 px-4 font-bold text-green-600 font-jua">
                              +50P
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 px-4 text-gray-900 flex gap-3 items-center font-gowun">
                              <span className="bg-pink-400 rounded-full w-6 h-6 flex items-center justify-center text-white font-bold">
                                -
                              </span>
                              동아리 굿즈 구매{" "}
                              <span className="text-xs text-gray-500 ml-2">
                                2024-01-13
                              </span>
                            </td>
                            <td className="py-2 px-4 font-bold text-red-600 font-jua">
                              -30P
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 px-4 text-gray-900 flex gap-3 items-center font-gowun">
                              <span className="bg-green-400 rounded-full w-6 h-6 flex items-center justify-center text-white font-bold">
                                +
                              </span>
                              MT 기획 참여{" "}
                              <span className="text-xs text-gray-500 ml-2">
                                2024-01-12
                              </span>
                            </td>
                            <td className="py-2 px-4 font-bold text-green-600 font-jua">
                              +200P
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 px-4 text-gray-900 flex gap-3 items-center font-gowun">
                              <span className="bg-pink-400 rounded-full w-6 h-6 flex items-center justify-center text-white font-bold">
                                -
                              </span>
                              간식 쿠폰 구매{" "}
                              <span className="text-xs text-gray-500 ml-2">
                                2024-01-11
                              </span>
                            </td>
                            <td className="py-2 px-4 font-bold text-red-600 font-jua">
                              -50P
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-4 text-gray-900 flex gap-3 items-center font-gowun">
                              <span className="bg-green-400 rounded-full w-6 h-6 flex items-center justify-center text-white font-bold">
                                +
                              </span>
                              회비 납부{" "}
                              <span className="text-xs text-gray-500 ml-2">
                                2024-01-10
                              </span>
                            </td>
                            <td className="py-2 px-4 font-bold text-green-600 font-jua">
                              +75P
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-xl max-w-5xl mx-auto p-8 shadow-lg mb-8">
                    <div className="mb-4 font-bold text-lg text-gray-700 font-jua">
                      포인트 획득 방법
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
                        <div className="mb-2 text-3xl">📅</div>
                        <div className="font-bold text-orange-500 mb-2 font-jua">
                          정기 모임 참석
                        </div>
                        <div className="text-sm text-gray-700 font-gowun">
                          +100P
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
                        <div className="mb-2 text-3xl">🗳️</div>
                        <div className="font-bold text-green-500 mb-2 font-jua">
                          투표 참여
                        </div>
                        <div className="text-sm text-gray-700 font-gowun">
                          +50P
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
                        <div className="mb-2 text-3xl">💰</div>
                        <div className="font-bold text-yellow-600 mb-2 font-jua">
                          회비 납부
                        </div>
                        <div className="text-sm text-gray-700 font-gowun">
                          +75P
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
                        <div className="mb-2 text-3xl">🎯</div>
                        <div className="font-bold text-red-500 mb-2 font-jua">
                          특별 활동
                        </div>
                        <div className="text-sm text-gray-700 font-gowun">
                          +200P
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 text-sm">📧</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-gowun">이메일</p>
                    <p className="font-medium font-gowun text-sm">
                      {profile.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 text-sm">📞</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-gowun">연락처</p>
                    <p className="font-medium font-gowun text-sm">
                      {profile.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 text-sm">🏫</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-gowun">
                      대학교(전공)
                    </p>
                    <p className="font-medium font-gowun text-sm">
                      {profile.university}({profile.major})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 text-sm">💳</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-gowun">계좌번호</p>
                    <p className="font-medium font-gowun text-sm">
                      {profile.bankAccount}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 text-sm">👤</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-gowun">성별</p>
                    <p className="font-medium font-gowun text-sm">
                      {profile.gender}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 text-sm">⏰</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-gowun">
                      활동 가능 시간
                    </p>
                    <p className="font-medium font-gowun text-sm">
                      {profile.availableTime}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <button
                onClick={() => setShowPointModal(true)}
                className="bg-white hover:bg-orange-200 rounded-2xl shadow-lg p-6 text-center border border-orange-100 transition-all duration-200 hover:shadow-xl"
              >
                <div className="text-3xl font-bold text-orange-600 mb-2 font-jua">
                  {data.stats.points}
                </div>
                <div className="text-sm text-gray-600 font-gowun">
                  보유 포인트
                </div>
              </button>
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center border border-orange-100">
                <div className="text-3xl font-bold text-green-600 mb-2 font-jua">
                  87
                </div>
                <div className="text-sm text-gray-600 font-gowun">
                  출석률 (%)
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center border border-orange-100">
                <div className="text-3xl font-bold text-purple-600 mb-2 font-jua">
                  {data.stats.participatingMeetings}
                </div>
                <div className="text-sm text-gray-600 font-gowun">
                  참여 모임
                </div>
              </div>
              <button
                onClick={() => setShowItemModal(true)}
                className="bg-white hover:bg-orange-200 rounded-2xl shadow-lg p-6 text-center border border-orange-100 transition-all duration-200 hover:shadow-xl"
              >
                <div className="text-3xl font-bold text-red-600 mb-2 font-jua">
                  {data.stats.itemKinds}
                </div>
                <div className="text-sm text-gray-600 font-gowun">
                  보유 아이템
                </div>
              </button>
            </div>

            {/* My Items Section */}
            <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 font-jua">
                  🎁 내 아이템
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {data.items.length === 0 ? (
                  <p className="text-gray-500 text-sm col-span-full text-center font-gowun">
                    보유한 아이템이 없습니다.
                  </p>
                ) : (
                  data.items.map((item) => (
                    <div key={item.itemId} className="text-center">
                      {/* 아이템 아이콘 (간단하게 첫 글자 이모지나 고정값) */}
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl">🎁</span>
                      </div>
                      {/* 아이템 이름 */}
                      <div className="font-medium text-gray-800 mb-1 font-jua">
                        {item.itemName}
                      </div>
                      {/* 보유 수량 */}
                      <div className="text-sm text-gray-600 mb-1 font-gowun">
                        보유: {item.qty}개
                      </div>
                    </div>
                  ))
                )}
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
  );
}
