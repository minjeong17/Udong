package com.udong.backend.dutchpay.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 정산하기 요청 DTO
 * - depositUserId: 입금 받을 사용자 ID
 * - amount: 이체 금액
 */
@Getter
@Setter
@NoArgsConstructor
public class PayRequest {
    private Integer depositUserId; // 입금 받을 사람
    private long amount;           // 이체 금액
}
