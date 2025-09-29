package com.udong.backend.calendar.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class EventListItemRes {
    private Integer id;   // FIX: Long -> Integer
    private String title;
    private String place;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private String type;
}

