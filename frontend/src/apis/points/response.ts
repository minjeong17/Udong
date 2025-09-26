export interface UserPointLedgerResponse {
  id: number;
  userId: number;
  userName: string;
  pointType: string;
  pointAmount: number;
  description: string;
  createdAt: string;
}

export interface PointHistoryResponse {
  codeName: string;
  memo: string;
  currPoint: number;
  delta: number;
  createdAt: string;
}