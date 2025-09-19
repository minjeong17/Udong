package com.udong.backend.calendar.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class EventRes {
    private Integer id;   // FIX: Long -> Integer
    private String title;
    private String content;
    private String place;
    private Short capacity;
    private Integer expectedCost;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private String type;
    private Long createdBy; // User.id는 Long 유지
}

