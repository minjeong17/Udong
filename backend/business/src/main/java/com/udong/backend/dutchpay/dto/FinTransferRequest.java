package com.udong.backend.dutchpay.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.udong.backend.fin.dto.FinHeader;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FinTransferRequest {

    @JsonProperty("Header")
    private FinHeader header;

    @JsonProperty("depositAccountNo")
    private String depositAccountNo;

    @JsonProperty("depositTransactionSummary")
    private String depositTransactionSummary; // "(수시입출금) : 입금(이체)"

    @JsonProperty("transactionBalance")
    private String transactionBalance; // 금액을 문자열로!

    @JsonProperty("withdrawalAccountNo")
    private String withdrawalAccountNo;

    @JsonProperty("withdrawalTransactionSummary")
    private String withdrawalTransactionSummary; // "(수시입출금) : 출금(이체)"
}