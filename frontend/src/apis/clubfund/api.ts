// apis/clubfund/api.ts
import fetchClient, { BASE_URL, API_PREFIX } from '../fetchClient';
import type {
  ApiResponse,
  BalanceResponse,
  TransactionsResponse,
  AttachReceiptResponse,
  QueryRequest,
  TransactionItem,
  UiTransaction,
} from './response';

/** 경로 결합 */
const withBase = (p: string) => `${BASE_URL}${API_PREFIX}${p}`;

/** yyyyMMdd → YYYY-MM-DD */
const toDashDate = (yyyymmdd: string) =>
  `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;

/** YYYY-MM-DD → yyyyMMdd */
const toCompactDate = (date: string) => date.replaceAll('-', '');

/** 문자열 금액/잔액 → number (숫자 외 제거 후 파싱) */
const toNumber = (s: string | null | undefined): number => {
  if (!s) return 0;
  const cleaned = s.replace(/[^\d-]/g, '');
  const n = parseInt(cleaned, 10);
  return Number.isNaN(n) ? 0 : n;
};

/** 백엔드 TransactionItem → UI Transaction 매핑 */
export const mapDtoToUi = (dto: TransactionItem): UiTransaction => {
  const isDeposit = dto.type === '1' && !dto.isWithdrawal;
  return {
    id: String(dto.transactionId),
    date: toDashDate(dto.date),
    description: dto.memo?.trim() || dto.summary?.trim() || dto.typeName || '',
    type: isDeposit ? '입금' : '출금',
    amount: toNumber(dto.amount),
    balance: toNumber(dto.afterBalance),
    receiptUrl: dto.receiptUrl ?? undefined,
  };
};

/** ✅ 서버 응답 안전 언래핑: {data: T} | {result: T} | T 전부 지원 */
function unwrap<T>(raw: any): T {
  if (raw && typeof raw === 'object') {
    if ('data' in raw && raw.data != null) return raw.data as T;
    if ('result' in raw && raw.result != null) return raw.result as T;
  }
  return raw as T;
}

export const ClubFundApi = {
  /**
   * 잔액 조회
   * GET /v1/clubs/{clubId}/funds/balance
   */
  async getBalance(clubId: number): Promise<BalanceResponse> {
    const url = withBase(`/clubs/${clubId}/funds/balance`);
    // 서버가 {success, data:{balance}} 또는 {balance}로 내려와도 처리
    const raw = await fetchClient<any>(url, { method: 'GET' });
    const body = unwrap<BalanceResponse>(raw);
    if (!body || typeof body.balance !== 'number') {
      console.error('Unexpected balance response:', raw);
      throw new Error('INVALID_RESPONSE_BALANCE');
    }
    return body;
  },

  /**
   * 거래내역 조회
   * POST /v1/clubs/{clubId}/funds/transactions
   * body: { startDate: yyyyMMdd, endDate: yyyyMMdd }
   */
  async getTransactions(params: {
    clubId: number;
    from: string; // YYYY-MM-DD
    to: string;   // YYYY-MM-DD
  }): Promise<TransactionsResponse> {
    const url = withBase(`/clubs/${params.clubId}/funds/transactions`);
    const bodyReq: QueryRequest = {
      startDate: toCompactDate(params.from),
      endDate: toCompactDate(params.to),
    };
    // 서버가 {success, data:{transactions:[...]}} 또는 {transactions:[...]}로 내려와도 처리
    const raw = await fetchClient<any>(url, {
      method: 'POST',
      body: JSON.stringify(bodyReq),
    });
    const body = unwrap<TransactionsResponse>(raw);

    const transactions =
      (body as any)?.transactions ??
      (body as any)?.items ?? // 혹시 items로 내려오면 커버
      [];

    if (!Array.isArray(transactions)) {
      console.error('Unexpected transactions response:', raw);
      throw new Error('INVALID_RESPONSE_TRANSACTIONS');
    }

    return { transactions };
  },

  /**
   * 영수증 업로드(멀티파트) + DB 연결
   * POST /v1/clubs/{clubId}/funds/transactions/{transactionId}/receipt
   * multipart/form-data: receipt=<file>, memo=<string?>
   */
  async attachReceiptMultipart(params: {
    clubId: number;
    transactionId: number | string;
    file: File;
    memo?: string;
  }): Promise<AttachReceiptResponse> {
    const url = withBase(
      `/clubs/${params.clubId}/funds/transactions/${params.transactionId}/receipt`,
    );
    const form = new FormData();
    form.append('receipt', params.file);
    if (params.memo) form.append('memo', params.memo);

    const raw = await fetchClient<any>(url, {
      method: 'POST',
      body: form,
    });
    const body = unwrap<AttachReceiptResponse>(raw);

    // 최소 필드 검증
    if (!body || typeof (body as any).created === 'undefined') {
      console.warn('Unexpected attach receipt response:', raw);
    }
    return body;
  },
};
