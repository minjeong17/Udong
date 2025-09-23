package com.udong.backend.fin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder @ToString
public class FinHeader {

    @JsonProperty("apiName")
    private String apiName; // "updateDemandDepositAccountTransfer"

    @JsonProperty("transmissionDate")
    private String transmissionDate; // YYYYMMDD

    @JsonProperty("transmissionTime")
    private String transmissionTime; // HHmmss

    @JsonProperty("institutionCode")
    private String institutionCode;  // "00100"

    @JsonProperty("fintechAppNo")
    private String fintechAppNo;     // "001"

    @JsonProperty("apiServiceCode")
    private String apiServiceCode;   // "updateDemandDepositAccountTransfer"

    @JsonProperty("institutionTransactionUniqueNo")
    private String institutionTransactionUniqueNo; // 20자리 숫자

    @JsonProperty("apiKey")
    private String apiKey;

    @JsonProperty("userKey")
    private String userKey;

}