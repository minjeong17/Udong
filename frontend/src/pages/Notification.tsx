import React, { useState } from "react";
import Header from '../components/Header';
import { Bell, Check, Clock, CreditCard, Users, Vote } from "lucide-react";

interface NotificationProps {
  onNavigateToOnboarding: () => void;
  currentRoute?: string;
}

interface Notification {
  id: string;
  type: "payment" | "vote" | "settlement" | "general";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: "high" | "medium" | "low";
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "payment",
    title: "회비 납부 알림",
    message: "12월 회비 납부 기한이 3일 남았습니다. 금액: 30,000원",
    timestamp: "2024-12-10T09:00:00Z",
    isRead: false,
    priority: "high",
  },
  {
    id: "2",
    type: "vote",
    title: "투표 참여 요청",
    message: "연말 MT 장소 선정 투표가 시작되었습니다. 투표에 참여해주세요!",
    timestamp: "2024-12-09T14:30:00Z",
    isRead: false,
    priority: "medium",
  },
];

const Notification: React.FC<NotificationProps> = ({onNavigateToOnboarding, currentRoute}) => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<Notification["type"] | "all">("all");

  const filteredNotifications =
    filter === "all" ? notifications : notifications.filter(n => n.type === filter);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "방금 전";
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    return `${Math.floor(diffInHours / 24)}일 전`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "payment": return <CreditCard className="h-5 w-5" />;
      case "vote": return <Vote className="h-5 w-5" />;
      case "settlement": return <Users className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "payment": return "text-orange-800 bg-orange-100";
      case "vote": return "text-blue-800 bg-blue-100";
      case "settlement": return "text-green-800 bg-green-100";
      default: return "text-gray-800 bg-gray-100";
    }
  };

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case "high": return <span className="w-3 h-3 bg-red-500 rounded-full" title="긴급" />;
      case "medium": return <span className="w-3 h-3 bg-orange-500 rounded-full" title="보통" />;
      case "low": return <span className="w-3 h-3 bg-green-500 rounded-full" title="낮음" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 p-6">
      {/* Header */}
      <Header onNavigateToOnboarding={onNavigateToOnboarding} currentRoute={currentRoute} />
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Bell className="h-8 w-8 text-orange-600" />
          알림
          {notifications.filter(n => !n.isRead).length > 0 && (
            <span className="bg-orange-600 text-white text-sm px-2 py-1 rounded-full">
              {notifications.filter(n => !n.isRead).length}개의 새 알림
            </span>
          )}
        </h1>
        <button
          onClick={markAllAsRead}
          className="flex items-center gap-2 border border-orange-200 text-orange-700 px-4 py-2 rounded-full hover:bg-orange-50 transition"
        >
          <Check className="h-4 w-4" />
          모두 읽음 처리
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="max-w-4xl mx-auto flex gap-2 mb-6 flex-wrap">
        {["all", "payment", "vote", "settlement", "general"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type as any)}
            className={`px-4 py-2 rounded-full text-sm transition ${
              filter === type
                ? "bg-orange-500 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {type === "all" ? "전체" : type === "payment" ? "회비" : type === "vote" ? "투표" : type === "settlement" ? "정산" : "일반"}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="max-w-4xl mx-auto space-y-4">
        {filteredNotifications.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow">
            <Bell className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">알림이 없습니다</h3>
            <p className="text-gray-600">새로운 알림이 있으면 여기에 표시됩니다.</p>
          </div>
        )}
        {filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start gap-4 p-6 rounded-2xl bg-white shadow hover:shadow-md transition border-l-4 ${
              !notification.isRead ? "border-l-orange-500" : "border-l-transparent"
            }`}
          >
            {/* Icon */}
            <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
              {getNotificationIcon(notification.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className={`font-semibold ${!notification.isRead ? "text-gray-900" : "text-gray-700"}`}>
                  {notification.title}
                </h3>
                {getPriorityIndicator(notification.priority)}
                {!notification.isRead && (
                  <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full">새 알림</span>
                )}
              </div>
              <p className={`text-sm mb-3 ${!notification.isRead ? "text-gray-800" : "text-gray-600"}`}>
                {notification.message}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {formatTimestamp(notification.timestamp)}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {!notification.isRead && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="text-orange-700 hover:bg-orange-50 px-3 py-1 rounded-full text-sm transition"
                >
                  읽음 처리
                </button>
              )}
              <button className="text-gray-400 hover:bg-gray-50 px-3 py-1 rounded-full text-sm transition">
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notification;