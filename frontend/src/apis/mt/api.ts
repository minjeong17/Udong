import fetchClient from '../fetchClient';
import type { MtPlannerRequest } from './request'
import type { MtPlannerResponse } from './response';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const API_PREFIX = import.meta.env.VITE_API_PREFIX || "/api/v1";

export const MtPlannerApi = {
    
  generatePlan: async (req: MtPlannerRequest): Promise<MtPlannerResponse> => {
    const url = `${BASE_URL}${API_PREFIX}/mt/plan`;
    const response = await fetchClient<{success: boolean, data: MtPlannerResponse}>(url, {
      method: "POST",
      body: JSON.stringify(req),
      auth: true, 
    });
    return response.data;
  },
}