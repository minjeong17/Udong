import fetchClient from '../fetchClient';
import type {
  NotificationRequest,
  NotificationPageResponse,
  ApiResponse
} from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

export const NotificationApi = {
  /**
   * 알림 생성 (다른 서비스에서 내부적으로 호출)
   * POST /api/v1/notifications
   */
  create: async (payload: NotificationRequest): Promise<string> => {
    const url = `${BASE_URL}${API_PREFIX}/notifications`;
    const response = await fetchClient<ApiResponse<string>>(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      auth: true
    });
    return response.data;
  },

  /**
   * 유저별 받은 알림 조회 (페이징 + 타입 필터링)
   * GET /api/v1/me/notifications?clubId={clubId}&type={type}
   */
  getMyNotifications: async (clubId: number, page = 0, size = 10, type?: string): Promise<NotificationPageResponse> => {
    let url = `${BASE_URL}${API_PREFIX}/me/notifications?clubId=${clubId}&page=${page}&size=${size}&sort=createdAt,desc`;
    if (type && type !== 'all') {
      url += `&type=${type}`;
    }
    const response = await fetchClient<ApiResponse<NotificationPageResponse>>(url, {
      method: 'GET',
      auth: true
    });
    return response.data;
  },

  /**
   * 내 미읽음 알림 총 개수 조회
   * GET /api/v1/me/notifications/unread-count?clubId={clubId}
   */
  getUnreadNotificationCount: async (clubId: number): Promise<number> => {
    const url = `${BASE_URL}${API_PREFIX}/me/notifications/unread-count?clubId=${clubId}`;
    const response = await fetchClient<ApiResponse<number>>(url, {
      method: 'GET',
      auth: true
    });
    return response.data;
  },

  /**
   * 알림 읽음 표시
   * PUT /api/v1/me/notifications/{notificationId}
   */
  markAsRead: async (notificationDeliveryId: number): Promise<string> => {
    const url = `${BASE_URL}${API_PREFIX}/me/notifications/${notificationDeliveryId}`;
    const response = await fetchClient<ApiResponse<string>>(url, {
      method: 'PUT',
      auth: true
    });
    return response.data;
  },

  /**
   * 모든 알림 읽음 처리
   * PATCH /api/v1/notifications/read-all?clubId={clubId}
   */
  markAllAsRead: async (clubId: number): Promise<string> => {
    const url = `${BASE_URL}${API_PREFIX}/notifications/read-all?clubId=${clubId}`;
    const response = await fetchClient<ApiResponse<string>>(url, {
      method: 'PATCH',
      auth: true
    });
    return response.data;
  },

  /**
   * 단일 알림 삭제
   * DELETE /api/v1/me/notifications/{notificationId}
   */
  deleteNotification: async (notificationDeliveryId: number): Promise<string> => {
    const url = `${BASE_URL}${API_PREFIX}/me/notifications/${notificationDeliveryId}`;
    const response = await fetchClient<ApiResponse<string>>(url, {
      method: 'DELETE',
      auth: true
    });
    return response.data;
  },

  /**
   * 읽은 알림 모두 삭제
   * DELETE /api/v1/me/notifications/read?clubId={clubId}
   */
  deleteAllReadNotifications: async (clubId: number): Promise<string> => {
    const url = `${BASE_URL}${API_PREFIX}/me/notifications/read?clubId=${clubId}`;
    const response = await fetchClient<ApiResponse<string>>(url, {
      method: 'DELETE',
      auth: true
    });
    return response.data;
  }
};