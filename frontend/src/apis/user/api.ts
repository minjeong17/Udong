import fetchClient from '../fetchClient';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

export interface AccountInfo {
  bankName: string;
  accountNumber: string;
}

export const UserApi = {
  // 내 계좌 정보 조회 (복호화)
  getMyAccount: async (): Promise<AccountInfo> => {
    const url = `${BASE_URL}${API_PREFIX}/me/account`;
    const response = await fetchClient<{success: boolean, data: AccountInfo}>(url, {
      method: 'GET',
      auth: true
    });
    return response.data;
  },

  // 내 계좌 정보 변경
  updateMyAccount: async (accountNumber: string): Promise<void> => {
    const url = `${BASE_URL}${API_PREFIX}/me/account`;
    await fetchClient<{success: boolean, message: string}>(url, {
      method: 'PUT',
      body: JSON.stringify({ accountNumber }),
      auth: true
    });
  }
};