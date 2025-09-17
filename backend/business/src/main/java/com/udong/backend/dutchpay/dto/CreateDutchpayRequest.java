package com.udong.backend.dutchpay.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateDutchpayRequest {

    @NotNull @Min(1)
    private Integer amount;

    private String note;

    @NotNull
    private Long eventId;

    @NotEmpty
    private List<Long> participantUserIds; // users.id 리스트
}
