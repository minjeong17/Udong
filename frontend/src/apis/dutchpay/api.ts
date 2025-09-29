import fetchClient, { BASE_URL, API_PREFIX } from "../fetchClient";
import type { PayRequest } from "./request";
import type { ApiResponse, DutchpayDetailResponse, DutchpayListResponse } from "./response";

export const DutchpayApi = {
  /** 내 정산 목록 조회 */
  getMyDutchpays: async (clubId: number): Promise<DutchpayListResponse[]> => {
    const url = `${BASE_URL}${API_PREFIX}/dutchpay/${clubId}`;
    const response = await fetchClient<ApiResponse<DutchpayListResponse[]>>(url, {
      method: "GET",
      auth: true,
    });
    return response.data;
  },

  getSettlementDetails: async (dutchPayId:number): Promise<DutchpayDetailResponse> => {
    const url = `${BASE_URL}${API_PREFIX}/dutchpay/detail/${dutchPayId}`;
    const response = await fetchClient<ApiResponse<DutchpayDetailResponse>>(url, {
      method: "GET",
      auth: true, 
    });
    return response.data;
  },

  /** 정산하기 API */
  pay: async (dutchpayId: number, req: PayRequest): Promise<string> => {
    const url = `${BASE_URL}${API_PREFIX}/dutchpay/${dutchpayId}/pay`;
    const response = await fetchClient<ApiResponse<string>>(url, {
      method: "POST",
      auth: true,
      body: JSON.stringify(req),
    });
    return response.data; // 응답이 문자열로 반환됩니다.
  },

  /** 정산 삭제 API */
  deleteSettlement: async (dutchpayId: number): Promise<string> => {
    const url = `${BASE_URL}${API_PREFIX}/dutchpay/${dutchpayId}`;
    const response = await fetchClient<ApiResponse<string>>(url, {
      method: "DELETE",
      auth: true,
    });
    return response.data; // 응답이 문자열로 반환됩니다.
  },

  /** 정산 종료 API */
  endSettlement: async (dutchpayId: number): Promise<string> => {
    const url = `${BASE_URL}${API_PREFIX}/dutchpay/${dutchpayId}`;
    const response = await fetchClient<ApiResponse<string>>(url, {
      method: "PUT", // PUT 메서드를 사용하여 정산 종료 처리
      auth: true,
    });
    return response.data; // 응답이 문자열로 반환됩니다.
  },
};
