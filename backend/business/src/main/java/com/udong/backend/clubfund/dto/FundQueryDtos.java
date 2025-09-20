// com.udong.backend.clubfund.dto.FundQueryDtos.java
package com.udong.backend.clubfund.dto;

import lombok.*;

import java.util.List;

public class FundQueryDtos {

    @Data
    public static class QueryRequest {
        /** yyyyMMdd */
        private String startDate;
        /** yyyyMMdd */
        private String endDate;
    }

    @Data @Builder
    public static class TransactionItem {
        private Integer transactionId;       // Fin: transactionUniqueNo
        private String date;                 // yyyyMMdd
        private String time;                 // HHmmss
        private String type;                 // "1"(입금) / "2"(출금)
        private String typeName;             // "입금", "출금(이체)" 등
        private String summary;              // "(수시입출금) : 출금(이체)"
        private String memo;                 // Fin 내역 메모
        private String accountNo;            // 상대 계좌 (있으면)
        private String amount;               // transactionBalance (문자열 원본)
        private String afterBalance;         // 거래 후 잔액
        private boolean isWithdrawal;        // type == "2"
        private boolean hasReceipt;          // 우리 DB에 영수증 존재
        private Integer receiptId;           // 존재하면 id

        private String receiptUrl; // = imageUrl (영수증이 있을 때만 세팅)
        private String s3Key;      // = S3 오브젝트 키 (있을 때만 세팅)
    }

    @Data @Builder
    public static class QueryResponse {
        /** 현재 계좌 잔액 (버튼 누른 시점) */
        private int balance;
        /** 기간 내 전체 거래 리스트 */
        private List<TransactionItem> transactions;
    }

    @Data
    public static class AttachReceiptRequest {
        private String memo;       // 선택
        private String imageUrl;   // 선택
        private String s3Key;      // 선택
    }

    @Data @Builder
    public static class AttachReceiptResponse {
        private Integer receiptId;
        private boolean created;   // 새로 생성(true) / 기존 반환(false)
    }
}
