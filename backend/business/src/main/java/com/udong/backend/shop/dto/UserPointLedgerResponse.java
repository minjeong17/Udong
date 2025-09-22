package com.udong.backend.shop.dto;

import java.time.LocalDateTime;

import com.udong.backend.shop.entity.UserPointLedger;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class UserPointLedgerResponse {
    private String codeName;
    private Integer delta;        // 변동값 
    private Integer currPoint;    // 변동 후 잔여 포인트
    private String memo;
    private LocalDateTime createdAt;
    
    public static UserPointLedgerResponse from(UserPointLedger ledger) {
        return UserPointLedgerResponse.builder()
                .codeName(ledger.getCodeName())
                .delta(ledger.getDelta())
                .currPoint(ledger.getCurrPoint())
                .memo(ledger.getMemo())
                .createdAt(ledger.getCreatedAt())
                .build();
    }
}