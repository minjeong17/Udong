package com.udong.backend.dutchpay.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class FinTransferResponse {

    @JsonProperty("Header")
    private Header header;

    @JsonProperty("REC")
    private List<Record> rec;

    // 내부 static class로 Header 포함
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Header {
        @JsonProperty("responseCode")
        private String responseCode;

        @JsonProperty("responseMessage")
        private String responseMessage;

        @JsonProperty("apiName")
        private String apiName;

        @JsonProperty("transmissionDate")
        private String transmissionDate;

        @JsonProperty("transmissionTime")
        private String transmissionTime;

        @JsonProperty("institutionCode")
        private String institutionCode;

        @JsonProperty("apiKey")
        private String apiKey;

        @JsonProperty("apiServiceCode")
        private String apiServiceCode;

        @JsonProperty("institutionTransactionUniqueNo")
        private String institutionTransactionUniqueNo;
    }

    // 내부 static class로 REC 포함
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Record {
        @JsonProperty("transactionUniqueNo")
        private String transactionUniqueNo;

        @JsonProperty("accountNo")
        private String accountNo;

        @JsonProperty("transactionDate")
        private String transactionDate;

        @JsonProperty("transactionType")
        private String transactionType;

        @JsonProperty("transactionTypeName")
        private String transactionTypeName;

        @JsonProperty("transactionAccountNo")
        private String transactionAccountNo;
    }
}
