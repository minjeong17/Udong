// com.udong.backend.fin.dto.InquireBalanceResponse
package com.udong.backend.fin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InquireBalanceResponse {

    @Getter @Setter
    public static class Header {
        @JsonProperty("responseCode") private String responseCode;
        @JsonProperty("responseMessage") private String responseMessage;
    }

    @Getter @Setter
    public static class Rec {
        @JsonProperty("bankCode") private String bankCode;
        @JsonProperty("accountNo") private String accountNo;
        @JsonProperty("accountBalance") private String accountBalance; // 문자열로 옴
        @JsonProperty("currency") private String currency;
    }

    @JsonProperty("Header") private Header header;
    @JsonProperty("REC")    private Rec rec;
}
