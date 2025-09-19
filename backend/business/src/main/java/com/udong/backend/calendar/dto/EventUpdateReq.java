package com.udong.backend.calendar.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EventUpdateReq {
    @NotBlank
    private String title;
    private String content;
    private String place;
    private Short capacity;
    private Integer expectedCost;
    @NotNull
    private LocalDateTime startAt;
    @NotNull private LocalDateTime endAt;
}
