import React, { useState, useEffect } from "react";
import {
  Bell,
  Check,
  Clock,
  CreditCard,
  Users,
  Vote,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { NotificationApi } from "../apis/notification";
import type { NotificationResponse } from "../apis/notification/types";
import { useAuthStore } from "../stores/authStore";

interface NotificationProps {
  onNavigateToOnboarding: () => void;
  currentRoute?: string;
}

// 백엔드 타입을 프론트엔드 UI용으로 변환하는 헬퍼 타입
interface UINotification {
  id: number;
  type: "dues" | "dutchpay" | "event" | "vote";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: "high" | "medium" | "low";
}

// 백엔드 타입을 UI 타입으로 변환하는 함수
const transformNotification = (
  notification: NotificationResponse
): UINotification => {
  // type에 따라 title과 priority 추론
  const getTypeInfo = (type: string) => {
    switch (type) {
      case "DUE_OPEN":
        return {
          title: "회비 시작 알림",
          priority: "high" as const,
          uiType: "dues" as const,
        };
      case "DUTCHPAY_OPEN":
        return {
          title: "N빵 시작 알림",
          priority: "medium" as const,
          uiType: "dutchpay" as const,
        };
      case "EVENT_OPEN":
        return {
          title: "행사 시작 알림",
          priority: "medium" as const,
          uiType: "event" as const,
        };
      case "VOTE_OPEN":
        return {
          title: "투표 시작 알림",
          priority: "medium" as const,
          uiType: "vote" as const,
        };
      default:
        return {
          title: "알림",
          priority: "low" as const,
          uiType: "event" as const,
        };
    }
  };

  const typeInfo = getTypeInfo(notification.type);

  return {
    id: notification.notificationDeliveryId,
    type: typeInfo.uiType,
    title: typeInfo.title,
    message: notification.payload,
    timestamp: notification.createdAt,
    isRead: notification.hasRead,
    priority: typeInfo.priority,
  };
};

const Notification: React.FC<NotificationProps> = () => {
  const clubId = useAuthStore((state) => state.clubId);
  const [notifications, setNotifications] = useState<UINotification[]>([]);
  const [filter, setFilter] = useState<UINotification["type"] | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // 프론트엔드 필터 타입을 백엔드 타입으로 변환
  const getBackendType = (
    filterType: UINotification["type"] | "all"
  ): string | undefined => {
    switch (filterType) {
      case "dues":
        return "DUE_OPEN";
      case "dutchpay":
        return "DUTCHPAY_OPEN";
      case "event":
        return "EVENT_OPEN";
      case "vote":
        return "VOTE_OPEN";
      case "all":
        return undefined;
      default:
        return undefined;
    }
  };

  // 서버에서 이미 필터링된 데이터를 받으므로 추가 필터링 불필요
  const filteredNotifications = notifications;

  // 전체 미읽음 알림 개수 로드
  const loadUnreadCount = async () => {
    if (!clubId) return;
    try {
      const count = await NotificationApi.getUnreadNotificationCount(clubId);
      setTotalUnreadCount(count);
    } catch (err) {
      console.error("미읽음 개수 로드 실패:", err);
    }
  };

  // 알림 목록 로드 (현재 필터 기준)
  const loadNotifications = async (
    page = 0,
    filterType: UINotification["type"] | "all" = filter
  ) => {
    if (!clubId) return;
    try {
      setLoading(true);
      setError(null);

      const backendType = getBackendType(filterType);
      const response = await NotificationApi.getMyNotifications(
        clubId,
        page,
        5,
        backendType
      ); // 타입 필터 추가

      const transformedNotifications = response.content.map(
        transformNotification
      );
      setNotifications(transformedNotifications);

      // 페이지네이션 정보 업데이트
      setCurrentPage(page);
      setTotalPages(response.totalPages);
      setHasNext(!response.last);
      setHasPrev(!response.first);
      setTotalElements(response.totalElements);

      // 첫 페이지 로드 시에만 미읽음 개수 업데이트
      if (page === 0) {
        await loadUnreadCount();
      }
    } catch (err) {
      console.error("알림 로드 실패:", err);
      setError("알림을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 페이지 이동 함수들
  const goToNextPage = () => {
    if (hasNext) {
      loadNotifications(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (hasPrev) {
      loadNotifications(currentPage - 1);
    }
  };

  // 컴포넌트 마운트 시 알림 로드
  useEffect(() => {
    if (clubId) {
      loadNotifications(0);
    }
  }, [clubId]);

  const markAsRead = async (id: number) => {
    try {
      await NotificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      // 읽음 처리 후 미읽음 개수 업데이트
      await loadUnreadCount();
    } catch (err) {
      console.error("읽음 처리 실패:", err);
      alert("읽음 처리에 실패했습니다.");
    }
  };

  const markAllAsRead = async () => {
    if (!clubId) return;
    try {
      await NotificationApi.markAllAsRead(clubId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      // 모든 읽음 처리 후 미읽음 개수 업데이트
      await loadUnreadCount();
    } catch (err) {
      console.error("모든 읽음 처리 실패:", err);
      alert("모든 읽음 처리에 실패했습니다.");
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await NotificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      // 삭제 후 미읽음 개수 업데이트 (미읽음 알림이 삭제될 수 있으므로)
      await loadUnreadCount();
    } catch (err) {
      console.error("알림 삭제 실패:", err);
      alert("알림 삭제에 실패했습니다.");
    }
  };

  const deleteAllReadNotifications = async () => {
    if (!clubId) return;
    try {
      await NotificationApi.deleteAllReadNotifications(clubId);
      // 읽은 알림들만 제거
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      // 페이지 새로고침 (읽은 알림이 삭제되어 페이지 구성이 바뀔 수 있음)
      await loadNotifications(0);
      // 삭제 후 미읽음 개수 업데이트
      await loadUnreadCount();
    } catch (err) {
      console.error("읽은 알림 모두 삭제 실패:", err);
      alert("읽은 알림 삭제에 실패했습니다.");
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "방금 전";
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    return `${Math.floor(diffInHours / 24)}일 전`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "dues":
        return <CreditCard className="w-5 h-5" />;
      case "dutchpay":
        return <Users className="w-5 h-5" />;
      case "event":
        return <Bell className="w-5 h-5" />;
      case "vote":
        return <Vote className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "dues":
        return "text-orange-800 bg-orange-100";
      case "dutchpay":
        return "text-green-800 bg-green-100";
      case "event":
        return "text-purple-800 bg-purple-100";
      case "vote":
        return "text-blue-800 bg-blue-100";
      default:
        return "text-gray-800 bg-gray-100";
    }
  };

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <span className="w-3 h-3 bg-red-500 rounded-full" title="긴급" />
        );
      case "medium":
        return (
          <span className="w-3 h-3 bg-orange-500 rounded-full" title="보통" />
        );
      case "low":
        return (
          <span className="w-3 h-3 bg-green-500 rounded-full" title="낮음" />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 h-96 bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-orange-600 rounded-full animate-spin"></div>
          <p className="text-orange-600 font-jua">알림을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-6 h-96 bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="p-8 text-center bg-white shadow-lg rounded-2xl">
          <p className="mb-4 text-red-600 font-jua">{error}</p>
          <button
            onClick={() => loadNotifications(0)}
            className="px-4 py-2 text-white transition-colors bg-orange-500 rounded-xl font-jua hover:bg-orange-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    // CHANGED: 전체 배경 및 패딩 역할만 하도록 수정
    <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
      {/* ADDED: Flexbox 레이아웃을 위한 메인 컨테이너. 모달의 높이를 가정하여 h-[85vh]로 설정 (값은 조절 가능) */}
      <div className="flex flex-col max-w-4xl mx-auto overflow-hidden bg-white shadow-xl h-[62vh] rounded-2xl">
        {/* -- 상단 고정 영역 (제목, 필터) -- */}
        <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-800 font-jua">
              <Bell className="w-8 h-8 text-orange-600" />
              알림
              {totalUnreadCount > 0 && (
                <span className="px-3 py-1 text-sm text-white bg-orange-500 rounded-full font-gowun">
                  {totalUnreadCount}개의 새 알림
                </span>
              )}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllAsRead}
                disabled={notifications.filter((n) => !n.isRead).length === 0}
                className="flex items-center gap-2 px-4 py-2 text-orange-700 transition-all duration-200 border-2 border-orange-200 shadow-md rounded-xl hover:bg-orange-50 font-jua hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                모두 읽음 처리
              </button>
              <button
                onClick={deleteAllReadNotifications}
                disabled={totalElements - totalUnreadCount === 0}
                className="flex items-center gap-2 px-4 py-2 text-red-700 transition-all duration-200 border-2 border-red-200 shadow-md rounded-xl hover:bg-red-50 font-jua hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                읽은 알림 삭제
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {["all", "dues", "dutchpay", "event", "vote"].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setFilter(type as UINotification["type"] | "all");
                  loadNotifications(0, type as UINotification["type"] | "all"); // 필터 변경 시 첫 페이지부터 새로 로드
                }}
                className={`px-4 py-2 rounded-xl text-sm transition-all duration-200 font-jua shadow-md hover:shadow-lg transform hover:scale-105 ${
                  filter === type
                    ? "bg-orange-500 text-white border-2 border-orange-400"
                    : "bg-white border-2 border-orange-200 text-gray-700 hover:bg-orange-50 hover:border-orange-300"
                }`}
              >
                {type === "all"
                  ? "전체"
                  : type === "dues"
                  ? "회비"
                  : type === "dutchpay"
                  ? "정산"
                  : type === "event"
                  ? "행사"
                  : "투표"}
              </button>
            ))}
          </div>
        </div>

        {/* -- 하단 스크롤 영역 (페이지네이션, 리스트) -- */}
        <div className="flex flex-col flex-1 min-h-0 p-6 pt-4">
          {/* 페이지네이션 헤더 */}
          <div className="flex items-center justify-between flex-shrink-0 p-4 mb-4 shadow-sm bg-gray-50 rounded-xl">
            <div className="text-sm text-gray-600 font-gowun">
              {totalPages > 0
                ? `${currentPage + 1} / ${totalPages} 페이지`
                : "0 / 0 페이지"}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPrevPage()}
                disabled={!hasPrev}
                className="p-2 text-orange-600 transition-all border border-orange-200 rounded-lg hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => goToNextPage()}
                disabled={!hasNext}
                className="p-2 text-orange-600 transition-all border border-orange-200 rounded-lg hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 알림 리스트 (남은 공간을 채우면서 스크롤) */}
          {/* CHANGED: max-h 제거, flex-1과 min-h-0 추가 */}
          <div className="flex-1 min-h-0 pr-2 -mr-2 overflow-y-auto">
            <div className="pb-6 space-y-4">
              {filteredNotifications.length === 0 && (
                <div className="py-12 text-center bg-white border border-orange-100 shadow-lg rounded-2xl">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-orange-400" />
                  <h3 className="mb-2 text-lg font-semibold text-gray-800 font-jua">
                    알림이 없습니다
                  </h3>
                  <p className="text-gray-600 font-gowun">
                    새로운 알림이 있으면 여기에 표시됩니다.
                  </p>
                </div>
              )}
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-l-4 border border-orange-100 hover:border-orange-200 ${
                    !notification.isRead
                      ? "border-l-orange-500"
                      : "border-l-transparent"
                  }`}
                >
                  {/* ... 알림 아이템 내부는 그대로 ... */}
                  {/* Icon */}
                  <div
                    className={`p-2 rounded-full ${getNotificationColor(
                      notification.type
                    )}`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3
                        className={`font-semibold font-jua ${
                          !notification.isRead
                            ? "text-gray-800"
                            : "text-gray-600"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      {getPriorityIndicator(notification.priority)}
                      {!notification.isRead && (
                        <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-gowun">
                          새 알림
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm mb-3 font-gowun ${
                        !notification.isRead ? "text-gray-700" : "text-gray-600"
                      }`}
                    >
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-gowun">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(notification.timestamp)}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="px-3 py-1 text-sm text-orange-700 transition-all duration-200 border border-orange-200 shadow-sm hover:bg-orange-50 rounded-xl font-jua hover:border-orange-300 hover:shadow-md"
                      >
                        읽음 처리
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="px-3 py-1 text-sm text-gray-400 transition-all duration-200 border border-gray-200 shadow-sm hover:bg-gray-50 rounded-xl font-jua hover:border-gray-300 hover:shadow-md hover:text-red-500"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;
