// com.udong.backend.fin.dto.InquireBalanceRequest
package com.udong.backend.fin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InquireBalanceRequest {
    @JsonProperty("Header")
    private FinHeader header;

    @JsonProperty("accountNo")
    private String accountNo;
}
