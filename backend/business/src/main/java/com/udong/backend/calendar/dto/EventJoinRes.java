// src/main/java/com/udong/backend/calendar/dto/EventJoinRes.java
package com.udong.backend.calendar.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class EventJoinRes {
    private Integer eventId;
    private Integer userId;
    private boolean participated;  // true=참여 중, false=취소됨
    private Integer attendees;     // 현재 참여 확정 인원수
    private Short capacity;        // 정원(null 가능)
    private Integer roomId;
    private LocalDateTime joinedAt;
}
