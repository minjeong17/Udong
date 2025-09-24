package com.udong.backend.mypage.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

/**
 * 유저 활동 가능 시간 (user_availability)
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityDto {
    private Integer dayOfWeek;   // 0~6 or 1~7 규칙
    private LocalTime startTime;
    private LocalTime endTime;
}
