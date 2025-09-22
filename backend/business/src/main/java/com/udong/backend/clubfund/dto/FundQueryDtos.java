// com.udong.backend.clubfund.dto.FundQueryDtos.java
package com.udong.backend.clubfund.dto;

import lombok.*;
import java.util.List;

public class FundQueryDtos {

    // ===== 공통 요청/아이템 =====
    @Data
    public static class QueryRequest {
        /** yyyyMMdd */
        private String startDate;
        /** yyyyMMdd */
        private String endDate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionItem {
        private Integer transactionId; // Fin: transactionUniqueNo
        private String date;           // yyyyMMdd
        private String time;           // HHmmss
        private String type;           // "1"(입금) / "2"(출금)
        private String typeName;       // "입금", "출금(이체)" 등
        private String summary;        // "(수시입출금) : 출금(이체)"
        private String memo;           // Fin 내역 메모
        private String accountNo;      // 상대 계좌 (있으면)
        private String amount;         // transactionBalance (원본 문자열)
        private String afterBalance;   // 거래 후 잔액
        private boolean isWithdrawal;  // type == "2"
        private boolean hasReceipt;    // 우리 DB에 영수증 존재
        private Integer receiptId;     // 존재하면 id

        private String receiptUrl; // = imageUrl (영수증 있을 때만)
        private String s3Key;      // = S3 오브젝트 키 (있을 때만)
    }

    // ===== 분리된 응답 DTO =====
    /** 거래내역만 반환 */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionsResponse {
        private List<TransactionItem> transactions;
    }

    /** 잔액만 반환 */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BalanceResponse {
        private int balance;
    }

    // ===== 영수증 업로드 DTO =====
    @Data
    public static class AttachReceiptRequest {
        private String memo;     // 선택
        private String imageUrl; // 선택
        private String s3Key;    // 선택
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttachReceiptResponse {
        private Integer receiptId;
        private boolean created; // 새로 생성(true) / 기존 반환(false)
    }
}
