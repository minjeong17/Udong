package com.udong.backend.dutchpay.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DutchpayDetailResponse {
    private Integer id;
    private Integer amount;
    private String note;
    private LocalDateTime createdAt;
    private Integer eventId;
    private Integer createdBy;
    private String s3Key;
    private String imageUrl;
    private boolean isDone;
    private int participantCount;
    private int perPersonAmount;
    private List<DutchpayParticipantResponse> participants;
}
