// com.udong.backend.fin.dto.InquireHistoryRequest
package com.udong.backend.fin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InquireHistoryRequest {
    @JsonProperty("Header")
    private FinHeader header;

    @JsonProperty("accountNo")
    private String accountNo;

    @JsonProperty("startDate") private String startDate; // yyyyMMdd
    @JsonProperty("endDate")   private String endDate;   // yyyyMMdd
    @JsonProperty("transactionType") private String transactionType; // A
    @JsonProperty("orderByType") private String orderByType; // ASC|DESC
}
