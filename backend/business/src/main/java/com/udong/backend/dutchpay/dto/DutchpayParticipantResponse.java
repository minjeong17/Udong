package com.udong.backend.dutchpay.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DutchpayParticipantResponse {
    private Integer id;
    private Integer userId;
    private String name;
    private boolean isPaid;
}
