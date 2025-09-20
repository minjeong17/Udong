// com.udong.backend.fin.dto.InquireHistoryResponse
package com.udong.backend.fin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InquireHistoryResponse {

    @Getter @Setter
    public static class Header {
        @JsonProperty("responseCode") private String responseCode;
        @JsonProperty("responseMessage") private String responseMessage;
    }

    @Getter @Setter
    public static class RecListItem {
        @JsonProperty("transactionUniqueNo") private String transactionUniqueNo; // "61"
        @JsonProperty("transactionDate") private String transactionDate; // yyyyMMdd
        @JsonProperty("transactionTime") private String transactionTime; // HHmmss
        @JsonProperty("transactionType") private String transactionType; // "1" 입금 / "2" 출금
        @JsonProperty("transactionTypeName") private String transactionTypeName;
        @JsonProperty("transactionAccountNo") private String transactionAccountNo;
        @JsonProperty("transactionBalance") private String transactionBalance;
        @JsonProperty("transactionAfterBalance") private String transactionAfterBalance;
        @JsonProperty("transactionSummary") private String transactionSummary; // "(수시입출금) : 출금(이체)"
        @JsonProperty("transactionMemo") private String transactionMemo;
    }

    @Getter @Setter
    public static class Rec {
        @JsonProperty("totalCount") private String totalCount;
        @JsonProperty("list") private List<RecListItem> list;
    }

    @JsonProperty("Header") private Header header;
    @JsonProperty("REC")    private Rec rec;
}
