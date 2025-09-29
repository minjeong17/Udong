package com.udong.backend.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private Long notificationDeliveryId; // 읽음 처리를 위한 delivery ID
    private String payload;
    private String type;
    private Long targetId;
    private boolean hasRead;
    private LocalDateTime createdAt;
}
