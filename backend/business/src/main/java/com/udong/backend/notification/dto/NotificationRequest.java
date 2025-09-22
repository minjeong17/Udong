package com.udong.backend.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationRequest {
    private List<Long> recipientUserIds; // 알림을 받을 유저 ID 목록
    private Long createdBy; // 알림을 발생시킨 주체 ID
    private String payload;
    private String type; // Enum 대신 String을 사용하셨으므로 String 타입으로 받습니다.
    private Long targetId;
}
