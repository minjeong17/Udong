// src/main/java/com/udong/backend/calendar/dto/EventParticipantRes.java
package com.udong.backend.calendar.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class EventParticipantRes {
    private Integer userId;
    private boolean participated;
    private LocalDateTime joinedAt;
}
