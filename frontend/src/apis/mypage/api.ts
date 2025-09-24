// apis/mypage/api.ts
import fetchClient, { BASE_URL, API_PREFIX } from "../fetchClient";
import type { ApiResponse, MyPageResponse } from "./response";

export const MyPageApi = {
  /** 마이페이지 조회 (유저×클럽 단위) */
  async getMyPage(clubId: number): Promise<MyPageResponse> {
    const url = `${BASE_URL}${API_PREFIX}/mypage/${encodeURIComponent(clubId)}`;
    const res = await fetchClient<ApiResponse<MyPageResponse>>(url, {
      method: "GET",
      auth: true,                 // accessToken 자동 헤더 부착 (프로젝트 fetchClient 규약)
    });

    return res.data;
  },

};
