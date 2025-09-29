import fetchClient from '../fetchClient';
import type { CreateDuesRequest, UpdatePaymentStatusRequest, PayDuesRequest } from './request';
import type {
  CreateDuesResponse,
  DuesListResponse,
  DuesStatusResponse,
  UpdatePaymentStatusResponse,
  CurrentDuesResponse,
  DuesSummaryResponse,
  MyUnpaidDuesResponse,
  PayDuesResponse
} from './response';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

export const ClubDuesApi = {
  // 1. 새로운 회비 요청 생성
  createDues: async (clubId: number, payload: CreateDuesRequest): Promise<CreateDuesResponse> => {
    const url = `${BASE_URL}${API_PREFIX}/clubs/${clubId}/clubdues`;
    const response = await fetchClient<{success: boolean, data: CreateDuesResponse}>(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      auth: true
    });
    return response.data;
  },

  // 2. 동아리 회비 요청 목록 조회 (드롭다운용)
  getDuesList: async (clubId: number): Promise<DuesListResponse> => {
    const url = `${BASE_URL}${API_PREFIX}/clubs/${clubId}/clubdues`;
    const response = await fetchClient<{success: boolean, data: DuesListResponse}>(url, {
      method: 'GET',
      auth: true
    });
    return response.data;
  },

  // 3. 특정 회차 납부 현황 조회
  getDuesStatus: async (clubId: number, duesNo: number): Promise<DuesStatusResponse> => {
    const url = `${BASE_URL}${API_PREFIX}/clubs/${clubId}/clubdues/${duesNo}/status`;
    const response = await fetchClient<{success: boolean, data: DuesStatusResponse}>(url, {
      method: 'GET',
      auth: true
    });
    return response.data;
  },

  // 4. 개별 회원 납부 상태 변경
  updatePaymentStatus: async (
    clubId: number,
    duesId: number,
    userId: number,
    payload: UpdatePaymentStatusRequest
  ): Promise<UpdatePaymentStatusResponse> => {
    const url = `${BASE_URL}${API_PREFIX}/clubs/${clubId}/clubdues/${duesId}/status/${userId}`;
    const response = await fetchClient<{success: boolean, data: UpdatePaymentStatusResponse}>(url, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      auth: true
    });
    return response.data;
  },

  // 5. 현재 진행 중인 최신 회차 정보 조회
  getCurrentDues: async (clubId: number): Promise<CurrentDuesResponse> => {
    const url = `${BASE_URL}${API_PREFIX}/clubs/${clubId}/clubdues/current`;
    const response = await fetchClient<{success: boolean, data: CurrentDuesResponse}>(url, {
      method: 'GET',
      auth: true
    });
    return response.data;
  },

  // 6. 납부 통계 요약 조회
  getDuesSummary: async (clubId: number, duesId: number): Promise<DuesSummaryResponse> => {
    const url = `${BASE_URL}${API_PREFIX}/clubs/${clubId}/clubdues/${duesId}/summary`;
    const response = await fetchClient<{success: boolean, data: DuesSummaryResponse}>(url, {
      method: 'GET',
      auth: true
    });
    return response.data;
  },

  // 7. 미납자 알림 전송
  notifyUnpaidMembers: async (clubId: number, duesId: number): Promise<void> => {
    const url = `${BASE_URL}${API_PREFIX}/clubs/${clubId}/clubdues/${duesId}/notify-unpaid`;
    await fetchClient<{success: boolean}>(url, {
      method: 'POST',
      auth: true
    });
  },

  // 8. 현재 사용자의 미납 회비 목록 조회
  getMyUnpaidDues: async (clubId: number): Promise<MyUnpaidDuesResponse> => {
    const url = `${BASE_URL}${API_PREFIX}/clubs/${clubId}/clubdues/my-unpaid`;
    const response = await fetchClient<{success: boolean, data: MyUnpaidDuesResponse}>(url, {
      method: 'GET',
      auth: true
    });
    return response.data;
  },

  // 9. 회비 결제
  payDues: async (clubId: number, duesId: number, payload: PayDuesRequest): Promise<PayDuesResponse> => {
    const url = `${BASE_URL}${API_PREFIX}/clubs/${clubId}/clubdues/${duesId}/pay`;
    const response = await fetchClient<{success: boolean, data: PayDuesResponse}>(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      auth: true
    });
    return response.data;
  }
};