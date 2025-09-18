package com.udong.backend.dutchpay.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 정산하기 응답 DTO
 * - paid: 납부 완료 여부
 * - responseCode: 외부 API 응답 코드 (성공 시 "H0000")
 * - responseMessage: 외부 API 응답 메시지
 */
@Getter
@AllArgsConstructor
public class PayResponse {
    private final boolean paid;
    private final String responseCode;
    private final String responseMessage;
}
