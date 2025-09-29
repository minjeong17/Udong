package com.udong.backend.dutchpay.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class DutchpayDetailResponse {
    private Integer id;
    private Integer amount;
    private String note;
    private LocalDateTime createdAt;
    private String createdBy;    // User.name
    private Integer createdUserId;
    private boolean isDone;
    private String s3Key;
    private String imageUrl;
    private EventInfo event;
    private List<ParticipantInfo> participants;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class EventInfo {
        private Integer id;
        private String title;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class ParticipantInfo {
        private Integer userId;
        private String name;
        private boolean isPaid;
    }
}

