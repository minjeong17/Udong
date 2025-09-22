// apis/clubfund/response.ts
// 백엔드 DTO 타입 정의 (스프링 컨트롤러/DTO에 맞춤)

export interface ApiResponse<T> {
  success: boolean;   // ApiResponse.ok(...) 기준
  data: T;
  status?: number;    // 서버에서 채우면 받음(선택)
  message?: string;   // 에러/알림 메시지(선택)
}

/** yyyyMMdd */
export type YyyyMmDd = string;
/** HHmmss */
export type HhMmSs = string;

/** 요청 바디 (거래내역 조회용) */
export interface QueryRequest {
  /** yyyyMMdd */
  startDate: YyyyMmDd;
  /** yyyyMMdd */
  endDate: YyyyMmDd;
}

/** 거래 아이템 (백엔드 응답) */
export interface TransactionItem {
  transactionId: number; // Fin: transactionUniqueNo
  date: YyyyMmDd;        // yyyyMMdd
  time: HhMmSs;          // HHmmss
  /** "1"(입금) / "2"(출금) */
  type: "1" | "2";
  /** "입금", "출금(이체)" 등 */
  typeName: string;
  /** "(수시입출금) : 출금(이체)" */
  summary: string;
  /** Fin 내역 메모 */
  memo: string | null;
  /** 상대 계좌 (있으면) */
  accountNo?: string | null;
  /** 거래 금액(문자열) */
  amount: string;
  /** 거래 후 잔액(문자열) */
  afterBalance: string;

  /** type == "2" */
  isWithdrawal: boolean;

  /** 우리 DB에 영수증 존재 여부 */
  hasReceipt: boolean;
  /** 존재 시 id */
  receiptId?: number | null;

  /** 이미지 URL(있을 때만) */
  receiptUrl?: string | null;
  /** S3 오브젝트 키(있을 때만) */
  s3Key?: string | null;
}

/** 거래내역 응답 (ApiResponse<data>) */
export interface TransactionsResponse {
  transactions: TransactionItem[];
}

/** 잔액 응답 (ApiResponse<data>) */
export interface BalanceResponse {
  balance: number;
}

/** 영수증 업로드(멀티파트) 응답 (ApiResponse<data>) */
export interface AttachReceiptResponse {
  receiptId: number;
  /** 새로 생성(true) / 기존 반환(false) */
  created: boolean;
}

/* ===== UI에서 이미 쓰고 있는 타입 (참고/재노출) ===== */
export type UiTxType = "입금" | "출금";
export interface UiTransaction {
  id: string;
  /** YYYY-MM-DD (대시 포함) */
  date: string;
  description: string;   // memo || summary || typeName 우선순위로 매핑
  type: UiTxType;        // "1"|"2" → "입금"|"출금"
  amount: number;        // 문자열 금액 → number
  balance: number;       // 문자열 잔액 → number
  receiptUrl?: string;
}
